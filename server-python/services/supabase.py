import os
from typing import Any, Dict

import httpx


class SupabaseService:
    def __init__(self) -> None:
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.url:
            raise RuntimeError("Missing SUPABASE_URL")
        if not self.key:
            raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")

        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    async def _insert(self, table: str, form_data: Dict[str, Any]) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/rest/v1/{table}",
                headers=self.headers,
                json=form_data,
            )
            response.raise_for_status()

    async def insert_membership(self, form_data: Dict[str, Any]) -> None:
        """Insert into membership_forms table"""
        await self._insert("membership_forms", form_data)

    async def insert_recruitment(self, form_data: Dict[str, Any]) -> None:
        """Insert into recruitment_forms table"""
        await self._insert("recruitment_forms", form_data)

    async def insert_core_team_application(self, form_data: Dict[str, Any]) -> None:
        """Insert into core_team_applications table"""
        await self._insert("core_team_applications", form_data)


supabase_service = SupabaseService()

