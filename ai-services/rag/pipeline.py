"""RAG pipeline — orchestrates ingestion and retrieval via pgvector.

Provides the core retrieval pipeline used by RAG-based agents.
Knowledge bases are versioned (Req 29.11) and updated through
a controlled ingestion pipeline with quality measurement (Req 29.10).
Chunks are stored in the ``rag_document_chunks`` PostgreSQL table with
pgvector embeddings for cosine similarity search.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass, field
from typing import Any

import asyncpg

from config import settings
from rag.chunking import ChunkingConfig, chunk_documents
from rag.embedding import get_embedding_model

logger = logging.getLogger("ai_services")


@dataclass
class RAGPipeline:
    """Orchestrates document ingestion, chunking, embedding, and retrieval.

    Uses ``asyncpg`` for direct pgvector operations against the
    ``rag_document_chunks`` table created by migration 0012.
    """

    chunking_config: ChunkingConfig = field(default_factory=ChunkingConfig)
    knowledge_base_version: str = "v0"

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_connection(self) -> asyncpg.Connection:
        """Acquire a single asyncpg connection from the configured DB URL."""
        return await asyncpg.connect(settings.database_url)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def ingest(self, documents: list[str], version: str | None = None) -> int:
        """Ingest documents into the knowledge base.

        Chunks documents, generates embeddings via OpenAIEmbeddings
        (text-embedding-3-small), and INSERTs into ``rag_document_chunks``.

        Args:
            documents: Raw document texts to ingest.
            version: Knowledge base version tag.

        Returns:
            Number of chunks ingested.
        """
        kb_version = version or self.knowledge_base_version
        chunks = chunk_documents(documents, self.chunking_config)

        if not chunks:
            return 0

        logger.info(
            "rag_ingest",
            extra={
                "chunk_count": len(chunks),
                "doc_count": len(documents),
                "kb_version": kb_version,
            },
        )

        # Generate embeddings
        embed_model = get_embedding_model()
        vectors = embed_model.embed_documents(chunks)

        conn = await self._get_connection()
        try:
            for chunk_text, vector in zip(chunks, vectors):
                chunk_id = f"CHK-{uuid.uuid4().hex[:12]}"
                metadata = json.dumps({"source": "ingest", "kb_version": kb_version})
                embedding_str = "[" + ",".join(str(v) for v in vector) + "]"
                await conn.execute(
                    """
                    INSERT INTO rag_document_chunks (id, content, embedding, kb_version, metadata)
                    VALUES ($1, $2, $3::vector, $4, $5::jsonb)
                    """,
                    chunk_id,
                    chunk_text,
                    embedding_str,
                    kb_version,
                    metadata,
                )
        finally:
            await conn.close()

        return len(chunks)

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        threshold: float = 0.5,
    ) -> list[dict[str, Any]]:
        """Retrieve relevant chunks for a query via cosine similarity.

        Embeds the query, performs cosine similarity search against
        ``rag_document_chunks``, and returns up to ``top_k`` chunks
        whose similarity score exceeds ``threshold``.

        Args:
            query: The search query.
            top_k: Maximum number of results to return.
            threshold: Minimum cosine similarity (0-1). Defaults to 0.5.

        Returns:
            List of dicts with ``content``, ``kb_version``, ``metadata``,
            and ``score`` keys. Empty list when nothing matches.
        """
        logger.info(
            "rag_retrieve",
            extra={"query_length": len(query), "top_k": top_k},
        )

        embed_model = get_embedding_model()
        query_vector = embed_model.embed_query(query)
        embedding_str = "[" + ",".join(str(v) for v in query_vector) + "]"

        conn = await self._get_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT id, content, kb_version, metadata,
                       1 - (embedding <=> $1::vector) AS score
                FROM rag_document_chunks
                WHERE 1 - (embedding <=> $1::vector) >= $2
                ORDER BY embedding <=> $1::vector
                LIMIT $3
                """,
                embedding_str,
                threshold,
                top_k,
            )
        finally:
            await conn.close()

        results: list[dict[str, Any]] = []
        for row in rows:
            meta = row["metadata"]
            if isinstance(meta, str):
                meta = json.loads(meta)
            results.append(
                {
                    "id": row["id"],
                    "content": row["content"],
                    "kb_version": row["kb_version"],
                    "metadata": meta,
                    "score": float(row["score"]),
                }
            )

        return results
