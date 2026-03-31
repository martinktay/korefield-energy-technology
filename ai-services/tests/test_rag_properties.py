"""Property-based tests for RAG pipeline ingest-retrieve round trip.

Uses hypothesis to verify universal correctness properties across
randomized inputs. Each test references its design document property
and validates specific requirements.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from hypothesis import given, settings as h_settings, strategies as st

from rag.chunking import ChunkingConfig
from rag.pipeline import RAGPipeline


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Generate non-empty document text: printable strings with reasonable length.
# We ensure min_size=1 so the document always produces at least one chunk.
_document_text_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
    min_size=10,
    max_size=500,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_deterministic_embedding(text: str) -> list[float]:
    """Create a deterministic pseudo-embedding from text content.

    Uses a simple hash-based approach so that identical or overlapping
    texts produce similar vectors, enabling the cosine similarity check
    to work correctly in the mocked environment.
    """
    # Use a fixed base vector and perturb slightly based on text hash
    import hashlib

    h = hashlib.sha256(text.encode("utf-8", errors="replace")).digest()
    # Build a 1536-dim vector from repeating hash bytes, normalized
    raw = [b / 255.0 for b in h] * (1536 // 32)
    norm = max((sum(x * x for x in raw)) ** 0.5, 1e-10)
    return [x / norm for x in raw]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = max(sum(x * x for x in a) ** 0.5, 1e-10)
    norm_b = max(sum(x * x for x in b) ** 0.5, 1e-10)
    return dot / (norm_a * norm_b)


# ---------------------------------------------------------------------------
# Property 1: RAG Ingest-Retrieve Round Trip
# Feature: production-readiness-hardening, Property 1
# Validates: Requirements 1.1, 1.6
# ---------------------------------------------------------------------------


class TestRAGIngestRetrieveRoundTrip:
    """Property 1: RAG Ingest-Retrieve Round Trip.

    For any valid non-empty document text, ingesting then retrieving with
    the same text as query should return at least one chunk containing
    that text.

    **Validates: Requirements 1.1, 1.6**
    """

    @given(doc_text=_document_text_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_ingest_then_retrieve_returns_matching_chunk(
        self, doc_text: str
    ) -> None:
        """Ingesting a document and querying with the same text returns at
        least one chunk whose content is a substring of (or equal to) the
        original document text."""

        # Use small chunk size so short docs still get chunked properly
        pipeline = RAGPipeline(
            chunking_config=ChunkingConfig(chunk_size=200, chunk_overlap=50),
        )

        # -- In-memory store simulating pgvector --------------------------
        stored_rows: list[dict] = []

        async def mock_execute(query: str, *args) -> None:
            """Capture INSERT calls into the in-memory store."""
            if "INSERT INTO rag_document_chunks" in query:
                chunk_id, content, embedding_str, kb_version, metadata = args
                # Parse the embedding string "[0.1,0.2,...]" into a list
                vec = [float(x) for x in embedding_str.strip("[]").split(",")]
                stored_rows.append(
                    {
                        "id": chunk_id,
                        "content": content,
                        "embedding": vec,
                        "kb_version": kb_version,
                        "metadata": metadata,
                    }
                )

        async def mock_fetch(query: str, *args) -> list[dict]:
            """Simulate cosine similarity search against stored rows."""
            query_embedding_str = args[0]
            threshold = args[1]
            top_k = args[2]

            query_vec = [
                float(x) for x in query_embedding_str.strip("[]").split(",")
            ]

            scored = []
            for row in stored_rows:
                score = _cosine_similarity(query_vec, row["embedding"])
                if score >= threshold:
                    scored.append((score, row))

            # Sort by score descending (highest similarity first)
            scored.sort(key=lambda x: x[0], reverse=True)

            results = []
            for score, row in scored[:top_k]:
                results.append(
                    {
                        "id": row["id"],
                        "content": row["content"],
                        "kb_version": row["kb_version"],
                        "metadata": row["metadata"],
                        "score": score,
                    }
                )
            return results

        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(side_effect=mock_execute)
        mock_conn.fetch = AsyncMock(side_effect=mock_fetch)
        mock_conn.close = AsyncMock()

        # -- Mock embedding model -----------------------------------------
        # Use deterministic embeddings so chunks of the same text produce
        # vectors with high cosine similarity to the query vector.
        mock_embed = MagicMock()
        mock_embed.embed_documents = MagicMock(
            side_effect=lambda texts: [
                _make_deterministic_embedding(t) for t in texts
            ]
        )
        mock_embed.embed_query = MagicMock(
            side_effect=lambda text: _make_deterministic_embedding(text)
        )

        with (
            patch("rag.pipeline.get_embedding_model", return_value=mock_embed),
            patch(
                "rag.pipeline.asyncpg.connect",
                AsyncMock(return_value=mock_conn),
            ),
        ):
            # Ingest the document
            chunk_count = await pipeline.ingest([doc_text])
            assert chunk_count > 0, "Ingest should produce at least one chunk"

            # Retrieve using the original document text as query
            results = await pipeline.retrieve(doc_text, top_k=10, threshold=0.0)

        # -- Verify round-trip property -----------------------------------
        assert len(results) >= 1, (
            f"Expected at least 1 result for query matching ingested doc, "
            f"got {len(results)}. Stored {len(stored_rows)} chunks."
        )

        # At least one returned chunk's content should be a substring of
        # the original document (since chunks are splits of the document).
        found_match = any(
            r["content"] in doc_text or doc_text in r["content"]
            for r in results
        )
        assert found_match, (
            f"No returned chunk is a substring of the original document.\n"
            f"Document: {doc_text!r}\n"
            f"Returned chunks: {[r['content'] for r in results]}"
        )


# ---------------------------------------------------------------------------
# Property 2: Retrieve Returns At Most top_k Results
# Feature: production-readiness-hardening, Property 2
# Validates: Requirements 1.2
# ---------------------------------------------------------------------------


class TestRetrieveTopKBound:
    """Property 2: Retrieve Returns At Most top_k Results.

    For any query and positive integer top_k, `retrieve()` should return
    a list with length ≤ top_k.

    **Validates: Requirements 1.2**
    """

    @given(
        query_text=_document_text_st,
        top_k=st.integers(min_value=1, max_value=50),
        num_stored=st.integers(min_value=0, max_value=100),
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_retrieve_returns_at_most_top_k(
        self, query_text: str, top_k: int, num_stored: int
    ) -> None:
        """Regardless of how many chunks are stored, retrieve() never
        returns more than top_k results."""

        pipeline = RAGPipeline(
            chunking_config=ChunkingConfig(chunk_size=200, chunk_overlap=50),
        )

        # -- Build an in-memory store with `num_stored` chunks ------------
        stored_rows: list[dict] = []
        for i in range(num_stored):
            chunk_text = f"stored chunk number {i}"
            stored_rows.append(
                {
                    "id": f"CHK-{i:012d}",
                    "content": chunk_text,
                    "embedding": _make_deterministic_embedding(chunk_text),
                    "kb_version": "v0",
                    "metadata": json.dumps({"source": "seed"}),
                }
            )

        async def mock_fetch(query: str, *args) -> list[dict]:
            """Simulate cosine similarity search respecting LIMIT."""
            query_embedding_str = args[0]
            threshold = args[1]
            limit = args[2]

            query_vec = [
                float(x) for x in query_embedding_str.strip("[]").split(",")
            ]

            scored = []
            for row in stored_rows:
                score = _cosine_similarity(query_vec, row["embedding"])
                if score >= threshold:
                    scored.append((score, row))

            scored.sort(key=lambda x: x[0], reverse=True)

            results = []
            for score, row in scored[:limit]:
                results.append(
                    {
                        "id": row["id"],
                        "content": row["content"],
                        "kb_version": row["kb_version"],
                        "metadata": row["metadata"],
                        "score": score,
                    }
                )
            return results

        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(side_effect=mock_fetch)
        mock_conn.close = AsyncMock()

        # -- Mock embedding model -----------------------------------------
        mock_embed = MagicMock()
        mock_embed.embed_query = MagicMock(
            side_effect=lambda text: _make_deterministic_embedding(text)
        )

        with (
            patch("rag.pipeline.get_embedding_model", return_value=mock_embed),
            patch(
                "rag.pipeline.asyncpg.connect",
                AsyncMock(return_value=mock_conn),
            ),
        ):
            results = await pipeline.retrieve(
                query_text, top_k=top_k, threshold=0.0
            )

        # -- Verify top_k bound ------------------------------------------
        assert len(results) <= top_k, (
            f"retrieve() returned {len(results)} results which exceeds "
            f"top_k={top_k}. Stored {num_stored} chunks."
        )


# ---------------------------------------------------------------------------
# Property 3: Ingested Chunks Carry Version Tag
# Feature: production-readiness-hardening, Property 3
# Validates: Requirements 1.5
# ---------------------------------------------------------------------------

# Strategy for version tag strings: non-empty printable identifiers.
_version_tag_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N")),
    min_size=1,
    max_size=30,
)


class TestVersionTagPropagation:
    """Property 3: Ingested Chunks Carry Version Tag.

    For any list of documents and any version tag, after calling
    ``ingest(documents, version)``, every stored chunk should have
    ``kb_version`` equal to the provided version tag.

    **Validates: Requirements 1.5**
    """

    @given(
        doc_texts=st.lists(_document_text_st, min_size=1, max_size=5),
        version_tag=_version_tag_st,
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_all_ingested_chunks_carry_version_tag(
        self, doc_texts: list[str], version_tag: str
    ) -> None:
        """Every chunk produced by ingest(documents, version) must have
        kb_version equal to the supplied version tag."""

        pipeline = RAGPipeline(
            chunking_config=ChunkingConfig(chunk_size=200, chunk_overlap=50),
        )

        # -- In-memory store simulating pgvector --------------------------
        stored_rows: list[dict] = []

        async def mock_execute(query: str, *args) -> None:
            """Capture INSERT calls into the in-memory store."""
            if "INSERT INTO rag_document_chunks" in query:
                chunk_id, content, embedding_str, kb_version, metadata = args
                stored_rows.append(
                    {
                        "id": chunk_id,
                        "content": content,
                        "kb_version": kb_version,
                        "metadata": metadata,
                    }
                )

        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(side_effect=mock_execute)
        mock_conn.close = AsyncMock()

        # -- Mock embedding model -----------------------------------------
        mock_embed = MagicMock()
        mock_embed.embed_documents = MagicMock(
            side_effect=lambda texts: [
                _make_deterministic_embedding(t) for t in texts
            ]
        )

        with (
            patch("rag.pipeline.get_embedding_model", return_value=mock_embed),
            patch(
                "rag.pipeline.asyncpg.connect",
                AsyncMock(return_value=mock_conn),
            ),
        ):
            chunk_count = await pipeline.ingest(doc_texts, version=version_tag)

        # -- Verify version tag property ----------------------------------
        assert chunk_count > 0, (
            f"Ingest should produce at least one chunk for {len(doc_texts)} "
            f"document(s)"
        )
        assert len(stored_rows) == chunk_count, (
            f"Expected {chunk_count} stored rows, got {len(stored_rows)}"
        )

        for row in stored_rows:
            assert row["kb_version"] == version_tag, (
                f"Chunk {row['id']} has kb_version={row['kb_version']!r}, "
                f"expected {version_tag!r}"
            )
