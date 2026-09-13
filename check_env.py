"""Run this if a notebook cell fails. Tells you exactly which Python is running.

    In a terminal:      .venv/bin/python check_env.py
    In a notebook cell: %run ../check_env.py
"""
import sys, os
from pathlib import Path

print("python executable :", sys.executable)
print("python version    :", sys.version.split()[0])

here = Path(__file__).resolve().parent
expected = here / ".venv" / "bin" / "python"
ok = Path(sys.executable).resolve() == expected.resolve()
print("using project venv:", "YES" if ok else "NO  <-- wrong kernel selected")
if not ok:
    print("                    expected", expected)

print("working directory :", os.getcwd())

for mod in ("langchain", "langchain_openai", "langgraph", "tiktoken", "numpy"):
    try:
        m = __import__(mod)
        print(f"  {mod:<18} {getattr(m, '__version__', 'ok')}")
    except ImportError:
        print(f"  {mod:<18} MISSING  <-- wrong kernel")

env = next((p for p in (Path(".env"), Path("../.env"), here / ".env") if p.exists()), None)
print(".env found        :", env or "NO  <-- key will not load")
print("OPENAI_API_KEY    :", "set" if os.environ.get("OPENAI_API_KEY") else "not loaded yet (the setup cell loads it)")
