"""Tests for the prompt management module."""

from pathlib import Path
from textwrap import dedent

import pytest

from prompts.manager import PromptManager


@pytest.fixture
def tmp_prompts(tmp_path: Path) -> Path:
    """Create a temporary prompts directory with sample YAML files."""
    agent_dir = tmp_path / "tutor"
    agent_dir.mkdir()

    yaml_content = dedent("""\
        agent_type: tutor
        prompt_key: lesson

        versions:
          - version_id: PMV-tutor-lesson-v1
            content: "Deliver lesson v1: {context}"
            system_instructions: "You are a tutor."
            output_format: "json"
            metadata:
              created_at: "2025-01-01"

          - version_id: PMV-tutor-lesson-v2
            content: "Deliver lesson v2: {context}"
            system_instructions: "You are an improved tutor."
            output_format: "json"
            metadata:
              created_at: "2025-06-01"
    """)
    (agent_dir / "lesson.yaml").write_text(yaml_content)
    return tmp_path


def test_get_prompt_by_version_id(tmp_prompts: Path):
    mgr = PromptManager(prompts_dir=tmp_prompts)
    pv = mgr.get("PMV-tutor-lesson-v1")
    assert pv.version_id == "PMV-tutor-lesson-v1"
    assert pv.agent_type == "tutor"
    assert pv.prompt_key == "lesson"
    assert "{context}" in pv.content


def test_get_latest_returns_highest_version(tmp_prompts: Path):
    mgr = PromptManager(prompts_dir=tmp_prompts)
    pv = mgr.get_latest("tutor", "lesson")
    assert pv.version_id == "PMV-tutor-lesson-v2"


def test_list_versions_returns_sorted(tmp_prompts: Path):
    mgr = PromptManager(prompts_dir=tmp_prompts)
    versions = mgr.list_versions("tutor", "lesson")
    assert versions == ["PMV-tutor-lesson-v1", "PMV-tutor-lesson-v2"]


def test_get_missing_version_raises_key_error(tmp_prompts: Path):
    mgr = PromptManager(prompts_dir=tmp_prompts)
    with pytest.raises(KeyError, match="PMV-nonexistent"):
        mgr.get("PMV-nonexistent")


def test_get_latest_missing_agent_raises_key_error(tmp_prompts: Path):
    mgr = PromptManager(prompts_dir=tmp_prompts)
    with pytest.raises(KeyError):
        mgr.get_latest("nonexistent_agent", "lesson")


def test_reload_refreshes_cache(tmp_prompts: Path):
    mgr = PromptManager(prompts_dir=tmp_prompts)
    assert mgr.get("PMV-tutor-lesson-v1") is not None
    mgr.reload()
    assert mgr.get("PMV-tutor-lesson-v1") is not None


def test_prompt_version_fields(tmp_prompts: Path):
    mgr = PromptManager(prompts_dir=tmp_prompts)
    pv = mgr.get("PMV-tutor-lesson-v1")
    assert pv.system_instructions != ""
    assert pv.output_format == "json"
    assert pv.metadata.get("created_at") == "2025-01-01"
