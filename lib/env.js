/**
 * dsh-os — operating system and shell detection.
 *
 * Pure Host inspection, kept separate from the prompt text (`lib/rules.js`)
 * and the context wiring (`lib/plugin.js`) so it can be unit-tested without
 * a running Harness.
 *
 * Auto detection answers three different questions:
 *
 * - OS: `process.platform` of the Host process (the Agent's shell runs there).
 * - Shell: the registered shell tool wins (`pwsh` → PowerShell, `bash` →
 *   bash) because that is what the Agent's commands actually execute in; the
 *   environment (`$SHELL`, `ComSpec`) is only a fallback.
 * - Bash flavor on Windows: WSL markers in the environment mean WSL,
 *   anything else means Git Bash. No processes are started to check.
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
 * Detect which bash the Agent's commands run in on Windows, without
 * starting any process. WSL sets `WSL_DISTRO_NAME`/`WSL_INTEROP` (and
 * usually `WSLENV`); anything else on Windows is Git Bash territory.
 * Outside Windows the flavor is always `native`.
 * @param {string} os - resolved OS.
 * @param {object} [env] - environment record, defaults to `process.env`.
 * @returns {'git-bash' | 'wsl' | 'native'} detected flavor.
 */
export function detectBashFlavor(os, env = process.env) {
  if (os !== 'windows') return 'native'
  const record = env !== null && typeof env === 'object' ? env : {}
  if (
    record.WSL_DISTRO_NAME !== undefined ||
    record.WSL_INTEROP !== undefined ||
    record.WSLENV !== undefined
  ) return 'wsl'
  return 'git-bash'
}

/**
 * Resolve the effective environment from Config and what the Host exposes.
 * `detectedOs`/`detectedShell`/`detectedBashFlavor` are what detection alone
 * says; `os`/`shell`/`bashFlavor` are what the rules actually use after
 * applying an explicit override.
 * @param {object} ctx - plugin context.
 * @param {unknown} config - plugin Config with optional volatile references.
 * @param {unknown} [scope] - the Agent whose prompt is being assembled.
 * @returns {{ os: string, shell: string, bashFlavor: string, location: string, powershellEdition: string, tool: string | undefined, native: string | undefined, tools: { pwsh: boolean, bash: boolean }, detectedOs: string, detectedShell: string, detectedBashFlavor: string }} resolved facts.
 */
export function resolveEnvironment(ctx, config, scope) {
  const tools = shellTools(ctx, scope)
  const detectedOs = detectOs()
  const detectedShell = detectShell(detectedOs, tools)
  const detectedBashFlavor = detectBashFlavor(detectedOs)
  const {
    os: osChoice,
    shell: shellChoice,
    bashFlavor: flavorChoice,
    location,
    powershellEdition,
  } = snapshot(config)
  const os = osChoice === 'auto' ? detectedOs : osChoice
  const shell = shellChoice === 'auto' ? detectedShell : shellChoice
  const bashFlavor = flavorChoice === 'auto' ? detectBashFlavor(os) : flavorChoice
  const native = tools.pwsh ? 'powershell' : tools.bash ? 'bash' : undefined
  const tool = tools.pwsh ? 'pwsh' : tools.bash ? 'bash' : undefined
  return {
    os,
    shell,
    bashFlavor,
    location,
    powershellEdition,
    tool,
    native,
    tools,
    detectedOs,
    detectedShell,
    detectedBashFlavor,
  }
}
