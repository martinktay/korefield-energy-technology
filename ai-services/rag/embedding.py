"""Embedding configuration and model factory.

Defines the embedding model version used across all RAG pipelines
per Requirement 29.12 (consistent, reproducible retrieval quality).
"""

from __future__ import annotations

from dataclasses import dataclass

from langchain_core.embeddings import Embeddings

from config import settings


@dataclass(frozen=True)
class EmbeddingConfig:
    """Embedding model configuration."""

    model_name: str = settings.rag_embedding_model


def get_embedding_model(config: EmbeddingConfig | None = None) -> Embeddings:
    """Create an embedding model instance.

    Returns a LangChain-compatible Embeddings object. Currently uses
    OpenAI embeddings; swap implementation for alternative providers.

    Raises:
        ImportError: If the required embedding provider is not installed.
    """
    cfg = config or EmbeddingConfig()

    from langchain_openai import OpenAIEmbeddings

    return OpenAIEmbeddings(model=cfg.model_name)
