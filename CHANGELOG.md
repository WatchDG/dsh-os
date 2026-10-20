# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-10-20

### Added

- `bashFlavor` config (`auto`, `git-bash`, `wsl`, `native`): `windows + bash`
  rules now name the flavor in the header and the topics pointer, with WSL
  paths (`/mnt/c/...`, `wslpath`) separated from Git Bash paths (`/c/...`).
  `auto` follows WSL markers without starting any process.
- `location` config (`local`, `remote`): remote sessions over SSH get a
  header badge, a dedicated bullet, and the new `topics/ssh.md` notes, so the
  rules describe the remote side instead of lying about this Host.
- `powershellEdition` config (`auto`, `5.1`, `7`): pinning `7` names
  `PowerShell 7` and documents `&&` / `||`; `auto` stays 5.1-safe.
- `topics/anti-patterns.md`: a global POSIX → native table (PowerShell, cmd,
  fish, sh) linked from every pointer.
- Settings → Terminal now shows the detected bash flavor, Host `$SHELL` /
  `ComSpec`, agent shell tools, the wrapper template, a remote badge, and a
  read-only preview of the exact rules text with a copy button and a working
  example command — all served by the existing `GET /os-shell/status` route.
- `preview.mjs` (`npm run preview`): print the resolved `os-shell:rules`
  section to stdout without a running Harness.
- OS bullets: CRLF vs LF (`.gitattributes`), lost executable bits
  (`chmod +x`), OneDrive/Defender locks, symlinks (`mklink`,
  `New-Item -ItemType SymbolicLink`, `ln -s`).

[1.3.0]: https://github.com/WatchDG/dsh-os/releases/tag/v1.3.0

## [1.2.0] - 2026-10-20

### Changed

- Core rules carry directives for the resolved context only: no cross-OS
  comparisons, no foreign package managers or shells — just what and how
  for this OS/shell pair.
- Topic files are split by context (`os-<os>.md`, `shell-<shell>.md`,
  `commands-<os>.md`, 12 files). The rules pointer names the resolved
  context and its three files, so the agent reads only relevant notes.
- `TOPICS` is replaced by `TOPIC_FILES` + `contextTopicFiles()`; the
  previous per-theme files are removed.

[1.2.0]: https://github.com/WatchDG/dsh-os/releases/tag/v1.2.0

## [1.1.0] - 2026-10-20

### Added

- OS-level rule bullets: exit-code checks (`$LASTEXITCODE`, `%ERRORLEVEL%`),
  `py` vs `python3` on Windows, file locks and reserved names, case-sensitivity,
  per-OS package managers with a no-interactive-`sudo` rule, `start` / `open` /
  `xdg-open`, `NUL` vs `/dev/null`, and a Windows PowerShell 5.1 encoding note.
- On-demand topic files (`topics/*.md`): exit codes, python, filesystem,
  encoding, packages, commands, processes. The core rules end with a pointer
  mapping each topic to its absolute file path, resolved from the bundle
  location, so the agent reads one with the harness `read` tool when needed.
- `node:test` suites for the new bullets and the topic files.

[1.1.0]: https://github.com/WatchDG/dsh-os/releases/tag/v1.1.0

## [1.0.0] - 2026-10-20

### Added

- Initial production release of the DSH bundle for [DeepSeek Harness](https://www.deepseek.com/en/harness/),
  transferred from `harness-os` (`dsh-os-shell`) and restructured by analogy with `dsh-rtk`.
- `os-shell:rules` system-prompt section with per-pair terminal syntax: chaining,
  variables, paths, tool commands, fresh-process discipline, and explicit
  wrappers for a non-native shell.
- OS/shell auto-detection: Host `process.platform` for the OS, the agent's
  registered shell tool (`pwsh`/`bash`) for the shell, `$SHELL` as a POSIX fallback.
- Settings → Terminal section with the live detection card
  (`GET /os-shell/status`), editable `os`/`shell` via a volatile `Config` schema
  (`@deepseek-ai/schemastery`) without a restart, in English and Russian.
- Runtime split into `lib/` modules (`config`, `env`, `rules`, `plugin`) with
  a thin `index.js` entry point; the previous single-file imports keep working
  through re-exports.
- `node:test` suites (env, rules, plugin, status, manifest), GitHub Actions CI
  on Linux and Windows with Node.js 20, 22, and 24.
- Documentation in English and Russian, contribution guide, and Apache-2.0 license.

[1.0.0]: https://github.com/WatchDG/dsh-os/releases/tag/v1.0.0
