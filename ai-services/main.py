"""KoreField Academy AI Services — FastAPI entry point.

Thin HTTP layer for the AI Agent Ecosystem (LangChain, LangGraph, LangSmith).
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.executive import (
    academic_performance_router,
    expansion_router,
    growth_router,
    market_intelligence_router,
    pricing_intelligence_router,
    product_strategy_router,
    strategy_router,
    workforce_intelligence_router,
)
from agents.faculty import (
    assessor_support_router,
    certification_validation_router,
    instructor_insight_router,
)
from agents.learner import (
    career_router,
    dropout_router,
    feedback_router,
    tutor_router,
)
from config import settings
from logging_config import setup_logging

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(
        "ai_services_startup",
        extra={"environment": settings.environment, "version": settings.app_version},
    )
    yield
    logger.info("ai_services_shutdown")


app = FastAPI(
    title="KoreField Academy AI Services",
    description="AI Agent Ecosystem — LangChain, LangGraph, LangSmith",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Register learner-side agent routers
app.include_router(tutor_router)
app.include_router(feedback_router)
app.include_router(dropout_router)
app.include_router(career_router)

# Register faculty-side agent routers
app.include_router(instructor_insight_router)
app.include_router(assessor_support_router)
app.include_router(certification_validation_router)

# Register executive-side agent routers (Super Admin only)
app.include_router(market_intelligence_router)
app.include_router(pricing_intelligence_router)
app.include_router(expansion_router)
app.include_router(academic_performance_router)
app.include_router(strategy_router)
app.include_router(growth_router)
app.include_router(product_strategy_router)
app.include_router(workforce_intelligence_router)


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for ECS Fargate readiness/liveness probes."""
    return {
        "status": "healthy",
        "service": "ai-services",
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
