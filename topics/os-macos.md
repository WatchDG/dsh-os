# macOS notes

Read this when the rules name macOS as the OS.

## Files and paths

- The disk is usually case-insensitive but case-preserving: keep names
  unambiguous anyway. A case-only rename needs `git mv Old new`.
- Hidden means a leading dot: `ls -a` to list. Temp is `$TMPDIR`
  (fallback `/tmp`).
- Per-user configs live in `~/.config` or `~/Library/Application Support`.
  Prefer `$HOME`-based paths over hardcoded user names.
- Line endings are LF: when a script from a CRLF checkout fails, set
  `*.sh text eol=lf` in `.gitattributes` and re-check out.
- Symlinks are ordinary (`ln -s target link`); keep them relative so
  clones elsewhere survive.

## Install and gates

- Install with Homebrew (`brew`): `/opt/homebrew` on Apple Silicon,
  `/usr/local` on Intel.
- Never run interactive `sudo` — it hangs the call. Propose the exact
  command; do not install silently.
- A downloaded binary that “cannot be opened” carries quarantine:
  `xattr -d com.apple.quarantine <file>`.
- SIP protects `/System` and parts of `/usr` even for root: do not fight it.
- Compilers and `git` need the Command Line Tools (`xcode-select
  --install`, interactive — ask the user).
- Services run under `launchd` (`launchctl`), not `systemd`.

## Shell tools

- The default shell is zsh; `sed -i ''`, `date -r`, `stat -f` are BSD —
  install GNU versions with `brew` when a script needs them.

## Open

- Open files and URLs with `open`.
