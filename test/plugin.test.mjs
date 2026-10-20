// Plugin wiring tests with a fake plugin context.
// No Harness is required.
import test from 'node:test'
import assert from 'node:assert/strict'

import { RULES_SECTION } from '../lib/config.js'
import { STATUS_PATH, mount } from '../lib/plugin.js'
import { apply, detectOs } from '../index.js'

test('STATUS_PATH is the documented settings channel', () => {
  assert.equal(STATUS_PATH, '/os-shell/status')
})

test('apply registers one prompt section with live text', () => {
  const sections = []
  const injected = []
  const ctx = {
    get: () => undefined,
    inject(deps) {
      injected.push(deps[0])
    },
    fiber: undefined,
    systemPrompt: {
      getSectionOrder: () => 1010,
      section(section) {
        sections.push(section)
        return () => {}
      },
    },
  }
  apply(ctx, { os: { get: () => 'windows' }, shell: { get: () => 'auto' } })
  assert.equal(sections.length, 1)
  assert.equal(sections[0].name, RULES_SECTION)
  assert.equal(sections[0].order, 1014)
  assert.match(sections[0].text(), /Terminal environment/)
  assert.deepEqual(injected, ['settings', 'webServer'], 'settings ownership and the status route are registered')
})

test('the section text follows volatile writes without remounting', () => {
  let shell = 'auto'
  let captured
  const ctx = {
    get: (name) => {
      if (name !== 'tools') return undefined
      return { get: (toolName) => (toolName === 'pwsh' ? { name: 'pwsh' } : undefined) }
    },
    inject: () => {},
    systemPrompt: {
      getSectionOrder: () => 1010,
      section(section) {
        captured = section
        return () => {}
      },
    },
  }
  mount(ctx, { os: { get: () => 'windows' }, shell: { get: () => shell } })
  assert.match(captured.text(), /PowerShell/)
  shell = 'cmd'
  assert.match(captured.text(), /%NAME%/)
})

test('the assembly scope reaches the tool registry', () => {
  const agent = { id: 'agent-1' }
  const seen = []
  let captured
  const ctx = {
    get(name) {
      if (name !== 'tools') return undefined
      return {
        get(toolName, scope) {
          seen.push(scope)
          return toolName === 'pwsh' && scope === agent ? { name: 'pwsh' } : undefined
        },
      }
    },
    inject: () => {},
    systemPrompt: {
      getSectionOrder: () => 1010,
      section(section) {
        captured = section
        return () => {}
      },
    },
  }
  apply(ctx, { os: { get: () => 'windows' }, shell: { get: () => 'auto' } })
  const text = captured.text({ scope: agent })
  assert.match(text, /through the `pwsh` tool/)
  assert.ok(seen.includes(agent), 'tools.get received the agent scope')
})

test('mount works without a webServer scope (legacy fake contexts)', () => {
  const ctx = {
    get: () => undefined,
    inject: () => {},
    systemPrompt: {
      getSectionOrder: () => 1010,
      section: () => () => {},
    },
  }
  mount(ctx, { os: 'auto', shell: 'auto' })
})

test('host detection falls back gracefully before any assembly', () => {
  let captured
  const ctx = {
    get: () => undefined,
    inject: () => {},
    systemPrompt: {
      getSectionOrder: () => undefined,
      section(section) {
        captured = section
        return () => {}
      },
    },
  }
  apply(ctx, { os: 'auto', shell: 'auto' })
  assert.equal(captured.order, 1014)
  assert.match(captured.text(), new RegExp(detectOs() === 'windows' ? 'Windows' : detectOs() === 'macos' ? 'macOS' : 'Linux'))
})
