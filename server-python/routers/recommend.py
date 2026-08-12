import os
import json
import redis
import logging
import time
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from services.recommendation_logic import compute_hybrid_recommendations
from services.recommendation_logic import fetch_data_with_sqlalchemy

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

FALLBACK_RECOMMENDATIONS = [
    {"id": "evt_1", "name": "AI Hackathon", "tags": ["AI", "machine learning", "hackathon"], "final_score": 0.0, "content_score": 0.0, "collab_score": 0.0},
    {"id": "evt_2", "name": "Web Dev Bootcamp", "tags": ["web", "react", "javascript"], "final_score": 0.0, "content_score": 0.0, "collab_score": 0.0},
    {"id": "evt_3", "name": "Cybersecurity Workshop", "tags": ["security", "networking", "workshop"], "final_score": 0.0, "content_score": 0.0, "collab_score": 0.0},
    {"id": "evt_4", "name": "Robotics Fest", "tags": ["robotics", "hardware", "iot"], "final_score": 0.0, "content_score": 0.0, "collab_score": 0.0},
    {"id": "evt_5", "name": "Data Science Summit", "tags": ["data", "AI", "python", "analytics"], "final_score": 0.0, "content_score": 0.0, "collab_score": 0.0},
]

@router.get("/recommend/events/{user_id}", tags=["Recommendations"], summary="Get Event Recommendations")
async def recommend_events(user_id: str, limit: int = Query(5, ge=1, le=20)):
    cache_key = f"recs:events:{user_id}:{limit}"

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Redis read error: {e}")
    elif cache_key in LOCAL_CACHE:
        entry = LOCAL_CACHE[cache_key]
        if time.time() < entry["expires"]:
            return entry["data"]

    try:
        from celery_app import precompute_recommendations
        precompute_recommendations.delay(user_id)
    except Exception as e:
        logger.error(f"Celery task failed: {e}")

    recs = compute_hybrid_recommendations(user_id, num_recommendations=limit)
    return recs if recs else FALLBACK_RECOMMENDATIONS[:limit]

@router.get("/recommend/trending", tags=["Recommendations"], summary="Get Trending Events")
async def trending_events(limit: int = Query(10, ge=1, le=30)):
    redis_key = "recs:trending"
    try:
        if redis_client:
            cached = redis_client.get(redis_key)
            if cached:
                return json.loads(cached)
    except Exception:
        pass

    if redis_key in LOCAL_CACHE:
        entry = LOCAL_CACHE[redis_key]
        if time.time() < entry["expires"]:
            return entry["data"]

    events, _, participations = fetch_data_with_sqlalchemy("__trending__")

    if not events:
        return {"trending": FALLBACK_RECOMMENDATIONS[:limit], "source": "fallback"}

    participation_counts = {}
    for p in participations:
        eid = p["event_id"]
        participation_counts[eid] = participation_counts.get(eid, 0) + 1

    scored = []
    for ev in events:
        count = participation_counts.get(ev["id"], 0)
        scored.append({"id": ev["id"], "name": ev["name"], "tags": ev.get("tags", []), "popularity": count})

    scored.sort(key=lambda x: x["popularity"], reverse=True)

    result = {"trending": scored[:limit], "source": "computed"}

    if redis_client:
        try:
            redis_client.setex(redis_key, 1800, json.dumps(result))
        except Exception:
            pass
    else:
        LOCAL_CACHE[redis_key] = {"data": result, "expires": time.time() + 1800}

    return result

@router.get("/recommend/similar/{event_id}", tags=["Recommendations"], summary="Similar Events")
async def similar_events(event_id: str, limit: int = Query(5, ge=1, le=20)):
    events, _, _ = fetch_data_with_sqlalchemy("__similar__")
    if not events:
        return {"similar": []}

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
    return {"similar": scored[:limit], "target_id": event_id}
