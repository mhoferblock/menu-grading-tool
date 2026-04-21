import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from src.config import settings
from src.utils.logging import setup_logging, get_logger
from src.utils.errors import AppError

from src.routers import reports, builders, graders, quality, feedback, ai

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


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0", "env": settings.ENV}


# --- Serve static frontend files ---
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )
