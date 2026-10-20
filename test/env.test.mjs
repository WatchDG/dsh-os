// Unit tests for configuration and OS/shell detection.
// These tests start no processes, so they run everywhere, including CI.
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  Config,
  OS_VALUES,
  RULES_SECTION,
  SHELL_VALUES,
  normalizeConfig,
  snapshot,
} from '../lib/config.js'
import { detectOs, detectShell, resolveEnvironment, shellTools } from '../lib/env.js'

/** A fake `ctx.tools` registry exposing exactly the named shell tools. */
function toolsContext(...names) {
  return {
    get(name) {
      if (name !== 'tools') return undefined
      return {
        get(toolName) {
          return names.includes(toolName) ? { name: toolName } : undefined
        },
      }
    },
  }
}

test('RULES_SECTION is the documented section name', () => {
  assert.equal(RULES_SECTION, 'os-shell:rules')
})

test('Config exposes two volatile select fields', () => {
  assert.equal(Config.type, 'object')
  assert.deepEqual(Object.keys(Config.dict), ['os', 'shell'])
  for (const field of ['os', 'shell']) {
    assert.equal(Config.dict[field].meta.volatile, true, `${field} is volatile`)
    assert.equal(Config.dict[field].meta.default, 'auto', `${field} defaults to auto`)
    assert.equal(Config.dict[field].type, 'union')
  }
})

test('selectable values cover every supported OS and shell', () => {
  assert.deepEqual(OS_VALUES, ['auto', 'windows', 'macos', 'linux'])
  assert.deepEqual(SHELL_VALUES, ['auto', 'powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh'])
})

test('normalizeConfig applies defaults and drops unknown values', () => {
  assert.deepEqual(normalizeConfig(undefined), { os: 'auto', shell: 'auto' })
  for (const raw of [null, 42, 'config', []]) {
    assert.deepEqual(normalizeConfig(raw), { os: 'auto', shell: 'auto' })
  }
  assert.deepEqual(normalizeConfig({ os: 'windows', shell: 'fish' }), { os: 'windows', shell: 'fish' })
  assert.deepEqual(normalizeConfig({ os: 'plan9', shell: 'tcsh' }), { os: 'auto', shell: 'auto' })
})

test('snapshot unwraps volatile references and tolerates plain values', () => {
  let shell = 'zsh'
  const live = snapshot({ os: { get: () => 'linux' }, shell: { get: () => shell } })
  assert.deepEqual(live, { os: 'linux', shell: 'zsh' })
  shell = 'fish'
  assert.deepEqual(snapshot({ shell: { get: () => shell } }), { os: 'auto', shell: 'fish' })
  assert.deepEqual(snapshot(undefined), { os: 'auto', shell: 'auto' })
  assert.deepEqual(snapshot({ os: 'macos', shell: 'bash' }), { os: 'macos', shell: 'bash' })
})

test('snapshot round-trips an already-normalized config', () => {
  const once = normalizeConfig({ os: 'linux', shell: 'bash' })
  assert.deepEqual(snapshot(once), once)
})

test('detectOs follows the host platform', () => {
  const expected =
    process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux'
  assert.equal(detectOs(), expected)
})

test('detectShell prefers the registered shell tool', () => {
  assert.equal(detectShell('windows', { pwsh: true, bash: false }), 'powershell')
  assert.equal(detectShell('windows', { pwsh: false, bash: true }), 'bash')
  assert.equal(detectShell('linux', { pwsh: true, bash: true }), 'powershell')
  assert.equal(detectShell('linux', { pwsh: false, bash: false }), 'bash')
  assert.equal(detectShell('macos', { pwsh: false, bash: false }), 'zsh')
})

test('shellTools tolerates a missing registry', () => {
  assert.deepEqual(shellTools({}, undefined), { pwsh: false, bash: false })
  assert.deepEqual(shellTools({ get: () => undefined }, undefined), { pwsh: false, bash: false })
  assert.deepEqual(shellTools(toolsContext('pwsh'), undefined), { pwsh: true, bash: false })
})

test('resolveEnvironment reads volatile references', () => {
  const config = { os: { get: () => 'linux' }, shell: { get: () => 'zsh' } }
  const detectedOs = detectOs()
  assert.deepEqual(resolveEnvironment(toolsContext(), config), {
    os: 'linux',
    shell: 'zsh',
    tool: undefined,
    native: undefined,
    detectedOs,
    detectedShell: detectShell(detectedOs, { pwsh: false, bash: false }),
  })
})

test('resolveEnvironment auto-detects from the tools registry', () => {
  const config = { os: { get: () => 'windows' }, shell: { get: () => 'auto' } }
  const resolved = resolveEnvironment(toolsContext('pwsh'), config)
  assert.equal(resolved.shell, 'powershell')
  assert.equal(resolved.tool, 'pwsh')
  assert.equal(resolved.native, 'powershell')
})

test('resolveEnvironment reports both tool and native shell', () => {
  const resolved = resolveEnvironment(toolsContext('bash'), { os: 'auto', shell: 'auto' })
  assert.equal(resolved.tool, 'bash')
  assert.equal(resolved.native, 'bash')
})
