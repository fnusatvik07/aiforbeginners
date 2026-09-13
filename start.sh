#!/usr/bin/env bash
# Launch Jupyter using THIS project's environment, not whatever is on your PATH.
set -euo pipefail
cd "$(dirname "$0")"
[ -x .venv/bin/jupyter ] || { echo "No .venv yet. Run ./setup.sh first."; exit 1; }
echo "using: $(.venv/bin/python --version) at .venv/bin/python"
exec .venv/bin/jupyter lab notebooks/
