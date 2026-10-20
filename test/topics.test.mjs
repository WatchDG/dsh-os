// On-demand topic files: the core rules point here, the agent reads one
// with the harness `read` tool when its topic bites.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { TOPICS, topicsPointer } from '../lib/rules.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const topicsDir = path.join(root, 'topics')

test('every topic slug ships a readable markdown file', () => {
  assert.ok(TOPICS.length >= 7, 'topics cover exit codes, python, files, encoding, packages, commands, processes')
  for (const { slug, about } of TOPICS) {
    const file = path.join(topicsDir, `${slug}.md`)
    assert.ok(statSync(file).isFile(), `${slug}.md is missing (${about})`)
    const text = readFileSync(file, 'utf8')
    assert.match(text, /^#\s+.+/m, `${slug}.md needs a heading`)
    assert.ok(text.length > 200, `${slug}.md is too short to help`)
    assert.ok(Buffer.byteLength(text) < 8 * 1024, `${slug}.md must stay a quick read`)
  }
})

test('topics/ holds no orphan files', () => {
  const shipped = new Set(TOPICS.map(({ slug }) => `${slug}.md`))
  for (const entry of readdirSync(topicsDir)) {
    assert.ok(entry.endsWith('.md'), `unexpected file in topics/: ${entry}`)
    assert.ok(shipped.has(entry), `${entry} is not listed in TOPICS`)
  }
})

test('the pointer names every shipped file', () => {
  const pointer = topicsPointer()
  for (const { slug } of TOPICS) {
    assert.match(pointer, new RegExp(`topics/${slug}\\.md|/${slug}\\.md`), pointer)
  }
})
