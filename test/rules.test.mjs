// Unit tests for the prompt rules text and section placement.
import test from 'node:test'
import assert from 'node:assert/strict'

import { FALLBACK_ORDER, rulesOrder, rulesText, wrapperFor } from '../lib/rules.js'

test('Windows PowerShell rules forbid && and use $env:', () => {
  const text = rulesText({ os: 'windows', shell: 'powershell', tool: 'pwsh', native: 'powershell' })
  assert.match(text, /never `&&` or `\|\|`/)
  assert.match(text, /\$env:NAME/)
  assert.match(text, /Get-ChildItem/)
  assert.match(text, /where\.exe/)
  assert.doesNotMatch(text, /bash -lc/)
})

test('a non-native shell is reached through a wrapper', () => {
  const text = rulesText({ os: 'windows', shell: 'cmd', tool: 'pwsh', native: 'powershell' })
  assert.match(text, /The Host's `pwsh` tool executes \*\*PowerShell\*\*/)
  assert.match(text, /cmd \/c "<command>"/)
  assert.match(text, /%NAME%/)

  const posixText = rulesText({ os: 'linux', shell: 'bash', tool: 'pwsh', native: 'powershell' })
  assert.match(posixText, /bash -lc '<command>'/)
})

test('POSIX rules use && and $NAME', () => {
  const text = rulesText({ os: 'linux', shell: 'bash', tool: 'bash', native: 'bash' })
  assert.match(text, /Chain with `&&`/)
  assert.match(text, /\$NAME/)
  assert.doesNotMatch(text, /never `&&`/)
})

test('macOS zsh rules name BSD tools', () => {
  const text = rulesText({ os: 'macos', shell: 'zsh', tool: 'bash', native: 'bash' })
  assert.match(text, /sed -i ''/)
  assert.match(text, /zsh -lc '<command>'/)
})

test('fish rules use set -x', () => {
  const text = rulesText({ os: 'linux', shell: 'fish', tool: 'bash', native: 'bash' })
  assert.match(text, /set -x NAME value/)
  assert.match(text, /fish -lc '<command>'/)
})

test('cmd and sh rules name their own syntax', () => {
  const cmd = rulesText({ os: 'windows', shell: 'cmd', tool: 'pwsh', native: 'powershell' })
  assert.match(cmd, /%NAME%/)
  assert.match(cmd, /findstr/)

  const sh = rulesText({ os: 'linux', shell: 'sh', tool: 'bash', native: 'bash' })
  assert.match(sh, /\[ \.\.\. \]/)
  assert.match(sh, /sh -c '<command>'/)
})

test('every section carries the environment header and the DSH facts', () => {
  for (const shell of ['powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']) {
    const text = rulesText({ os: 'linux', shell, tool: 'bash', native: 'bash' })
    assert.match(text, /^## Terminal environment/m, `${shell} header`)
    assert.match(text, /DSH_\*/, `${shell} harness facts`)
    assert.match(text, /do not switch dialects/, `${shell} closing bullet`)
  }
})

test('wrapperFor covers every selectable shell', () => {
  for (const shell of ['powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']) {
    assert.match(wrapperFor(shell, 'windows'), /command/)
    assert.match(wrapperFor(shell, 'linux'), /command/)
  }
  assert.equal(wrapperFor('powershell', 'windows'), 'powershell -NoProfile -Command "<command>"')
  assert.equal(wrapperFor('powershell', 'linux'), 'pwsh -NoProfile -Command \'<command>\'')
})

test('rulesOrder follows the shell tools guidance with a fallback', () => {
  assert.equal(rulesOrder({ getSectionOrder: (name) => (name === 'TOOL_PWSH' ? 1010 : undefined) }), 1014)
  assert.equal(rulesOrder({ getSectionOrder: () => undefined }), FALLBACK_ORDER)
  assert.equal(rulesOrder({ getSectionOrder: () => Number.NaN }), FALLBACK_ORDER)
  assert.equal(rulesOrder({}), FALLBACK_ORDER)
  assert.equal(rulesOrder(undefined), FALLBACK_ORDER)
  assert.equal(rulesOrder({ getSectionOrder: () => 0 }), 4)
})
