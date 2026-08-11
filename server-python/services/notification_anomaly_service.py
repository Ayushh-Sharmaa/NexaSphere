import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd
from sklearn.ensemble import IsolationForest
import httpx

from services.supabase import supabase_service

logger = logging.getLogger(__name__)


@dataclass
class AnomalyResult:
    detected: bool
    severity: str
    message: str
    metric: str
    current_value: float | None
    expected_value: float | None
    sample_size: int


class NotificationAnomalyDetector:
    """
    Detect unusual notification delivery patterns using Isolation Forest.

    The detector analyzes hourly notification delivery rates
    from the Supabase notification_analytics table.
    """

    MIN_SAMPLES = 24
    HISTORY_HOURS = 168  # 7 days
    CONTAMINATION = 0.10

    def __init__(
        self,
        contamination: float = CONTAMINATION,
        random_state: int = 42,
    ):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100,
        )

    async def _fetch_hourly_delivery_data(
        self,
        hours: int = HISTORY_HOURS,
    ) -> pd.DataFrame:
        """
        Fetch notification analytics from Supabase
        and calculate hourly delivery rates.
        """

        since = (
            datetime.now(timezone.utc)
            - timedelta(hours=hours)
        ).isoformat()

        url = (
            f"{supabase_service.url}/rest/v1/"
            f"notification_analytics"
            f"?created_at=gte.{since}"
            f"&select=created_at,event_type"
            f"&order=created_at.asc"
        )

        headers = {
            key: value
            for key, value in supabase_service.headers.items()
            if key != "Prefer"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=headers,
                )

                response.raise_for_status()
                rows = response.json()

        except Exception as exc:
            logger.error(
                "Failed to fetch notification analytics: %s",
                exc,
            )

            return pd.DataFrame(
                columns=[
                    "hour",
                    "sent_count",
                    "delivered_count",
                    "delivery_rate",
                ]
            )

        if not rows:
            return pd.DataFrame(
                columns=[
                    "hour",
                    "sent_count",
                    "delivered_count",
                    "delivery_rate",
                ]
            )

        df = pd.DataFrame(rows)

        df["created_at"] = pd.to_datetime(
            df["created_at"],
            utc=True,
        )

        df["hour"] = df["created_at"].dt.floor("h")

        sent_events = {
            "notification_sent",
            "sent",
        }

        delivered_events = {
            "delivered",
            "notification_delivered",
        }

        df["is_sent"] = df["event_type"].isin(sent_events)
        df["is_delivered"] = df["event_type"].isin(
            delivered_events
        )

        hourly = (
            df.groupby("hour")
            .agg(
                sent_count=("is_sent", "sum"),
                delivered_count=("is_delivered", "sum"),
            )
            .reset_index()
        )

        hourly["delivery_rate"] = (
            hourly["delivered_count"]
            .div(
                hourly["sent_count"].replace(0, pd.NA)
            )
            .fillna(0)
            .astype(float)
        )

        return hourly

    async def detect(self) -> AnomalyResult:
        """
        Analyze recent notification delivery behavior.
        """

        df = await self._fetch_hourly_delivery_data()

        if len(df) < self.MIN_SAMPLES:
            return AnomalyResult(
                detected=False,
                severity="insufficient_data",
                message=(
                    "Not enough historical data for anomaly "
                    f"detection. Required at least "
                    f"{self.MIN_SAMPLES} hourly samples, "
                    f"found {len(df)}."
                ),
                metric="delivery_rate",
                current_value=None,
                expected_value=None,
                sample_size=len(df),
            )

        values = df[["delivery_rate"]].to_numpy()

        predictions = self.model.fit_predict(values)

        df["is_anomaly"] = predictions == -1

        latest = df.iloc[-1]

        current_rate = float(
            latest["delivery_rate"]
        )

        normal_values = df.loc[
            ~df["is_anomaly"],
            "delivery_rate",
        ]

        expected_rate = (
            float(normal_values.mean())
            if not normal_values.empty
            else float(df["delivery_rate"].mean())
        )

        if bool(latest["is_anomaly"]):
            logger.critical(
                "Notification delivery anomaly detected: "
                "current_rate=%.4f expected_rate=%.4f "
                "sample_size=%d",
                current_rate,
                expected_rate,
                len(df),
            )

            return AnomalyResult(
                detected=True,
                severity="critical",
                message=(
                    "Anomalous notification delivery rate "
                    "detected. Infrastructure investigation "
                    "is recommended."
                ),
                metric="delivery_rate",
                current_value=current_rate,
                expected_value=expected_rate,
                sample_size=len(df),
            )

        return AnomalyResult(
            detected=False,
            severity="normal",
            message=(
                "Notification delivery rate is within "
                "the expected range."
            ),
            metric="delivery_rate",
            current_value=current_rate,
            expected_value=expected_rate,
            sample_size=len(df),
        )


detector = NotificationAnomalyDetector()


async def detect_notification_anomaly() -> dict[str, Any]:
    """
    Public service function used by the API/router.
    """

    result = await detector.detect()

    return {
        "anomalyDetected": result.detected,
        "severity": result.severity,
        "message": result.message,
        "metric": result.metric,
        "currentValue": result.current_value,
        "expectedValue": result.expected_value,
        "sampleSize": result.sample_size,
        "checkedAt": datetime.now(
            timezone.utc
        ).isoformat(),
    }