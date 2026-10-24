"""
FastAPI application entry point — APAAR Verify Backend.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import engine, Base
from app.core.exceptions import (
    APAARException,
    apaar_exception_handler,
    validation_exception_handler,
    http_exception_handler,
)
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Import all models so they're registered with Base.metadata
import app.models  # noqa: F401

# API routers
from app.api import (
    auth,
    institutions,
    students,
    uploads,
    validation,
    reviews,
    dashboard,
    verification,
    audit,
    notifications,
    reports,
    graph,
    integrations,
    jwks,
    consent,
    institutional_api,
    reference_data,
    freshness,
    correction_workflow,
    zk_exchange,
    analytics_v2,
    ocr,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Create tables if they don't exist (for development/demo)
    Base.metadata.create_all(bind=engine)
    if settings.DEMO_MODE:
        try:
            import sys
            backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
            if backend_dir not in sys.path:
                sys.path.insert(0, backend_dir)
            from seed_data import seed
            seed()
        except Exception as e:
            print(f"Auto-seed note: {e}")
    yield
    # Cleanup on shutdown (if needed)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description=(
        "APAAR Verify — Academic Data Integrity Platform. "
        "DEMONSTRATION ENVIRONMENT: All data is synthetic. "
        "Identity responses are simulated and are NOT official APAAR results."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Exception Handlers ───────────────────────────────────────────────────────
app.add_exception_handler(APAARException, apaar_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

# ─── Routers ─────────────────────────────────────────────────────────────────
PREFIX = settings.API_V1_STR

app.include_router(auth.router, prefix=PREFIX, tags=["Authentication"])
app.include_router(institutions.router, prefix=PREFIX, tags=["Institutions"])
app.include_router(students.router, prefix=PREFIX, tags=["Students"])
app.include_router(uploads.router, prefix=PREFIX, tags=["Uploads"])
app.include_router(validation.router, prefix=PREFIX, tags=["Validation"])
app.include_router(reviews.router, prefix=PREFIX, tags=["Reviews"])
app.include_router(dashboard.router, prefix=PREFIX, tags=["Dashboard"])
app.include_router(verification.router, prefix=PREFIX, tags=["Verification"])
app.include_router(audit.router, prefix=PREFIX, tags=["Audit"])
app.include_router(notifications.router, prefix=PREFIX, tags=["Notifications"])
app.include_router(reports.router, prefix=PREFIX, tags=["Reports"])
app.include_router(graph.router, prefix=PREFIX, tags=["Graph"])
app.include_router(integrations.router, prefix=PREFIX, tags=["External Identity Integrations"])
app.include_router(jwks.router, prefix=PREFIX, tags=["Cryptographic Trust Framework"])
app.include_router(consent.router, prefix=PREFIX, tags=["Consent & Purpose Scoping"])
app.include_router(institutional_api.router, prefix=PREFIX, tags=["Institutional ERP & SIS Integration"])
app.include_router(reference_data.router, prefix=PREFIX, tags=["Authoritative Reference Data & Reconciliation"])
app.include_router(freshness.router, prefix=PREFIX, tags=["Source Freshness & SLA Monitoring"])
app.include_router(correction_workflow.router, prefix=PREFIX, tags=["Expanded Correction Reconciliation"])
app.include_router(zk_exchange.router, prefix=PREFIX, tags=["Zero-Knowledge & Blinded Privacy Exchange"])
app.include_router(analytics_v2.router, prefix=PREFIX, tags=["Integrity Analytics & Risk Scoring"])
app.include_router(ocr.router, prefix=PREFIX, tags=["OCR Document Reconciliation"])


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "demo_mode": settings.DEMO_MODE,
        "disclaimer": (
            "DEMONSTRATION ENVIRONMENT — All data is synthetic. "
            "Identity responses are NOT official APAAR verification results."
        ),
    }


# ─── Static Frontend Serving (Single-Port Production Deployment) ─────────────
frontend_dist = os.environ.get(
    "FRONTEND_DIST",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
)
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}", tags=["Frontend SPA"])
async def serve_spa(full_path: str):
    # Don't intercept API routes or documentation
    if (
        full_path.startswith("api/")
        or full_path == "api"
        or full_path.startswith("health")
        or full_path.startswith("docs")
        or full_path.startswith("redoc")
        or full_path.startswith("openapi.json")
    ):
        raise HTTPException(status_code=404, detail="Not Found")

    # Serve static file if it exists (e.g. vite.svg, favicon)
    file_path = os.path.join(frontend_dist, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # Fallback to index.html for client-side routing
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)

    return {"message": "Frontend build not found. Please build frontend first."}
