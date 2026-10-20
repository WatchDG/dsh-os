// Unit tests for configuration and OS/shell detection.
// These tests start no processes, so they run everywhere, including CI.
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BASH_FLAVOR_VALUES,
  Config,
  LOCATION_VALUES,
  OS_VALUES,
  POWERSHELL_EDITION_VALUES,
  RULES_SECTION,
  SHELL_VALUES,
  normalizeConfig,
  snapshot,
} from '../lib/config.js'
import { detectBashFlavor, detectOs, detectShell, resolveEnvironment, shellTools } from '../lib/env.js'

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

test('Config exposes five volatile select fields', () => {
  assert.equal(Config.type, 'object')
  assert.deepEqual(Object.keys(Config.dict), ['os', 'shell', 'bashFlavor', 'location', 'powershellEdition'])
  for (const field of ['os', 'shell', 'bashFlavor', 'location', 'powershellEdition']) {
    assert.equal(Config.dict[field].meta.volatile, true, `${field} is volatile`)
    assert.equal(Config.dict[field].type, 'union')
  }
  assert.equal(Config.dict.os.meta.default, 'auto')
  assert.equal(Config.dict.shell.meta.default, 'auto')
  assert.equal(Config.dict.bashFlavor.meta.default, 'auto')
  assert.equal(Config.dict.location.meta.default, 'local')
  assert.equal(Config.dict.powershellEdition.meta.default, 'auto')
})

test('selectable values cover every supported OS, shell, flavor, location, and edition', () => {
  assert.deepEqual(OS_VALUES, ['auto', 'windows', 'macos', 'linux'])
  assert.deepEqual(SHELL_VALUES, ['auto', 'powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh'])
  assert.deepEqual(BASH_FLAVOR_VALUES, ['auto', 'git-bash', 'wsl', 'native'])
  assert.deepEqual(LOCATION_VALUES, ['local', 'remote'])
  assert.deepEqual(POWERSHELL_EDITION_VALUES, ['auto', '5.1', '7'])
})

test('normalizeConfig applies defaults and drops unknown values', () => {
  assert.deepEqual(normalizeConfig(undefined), {
    os: 'auto',
    shell: 'auto',
    bashFlavor: 'auto',
    location: 'local',
    powershellEdition: 'auto',
  })
  for (const raw of [null, 42, 'config', []]) {
    assert.deepEqual(normalizeConfig(raw), normalizeConfig(undefined))
  }
  assert.deepEqual(normalizeConfig({ os: 'windows', shell: 'fish' }), {
    os: 'windows',
    shell: 'fish',
    bashFlavor: 'auto',
    location: 'local',
    powershellEdition: 'auto',
  })
  assert.deepEqual(
    normalizeConfig({ os: 'plan9', shell: 'tcsh', bashFlavor: 'cygwin', location: 'far', powershellEdition: '8' }),
    normalizeConfig(undefined),
  )
  assert.deepEqual(
    normalizeConfig({ bashFlavor: 'wsl', location: 'remote', powershellEdition: '7' }),
    { os: 'auto', shell: 'auto', bashFlavor: 'wsl', location: 'remote', powershellEdition: '7' },
  )
})

test('snapshot unwraps volatile references and tolerates plain values', () => {
  let shell = 'zsh'
  const live = snapshot({ os: { get: () => 'linux' }, shell: { get: () => shell } })
  assert.deepEqual(live, {
    os: 'linux',
    shell: 'zsh',
    bashFlavor: 'auto',
    location: 'local',
    powershellEdition: 'auto',
  })
  shell = 'fish'
  assert.deepEqual(snapshot({ shell: { get: () => shell } }), {
    os: 'auto',
    shell: 'fish',
    bashFlavor: 'auto',
    location: 'local',
    powershellEdition: 'auto',
  })
  assert.deepEqual(snapshot(undefined), normalizeConfig(undefined))
  assert.deepEqual(snapshot({ os: 'macos', shell: 'bash', bashFlavor: 'wsl', location: 'remote', powershellEdition: '7' }), {
    os: 'macos',
    shell: 'bash',
    bashFlavor: 'wsl',
    location: 'remote',
    powershellEdition: '7',
  })
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
  assert.equal(detectShell('windows', { pwsh: true, bash: false }, {}), 'powershell')
  assert.equal(detectShell('windows', { pwsh: false, bash: true }, {}), 'bash')
  assert.equal(detectShell('linux', { pwsh: true, bash: true }, {}), 'powershell')
  assert.equal(detectShell('linux', { pwsh: false, bash: false }, {}), 'bash')
  assert.equal(detectShell('macos', { pwsh: false, bash: false }, {}), 'zsh')
})

test('detectShell falls back to $SHELL from the given environment', () => {
  const tools = { pwsh: false, bash: false }
  assert.equal(detectShell('linux', tools, { SHELL: '/bin/zsh' }), 'zsh')
  assert.equal(detectShell('linux', tools, { SHELL: '/bin/fish' }), 'fish')
  assert.equal(detectShell('macos', tools, { SHELL: '/bin/bash' }), 'bash')
  assert.equal(detectShell('linux', tools, { SHELL: '/bin/false' }), 'bash')
  assert.equal(detectShell('macos', tools, {}), 'zsh')
  // Registered tools beat the environment.
  assert.equal(detectShell('linux', { pwsh: true, bash: false }, { SHELL: '/bin/bash' }), 'powershell')
})

test('detectBashFlavor follows WSL markers on Windows only', () => {
  assert.equal(detectBashFlavor('linux', {}), 'native')
  assert.equal(detectBashFlavor('macos', {}), 'native')
  assert.equal(detectBashFlavor('windows', {}), 'git-bash')
  assert.equal(detectBashFlavor('windows', null), 'git-bash')
  assert.equal(detectBashFlavor('windows', { WSL_DISTRO_NAME: 'Ubuntu' }), 'wsl')
  assert.equal(detectBashFlavor('windows', { WSL_INTEROP: '/run/WSL/interop' }), 'wsl')
  assert.equal(detectBashFlavor('windows', { WSLENV: 'x' }), 'wsl')
  assert.equal(detectBashFlavor('windows', { MSYSTEM: 'MINGW64' }), 'git-bash')
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
    bashFlavor: 'native',
    location: 'local',
    powershellEdition: 'auto',
    tool: undefined,
    native: undefined,
    tools: { pwsh: false, bash: false },
    detectedOs,
    detectedShell: detectShell(detectedOs, { pwsh: false, bash: false }),
    detectedBashFlavor: detectBashFlavor(detectedOs),
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

test('resolveEnvironment honors explicit flavor, location, and edition', () => {
  const resolved = resolveEnvironment(toolsContext('bash'), {
    os: 'windows',
    shell: 'bash',
    bashFlavor: 'wsl',
    location: 'remote',
    powershellEdition: '7',
  })
  assert.equal(resolved.os, 'windows')
  assert.equal(resolved.bashFlavor, 'wsl')
  assert.equal(resolved.location, 'remote')
  assert.equal(resolved.powershellEdition, '7')
})

test('resolveEnvironment auto flavor follows the resolved OS', () => {
  const windows = resolveEnvironment(toolsContext(), { os: 'windows', shell: 'bash' })
  assert.equal(windows.bashFlavor, detectBashFlavor('windows'))
  const linux = resolveEnvironment(toolsContext(), { os: 'linux', shell: 'bash' })
  assert.equal(linux.bashFlavor, 'native')
})
