// Unit tests for the prompt rules text and section placement.
import test from 'node:test'
import assert from 'node:assert/strict'

import { FALLBACK_ORDER, TOPIC_FILES, contextTopicFiles, exampleCommand, rulesOrder, rulesText, topicsPointer, wrapperFor } from '../lib/rules.js'

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

test('windows bash defaults to the Git Bash flavor', () => {
  const text = rulesText({ os: 'windows', shell: 'bash', tool: 'bash', native: 'bash' })
  assert.match(text, /Git Bash paths look like `\/c\//)
  assert.match(text, /where\.exe/)
  assert.doesNotMatch(text, /\/mnt\/c\//)
})

test('windows bash under WSL names WSL paths and wslpath', () => {
  const text = rulesText({ os: 'windows', shell: 'bash', bashFlavor: 'wsl', tool: 'bash', native: 'bash' })
  assert.match(text, /\/mnt\/c\//)
  assert.match(text, /wslpath/)
  assert.match(text, /powershell\.exe/)
  assert.doesNotMatch(text, /Git Bash paths/)
})

test('non-windows bash ignores the flavor', () => {
  const text = rulesText({ os: 'linux', shell: 'bash', bashFlavor: 'wsl', tool: 'bash', native: 'bash' })
  assert.match(text, /GNU tools/)
  assert.doesNotMatch(text, /\/mnt\/c\//)
  assert.doesNotMatch(text, /Git Bash/)
})

test('the pointer names the bash flavor', () => {
  const gitBash = topicsPointer({ os: 'windows', shell: 'bash', bashFlavor: 'git-bash' })
  assert.match(gitBash, /Windows \+ bash \(Git Bash\)/)
  const wsl = topicsPointer({ os: 'windows', shell: 'bash', bashFlavor: 'wsl' })
  assert.match(wsl, /Windows \+ bash \(WSL\)/)
  const native = topicsPointer({ os: 'linux', shell: 'bash', bashFlavor: 'native' })
  assert.match(native, /Linux \+ bash \(native\)/)
  const other = topicsPointer({ os: 'windows', shell: 'powershell' })
  assert.doesNotMatch(other, /Git Bash|\(WSL\)|\(native\)/)
})

test('PowerShell 7 rules allow && while auto stays 5.1-safe', () => {
  const seven = rulesText({ os: 'windows', shell: 'powershell', powershellEdition: '7', tool: 'pwsh', native: 'powershell' })
  assert.match(seven, /PowerShell 7 also accepts `&&` \/ `\|\|`/)
  assert.match(seven, /PowerShell 7/)
  const auto = rulesText({ os: 'windows', shell: 'powershell', tool: 'pwsh', native: 'powershell' })
  assert.match(auto, /never `&&` or `\|\|`/)
  const pinned = rulesText({ os: 'windows', shell: 'powershell', powershellEdition: '5.1', tool: 'pwsh', native: 'powershell' })
  assert.match(pinned, /Windows PowerShell 5\.1/)
  assert.match(pinned, /never `&&` or `\|\|`/)
})

test('remote rules name the remote machine and the SSH notes', () => {
  const text = rulesText({ os: 'linux', shell: 'bash', location: 'remote', tool: 'bash', native: 'bash' })
  assert.match(text, /remote .*Linux.* over SSH/i)
  assert.match(text, /Remote session over SSH/)
  assert.match(text, /scp/)
  const pointer = text.split('\n').find((line) => line.startsWith('- Your context:'))
  assert.match(pointer, /Remote over SSH/)
  assert.match(pointer, /ssh\.md/)
  const local = rulesText({ os: 'linux', shell: 'bash', tool: 'bash', native: 'bash' })
  assert.doesNotMatch(local, /Remote session over SSH/)
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
  assert.match(win, /ExecutionPolicy Bypass/)

  const nix = rulesText({ os: 'linux', shell: 'powershell', tool: 'pwsh', native: 'powershell' })
  assert.match(nix, /\$LASTEXITCODE/)
  assert.doesNotMatch(nix, /chcp 65001/)
})

test('cmd rules check ERRORLEVEL', () => {
  const text = rulesText({ os: 'windows', shell: 'cmd', tool: 'pwsh', native: 'powershell' })
  assert.match(text, /%ERRORLEVEL%/)
})

test('windows bullets are directives for this context only', () => {
  const text = rulesText({ os: 'windows', shell: 'powershell', tool: 'pwsh', native: 'powershell' })
  assert.match(text, /keep their case but compare case-insensitively/)
  assert.match(text, /stop the process holding the file/)
  assert.match(text, /Run Python as `py -3`/)
  assert.match(text, /Do not create files named `CON`/)
  assert.match(text, /Install tools with `winget`/)
  assert.match(text, /cannot elevate itself/)
  assert.match(text, /start "" <path>/)
  assert.match(text, /OneDrive\/Dropbox/)
  assert.match(text, /\.gitattributes/)
  assert.match(text, /chmod=\+x/)
  assert.match(text, /SymbolicLink/)
  assert.doesNotMatch(text, /python3/)
  assert.doesNotMatch(text, /Linux/)
  assert.doesNotMatch(text, /macOS/)
  assert.doesNotMatch(text, /\bapt\b/)
  assert.doesNotMatch(text, /brew/)
  assert.doesNotMatch(text, /does not exist/)
  assert.doesNotMatch(text, /rather than/)
})

test('linux bullets are directives for this context only', () => {
  const text = rulesText({ os: 'linux', shell: 'bash', tool: 'bash', native: 'bash' })
  assert.match(text, /case-sensitive/)
  assert.match(text, /Install tools with the distro manager/)
  assert.match(text, /Never run interactive `sudo`/)
  assert.match(text, /xdg-open/)
  assert.match(text, /\.gitattributes/)
  assert.match(text, /ln -s target link/)
  assert.doesNotMatch(text, /Windows/)
  assert.doesNotMatch(text, /macOS/)
  assert.doesNotMatch(text, /winget/)
  assert.doesNotMatch(text, /brew/)
  assert.doesNotMatch(text, /`py -3`/)
  assert.doesNotMatch(text, /does not exist/)
})

test('macos bullets are directives for this context only', () => {
  const text = rulesText({ os: 'macos', shell: 'zsh', tool: 'bash', native: 'bash' })
  assert.match(text, /Homebrew \(`brew`\)/)
  assert.match(text, /xattr -d com\.apple\.quarantine/)
  assert.match(text, /with `open`/)
  assert.match(text, /Never run interactive `sudo`/)
  assert.match(text, /\.gitattributes/)
  assert.match(text, /ln -s target link/)
  assert.doesNotMatch(text, /Windows/)
  assert.doesNotMatch(text, /Linux/)
  assert.doesNotMatch(text, /\bapt\b/)
  assert.doesNotMatch(text, /winget/)
  assert.doesNotMatch(text, /does not exist/)
})

test('remote bullets name no OS, so they compose with every context', () => {
  for (const os of ['windows', 'macos', 'linux']) {
    const text = rulesText({ os, shell: 'bash', location: 'remote' })
    assert.match(text, /Remote session over SSH/, `${os} remote`)
  }
  const win = rulesText({ os: 'windows', shell: 'powershell', location: 'remote' })
  assert.doesNotMatch(win, /Linux|macOS/)
  const lin = rulesText({ os: 'linux', shell: 'bash', location: 'remote' })
  assert.doesNotMatch(lin, /Windows|macOS/)
  const mac = rulesText({ os: 'macos', shell: 'zsh', location: 'remote' })
  assert.doesNotMatch(mac, /Windows|Linux/)
})

test('exampleCommand names a command that works in the shell', () => {
  assert.equal(exampleCommand({ shell: 'powershell' }), 'Get-ChildItem')
  assert.equal(exampleCommand({ shell: 'cmd' }), 'dir')
  assert.equal(exampleCommand({ shell: 'bash' }), 'ls -la')
  assert.equal(exampleCommand({ shell: 'zsh' }), 'ls -la')
  assert.equal(exampleCommand({ shell: 'fish' }), 'ls -la')
  assert.equal(exampleCommand({ shell: 'sh' }), 'ls -la')
})

test('null device follows the shell family', () => {
  assert.match(rulesText({ os: 'windows', shell: 'powershell' }), /Discard output to `NUL`/)
  assert.match(rulesText({ os: 'windows', shell: 'cmd' }), /Discard output to `NUL`/)
  assert.match(rulesText({ os: 'linux', shell: 'bash' }), /Discard output to `\/dev\/null`/)
  assert.match(rulesText({ os: 'macos', shell: 'zsh' }), /Discard output to `\/dev\/null`/)
})

test('the pointer names the resolved context and its files plus the global table', () => {
  const contexts = [
    'os-windows.md',
    'os-macos.md',
    'os-linux.md',
    'shell-powershell.md',
    'shell-cmd.md',
    'shell-bash.md',
    'shell-zsh.md',
    'shell-fish.md',
    'shell-sh.md',
    'commands-windows.md',
    'commands-macos.md',
    'commands-linux.md',
  ]
  const cases = [
    { os: 'windows', shell: 'powershell' },
    { os: 'windows', shell: 'cmd' },
    { os: 'linux', shell: 'bash' },
    { os: 'linux', shell: 'fish' },
    { os: 'macos', shell: 'zsh' },
  ]
  const filePattern = (file) => new RegExp(file.replaceAll('.', '\\.'))
  for (const { os, shell } of cases) {
    const text = rulesText({ os, shell, tool: 'x', native: 'y' })
    const pointer = text.split('\n').find((line) => line.startsWith('- Your context:'))
    assert.ok(pointer, `${os}+${shell} pointer`)
    const wanted = [`os-${os}.md`, `shell-${shell}.md`, `commands-${os}.md`]
    for (const file of wanted) {
      assert.match(pointer, filePattern(file), `${os}+${shell} points at ${file}`)
    }
    for (const other of contexts) {
      if (!wanted.includes(other)) {
        assert.doesNotMatch(pointer, filePattern(other), `${os}+${shell} hides ${other}`)
      }
    }
    assert.doesNotMatch(pointer, /ssh\.md/, `${os}+${shell} local hides ssh.md`)
    assert.match(pointer, /anti-patterns\.md/, `${os}+${shell} links the global table`)
    assert.match(text, /do not switch dialects/, `${os}+${shell} closing bullet`)
  }
  const remote = rulesText({ os: 'linux', shell: 'bash', tool: 'bash', native: 'bash', location: 'remote' })
  const remotePointer = remote.split('\n').find((line) => line.startsWith('- Your context:'))
  assert.match(remotePointer, /ssh\.md/)
})

test('topicsPointer and contextTopicFiles agree on the files', () => {
  assert.deepEqual(contextTopicFiles({ os: 'windows', shell: 'cmd' }), [
    'os-windows.md',
    'shell-cmd.md',
    'commands-windows.md',
  ])
  assert.deepEqual(contextTopicFiles({ os: 'linux', shell: 'bash', location: 'remote' }), [
    'os-linux.md',
    'shell-bash.md',
    'commands-linux.md',
    'ssh.md',
  ])
  const pointer = topicsPointer({ os: 'linux', shell: 'fish' })
  assert.match(pointer, /Your context: \*\*Linux \+ fish\*\*/)
  assert.match(pointer, /os-linux\.md/)
  assert.match(pointer, /shell-fish\.md/)
  assert.match(pointer, /commands-linux\.md/)
  assert.match(pointer, /anti-patterns\.md/)
  assert.equal(TOPIC_FILES.length, 14)
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
