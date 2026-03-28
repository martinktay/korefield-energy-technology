"""Executive-side agents: Market Intelligence, Pricing Intelligence, Expansion, Academic Performance, Strategy, Growth, Product Strategy, Workforce Intelligence."""

from agents.executive.academic_performance import router as academic_performance_router
from agents.executive.expansion import router as expansion_router
from agents.executive.growth import router as growth_router
from agents.executive.market_intelligence import router as market_intelligence_router
from agents.executive.pricing_intelligence import router as pricing_intelligence_router
from agents.executive.product_strategy import router as product_strategy_router
from agents.executive.strategy import router as strategy_router
from agents.executive.workforce_intelligence import router as workforce_intelligence_router

__all__ = [
    "academic_performance_router",
    "expansion_router",
    "growth_router",
    "market_intelligence_router",
    "pricing_intelligence_router",
    "product_strategy_router",
    "strategy_router",
    "workforce_intelligence_router",
]
