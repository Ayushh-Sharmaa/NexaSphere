import os
from unittest.mock import patch

from services.recommendation_logic import fetch_data_with_sqlalchemy, fixtures_allowed


def test_fixtures_allowed_defaults_false(monkeypatch):
    monkeypatch.delenv("ALLOW_RECOMMENDATION_FIXTURES", raising=False)
    assert fixtures_allowed() is False


def test_fixtures_allowed_when_enabled(monkeypatch):
    monkeypatch.setenv("ALLOW_RECOMMENDATION_FIXTURES", "true")
    assert fixtures_allowed() is True


def test_fetch_returns_empty_when_db_unavailable(monkeypatch):
    monkeypatch.delenv("ALLOW_RECOMMENDATION_FIXTURES", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    events, users, parts = fetch_data_with_sqlalchemy("user_1")
    assert events == []
    assert users == []
    assert parts == []


def test_fetch_uses_fixtures_only_when_opted_in(monkeypatch):
    monkeypatch.setenv("ALLOW_RECOMMENDATION_FIXTURES", "1")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    events, users, parts = fetch_data_with_sqlalchemy("user_1")
    assert len(events) > 0
    assert len(users) > 0
    assert any(e["id"] == "evt_1" for e in events)


def test_recommend_events_does_not_return_fallback_samples(monkeypatch):
    monkeypatch.delenv("ALLOW_RECOMMENDATION_FIXTURES", raising=False)

    from routers import recommend as recommend_router
    import asyncio

    with patch(
        "routers.recommend.compute_hybrid_recommendations",
        return_value=[],
    ), patch(
        "routers.recommend._cache_get",
        return_value=None,
    ):
        result = asyncio.run(recommend_router.recommend_events("user_1", limit=5))
        assert result == []
