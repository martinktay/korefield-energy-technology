# KoreField Academy — Python FastAPI AI Services
# Multi-stage production build using uv on python:3.12-slim.
# Stages: deps → production
# Exposes port 8000, runs as non-root user.

# ──────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────
FROM python:3.12-slim AS deps

RUN pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

# ──────────────────────────────────────────────
# Stage 2: Production image
# ──────────────────────────────────────────────
FROM python:3.12-slim AS production

RUN pip install --no-cache-dir uv

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Non-root user for security
RUN groupadd --system --gid 1001 kfgroup && \
    useradd --system --uid 1001 --gid kfgroup kfuser

COPY --from=deps --chown=kfuser:kfgroup /app/.venv ./.venv
COPY --from=deps --chown=kfuser:kfgroup /app/pyproject.toml /app/uv.lock ./

# Copy application source
COPY --chown=kfuser:kfgroup main.py config.py logging_config.py ./
COPY --chown=kfuser:kfgroup agents ./agents
COPY --chown=kfuser:kfgroup prompts ./prompts
COPY --chown=kfuser:kfgroup rag ./rag
COPY --chown=kfuser:kfgroup workflows ./workflows

USER kfuser

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
