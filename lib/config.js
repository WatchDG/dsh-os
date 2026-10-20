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
 * PowerShell 7 with the conservative rules that work on 5.1.
 */
export const SHELL_VALUES = ['auto', 'powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']

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
 * @returns {{ os: string, shell: string }}
 */
export function normalizeConfig(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {}
  const os = OS_VALUES.includes(source.os) ? source.os : 'auto'
  const shell = SHELL_VALUES.includes(source.shell) ? source.shell : 'auto'
  return { os, shell }
}

/**
 * Unwrap volatile Config references into a plain object `normalizeConfig`
 * accepts, then normalize. Call it on every use, not once at activation:
 * the Settings page may replace a field between two prompt assemblies.
 *
 * @param {unknown} raw Plugin Config with optional volatile references.
 * @returns {{ os: string, shell: string }}
 */
export function snapshot(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {}
  return normalizeConfig({
    os: live(source.os, 'auto'),
    shell: live(source.shell, 'auto'),
  })
}
