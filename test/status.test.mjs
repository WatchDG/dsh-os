// Settings route tests: the Settings → Terminal section reads detection
// over the authenticated Host route.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { STATUS_PATH, mount, statusView } from '../lib/plugin.js'
import { apply, detectOs, detectShell } from '../index.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (relative) => readFileSync(path.join(root, relative), 'utf8')

/**
 * Mount with a fake context that captures the registered route.
 */
function mountRoute({ config = { os: { get: () => 'auto' }, shell: { get: () => 'auto' } }, rejection } = {}) {
  let route
  let section
  const ctx = {
    get(name) {
      if (name === 'tools') {
        return {
          get(toolName, scope) {
            return toolName === 'pwsh' && scope !== undefined ? { name: 'pwsh' } : undefined
          },
        }
      }
      if (name === 'connection') return { requestRejection: () => rejection }
      return undefined
    },
    fiber: {},
    inject(deps, callback) {
      if (deps[0] === 'settings') {
        callback({ effect: () => {}, settings: { configure: () => {} } })
      } else if (deps[0] === 'webServer') {
        callback({
          effect: (fn) => {
            fn()
          },
          connection: { requestRejection: () => rejection },
          webServer: {
            register(registered) {
              route = registered
              return () => {}
            },
          },
        })
      }
    },
    systemPrompt: {
      getSectionOrder: () => 1010,
      section(registered) {
        section = registered
        return () => {}
      },
    },
  }
  apply(ctx, config)
  return { route, section }
}

async function exchange(route, { method = 'GET' } = {}) {
  let statusCode = 0
  const headers = {}
  let body = ''
  const res = {
    set statusCode(value) {
      statusCode = value
    },
    setHeader(name, value) {
      headers[name] = value
    },
    writeHead(code, nextHeaders) {
      statusCode = code
      Object.assign(headers, nextHeaders)
    },
    end(text) {
      body = text ?? ''
    },
  }
  await route.handler({ method, headers: {} }, res)
  return { statusCode, headers, body: body ? JSON.parse(body) : body }
}

test('statusView reports detection, the targeted pair, and its source', () => {
  const config = { os: { get: () => 'auto' }, shell: { get: () => 'bash' } }
  const view = statusView(config, {
    os: 'windows',
    shell: 'bash',
    tool: 'pwsh',
    native: 'powershell',
    detectedOs: 'windows',
    detectedShell: 'powershell',
  })
  assert.deepEqual(view.detected, { os: 'windows', shell: 'powershell' })
  assert.deepEqual(view.target, { os: 'windows', shell: 'bash' })
  assert.equal(view.tool, 'pwsh')
  assert.equal(view.source, 'agent')

  const fallback = statusView({ os: { get: () => 'auto' }, shell: { get: () => 'auto' } }, undefined)
  assert.equal(fallback.source, 'host')
  assert.equal(fallback.detected.os, detectOs())
  assert.deepEqual(fallback.target, fallback.detected)
})

test('the status route answers the settings page', async () => {
  const agent = { id: 'agent-1' }
  const { route, section } = mountRoute()
  assert.equal(route.kind, 'exact')
  assert.equal(route.path, '/os-shell/status')

  section.text({ scope: agent })

  const ok = await exchange(route, { method: 'GET' })
  assert.equal(ok.statusCode, 200)
  assert.match(ok.headers['content-type'], /application\/json/)
  const payload = ok.body
  assert.deepEqual(payload.detected, { os: detectOs(), shell: 'powershell' })
  assert.deepEqual(payload.target, { os: detectOs(), shell: 'powershell' })
  assert.equal(payload.tool, 'pwsh')
  assert.equal(payload.source, 'agent')

  const wrongMethod = await exchange(route, { method: 'POST' })
  assert.equal(wrongMethod.statusCode, 405)
})

test('settings routes refuse rejected browser callers', async () => {
  const { route } = mountRoute({ rejection: 403 })
  const refused = await exchange(route, { method: 'GET' })
  assert.equal(refused.statusCode, 403)
})

test('the plugin owns its settings page instead of a generic form', () => {
  const settingsCalls = []
  const ctx = {
    get: () => undefined,
    fiber: {},
    systemPrompt: { section: () => () => {}, getSectionOrder: () => 1010 },
    on: () => () => {},
    inject(deps, callback) {
      if (deps[0] === 'settings') {
        settingsCalls.push(deps)
        callback({ effect: (fn) => fn(), settings: { configure: () => {} } })
      }
    },
  }
  mount(ctx, {})
  assert.deepEqual(settingsCalls, [['settings']])
})

test('an assembly without an agent scope still uses host detection', () => {
  const { route, section } = mountRoute()
  section.text()
  return exchange(route, { method: 'GET' }).then((ok) => {
    assert.equal(ok.statusCode, 200)
    assert.equal(ok.body.source, 'agent')
    assert.equal(ok.body.tool, undefined)
    assert.equal(ok.body.detected.shell, detectShell(ok.body.detected.os, { pwsh: false, bash: false }))
  })
})

test('the web client registers the Terminal section and the status channel', () => {
  const client = read('client.js')
  assert.match(client, /id:\s*['"]dsh-os['"]/)
  assert.match(client, /settings\.section/)
  assert.match(client, /\/os-shell\/status/)
  assert.match(client, /os-shell: settings page/)
  assert.match(client, /whileServed/)
  assert.match(client, /configForms/)
})
