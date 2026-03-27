"""Input/output guardrails for learner-side agents.

Provides prompt injection protection on input and safety filtering on output,
per AI Guardrails policy (Req 31.23, 31.24).
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger("ai_services")

# Patterns that indicate prompt injection attempts
_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts)", re.I),
    re.compile(r"disregard\s+(all\s+)?(previous|above|prior)", re.I),
    re.compile(r"you\s+are\s+now\s+(a|an)\s+", re.I),
    re.compile(r"system\s*:\s*", re.I),
    re.compile(r"<\s*/?\s*system\s*>", re.I),
    re.compile(r"act\s+as\s+(if\s+)?(you\s+are\s+)?", re.I),
    re.compile(r"pretend\s+(to\s+be|you\s+are)", re.I),
    re.compile(r"override\s+(your\s+)?(instructions|rules|guidelines)", re.I),
    re.compile(r"reveal\s+(your\s+)?(system\s+)?(prompt|instructions)", re.I),
    re.compile(r"forget\s+(everything|all|your)", re.I),
]

# Patterns indicating unsafe output content
_UNSAFE_OUTPUT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(hack|exploit|attack)\s+(the|this|a)\s+(system|server|database)", re.I),
    re.compile(r"(create|build|write)\s+(a\s+)?(virus|malware|ransomware)", re.I),
    re.compile(r"(bypass|circumvent)\s+(security|authentication|authorization)", re.I),
]


class PromptInjectionError(Exception):
    """Raised when prompt injection is detected in user input."""


def validate_input(text: str) -> str:
    """Check input text for prompt injection patterns.

    Args:
        text: Raw user input to validate.

    Returns:
        The original text if safe.

    Raises:
        PromptInjectionError: If a prompt injection pattern is detected.
    """
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            logger.warning(
                "prompt_injection_blocked",
                extra={"pattern": pattern.pattern, "input_length": len(text)},
            )
            raise PromptInjectionError(
                "Input rejected: potentially unsafe content detected."
            )
    return text


def filter_output(text: str) -> str:
    """Screen agent output for harmful or policy-violating content.

    Args:
        text: Agent-generated output to filter.

    Returns:
        The original text if safe, or a safe fallback message.
    """
    for pattern in _UNSAFE_OUTPUT_PATTERNS:
        if pattern.search(text):
            logger.warning(
                "output_safety_filtered",
                extra={"pattern": pattern.pattern, "output_length": len(text)},
            )
            return (
                "I'm unable to provide that information. "
                "Please rephrase your request or contact support."
            )
    return text
