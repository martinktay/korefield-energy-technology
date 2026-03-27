"""Executive-side agents: Market Intelligence, Pricing Intelligence, Expansion, Academic Performance."""

from agents.executive.academic_performance import router as academic_performance_router
from agents.executive.expansion import router as expansion_router
from agents.executive.market_intelligence import router as market_intelligence_router
from agents.executive.pricing_intelligence import router as pricing_intelligence_router

__all__ = [
    "academic_performance_router",
    "expansion_router",
    "market_intelligence_router",
    "pricing_intelligence_router",
]
