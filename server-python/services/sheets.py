import os
from datetime import datetime
from typing import Any, Dict

import gspread
from google.oauth2.service_account import Credentials


class SheetsService:
    def __init__(self) -> None:
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

        private_key = os.getenv("GOOGLE_PRIVATE_KEY")
        if not private_key:
            raise RuntimeError("Missing GOOGLE_PRIVATE_KEY")

        creds_dict = {
            "type": "service_account",
            "project_id": os.getenv("GOOGLE_PROJECT_ID"),
            "private_key": private_key.replace("\\n", "\n"),
            "client_email": os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
            "token_uri": "https://oauth2.googleapis.com/token",
        }

        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        self.client = gspread.authorize(creds)
        self.sheet_id = os.getenv("GOOGLE_SHEET_ID")
        if not self.sheet_id:
            raise RuntimeError("Missing GOOGLE_SHEET_ID")

    def _append_to_worksheet(self, worksheet_name: str, form_data: Dict[str, Any]) -> None:
        sheet = self.client.open_by_key(self.sheet_id).worksheet(worksheet_name)
        row = [
            datetime.now().isoformat(),
            form_data["name"],
            form_data["email"],
            form_data["whatsapp"],
            form_data["year"],
            form_data["branch"],
            form_data["section"],
            form_data.get("reason") or "",
        ]
        sheet.append_row(row)

    async def append_membership(self, form_data: Dict[str, Any]) -> None:
        """Append to Membership sheet"""
        self._append_to_worksheet("Membership", form_data)

    async def append_recruitment(self, form_data: Dict[str, Any]) -> None:
        """Append to Recruitment sheet"""
        self._append_to_worksheet("Recruitment", form_data)

    async def append_core_team_application(self, form_data: Dict[str, Any]) -> None:
        """Append to Core Team Applications sheet"""
        self._append_to_worksheet("CoreTeamApplications", form_data)


sheets_service = SheetsService()

