#!/usr/bin/env bash
# One-shot setup for the AI Fundamentals workshop.
#   ./setup.sh          create .venv, install everything, register the Jupyter kernel
#   ./setup.sh --check  also run all six notebooks to prove the environment works
set -euo pipefail
cd "$(dirname "$0")"

PY=""
for c in python3.12 python3.11 python3.10 python3; do
  if command -v "$c" >/dev/null 2>&1; then
    v=$("$c" -c 'import sys;print(sys.version_info[:2]>=(3,10) and sys.version_info[:2]<(3,14))')
    [ "$v" = "True" ] && PY="$c" && break
  fi
done
[ -z "$PY" ] && { echo "Need Python 3.10-3.13. Install one, then rerun."; exit 1; }
echo "==> using $PY ($($PY --version 2>&1))"

echo "==> creating .venv"
rm -rf .venv && "$PY" -m venv .venv
.venv/bin/python -m pip install --upgrade pip >/dev/null

echo "==> installing dependencies"
.venv/bin/pip install -r requirements.txt

echo "==> registering the Jupyter kernel"
.venv/bin/python -m ipykernel install --user \
  --name aiforbeginners --display-name "Python (AI Fundamentals)" >/dev/null

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> created .env from the example. PUT YOUR OPENAI KEY IN IT before running anything."
fi

if [ "${1:-}" = "--check" ]; then
  echo "==> running all six notebooks (about 90 seconds, costs a few cents)"
  mkdir -p .qa/executed
  for f in notebooks/*.ipynb; do
    n=$(basename "$f")
    if .venv/bin/jupyter nbconvert --to notebook --execute \
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

cat <<'MSG'

Done. To start:

    source .venv/bin/activate
    jupyter lab notebooks/

In Jupyter pick the kernel "Python (AI Fundamentals)".
Run the first two cells of 01_first_llm_call.ipynb; you should see:

    ready | openai:gpt-4.1-mini
MSG
