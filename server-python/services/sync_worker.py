import asyncio
import logging
from typing import Any, Dict
from services.sheets import sheets_service
from services.supabase import supabase_service

logger = logging.getLogger(__name__)

# Maximum number of retries for a failed sync item
MAX_RETRIES = 5


async def sync_single_item(task_id: int, form_type: str, payload: Dict[str, Any], retry_count: int) -> bool:
    """
    Attempts to sync a single item to Google Sheets.
    Returns True if sync was successful, False otherwise.
    """
    try:
        logger.info(f"Attempting background Google Sheets sync for task {task_id} (Type: {form_type}, Retry: {retry_count})")
        if form_type == "Membership":
            await sheets_service.append_membership(payload)
        elif form_type == "Recruitment":
            await sheets_service.append_recruitment(payload)
        elif form_type == "CoreTeam":
            await sheets_service.append_core_team_application(payload)
        else:
            logger.error(f"Unknown form type in sync task: {form_type}")
            new_retry_count = retry_count + 1
            if new_retry_count >= MAX_RETRIES:
                logger.error(f"Task {task_id} exceeded maximum retries. Leaving in queue with failure state.")
            await supabase_service.release_failed_sync_task(task_id, new_retry_count, f"Unknown form type: {form_type}")
            return False

        # Success! Delete from queue
        await supabase_service.delete_sync_task(task_id)
        logger.info(f"Successfully synced task {task_id} to Google Sheets and removed from queue.")
        return True
    except Exception as e:
        logger.warning(f"Failed to sync task {task_id} to Google Sheets: {e}")
        new_retry_count = retry_count + 1
        if new_retry_count >= MAX_RETRIES:
            logger.error(f"Task {task_id} exceeded maximum retries. Leaving in queue with failure state.")
        await supabase_service.release_failed_sync_task(task_id, new_retry_count, str(e))
        return False


async def process_sync_queue() -> None:
    """
    Fetches pending sync items from the database queue and attempts to process them.
    """
    import uuid
    try:
        # First, release any stale locks
        await supabase_service.release_stale_locks()

        pending_tasks = await supabase_service.fetch_pending_syncs()
        if not pending_tasks:
            return

        worker_id = str(uuid.uuid4())
        logger.info(f"Worker {worker_id} processing {len(pending_tasks)} pending items from Google Sheets sync queue.")
        for task in pending_tasks:
            task_id = task["id"]
            form_type = task["form_type"]
            payload = task["payload"]
            retry_count = task.get("retry_count", 0)

            # Skip if maximum retries already exceeded
            if retry_count >= MAX_RETRIES:
                continue

            # Atomically claim the task before processing
            claimed = await supabase_service.claim_sync_task(task_id, worker_id)
            if not claimed:
                logger.info(f"Task {task_id} already claimed by another worker. Skipping.")
                continue

            await sync_single_item(task_id, form_type, payload, retry_count)
    except Exception as e:
        logger.exception("Error processing Google Sheets sync queue")


async def periodic_sync_worker(interval_seconds: int = 60) -> None:
    """
    Periodic loop that runs the sync queue processor.
    """
    logger.info("Starting Google Sheets periodic sync worker.")
    while True:
        try:
            await process_sync_queue()
        except asyncio.CancelledError:
            logger.info("Google Sheets periodic sync worker is shutting down.")
            raise
        except Exception as e:
            logger.exception("Error in Google Sheets periodic sync worker loop")

        await asyncio.sleep(interval_seconds)
