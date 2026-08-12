import os
import json
import redis
import logging
import time
from fastapi import APIRouter, HTTPException, Query
from services.recommendation_logic import compute_hybrid_recommendations
from services.recommendation_logic import fetch_data_with_sqlalchemy
from services.recommendation_logic import fixtures_allowed

router = APIRouter()
logger = logging.getLogger(__name__)

LOCAL_CACHE = {}

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = None
try:
    temp_redis = redis.from_url(redis_url, socket_connect_timeout=1)
    temp_redis.ping()
    redis_client = temp_redis
except (redis.exceptions.ConnectionError, Exception) as e:
    logger.warning(f"Redis unavailable ({e}), using local cache")


def _cache_get(cache_key: str):
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Redis read error: {e}")
        return None

    entry = LOCAL_CACHE.get(cache_key)
    if entry and time.time() < entry["expires"]:
        return entry["data"]
    return None


def _cache_set(cache_key: str, data, ttl_seconds: int = 1800):
    """Cache live recommendation payloads only — never fixtures or empty fallbacks."""
    if not data:
        return
    if isinstance(data, dict) and data.get("source") in ("unavailable", "fallback", "fixtures"):
        return
    if fixtures_allowed():
        return

    if redis_client:
        try:
            redis_client.setex(cache_key, ttl_seconds, json.dumps(data))
        except Exception as e:
            logger.warning(f"Redis write error: {e}")
    else:
        LOCAL_CACHE[cache_key] = {"data": data, "expires": time.time() + ttl_seconds}


@router.get("/recommend/events/{user_id}", tags=["Recommendations"], summary="Get Event Recommendations")
async def recommend_events(user_id: str, limit: int = Query(5, ge=1, le=20)):
    cache_key = f"recs:events:{user_id}:{limit}"

    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        from celery_app import precompute_recommendations
        precompute_recommendations.delay(user_id)
    except Exception as e:
        logger.error(f"Celery task failed: {e}")

    recs = compute_hybrid_recommendations(user_id, num_recommendations=limit)
    if not recs:
        # Empty / unavailable — do not serve or cache fixture fallbacks
        return []

    if not fixtures_allowed():
        _cache_set(cache_key, recs)
    return recs


@router.get("/recommend/trending", tags=["Recommendations"], summary="Get Trending Events")
async def trending_events(limit: int = Query(10, ge=1, le=30)):
    redis_key = "recs:trending"

    if redis_key in LOCAL_CACHE:
        entry = LOCAL_CACHE[redis_key]
        if time.time() < entry["expires"]:
            return entry["data"]

    events, _, participations = fetch_data_with_sqlalchemy("__trending__")

    if not events:
        return {"trending": [], "source": "unavailable", "available": False}

    participation_counts = {}
    for p in participations:
        eid = p["event_id"]
        participation_counts[eid] = participation_counts.get(eid, 0) + 1

    scored = []
    for ev in events:
        count = participation_counts.get(ev["id"], 0)
        scored.append({"id": ev["id"], "name": ev["name"], "tags": ev.get("tags", []), "popularity": count})

    scored.sort(key=lambda x: x["popularity"], reverse=True)

    result = {
        "trending": scored[:limit],
        "source": "fixtures" if fixtures_allowed() else "computed",
        "available": True,
    }
    _cache_set(redis_key, result)
    return result


@router.get("/recommend/similar/{event_id}", tags=["Recommendations"], summary="Similar Events")
async def similar_events(event_id: str, limit: int = Query(5, ge=1, le=20)):
    events, _, _ = fetch_data_with_sqlalchemy("__similar__")
    if not events:
        return {"similar": [], "source": "unavailable", "available": False}

    target = next((ev for ev in events if ev["id"] == event_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Event not found")

    target_tags = set(t.lower() for t in (target.get("tags") or []))
    scored = []
    for ev in events:
        if ev["id"] == event_id:
            continue
        ev_tags = set(t.lower() for t in (ev.get("tags") or []))
        if not target_tags or not ev_tags:
            continue
        intersection = len(target_tags & ev_tags)
        union = len(target_tags | ev_tags)
        jaccard = intersection / union if union > 0 else 0
        scored.append({"id": ev["id"], "name": ev["name"], "tags": ev.get("tags", []), "similarity": round(jaccard, 4)})

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return {"similar": scored[:limit], "target_id": event_id, "available": True}
