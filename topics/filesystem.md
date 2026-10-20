# Filesystem differences that break agents

## Case sensitivity

- Linux: `Readme.md` ≠ `README.md` ≠ `readme.md`. A path copied from
  Windows/macOS output may not exist here — list the directory first.
- Windows and macOS (default APFS): case-insensitive but case-preserving.
  Git still tracks case: a rename changing only case needs
  `git mv Old new` explicitly.

## Locked files (Windows)

- A running `.exe`/DLL or a file held open by a process cannot be deleted
  or overwritten (“access denied” / “file in use”). Stop the owning process
  first; retrying the same delete never helps.
- On POSIX an open file can be unlinked — do not assume the Windows
  behavior, or vice versa.

## Names and lengths (Windows)

- Reserved names cannot be created, with any extension:
  `CON PRN AUX NUL COM1–COM9 LPT1–LPT9`.
- Classic limit is ~260 chars per path unless long-path support is enabled:
  keep generated paths short, clone repos near the drive root.
- `:` inside a name addresses an alternate data stream (`file:stream`).
  Quote and escape accordingly; avoid creating such names.

## Hidden files and special locations

- Windows hides via attribute: `Get-ChildItem -Force` to see them.
  POSIX hides via a leading dot: `ls -a`.
- Temp: `$env:TEMP` (Windows) vs `/tmp` (Linux) vs `$TMPDIR` (macOS, fallback `/tmp`).
- Per-user configs: `%APPDATA%` / `%LOCALAPPDATA%` (Windows) vs `~/.config`
  (Linux) vs `~/Library/Application Support` (macOS). Prefer `$HOME`-based
  paths over hardcoded user names.

## Links

- POSIX: `ln -s target link`; needs `chmod +x` only for executables, not links.
- Windows: `New-Item -ItemType SymbolicLink` needs Developer Mode or
  elevation; plain users fall back to copying.
- Git on Windows ignores the executable bit by default and needs
  `core.symlinks=true` (plus the privilege above) to check out symlinks.
