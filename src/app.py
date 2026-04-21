import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from src.config import settings
from src.utils.logging import setup_logging, get_logger
from src.utils.errors import AppError

from src.routers import reports, builders, graders, quality, feedback, ai, catalog, uploads
from src.services.store import init_tables, seed_if_empty
from src.services.db import is_available as db_is_available

setup_logging(debug=settings.DEBUG)
log = get_logger("app")

app = FastAPI(
    title="Menu Grading Tool",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    user_email = request.headers.get("X-Forwarded-Email", "dev@squareup.com")
    user_name = request.headers.get("X-Forwarded-User", "Dev User")
    request.state.user_email = user_email
    request.state.user_name = user_name
    response = await call_next(request)
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    detail = exc.detail
    if isinstance(detail, dict):
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error, "detail": detail},
    )


# --- Mount API routers under /api/v1/ ---
app.include_router(reports.router, prefix="/api/v1")
app.include_router(builders.router, prefix="/api/v1")
app.include_router(graders.router, prefix="/api/v1")
app.include_router(quality.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(catalog.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    if db_is_available():
        log.info("initializing_database")
        init_tables()
        seed_if_empty()
        log.info("database_ready")
    else:
        log.warning("database_unavailable", msg="Running without persistence — data will not survive restarts")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0", "env": settings.ENV, "db": db_is_available()}


# --- Serve static frontend files ---
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        """Serve index.html for all non-API routes (SPA client-side routing)."""
        file_path = frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )
