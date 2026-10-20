# dsh-os

[![CI](https://github.com/WatchDG/dsh-os/actions/workflows/ci.yml/badge.svg)](https://github.com/WatchDG/dsh-os/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**English** | [Русский](README.ru.md)

OS and shell awareness for [DeepSeek Harness](https://www.deepseek.com/en/harness/):
a bundle plugin that fixes the typical agent mistake of writing POSIX syntax
(`&&`, `$NAME`, `export`, `/usr/bin/...`) on Windows, where commands are run
by PowerShell and `&&` is a syntax error on Windows PowerShell 5.1.

The plugin detects the OS and the shell, offers switches in
**Settings → Terminal**, and injects a short rules block matching the selected
pair into the agents' prompts.

## Requirements

| Requirement | Details |
|---|---|
| [DeepSeek Harness](https://www.deepseek.com/en/harness/) | 0.2.x. The plugin uses the Host `systemPrompt` service and the `settings` / `webServer` scopes. |

No external binaries, no network access, no build step.

## Installation in DeepSeek Harness

The plugin is a bundle for the current DSH profile, so it applies to every
session of that profile.

1. Open the **Plugins** page in the DSH sidebar (the Plugin Manager).
2. Choose **Add plugin** / **Install bundle**, select this directory (the one
   containing `package.json`), and confirm.
3. Make sure **OS & Shell Rules** / **Правила ОС и оболочки** is enabled in the
   plugin list.

The same step is available to an agent through the `plugin_manager` tool with
`action: install_bundle` and the absolute path to this directory. DSH records a
`link:` dependency on the directory in the profile's `package.json`; because the
directory is linked, restart DSH after updating the plugin's files so Host
JavaScript is loaded again.

To uninstall, remove the bundle from the Plugin Manager (or
`plugin_manager` with `action: remove_bundle`).

## What the plugin does

### 1. Rules

One system-prompt section `os-shell:rules` is inserted right after the shell
tools' own guidance (`tool:pwsh` / `tool:bash`). It tells the model:

- how to chain commands (`;` in PowerShell, `&&` in bash/cmd);
- how to read and set variables (`$env:NAME`, `$NAME`, `%NAME%`);
- how to write paths and which commands to use instead of POSIX analogues;
- that every call is a new process: pass `workdir`, do not rely on `cd`;
- how to reach another shell when the selected one differs from the tool
  (`cmd /c "…"`, `bash -lc '…'`, `pwsh -NoProfile -Command '…'`);
- how to check exit codes (`$LASTEXITCODE`, `%ERRORLEVEL%`);
- OS traps: file locks and reserved names on Windows, OneDrive/Defender locks,
  CRLF vs LF line endings (`.gitattributes`), lost executable bits (`chmod +x`),
  symlinks, case-sensitivity, the right package manager, `py` vs `python3`,
  `start` / `open` / `xdg-open`, `NUL` vs `/dev/null`, and 5.1 encoding pitfalls.
- which bash flavor the paths follow on Windows (Git Bash `/c/...` vs WSL `/mnt/c/...`);
- that a `remote` connection describes the SSH side, not this Host;
- a pointer to the global POSIX → native anti-patterns table.

### 2. Switches, detection, and preview

**Settings → Terminal** shows:

- a card "Detected on this Host: Windows · PowerShell" — what auto-detection
  actually sees, plus the tool (`pwsh`) the shell came from, the detected bash
  flavor, the Host `$SHELL`/`ComSpec`, the agent's shell tools (`pwsh`/`bash`),
  and the wrapper template when the selected shell differs from the tool;
- a remote badge when the rules describe an SSH machine instead of this Host;
- when your selection differs from detection, a separate line showing what the
  rules currently use;
- five lists: the operating system, the shell, the bash flavor (Windows bash
  only), the connection (`local` or remote over SSH), and the PowerShell
  edition (`auto` stays 5.1-safe, `7` unlocks `&&`/`||` notes);
- a read-only preview of the exact `os-shell:rules` text the agent will see
  (served by the same `GET /os-shell/status` route, with a copy button and a
  working example command for the pair).

Both fields are *volatile* Config: a write applies in place, without
reloading the plugin, and takes effect from the next model step. A step that
is already running keeps the prompt it started with.

### 3. Topic files

The core block carries directives for the resolved context only — no
comparisons, no foreign shells or package managers. It ends with a pointer
that names the context (`Windows + PowerShell`, or `Windows + bash (WSL)` when
a flavor applies) and its detail files: `topics/os-<os>.md` (files, installs,
console, locations), `topics/shell-<shell>.md` (exit codes, scripts,
processes), `topics/commands-<os>.md` (native equivalents), plus
`topics/ssh.md` for remote sessions. A second link always points at the
global `topics/anti-patterns.md` table (POSIX habit → what each shell
actually accepts). The agent reads one with the harness `read` tool when its
topic bites — the pointer carries absolute paths, resolved from the bundle
location, so it works wherever the bundle is installed, and the agent never
sees other contexts.

## Auto-detection

- **OS** — `process.platform` of the Host process (the agent's commands run
  there): `win32 → Windows`, `darwin → macOS`, otherwise `Linux`.
- **Shell** — first the tool registry is checked: if the agent has `pwsh`,
  that is PowerShell; if `bash`, that is bash. This beats environment
  variables because that tool is what executes the commands. With no tools,
  `$SHELL` is used on POSIX (`zsh` by default on macOS, `bash` on Linux) and
  PowerShell on Windows.

- **Bash flavor (Windows only)** — WSL markers in the environment
  (`WSL_DISTRO_NAME` / `WSL_INTEROP`) mean WSL (`/mnt/c/...`), anything else
  means Git Bash (`/c/...`). No processes are started to check. Outside
  Windows the flavor is always `native`.

`auto` in the `os`, `shell`, `bashFlavor`, and `powershellEdition` fields
enables this detection. An explicit choice wins. `location` defaults to
`local`; pick `remote` when the commands run on another machine over SSH —
the rules then describe the remote side, not this Host.

Detection for the page comes from the latest prompt assembly — that is where
the agent's scope and its tools are known. Before the first assembly the page
shows host-environment detection (`source: 'host'`); afterwards it shows
agent-tool detection (`source: 'agent'`).

When the selected shell does not match the tool executing it, the rules do
not lie: they show the wrapper for an explicit invocation
(`cmd /c "<command>"` and the like).

The card reads detection over the self-contained `GET /os-shell/status`
route (the same browser trust-fence as the other APIs: unauthenticated
callers get 401).

## Configuration

| Field | Values | Default |
|---|---|---|
| `os` | `auto`, `windows`, `macos`, `linux` | `auto` |
| `shell` | `auto`, `powershell`, `cmd`, `bash`, `zsh`, `fish`, `sh` | `auto` |
| `bashFlavor` | `auto`, `git-bash`, `wsl`, `native` | `auto` |
| `location` | `local`, `remote` | `local` |
| `powershellEdition` | `auto`, `5.1`, `7` | `auto` |

All fields are also available in the profile patch layer (row `id: os-shell`):

```yaml
- id: os-shell
  config:
    os: windows
    shell: bash
    bashFlavor: wsl
    location: local
    powershellEdition: auto
```

`powershell` covers both Windows PowerShell 5.1 and PowerShell 7. With
`powershellEdition: auto` (or `5.1`) the rules stay safe on 5.1: `&&`/`||`
are forbidden, chaining goes through `;`. Pick `7` only when the target is
known to run PowerShell 7+.

## Verification

1. The **Plugins** page (and the read-only **Settings → Plugins** list) shows
   **OS & Shell Rules** / **Правила ОС и оболочки**, and it is enabled.
2. **Settings → Terminal** is served in the live `settings.section` slot
   (`id: os-shell`, `order: 17`, `active: true`) — the Host serves the
   namespace and the settings form is connected. The page shows the detection
   card, the five selects, and the read-only preview of the exact rules text
   with a copy button and an example command.
3. In a new session, ask a subagent to quote the prompt: the first paragraph
   of `## Terminal environment` names the tool (`through the `pwsh` tool`) —
   shell detection by the agent's tooling (scope) works, not by the global
   registry.
4. Toggling the `include:os-shell` row off and on in the Plugin Manager
   removes and restores the section in the prompt without restarting the app.
5. `GET /os-shell/status` is registered and protected: a `POST` to it without
   browser authentication gets 401 from the shared trust-fence, while the same
   `POST` to a nonexistent path falls into the SPA fallback and gets 405 —
   the route exists and answers itself. The payload also carries `preview`,
   `example`, `wrapper`, `tools`, and the detected/targeted flavor, location,
   and edition.
6. `npm test` — unit checks for the Config schema, detection, flavor,
   wrappers, rules text, settings ownership, and the status route, plus
   manifest checks.
7. `npm run preview -- --os windows --shell bash --bash-flavor wsl` prints
   the resolved section to stdout without a running Harness.

The card was verified by inspection plus the protected route; saving by click
was not driven from this session (no browser control here). Saving goes
through the standard `configForms` → `settings` path, the same one the Shell
settings page uses.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| The rules mention the wrong shell | The page card shows the source: `host` before the first agent step, `agent` after. Check which tools the agent has (`pwsh` wins over `bash`). For `windows + bash`, check the flavor line: Git Bash and WSL disagree on drive paths. |
| The rules describe the wrong machine | The location may be `remote`: the rules then describe the SSH side on purpose. Flip it back to `local` for this Host. |
| A selection does not apply | Writes are volatile and apply from the next model step; a running step keeps its prompt. Toggle the bundle row if the Host JS was edited. |
| No Terminal page | The Host serves the namespace only while the bundle row is enabled; check the Plugins page and restart DSH after updating files. |

## Development

One dependency (`@deepseek-ai/schemastery` for the settings schema) and no
build step.

```bash
npm ci                   # install the settings schema library
npm test                 # unit tests + manifest checks
npm run test:unit        # same suites, explicit list
npm run preview -- --os windows --shell bash --bash-flavor wsl
npm run pack:check       # verify the npm package contents
```

Layout:

```
index.js              Host entry point: exports apply / name / inject / Config
client.js             Settings → Terminal page: detection card, selects, rules preview (web client)
preview.mjs           CLI preview of the resolved rules without a running Harness
lib/config.js         Config schema, defaults, normalization, live snapshot
lib/env.js            pure OS/shell/flavor detection and environment resolution
lib/rules.js          system-prompt rules text and section order
lib/plugin.js         context wiring (prompt section + /os-shell/status settings route)
topics/               per-context packs the core rules point at
                      (os-<os>.md, shell-<shell>.md, commands-<os>.md, ssh.md, anti-patterns.md)
test/                 node:test suites (env, rules, plugin, status, topics, manifest)
```

When adding a runtime module, add it to `files` in `package.json`; the manifest
test fails otherwise. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security and privacy

- The plugin starts no processes, performs no network access, sends no
  telemetry, and stores no command history. The Settings page talks only to
  the Host's own authenticated `/os-shell/status` route.
- The plugin never rewrites or blocks commands: it provides rules. A step
  that is already running keeps the prompt it started with.

## Links

- **DeepSeek Harness** — https://www.deepseek.com/en/harness/
- **Plugin repository** — https://github.com/WatchDG/dsh-os

## License

[Apache-2.0](LICENSE), © 2026 Baranov Grigoriy Vladimirovich.
