"""Document chunking configuration and utilities.

Defines chunk size limits, overlap parameters per Requirement 29.12
(chunking and embedding standards for RAG knowledge bases).
"""

from __future__ import annotations

from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings


@dataclass(frozen=True)
class ChunkingConfig:
    """Chunking parameters for RAG knowledge base ingestion."""

    chunk_size: int = settings.rag_chunk_size
    chunk_overlap: int = settings.rag_chunk_overlap
    separators: tuple[str, ...] = ("\n\n", "\n", ". ", " ", "")


def chunk_documents(
    documents: list[str],
    config: ChunkingConfig | None = None,
) -> list[str]:
    """Split documents into chunks using the configured strategy.

    Args:
        documents: Raw document texts to chunk.
        config: Optional chunking config override.

    Returns:
        List of text chunks ready for embedding.
    """
    cfg = config or ChunkingConfig()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=cfg.chunk_size,
        chunk_overlap=cfg.chunk_overlap,
        separators=list(cfg.separators),
    )
    chunks: list[str] = []
    for doc in documents:
        chunks.extend(splitter.split_text(doc))
    return chunks
