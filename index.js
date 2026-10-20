/**
 * dsh-os — OS and shell awareness for DeepSeek Harness agents.
 *
 * The problem this plugin addresses: agents default to POSIX muscle memory
 * (`&&`, `$NAME`, `export`, `/usr/bin`) even when the deployment is Windows
 * with PowerShell, where `&&` is a syntax error on Windows PowerShell 5.1.
 *
 * Two contributions, both owned by this plugin's context:
 *
 * 1. **Config** — two *volatile* fields (`os`, `shell`). Volatile fields are
 *    live references: the Settings page writes them through the profile's
 *    settings document and the running plugin sees the new value without a
 *    reload. `auto` defers to detection.
 * 2. **Rules** — one system-prompt section whose text is resolved on every
 *    prompt assembly from those references, the Host platform, and the shell
 *    tool the Agent actually has (`pwsh` or `bash`). New steps pick a change
 *    up immediately.
 *
 * Auto detection answers two different questions:
 *
 * - OS: `process.platform` of the Host process (the Agent's shell runs there).
 * - Shell: the registered shell tool wins (`pwsh` → PowerShell, `bash` →
 *   bash) because that is what the Agent's commands actually execute in; the
 *   environment (`$SHELL`, `ComSpec`) is only a fallback.
 *
 * When the user explicitly selects a shell that differs from the tool's own
 * dialect, the rules say how to invoke that shell (`cmd /c "…"`, `bash -lc
 * '…'`, `pwsh -NoProfile -Command '…'`) instead of pretending the tool
 * changed.
 *
 * Layout (by analogy with `dsh-rtk`):
 *
 * ```
 * index.js       Host entry point: exports apply / name / inject / Config
 * client.js      Settings → Terminal page: detection card and the os/shell form (web client)
 * lib/config.js  Config schema, defaults, normalization, live snapshot
 * lib/env.js     pure OS/shell detection and environment resolution
 * lib/rules.js   system-prompt rules text and section order
 * lib/plugin.js  context wiring (prompt section + /os-shell/status settings route)
 * test/          node:test suites (env, rules, plugin, status, manifest)
 * ```
 */

import { Config } from './lib/config.js'
import { mount } from './lib/plugin.js'

/**
 * Activate the plugin for one profile context.
 *
 * The raw config (with volatile references) is passed through: the rules
 * text and the status route re-read it on every use, so Settings writes
 * apply without remounting.
 *
 * @param {object} ctx Plugin context supplied by the DSH loader.
 * @param {unknown} config Bundle row config.
 */
export function apply(ctx, config) {
  mount(ctx, config)
}

export { Config }

/** Plugin name reported to the Loader. */
export const name = 'os-shell'

/** The prompt registry is the one hard dependency; tools are read optionally. */
export const inject = ['systemPrompt']

// Re-exported helpers (moved to lib/): existing imports from the previous
// single-file layout (`harness-os`) keep working through this entry point.
export { RULES_SECTION, OS_VALUES, SHELL_VALUES, normalizeConfig, snapshot } from './lib/config.js'
export { detectOs, detectShell, shellTools, resolveEnvironment } from './lib/env.js'
export { FALLBACK_ORDER, rulesOrder, rulesText, wrapperFor } from './lib/rules.js'
export { STATUS_PATH, statusView, mount } from './lib/plugin.js'
