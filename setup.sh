#!/usr/bin/env bash
# One-shot setup for the AI Fundamentals workshop.
#   ./setup.sh          create the venv, install everything, register the Jupyter kernel
#   ./setup.sh --check  also run all six notebooks to prove the environment works
set -euo pipefail
cd "$(dirname "$0")"
PROJECT="$(pwd)"

# ---------------------------------------------------------------------------
# Where to put the virtual environment.
#
# A venv holds thousands of small files. If the project sits in an iCloud synced
# folder (Desktop or Documents with "Desktop & Documents Folders" turned on),
# every kernel start is routed through the sync daemon and Jupyter crawls or
# hangs outright. So in that case we build the venv on local disk instead.
# ---------------------------------------------------------------------------
ICLOUD_ROOT="$HOME/Library/Mobile Documents/com~apple~CloudDocs"
if [ -d "$ICLOUD_ROOT/Desktop" ] || [ -d "$ICLOUD_ROOT/Documents" ]; then
  case "$PROJECT" in
    "$HOME/Desktop"/*|"$HOME/Documents"/*|"$ICLOUD_ROOT"/*) IN_ICLOUD=1 ;;
    *) IN_ICLOUD=0 ;;
  esac
else
  IN_ICLOUD=0
fi

if [ "$IN_ICLOUD" = "1" ]; then
  VENV="$HOME/.venvs/$(basename "$PROJECT")"
  echo "==> this project is inside an iCloud synced folder"
  echo "    putting the venv on local disk instead: $VENV"
  mkdir -p "$HOME/.venvs"
else
  VENV="$PROJECT/.venv"
fi
echo "$VENV" > .venvpath

PY=""
for c in python3.12 python3.11 python3.10 python3; do
  if command -v "$c" >/dev/null 2>&1; then
    v=$("$c" -c 'import sys;print(sys.version_info[:2]>=(3,10) and sys.version_info[:2]<(3,14))')
    [ "$v" = "True" ] && PY="$c" && break
  fi
done
[ -z "$PY" ] && { echo "Need Python 3.10 to 3.13. Install one, then rerun."; exit 1; }
echo "==> using $PY ($($PY --version 2>&1))"

echo "==> creating the virtual environment"
rm -rf "$VENV" && "$PY" -m venv "$VENV"
"$VENV/bin/python" -m pip install --upgrade pip >/dev/null

echo "==> installing dependencies"
"$VENV/bin/pip" install -r requirements.txt

echo "==> registering the Jupyter kernel"
"$VENV/bin/python" -m ipykernel install --user \
  --name aiforbeginners --display-name "Python (AI Fundamentals)" >/dev/null

# Keep notebook outputs out of commits. They make diffs unreadable and can leak
# whatever a cell happened to print. Your local copy keeps its results.
if [ -d .git ]; then
  git config filter.strip-notebook-output.clean \
    "$VENV/bin/python -c \"import sys,json; nb=json.load(sys.stdin); [c.update(outputs=[], execution_count=None) for c in nb['cells'] if c['cell_type']=='code']; json.dump(nb, sys.stdout, indent=1)\""
  git config filter.strip-notebook-output.smudge cat
  git config filter.strip-notebook-output.required false
  echo "==> registered the notebook output stripping filter"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> created .env from the example. PUT YOUR OPENAI KEY IN IT before running anything."
fi

if [ "${1:-}" = "--check" ]; then
  echo "==> running all six notebooks (about 90 seconds, costs a few cents)"
  mkdir -p .qa/executed
  for f in notebooks/*.ipynb; do
    n=$(basename "$f")
    if "$VENV/bin/jupyter" nbconvert --to notebook --execute \
         --output-dir=.qa/executed --output "$n" \
         --ExecutePreprocessor.kernel_name=aiforbeginners \
         --ExecutePreprocessor.timeout=600 "$f" >/dev/null 2>&1; then
      echo "    ok    $n"
    else
      echo "    FAIL  $n"; exit 1
    fi
  done
  echo "==> all notebooks ran clean"
fi

cat <<MSG

Done. Virtual environment: $VENV

To start:

    ./start.sh

In Jupyter pick the kernel "Python (AI Fundamentals)".
Run the first two cells of 01_first_llm_call.ipynb; you should see:

    ready | openai:gpt-4.1-mini
MSG
