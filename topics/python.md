# Which `python` to call

The binary name differs per OS. Probe before assuming; never install
another interpreter to “fix” a missing name.

## Windows

- Prefer the launcher: `py -3 script.py`, `py -3 -m pip ...`.
- Fallback: `python`. `python3` usually does **not** exist — do not call it.
- Microsoft Store shims can open the Store instead of running: if `python`
  prints nothing and opens a window, use `py -3`.

## macOS / Linux

- Use `python3`: `python3 -m pip ...`. Bare `python` may be missing or
  point at Python 2.
- Never use `sudo pip`: use `python3 -m venv .venv` or `pip install --user`.

## Virtual environments

- Create: `python -m venv .venv` (Windows) / `python3 -m venv .venv` (POSIX).
- Activate per call instead of relying on a persistent shell: run
  `.venv/Scripts/python -m ...` (Windows) or `.venv/bin/python -m ...`
  (POSIX) directly — each tool call is a fresh process.
