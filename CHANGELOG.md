# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
