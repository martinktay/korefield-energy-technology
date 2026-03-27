"""Version-controlled prompt management.

Prompts are stored as YAML files in the prompts/templates/ directory,
organised by agent type. Each prompt file contains the prompt content,
metadata, and version identifier (PMV-*).

Directory layout:
    prompts/templates/
        tutor/
            lesson_delivery.yaml    # PMV-tutor-lesson-v1, PMV-tutor-lesson-v2, ...
        feedback/
            analyze.yaml
        ...
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger("ai_services")

PROMPTS_DIR = Path(__file__).parent / "templates"


@dataclass(frozen=True)
class PromptVersion:
    """A single versioned prompt record."""

    version_id: str  # PMV-* identifier
    agent_type: str
    prompt_key: str
    content: str
    system_instructions: str = ""
    output_format: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


class PromptManager:
    """Load and retrieve version-controlled prompts by PMV-* identifier.

    Prompts are loaded from YAML template files on disk. Each YAML file
    can contain multiple versions under a `versions` key.
    """

    def __init__(self, prompts_dir: Path | None = None) -> None:
        self._dir = prompts_dir or PROMPTS_DIR
        self._cache: dict[str, PromptVersion] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get(self, version_id: str) -> PromptVersion:
        """Retrieve a prompt by its PMV-* version identifier.

        Raises KeyError if the version is not found.
        """
        if not self._cache:
            self._load_all()

        if version_id not in self._cache:
            raise KeyError(f"Prompt version '{version_id}' not found")

        return self._cache[version_id]

    def get_latest(self, agent_type: str, prompt_key: str) -> PromptVersion:
        """Retrieve the latest version of a prompt for a given agent/key.

        Raises KeyError if no matching prompt is found.
        """
        if not self._cache:
            self._load_all()

        matches = [
            p
            for p in self._cache.values()
            if p.agent_type == agent_type and p.prompt_key == prompt_key
        ]
        if not matches:
            raise KeyError(
                f"No prompt found for agent_type='{agent_type}', prompt_key='{prompt_key}'"
            )

        return max(matches, key=lambda p: p.version_id)

    def list_versions(self, agent_type: str, prompt_key: str) -> list[str]:
        """List all version IDs for a given agent type and prompt key."""
        if not self._cache:
            self._load_all()

        return sorted(
            p.version_id
            for p in self._cache.values()
            if p.agent_type == agent_type and p.prompt_key == prompt_key
        )

    def reload(self) -> None:
        """Force reload all prompts from disk."""
        self._cache.clear()
        self._load_all()

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _load_all(self) -> None:
        """Scan templates directory and load all YAML prompt files."""
        if not self._dir.exists():
            logger.warning("prompts_dir_missing", extra={"path": str(self._dir)})
            return

        for yaml_path in self._dir.rglob("*.yaml"):
            self._load_file(yaml_path)

    def _load_file(self, path: Path) -> None:
        """Parse a single YAML prompt file and cache its versions."""
        try:
            data = yaml.safe_load(path.read_text(encoding="utf-8"))
        except Exception:
            logger.exception("prompt_file_load_error", extra={"path": str(path)})
            return

        if not isinstance(data, dict) or "versions" not in data:
            return

        agent_type = data.get("agent_type", path.parent.name)
        prompt_key = data.get("prompt_key", path.stem)

        for entry in data["versions"]:
            version_id = entry.get("version_id", "")
            if not version_id.startswith("PMV-"):
                continue

            pv = PromptVersion(
                version_id=version_id,
                agent_type=agent_type,
                prompt_key=prompt_key,
                content=entry.get("content", ""),
                system_instructions=entry.get("system_instructions", ""),
                output_format=entry.get("output_format", ""),
                metadata=entry.get("metadata", {}),
            )
            self._cache[version_id] = pv
