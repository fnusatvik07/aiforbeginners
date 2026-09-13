#!/usr/bin/env bash
# Launch Jupyter using THIS project's environment, not whatever is on your PATH.
set -euo pipefail
cd "$(dirname "$0")"
VENV=$( [ -f .venvpath ] && cat .venvpath || echo "$PWD/.venv" )
[ -x "$VENV/bin/jupyter" ] || { echo "No environment yet. Run ./setup.sh first."; exit 1; }
echo "using: $("$VENV/bin/python" --version) at $VENV"
exec "$VENV/bin/jupyter" lab notebooks/
