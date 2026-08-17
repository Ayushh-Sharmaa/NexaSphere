import asyncio
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock, patch


def _import_portfolio(monkeypatch):
    monkeypatch.delenv("ALLOW_PORTFOLIO_FIXTURES", raising=False)

    # Avoid requiring a live Postgres driver just to exercise fallback logic.
    sys.modules["database"] = MagicMock(
        SessionLocal=MagicMock(),
        engine=MagicMock(),
        get_db=MagicMock(),
    )
    sys.modules["models.portfolio"] = MagicMock()
    sys.modules["services.portfolio_service"] = MagicMock()

    if "routers.portfolio" in sys.modules:
        del sys.modules["routers.portfolio"]

    from routers import portfolio as portfolio_router

    return portfolio_router


def test_fixtures_allowed_defaults_false(monkeypatch):
    portfolio_router = _import_portfolio(monkeypatch)
    assert portfolio_router._fixtures_allowed() is False


def test_list_portfolios_unavailable_when_db_down(monkeypatch):
    portfolio_router = _import_portfolio(monkeypatch)

    with patch.object(portfolio_router, "_db_available", return_value=False):
        result = asyncio.run(portfolio_router.list_portfolios(db=None))

    assert result.available is False
    assert result.source == "unavailable"
    assert result.portfolios == []
    assert result.total == 0


def test_list_portfolios_fixtures_opt_in(monkeypatch):
    portfolio_router = _import_portfolio(monkeypatch)
    monkeypatch.setenv("ALLOW_PORTFOLIO_FIXTURES", "true")

    with patch.object(portfolio_router, "_db_available", return_value=False):
        result = asyncio.run(portfolio_router.list_portfolios(db=None))

    assert result.source == "fixtures"
    assert result.total == 1
    assert result.portfolios[0].full_name == "Rajesh Puripanda"
