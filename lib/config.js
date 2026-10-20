/**
 * dsh-os — configuration normalization and the settings schema.
 *
 * The bundle row's `config` is user-authored YAML, so every field is optional
 * and every value is validated here, at activation, instead of at each prompt
 * assembly.
 *
 * `Config` is the same shape as a schema: the settings service serves only
 * volatile fields, so the Settings page can rewrite them while the plugin
 * stays loaded. `snapshot()` unwraps those live references back into the
 * plain values the rules and the status route consume.
 */

import z from '@deepseek-ai/schemastery'

/** Prompt section name owned by this plugin. */
export const RULES_SECTION = 'os-shell:rules'

/** Selectable operating systems. `auto` resolves from `process.platform`. */
export const OS_VALUES = ['auto', 'windows', 'macos', 'linux']

/**
 * Selectable shells. `powershell` covers both Windows PowerShell 5.1 and
 * PowerShell 7; the edition switch (`powershellEdition`) picks how strict
 * the chaining rules are.
 */
export const SHELL_VALUES = ['auto', 'powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']

/**
 * Bash flavors on Windows. Git Bash (MSYS2) mounts drives as `/c/...`;
 * WSL mounts them as `/mnt/c/...` and needs `.exe` to reach Windows
 * binaries. Outside Windows the flavor is always `native`.
 */
export const BASH_FLAVOR_VALUES = ['auto', 'git-bash', 'wsl', 'native']

/**
 * Where the agent's commands run. `local` is this Host; `remote` means a
 * machine reached over SSH, so the rules describe the remote side.
 */
export const LOCATION_VALUES = ['local', 'remote']

/**
 * PowerShell language edition. `auto` stays conservative (5.1-safe syntax:
 * no `&&`/`||`). Pick `7` only when the target is known to run
 * PowerShell 7+.
 */
export const POWERSHELL_EDITION_VALUES = ['auto', '5.1', '7']

/**
 * Runtime configuration.
 *
 * `.volatile()` is what makes the Settings page work: the settings service
 * exposes only volatile fields, and a write replaces the reference in place
 * instead of remounting the plugin.
 */
export const Config = z.object({
  os: z.union(OS_VALUES).default('auto').volatile(),
  shell: z.union(SHELL_VALUES).default('auto').volatile(),
  bashFlavor: z.union(BASH_FLAVOR_VALUES).default('auto').volatile(),
  location: z.union(LOCATION_VALUES).default('local').volatile(),
  powershellEdition: z.union(POWERSHELL_EDITION_VALUES).default('auto').volatile(),
})

/**
 * Read one Config field, tolerating a plain value when the schema is parsed
 * without the volatile wrapper (tests, older readers).
 *
 * @param {unknown} value Stored field value or volatile reference.
 * @param {unknown} fallback Value when nothing usable is stored.
 * @returns {unknown} the stored choice.
 */
function live(value, fallback) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    try {
      const current = value.get()
      return current === undefined ? fallback : current
    } catch {
      return fallback
    }
  }
  return value === undefined ? fallback : value
}

/**
 * Normalize the loader row's config.
 *
 * @param {unknown} raw Value from the bundle row (`config` in the patch layer).
 * @returns {{ os: string, shell: string, bashFlavor: string, location: string, powershellEdition: string }}
 */
export function normalizeConfig(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {}
  const os = OS_VALUES.includes(source.os) ? source.os : 'auto'
  const shell = SHELL_VALUES.includes(source.shell) ? source.shell : 'auto'
  const bashFlavor = BASH_FLAVOR_VALUES.includes(source.bashFlavor) ? source.bashFlavor : 'auto'
  const location = LOCATION_VALUES.includes(source.location) ? source.location : 'local'
  const powershellEdition = POWERSHELL_EDITION_VALUES.includes(source.powershellEdition)
    ? source.powershellEdition
    : 'auto'
  return { os, shell, bashFlavor, location, powershellEdition }
}

/**
 * Unwrap volatile Config references into a plain object `normalizeConfig`
 * accepts, then normalize. Call it on every use, not once at activation:
 * the Settings page may replace a field between two prompt assemblies.
 *
 * @param {unknown} raw Plugin Config with optional volatile references.
 * @returns {{ os: string, shell: string, bashFlavor: string, location: string, powershellEdition: string }}
 */
export function snapshot(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {}
  return normalizeConfig({
    os: live(source.os, 'auto'),
    shell: live(source.shell, 'auto'),
    bashFlavor: live(source.bashFlavor, 'auto'),
    location: live(source.location, 'local'),
    powershellEdition: live(source.powershellEdition, 'auto'),
  })
}
