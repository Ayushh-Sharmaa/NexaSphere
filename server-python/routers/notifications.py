import os
import hmac
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from services.notification_service import notify_team_leader

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notify", tags=["Notifications"])


class JoinRequestPayload(BaseModel):
    teamId: int
    pitch: str
    skills: str
    github: str


class NotificationResponse(BaseModel):
    status: str
    detail: Optional[str] = None


INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "")


def _verify_service_auth(
    x_service_auth: Optional[str] = Header(default=None, alias="X-Service-Auth"),
) -> None:
    """Dependency that validates the internal service auth header string securely."""
    if not INTERNAL_SERVICE_SECRET:
        logger.critical("INTERNAL_SERVICE_SECRET is not configured — blocking all requests")
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: internal auth secret is not set",
        )

    if not x_service_auth or not hmac.compare_digest(x_service_auth, INTERNAL_SERVICE_SECRET):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: invalid service auth",
        )


@router.post("/join-request", response_model=NotificationResponse)
def handle_join_request_notification(
    payload: JoinRequestPayload,
    _: None = Depends(_verify_service_auth),
):
    """
    Webhook endpoint called by the Java backend when a new join request is created.
    """
    try:
        notify_team_leader(
            team_id=payload.teamId,
            pitch=payload.pitch,
            skills=payload.skills,
            github=payload.github,
        )
        return NotificationResponse(status="success", detail="Notification sent successfully")
    except Exception as e:
        logger.error(f"Failed to deliver join notification for team {payload.teamId}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to dispatch notification to team leader",
        )
