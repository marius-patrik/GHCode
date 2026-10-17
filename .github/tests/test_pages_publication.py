"""Behavioral checks for independent GHCode Pages preview publication."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "assemble_pages.py"


def assemble(staging: Path, site: Path, *open_prs: int) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--staging", str(staging),
         "--site", str(site), "--open-prs", *(str(n) for n in open_prs)],
        capture_output=True, text=True,
    )


def test_keeps_production_and_unrelated_active_previews(tmp_path: Path):
    stage = tmp_path / "stage"
    (stage / "assets").mkdir(parents=True)
    (stage / "index.html").write_text("production", encoding="utf-8")
    (stage / "assets/app.js").write_text("actual main asset", encoding="utf-8")
    for n in (5, 16, 17):
        d = stage / f"pr-{n}"
        d.mkdir()
        (d / "index.html").write_text(f"preview {n}", encoding="utf-8")
        (d / ".preview-head").write_text("a" * 40, encoding="utf-8")
    result = assemble(stage, tmp_path / "site", 16, 17)
    assert result.returncode == 0, result.stderr
    site = tmp_path / "site"
    assert (site / "index.html").read_text() == "production"
    assert (site / "assets/app.js").read_text() == "actual main asset"
    assert not (site / "pr-5").exists()
    assert (site / "pr-16/index.html").read_text() == "preview 16"
    assert (site / "pr-17/index.html").read_text() == "preview 17"
    assert (stage / "pr-5").exists(), "Do not mutate the staging branch"


def test_closed_preview_removed_from_next_complete_artifact(tmp_path: Path):
    stage = tmp_path / "stage"
    stage.mkdir()
    (stage / "index.html").write_text("main", encoding="utf-8")
    old = stage / "pr-16"
    old.mkdir()
    (old / "index.html").write_text("closed", encoding="utf-8")
    (old / ".preview-head").write_text("a" * 40, encoding="utf-8")
    assert assemble(stage, tmp_path / "site").returncode == 0
    assert not (tmp_path / "site/pr-16").exists()


def test_missing_production_is_rejected(tmp_path: Path):
    stage = tmp_path / "stage"
    stage.mkdir()
    (stage / "pr-16").mkdir()
    (stage / "pr-16/index.html").write_text("preview", encoding="utf-8")
    result = assemble(stage, tmp_path / "site", 16)
    assert result.returncode != 0
    assert "production" in result.stderr.lower()
    assert not (tmp_path / "site").exists()


def test_symlink_payload_rejected(tmp_path: Path):
    stage = tmp_path / "stage"
    stage.mkdir()
    (stage / "index.html").write_text("main", encoding="utf-8")
    (stage / "malicious").symlink_to(tmp_path / "outside")
    result = assemble(stage, tmp_path / "site")
    assert result.returncode != 0
    assert "symlink" in result.stderr.lower()
