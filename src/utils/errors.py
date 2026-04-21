from __future__ import annotations

from typing import Optional
from fastapi import HTTPException


class AppError(HTTPException):
    def __init__(self, status_code: int, error: str, detail: Optional[str] = None):
        self.error = error
        super().__init__(
            status_code=status_code,
            detail={"error": error, "detail": detail or error},
        )


class NotFoundError(AppError):
    def __init__(self, resource: str, id: str):
        super().__init__(404, "%s not found" % resource, "%s with id '%s' not found" % (resource, id))


class ValidationError(AppError):
    def __init__(self, detail: str):
        super().__init__(422, "Validation error", detail)


class AuthError(AppError):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(401, "Unauthorized", detail)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(403, "Forbidden", detail)
