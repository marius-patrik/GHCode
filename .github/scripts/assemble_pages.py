"""Assemble a complete GitHub Pages site from independently staged build snapshots.

The Pages Actions publisher deploys a complete site, not a subdirectory.
Never erase an existing successful main or another PR when adding one preview.
"""
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path


def assemble(staging: Path, destination: Path, open_prs: set[int]) -> list[int]:
    if not staging.is_dir():
        raise FileNotFoundError(f"Missing staged Pages snapshots: {staging}")
    if any(path.is_symlink() for path in staging.rglob("*")):
        raise ValueError("Refusing symlinks in Pages staging tree")
    if not (staging / "index.html").is_file():
        raise FileNotFoundError("No previously validated production index.html is staged")
    if staging.resolve() == destination.resolve():
        raise ValueError("Cannot overwrite staging while assembling Pages")
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(staging, destination, symlinks=False)
    published = []
    for entry in destination.iterdir():
        if not entry.is_dir() or not re.fullmatch(r"pr-\d+", entry.name):
            continue
        number = int(entry.name[3:])
        if number not in open_prs or not (entry / "index.html").is_file() or not (entry / ".preview-head").is_file():
            shutil.rmtree(entry)
            continue
        published.append(number)
    (destination / ".nojekyll").touch()
    return sorted(published)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--staging", required=True, type=Path)
    parser.add_argument("--site", required=True, type=Path)
    parser.add_argument("--open-prs", type=int, nargs="*", default=[])
    args = parser.parse_args()
    print("Assembled PR previews:", assemble(args.staging, args.site, set(args.open_prs)))


if __name__ == "__main__":
    main()
