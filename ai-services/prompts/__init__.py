"""Prompt management module — version-controlled prompt storage and retrieval.

Prompts are identified by PMV-* version identifiers and stored as YAML files.
Retrieval is by agent type + prompt key + version, supporting rollback and
evaluation tracking per the Prompt Engineering Standard.
"""

from prompts.manager import PromptManager, PromptVersion

__all__ = ["PromptManager", "PromptVersion"]
