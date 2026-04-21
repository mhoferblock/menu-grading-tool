"""Database layer using Databricks SDK Statement Execution API."""

from __future__ import annotations

import json
from typing import Any, Optional

from src.config import settings
from src.utils.logging import get_logger

log = get_logger("db")

_client = None


def _get_client():
    global _client
    if _client is None:
        try:
            from databricks.sdk import WorkspaceClient
            _client = WorkspaceClient()
            log.info("db_connected", catalog=settings.DATABRICKS_CATALOG, schema=settings.DATABRICKS_SCHEMA)
        except Exception as e:
            log.warning("db_connect_failed", error=str(e))
            _client = None
    return _client


def execute_sql(sql: str, params: Optional[dict] = None) -> list[dict]:
    """Execute SQL and return rows as list of dicts."""
    client = _get_client()
    if client is None:
        return []

    try:
        fqn_sql = sql
        if params:
            for key, val in params.items():
                placeholder = f":{key}"
                if isinstance(val, str):
                    escaped = val.replace("'", "''")
                    fqn_sql = fqn_sql.replace(placeholder, f"'{escaped}'")
                elif val is None:
                    fqn_sql = fqn_sql.replace(placeholder, "NULL")
                else:
                    fqn_sql = fqn_sql.replace(placeholder, str(val))

        response = client.statement_execution.execute_statement(
            warehouse_id=settings.DATABRICKS_WAREHOUSE_ID,
            statement=fqn_sql,
            catalog=settings.DATABRICKS_CATALOG,
            schema=settings.DATABRICKS_SCHEMA,
            wait_timeout="30s",
        )

        if response.status and response.status.state and response.status.state.value == "FAILED":
            error_msg = response.status.error.message if response.status.error else "Unknown"
            log.error("sql_failed", sql=sql[:200], error=error_msg)
            return []

        if not response.manifest or not response.result:
            return []

        columns = [col.name for col in response.manifest.schema.columns]
        rows = []
        if response.result.data_array:
            for row_data in response.result.data_array:
                row = {}
                for i, col_name in enumerate(columns):
                    row[col_name] = row_data[i] if i < len(row_data) else None
                rows.append(row)
        return rows

    except Exception as e:
        log.error("sql_error", sql=sql[:200], error=str(e))
        return []


def execute_ddl(sql: str) -> bool:
    """Execute DDL statement, return True on success."""
    client = _get_client()
    if client is None:
        return False
    try:
        response = client.statement_execution.execute_statement(
            warehouse_id=settings.DATABRICKS_WAREHOUSE_ID,
            statement=sql,
            catalog=settings.DATABRICKS_CATALOG,
            schema=settings.DATABRICKS_SCHEMA,
            wait_timeout="30s",
        )
        if response.status and response.status.state and response.status.state.value == "FAILED":
            error_msg = response.status.error.message if response.status.error else "Unknown"
            log.error("ddl_failed", sql=sql[:200], error=error_msg)
            return False
        return True
    except Exception as e:
        log.error("ddl_error", sql=sql[:200], error=str(e))
        return False


def is_available() -> bool:
    """Check if the database connection is available."""
    return _get_client() is not None
