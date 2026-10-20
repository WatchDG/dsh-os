// Unit tests for the prompt rules text and section placement.
import test from 'node:test'
import assert from 'node:assert/strict'

import { FALLBACK_ORDER, TOPICS, rulesOrder, rulesText, topicsPointer, wrapperFor } from '../lib/rules.js'

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

test('powershell rules check LASTEXITCODE and warn about 5.1 encodings', () => {
  const win = rulesText({ os: 'windows', shell: 'powershell', tool: 'pwsh', native: 'powershell' })
  assert.match(win, /\$LASTEXITCODE/)
  assert.doesNotMatch(win, /\$\? -ne 0/)
  assert.match(win, /chcp 65001/)
  assert.match(win, /Out-File -Encoding utf8/)

  const nix = rulesText({ os: 'linux', shell: 'powershell', tool: 'pwsh', native: 'powershell' })
  assert.match(nix, /\$LASTEXITCODE/)
  assert.doesNotMatch(nix, /chcp 65001/)
})

test('cmd rules check ERRORLEVEL', () => {
  const text = rulesText({ os: 'windows', shell: 'cmd', tool: 'pwsh', native: 'powershell' })
  assert.match(text, /%ERRORLEVEL%/)
})

test('windows bullets name locks, py, reserved names, and managers', () => {
  const text = rulesText({ os: 'windows', shell: 'powershell', tool: 'pwsh', native: 'powershell' })
  assert.match(text, /locks open files/)
  assert.match(text, /`py -3`/)
  assert.doesNotMatch(text, /call `python3`/)
  assert.match(text, /`CON`, `PRN`, `AUX`, `NUL`/)
  assert.match(text, /winget/)
  assert.match(text, /`apt`\/`brew` do not exist here/)
  assert.match(text, /start "" <path>/)
  assert.match(text, /no `sudo` in a non-interactive call/)
})

test('linux bullets name case, managers, and xdg-open', () => {
  const text = rulesText({ os: 'linux', shell: 'bash', tool: 'bash', native: 'bash' })
  assert.match(text, /case-sensitive/)
  assert.match(text, /`apt`, `dnf`, `pacman`/)
  assert.match(text, /`brew`\/`winget` do not exist here/)
  assert.match(text, /xdg-open/)
  assert.match(text, /Never use interactive `sudo`/)
  assert.doesNotMatch(text, /`py -3`/)
})

test('macos bullets name brew, quarantine, and open', () => {
  const text = rulesText({ os: 'macos', shell: 'zsh', tool: 'bash', native: 'bash' })
  assert.match(text, /Homebrew/)
  assert.match(text, /xattr -d com\.apple\.quarantine/)
  assert.match(text, /with `open`/)
  assert.match(text, /Never use interactive `sudo`/)
})

test('null device follows the shell family', () => {
  assert.match(rulesText({ os: 'windows', shell: 'powershell' }), /Discard output to `NUL`/)
  assert.match(rulesText({ os: 'windows', shell: 'cmd' }), /Discard output to `NUL`/)
  assert.match(rulesText({ os: 'linux', shell: 'bash' }), /Discard output to `\/dev\/null`/)
  assert.match(rulesText({ os: 'macos', shell: 'zsh' }), /Discard output to `\/dev\/null`/)
})

test('every section ends with the topics pointer and the dialect bullet', () => {
  for (const shell of ['powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']) {
    const text = rulesText({ os: 'linux', shell, tool: 'bash', native: 'bash' })
    assert.match(text, /Deeper notes live next to the plugin/, `${shell} pointer`)
    for (const { slug } of TOPICS) {
      assert.match(text, new RegExp(`${slug}\\.md`), `${shell} points at ${slug}.md`)
    }
    assert.match(text, /do not switch dialects/, `${shell} closing bullet`)
  }
})

test('topicsPointer maps every topic to its file', () => {
  const pointer = topicsPointer()
  assert.match(pointer, /^-\s+Deeper notes/)
  for (const { slug, about } of TOPICS) {
    assert.match(pointer, new RegExp(`${slug}\\.md`), about)
  }
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
