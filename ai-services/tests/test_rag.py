"""Tests for the RAG pipeline chunking and pipeline skeleton."""

from rag.chunking import ChunkingConfig, chunk_documents
from rag.pipeline import RAGPipeline


def test_chunk_documents_splits_text():
    long_text = "word " * 500  # ~2500 chars
    config = ChunkingConfig(chunk_size=200, chunk_overlap=50)
    chunks = chunk_documents([long_text], config)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 200 + 50  # allow overlap margin


def test_chunk_documents_empty_input():
    chunks = chunk_documents([])
    assert chunks == []


def test_chunk_documents_short_text_single_chunk():
    chunks = chunk_documents(["Hello world"])
    assert len(chunks) == 1
    assert chunks[0] == "Hello world"


def test_chunking_config_defaults():
    cfg = ChunkingConfig()
    assert cfg.chunk_size > 0
    assert cfg.chunk_overlap >= 0
    assert cfg.chunk_overlap < cfg.chunk_size


def test_rag_pipeline_ingest_returns_chunk_count():
    pipeline = RAGPipeline(
        chunking_config=ChunkingConfig(chunk_size=100, chunk_overlap=20)
    )
    count = pipeline.ingest(["word " * 200])
    assert count > 0


def test_rag_pipeline_retrieve_returns_empty_list():
    """Retrieve returns empty until vector store is integrated (task 11.1)."""
    pipeline = RAGPipeline()
    results = pipeline.retrieve("test query")
    assert results == []
