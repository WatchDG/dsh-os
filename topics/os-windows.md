# Windows notes

Read this when the rules name Windows as the OS.

## Files and paths

- Names keep their case but compare case-insensitively. Git still tracks
  case: a case-only rename needs `git mv Old new`.
- A delete or overwrite failing with “access denied” means a process holds
  the file: stop the holder, then retry once. OneDrive/Dropbox sync and
  Defender real-time scanning lock files too — pause sync or move the
  workdir out before retrying. Retrying the same call never helps.
- Checkouts are often CRLF while shell scripts need LF: enforce
  `* text=auto` and `*.sh text eol=lf` in `.gitattributes`.
- Checkouts drop the executable bit: run `bash script.sh`, or restore it
  with `git update-index --chmod=+x`, when `./script.sh` reports
  permission denied.
- Never create `CON PRN AUX NUL COM1–COM9 LPT1–LPT9`, with any extension.
- Keep paths under ~260 chars unless long-path support is enabled; clone
  repos near the drive root.
- `:` inside a name addresses an alternate data stream (`file:stream`).
- Binaries carry `.exe` / `.cmd` / `.bat` and run without the suffix
  (PATHEXT). Folders do not need a trailing backslash.

## Python

- Run as `py -3` (fallback: `python`). Never call `python3`.
- A bare `python` may open the Microsoft Store instead of running: that is
  a shim, not an interpreter — switch to `py -3`.

## Install and elevation

- Install with `winget` (`choco` or `scoop` as fallback). Propose the exact
  command; do not install silently.
- A running step cannot elevate itself: elevation starts a new elevated
  process. The Win11 `sudo` / `gsudo` helpers are opt-in and may not exist.

## Console and text

- The console speaks the OEM code page (Russian systems: cp866/cp1251).
  Garbled non-ASCII output is mojibake, not broken data: run `chcp 65001`.
- Redirection and `Out-File` default to UTF-16: write text explicitly with
  `Out-File -Encoding utf8`.

## Locations

- Temp: `$env:TEMP`. Per-user configs: `%APPDATA%`, `%LOCALAPPDATA%`.
  Prefer `$HOME`-based paths over hardcoded user names.
- Symlinks need Developer Mode or elevation (`New-Item -ItemType
  SymbolicLink`); otherwise copy. Git needs `core.symlinks=true` to check
  them out. Hidden files need `Get-ChildItem -Force` to be listed.

## Open, services

- Open files and URLs with `start "" <path>`.
- Services: `sc.exe`, `Get-Service` / `Start-Service` (elevation often needed).
