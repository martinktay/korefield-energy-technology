"""RAG pipeline module — chunking, embedding, and vector store integration.

Provides the retrieval backbone for RAG-based agents (Tutor, Feedback, Career).
Knowledge bases are versioned and updated through a controlled ingestion pipeline.
"""

from rag.chunking import ChunkingConfig, chunk_documents
from rag.embedding import EmbeddingConfig, get_embedding_model
from rag.pipeline import RAGPipeline

__all__ = [
    "ChunkingConfig",
    "EmbeddingConfig",
    "RAGPipeline",
    "chunk_documents",
    "get_embedding_model",
]
