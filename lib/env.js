/**
 * dsh-os — operating system and shell detection.
 *
 * Pure Host inspection, kept separate from the prompt text (`lib/rules.js`)
 * and the context wiring (`lib/plugin.js`) so it can be unit-tested without
 * a running Harness.
 *
 * Auto detection answers two different questions:
 *
 * - OS: `process.platform` of the Host process (the Agent's shell runs there).
 * - Shell: the registered shell tool wins (`pwsh` → PowerShell, `bash` →
 *   bash) because that is what the Agent's commands actually execute in; the
 *   environment (`$SHELL`, `ComSpec`) is only a fallback.
 */

import { snapshot } from './config.js'

/** Shells an environment variable may name on POSIX. */
const POSIX_SHELLS = new Set(['bash', 'zsh', 'fish', 'sh'])

/**
 * Detect the operating system of the machine that runs the Agent's shell.
 * @returns {'windows' | 'macos' | 'linux'} detected OS.
 */
export function detectOs() {
  if (process.platform === 'win32') return 'windows'
  if (process.platform === 'darwin') return 'macos'
  return 'linux'
}

/**
 * Inspect the tool registry without requiring it. Prompt tools are usually
 * registered on the Agent's layer, so the assembly scope must be passed:
 * without it the global view legitimately has no model-facing tool.
 * @param {object} ctx - plugin context.
 * @param {unknown} scope - the Agent the assembly is for, when known.
 * @returns {{ pwsh: boolean, bash: boolean }} which shell tools the scope sees.
 */
export function shellTools(ctx, scope) {
  const tools = typeof ctx?.get === 'function' ? ctx.get('tools') : undefined
  if (!tools || typeof tools.get !== 'function') return { pwsh: false, bash: false }
  const has = (toolName) => {
    try {
      return tools.get(toolName, scope) !== undefined
    } catch {
      return false
    }
  }
  return { pwsh: has('pwsh'), bash: has('bash') }
}

/**
 * Detect the shell dialect the Agent's commands run in.
 * @param {string} os - resolved OS.
 * @param {{ pwsh: boolean, bash: boolean }} tools - registered shell tools.
 * @returns {string} one of the selectable shells except `auto`.
 */
export function detectShell(os, tools) {
  if (tools.pwsh) return 'powershell'
  if (tools.bash) return 'bash'
  if (os !== 'windows') {
    const fromEnv = String(process.env.SHELL ?? '')
      .split(/[\\/]/)
      .pop()
      .toLowerCase()
    if (POSIX_SHELLS.has(fromEnv)) return fromEnv
    return os === 'macos' ? 'zsh' : 'bash'
  }
  return 'powershell'
}

/**
 * Resolve the effective environment from Config and what the Host exposes.
 * `detectedOs`/`detectedShell` are what detection alone says; `os`/`shell` are
 * what the rules actually use after applying an explicit override.
 * @param {object} ctx - plugin context.
 * @param {unknown} config - plugin Config with optional volatile references.
 * @param {unknown} [scope] - the Agent whose prompt is being assembled.
 * @returns {{ os: string, shell: string, tool: string | undefined, native: string | undefined, detectedOs: string, detectedShell: string }} resolved facts.
 */
export function resolveEnvironment(ctx, config, scope) {
  const tools = shellTools(ctx, scope)
  const detectedOs = detectOs()
  const detectedShell = detectShell(detectedOs, tools)
  const { os: osChoice, shell: shellChoice } = snapshot(config)
  const os = osChoice === 'auto' ? detectedOs : osChoice
  const shell = shellChoice === 'auto' ? detectedShell : shellChoice
  const native = tools.pwsh ? 'powershell' : tools.bash ? 'bash' : undefined
  const tool = tools.pwsh ? 'pwsh' : tools.bash ? 'bash' : undefined
  return { os, shell, tool, native, detectedOs, detectedShell }
}
