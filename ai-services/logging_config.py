"""Structured JSON logging configuration for AI Services."""

import logging
import sys

from pythonjsonlogger.json import JsonFormatter


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    """Configure structured JSON logging for the AI services.

    Returns the root 'ai_services' logger with JSON-formatted output
    suitable for CloudWatch ingestion.
    """
    logger = logging.getLogger("ai_services")

    if logger.handlers:
        return logger

    handler = logging.StreamHandler(sys.stdout)
    formatter = JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
        rename_fields={"asctime": "timestamp", "levelname": "level"},
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False

    return logger
