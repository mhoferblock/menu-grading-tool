from __future__ import annotations

import os
from typing import List


class Settings:
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    SQUARE_ACCESS_TOKEN: str = os.getenv("SQUARE_ACCESS_TOKEN", "")
    DATABRICKS_WAREHOUSE_ID: str = os.getenv("DATABRICKS_WAREHOUSE_ID", "a53b3ef899f7696a")
    DATABRICKS_CATALOG: str = os.getenv("DATABRICKS_CATALOG", "sandbox")
    DATABRICKS_SCHEMA: str = os.getenv("DATABRICKS_SCHEMA", "menu_grading")
    FEEDBACK_CC_EMAIL: str = os.getenv(
        "FEEDBACK_CC_EMAIL", "menugradingtoolresponses@squareup.com"
    )
    FEEDBACK_FROM_EMAIL: str = os.getenv(
        "FEEDBACK_FROM_EMAIL", "noreply@menugrading.squareup.com"
    )
    ALLOWED_DOMAINS: List[str] = os.getenv(
        "ALLOWED_DOMAINS", "squareup.com,block.xyz,bpofit.com"
    ).split(",")
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))


settings = Settings()
