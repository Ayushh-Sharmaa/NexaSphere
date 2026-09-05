import logging

from fastapi import APIRouter, HTTPException

from models.forms import FormSubmission
from services.sheets import sheets_service
from services.supabase import supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/forms/membership")
async def submit_membership(form: FormSubmission):
    try:
        form_dict = form.model_dump()

        await sheets_service.append_membership(form_dict)
        await supabase_service.insert_membership(form_dict)

        return {
            "ok": True,
            "message": "Membership form submitted successfully",
        }
    except Exception as e:
        logger.exception("Membership form error")
        raise HTTPException(status_code=500, detail="Failed to submit form") from e


@router.post("/api/forms/recruitment")
async def submit_recruitment(form: FormSubmission):
    try:
        form_dict = form.model_dump()

        await sheets_service.append_recruitment(form_dict)
        await supabase_service.insert_recruitment(form_dict)

        return {
            "ok": True,
            "message": "Recruitment form submitted successfully",
        }
    except Exception as e:
        logger.exception("Recruitment form error")
        raise HTTPException(status_code=500, detail="Failed to submit form") from e


@router.post("/api/core-team/apply")
async def submit_core_team_application(form: FormSubmission):
    try:
        form_dict = form.model_dump()

        await sheets_service.append_core_team_application(form_dict)
        await supabase_service.insert_core_team_application(form_dict)

        return {
            "ok": True,
            "message": "Application submitted successfully",
        }
    except Exception as e:
        logger.exception("Core team application error")
        raise HTTPException(status_code=500, detail="Failed to submit application") from e

