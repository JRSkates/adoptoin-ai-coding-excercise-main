#!/usr/bin/env bash
# Package BRIEF.md + python/ + typescript/ + scripts/ into a zip for candidate distribution.
# Excludes build artifacts, venvs, caches, and runtime DBs that may have crept in.
#
# Usage:
#   ./package.sh                      # writes ./interview.zip
#   ./package.sh path/to/output.zip   # custom path

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

out="${1:-$repo_root/interview.zip}"

for path in BRIEF.md python typescript scripts; do
  if [[ ! -e "$path" ]]; then
    echo "error: missing $path in $repo_root" >&2
    exit 1
  fi
done

rm -f "$out"

zip -r "$out" BRIEF.md python typescript scripts \
  -x '*/node_modules/*' \
     '*/.venv/*' \
     '*/venv/*' \
     '*/__pycache__/*' \
     '*/.pytest_cache/*' \
     '*/.mypy_cache/*' \
     '*/.ruff_cache/*' \
     '*/dist/*' \
     '*/build/*' \
     '*.pyc' \
     '*.tsbuildinfo' \
     '*.DS_Store' \
     '*.db' \
     '*.sqlite' \
     '*.sqlite3' \
     '*.log' \
  > /dev/null

echo "Wrote $out ($(du -h "$out" | cut -f1))"
