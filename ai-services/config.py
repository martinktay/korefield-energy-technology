"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AI Services configuration.

    Values are loaded from environment variables or .env file.
    """

    # Application
    app_version: str = "0.1.0"
    environment: str = "dev"
    debug: bool = False

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # LLM Provider
    openai_api_key: str = ""
    default_model: str = "gpt-4o"

    # LangSmith Observability
    langsmith_api_key: str = ""
    langsmith_project: str = "korefield-academy"
    langsmith_tracing_enabled: bool = False

    # RAG Configuration
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 200
    rag_embedding_model: str = "text-embedding-3-small"

    model_config = {"env_prefix": "KF_", "env_file": ".env", "extra": "ignore"}


settings = Settings()
