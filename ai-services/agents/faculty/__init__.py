"""Faculty-side agents: Instructor Insight, Assessor Support, Certification Validation."""

from agents.faculty.assessor_support import router as assessor_support_router
from agents.faculty.certification_validation import router as certification_validation_router
from agents.faculty.instructor_insight import router as instructor_insight_router

__all__ = [
    "assessor_support_router",
    "certification_validation_router",
    "instructor_insight_router",
]
