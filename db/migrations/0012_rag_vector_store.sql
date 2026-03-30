-- Migration: 0012_rag_vector_store
-- Enables the pgvector extension and creates the rag_document_chunks table
-- for storing RAG pipeline document embeddings. Used by the AI services
-- RAG pipeline for cosine similarity search against curriculum content.
-- Embeddings use vector(1536) for the text-embedding-3-small model.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rag_document_chunks (
  id          TEXT PRIMARY KEY,                            -- Chunk identifier
  content     TEXT NOT NULL,                               -- Raw chunk text
  embedding   vector(1536) NOT NULL,                       -- OpenAI text-embedding-3-small vector
  kb_version  TEXT NOT NULL DEFAULT 'v0',                   -- Knowledge base version tag
  metadata    JSONB NOT NULL DEFAULT '{}',                  -- Additional chunk metadata
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_chunks_embedding ON rag_document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
