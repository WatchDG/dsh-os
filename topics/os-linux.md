# Linux notes

Read this when the rules name Linux as the OS.

## Files and paths

- Names are case-sensitive: a path copied from Windows/macOS output may not
  exist here — list the directory first.
- An open file can be unlinked: replacing a running binary or log usually
  succeeds (unlike Windows).
- Hidden means a leading dot: `ls -a` to list. Temp is `/tmp`.
- Per-user configs live in `~/.config`. Prefer `$HOME`-based paths over
  hardcoded user names.
- Links are ordinary: `ln -s target link`. Mark scripts executable
  (`chmod +x`) and start them with a shebang (`#!/usr/bin/env bash`).

## Install and elevation

- Install with the distro manager (`apt`, `dnf`, `pacman`, `apk`,
  `zypper`…). Propose the exact command; do not install silently.
- Never run interactive `sudo` — it waits for a password and hangs the call.
- Services usually run under `systemd` (`systemctl`); never assume it on
  containers or WSL.

## Locale

- Assume UTF-8 (`LANG` should end in `.UTF-8`). Parse `date -u +%FT%TZ`
  output instead of localized month/day names.

## Open

- Open files and URLs with `xdg-open`.
