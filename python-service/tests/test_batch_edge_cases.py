"""
Edge case / null value tests for POST /batch/verify.
Closes #345
"""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_batch_verify_empty_wallet_list_returns_error():
    """Empty wallet list is rejected by schema validation (min_length=1)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": []})
    # Pydantic min_length=1 → FastAPI returns 422 Unprocessable Entity
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_batch_verify_missing_wallets_field():
    """Request body without 'wallets' field is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_batch_verify_null_wallets_field():
    """Request body with null 'wallets' is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": None})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_batch_verify_over_limit():
    """More than 100 wallets returns 400."""
    wallets = [f"GADDR{str(i).zfill(51)}" for i in range(101)]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": wallets})
    assert res.status_code in (400, 422)
