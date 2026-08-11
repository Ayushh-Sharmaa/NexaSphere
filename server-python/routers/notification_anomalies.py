import logging

from fastapi import APIRouter

from services.notification_anomaly_service import (
    detect_notification_anomaly,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/notifications",
    tags=["Notification Analytics"],
)


@router.get("/anomalies")
async def check_notification_anomalies():
    """
    Analyze recent notification delivery data
    and detect anomalies.
    """

    result = await detect_notification_anomaly()

    if result["anomalyDetected"]:
        logger.critical(
            "CRITICAL notification anomaly detected: %s",
            result,
        )

    return result