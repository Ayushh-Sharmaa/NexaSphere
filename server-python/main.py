import json
import logging
import os
import uuid
import contextvars

import google.generativeai as genai
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from observability.metrics import collect_celery_queue_depth
from observability.tracing import init_tracing
from prompts.system_prompt import SYSTEM_PROMPT
from routers import (
    certificates,
    forms,
    health,
    notifications,
    notification_anomalies,
    portfolio,
    recommend,
    review,
    webhooks,
    sync,
)

from services.sync_worker import periodic_sync_worker
from utils.security import limiter

# --- Logging Standardization with Trace ID ---
request_id_context = contextvars.ContextVar("request_id", default="system")
SERVICE_NAME = os.getenv("OTEL_SERVICE_NAME", "nexasphere-python")
LOG_FORMAT = os.getenv("LOG_FORMAT", "text").lower()


class TraceIdFilter(logging.Filter):
    def filter(self, record):
        record.trace_id = request_id_context.get()
        record.service = SERVICE_NAME
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname.lower(),
            "message": record.getMessage(),
            "service": getattr(record, "service", SERVICE_NAME),
            "traceId": getattr(record, "trace_id", None),
            "reqId": getattr(record, "trace_id", None),
            "logger": record.name,
        }
        if record.exc_info:
            payload["stack"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def _configure_logging():
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler()
    handler.addFilter(TraceIdFilter())
    if LOG_FORMAT == "json":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] [%(trace_id)s] %(name)s: %(message)s")
        )
    root.addHandler(handler)
    root.setLevel(logging.INFO)


_configure_logging()
logger = logging.getLogger(__name__)

# Initialize Gemini
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    logger.warning("GEMINI_API_KEY is not configured. AI Chat will not work.")
    model = None
else:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(model_name="gemini-3.1-flash-lite-preview")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the periodic background worker task
    worker_task = asyncio.create_task(periodic_sync_worker(interval_seconds=60))
    yield
    # Clean up the background worker task on shutdown
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="NexaSphere AI Core", lifespan=lifespan)

init_tracing(app)

if os.getenv("METRICS_ENABLED", "true").lower() != "false":
    instrumentator = Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
    )
    instrumentator.add(lambda info: collect_celery_queue_depth())
    instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # pyright: ignore[reportArgumentType]

origins = os.getenv(
    "CORS_ORIGIN",
    "http://localhost:5173,http://localhost:5174,https://nexasphere-glbajaj.vercel.app,"
    "https://admin-nexasphere.vercel.app,https://nexa-sphere-sigma.vercel.app,"
    "https://admin-dashboard-navy-pi-22.vercel.app",
).split(",")
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = request_id_context.set(req_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    request_id_context.reset(token)
    return response

@app.get("/")
async def root():
    return {"message": "NexaSphere AI Core API is running. Visit /docs for Swagger API documentation."}

from routers import forms, recommend, certificates, notifications, portfolio, health
app.include_router(forms.router)
app.include_router(recommend.router)
app.include_router(certificates.router)
app.include_router(notifications.router)
app.include_router(health.router)
app.include_router(portfolio.router)
app.include_router(notification_anomalies.router)
# 3. CORS Configuration
origins = os.getenv("CORS_ORIGIN", "http://localhost:5173,http://localhost:5174,https://nexasphere-glbajaj.vercel.app,https://admin-nexasphere.vercel.app,https://nexa-sphere-sigma.vercel.app,https://admin-dashboard-navy-pi-22.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    token = request_id_context.set(req_id)
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = req_id
    request_id_context.reset(token)
    return response


@app.get("/")
async def root():
    return {
        "message": "NexaSphere AI Core API is running. Visit /docs for Swagger API documentation."
    }


app.include_router(forms.router)
app.include_router(webhooks.router)
app.include_router(sync.router)
app.include_router(recommend.router)
app.include_router(certificates.router)
app.include_router(notifications.router)
app.include_router(health.router)
app.include_router(portfolio.router)
app.include_router(review.router)


class ChatRequest(BaseModel):
    message: str


@app.post("/ai/chat")
@limiter.limit("20/minute")
async def chat_with_ai(request: Request, chat_req: ChatRequest):
    try:
        if not model:
            return {"reply": "Nexa-AI Core is offline. (GEMINI_API_KEY missing)"}

        full_prompt = (
            f"System Instruction:\n{SYSTEM_PROMPT}\n\nUser Message:\n{chat_req.message}"
        )
        response = model.generate_content(full_prompt)

        if not response.text:
            return {"reply": "Nexa-AI is processing, but returned an empty signal. Try rephrasing."}

        return {"reply": response.text}

    except Exception as e:
        error_code = getattr(e, "status_code", None)
        logger.warning(
            "Gemini request failed",
            extra={"error_type": type(e).__name__, "status_code": error_code},
        )

        if error_code == 429 or getattr(getattr(e, "response", None), "status_code", None) == 429:
            return {
                "reply": "Nexa-AI is currently at peak capacity (Quota Limit). Please wait 60 seconds."
            }

        return {"reply": "Nexa-AI Core Offline. Connection recalibrating..."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
