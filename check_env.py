"""Run this if a notebook cell fails or hangs. Tells you exactly what is wrong.

    In a notebook cell:  %run ../check_env.py
    In a terminal:       ./start.sh is easier, but: python check_env.py
"""
import sys, os
from pathlib import Path

here = Path(__file__).resolve().parent
print("python executable :", sys.executable)
print("python version    :", sys.version.split()[0])

vp = here / ".venvpath"
expected = Path(vp.read_text().strip()) / "bin" / "python" if vp.exists() else here / ".venv" / "bin" / "python"
ok = Path(sys.executable).resolve() == expected.resolve()
print("using project venv:", "YES" if ok else "NO  <-- wrong kernel selected")
if not ok:
    print("                    expected", expected)

# A venv inside an iCloud synced folder is the usual cause of a hanging kernel.
icloud = Path.home() / "Library" / "Mobile Documents" / "com~apple~CloudDocs"
in_icloud = (icloud / "Desktop").exists() and str(expected).startswith(str(Path.home() / "Desktop"))
print("venv in iCloud    :", "YES  <-- this makes the kernel hang, rerun ./setup.sh" if in_icloud else "no")

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
