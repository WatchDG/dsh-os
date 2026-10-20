// On-demand context packs: the core rules point at exactly the files
// matching the resolved OS/shell pair (plus the SSH notes for remote
// sessions); the agent reads one with the harness `read` tool when its
// topic bites, and never sees other contexts.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { TOPIC_FILES, contextTopicFiles, topicsPointer } from '../lib/rules.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const topicsDir = path.join(root, 'topics')

const OS_VALUES = ['windows', 'macos', 'linux']
const SHELL_VALUES = ['powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']

/** Per-file marker proving the file states its own context. */
function contextMarker(file) {
  if (file === 'ssh.md') return /remote/i
  if (file === 'anti-patterns.md') return /from memory/
  if (file.startsWith('shell-')) {
    return /Read this when the rules name (PowerShell|cmd|bash|zsh|fish|the POSIX shell)/
  }
  return /Read this when the rules name (Windows|macOS|Linux)/
}

test('every context pack ships a readable markdown file', () => {
  assert.equal(TOPIC_FILES.length, 14, 'os x3, shell x6, commands x3, ssh, anti-patterns')
  for (const file of TOPIC_FILES) {
    const full = path.join(topicsDir, file)
    assert.ok(statSync(full).isFile(), `${file} is missing`)
    const text = readFileSync(full, 'utf8')
    assert.match(text, /^#\s+.+/m, `${file} needs a heading`)
    assert.ok(text.length > 200, `${file} is too short to help`)
    assert.ok(Buffer.byteLength(text) < 8 * 1024, `${file} must stay a quick read`)
    assert.match(text, contextMarker(file), `${file} states its context`)
  }
})

test('topics/ holds no orphan files', () => {
  const shipped = new Set(TOPIC_FILES)
  for (const entry of readdirSync(topicsDir)) {
    assert.ok(entry.endsWith('.md'), `unexpected file in topics/: ${entry}`)
    assert.ok(shipped.has(entry), `${entry} is not listed in TOPIC_FILES`)
  }
})

test('every OS/shell pair resolves to its shipped files', () => {
  for (const os of OS_VALUES) {
    for (const shell of SHELL_VALUES) {
      const files = contextTopicFiles({ os, shell })
      assert.deepEqual(files, [`os-${os}.md`, `shell-${shell}.md`, `commands-${os}.md`])
      for (const file of files) {
        assert.ok(statSync(path.join(topicsDir, file)).isFile(), `${os}+${shell} → ${file} exists`)
      }
      const remote = contextTopicFiles({ os, shell, location: 'remote' })
      assert.deepEqual(remote, [`os-${os}.md`, `shell-${shell}.md`, `commands-${os}.md`, 'ssh.md'])
    }
  }
})

test('the pointer carries its own files plus the global table', () => {
  for (const os of OS_VALUES) {
    for (const shell of SHELL_VALUES) {
      const pointer = topicsPointer({ os, shell })
      assert.match(pointer, /Your context:/)
      assert.match(pointer, /anti-patterns\.md/)
      const wanted = new Set(contextTopicFiles({ os, shell }))
      for (const file of TOPIC_FILES) {
        if (file === 'anti-patterns.md') continue
        if (wanted.has(file)) assert.match(pointer, new RegExp(file.replaceAll('.', '\\.')))
        else assert.doesNotMatch(pointer, new RegExp(file.replaceAll('.', '\\.')))
      }
    }
  }
  const remote = topicsPointer({ os: 'linux', shell: 'bash', location: 'remote' })
  assert.match(remote, /ssh\.md/)
  assert.match(remote, /Remote over SSH/)
})
