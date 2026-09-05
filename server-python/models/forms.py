from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class FormSubmission(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr
    whatsapp: str = Field(..., pattern=r"^\d{10}$")
    year: str = Field(..., max_length=20)
    branch: str = Field(..., max_length=100)
    section: str = Field(..., max_length=1, pattern=r"^[A-Z]$")
    reason: Optional[str] = Field(None, max_length=500)

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Priya Verma",
                "email": "priya.verma@example.com",
                "whatsapp": "9876543210",
                "year": "1st Year",
                "branch": "CSE (AI & ML)",
                "section": "B",
                "reason": "Passionate about technology and eager to contribute to the community.",
            }
        }
    }

