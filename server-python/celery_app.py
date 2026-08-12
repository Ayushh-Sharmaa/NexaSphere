import os
import json
import logging
from celery import Celery
import redis
from services.recommendation_logic import compute_hybrid_recommendations

logger = logging.getLogger(__name__)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery app
app = Celery(
    "celery_app",
    broker=redis_url,
    backend=redis_url
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@app.task(name="celery_app.precompute_recommendations")
def precompute_recommendations(user_id: str):
    logger.info(f"Starting async recommendation pre-computation for user: {user_id}")
    try:
        from services.recommendation_logic import fixtures_allowed

        recommendations = compute_hybrid_recommendations(user_id, num_recommendations=5)

        # Never cache empty results or development fixture payloads
        if not recommendations or fixtures_allowed():
            logger.info(
                "Skipping recommendation cache for user %s (empty=%s fixtures=%s)",
                user_id,
                not recommendations,
                fixtures_allowed(),
            )
            return recommendations

        r_client = redis.from_url(redis_url)
        cache_key = f"recs:events:{user_id}:5"
        r_client.setex(cache_key, 3600, json.dumps(recommendations))
        logger.info(f"Successfully cached pre-computed recommendations for user: {user_id}")
        return recommendations
    except Exception as e:
        logger.error(f"Error pre-computing recommendations for user {user_id}: {e}")
        raise e
