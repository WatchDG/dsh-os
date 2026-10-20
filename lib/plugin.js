/**
 * dsh-os — plugin mounting.
 *
 * Kept separate from `index.js` so the wiring can be unit-tested with a fake
 * plugin context, without a running Harness.
 *
 * Config is read live: `snapshot()` unwraps volatile references on every use,
 * so the Settings page can flip `os` and `shell` without remounting the
 * plugin. Only the rules section's presence is decided once, at activation
 * (it is always registered; its text is resolved per prompt assembly).
 */

import { RULES_SECTION, snapshot } from './config.js'
import { detectBashFlavor, detectOs, detectShell, resolveEnvironment } from './env.js'
import { exampleCommand, rulesOrder, rulesText, wrapperFor } from './rules.js'

/** Authenticated HTTP route the Settings page reads detection from. */
export const STATUS_PATH = '/os-shell/status'

/**
 * Build the payload the Settings page reads over the status channel.
 * Detection comes from the latest prompt assembly when one has run (it knows
 * the Agent's tools); otherwise only the Host environment is available.
 * The payload also carries the resolved rules preview, a working example
 * command, and the wrapper template, so the page can show what the agent
 * will actually see without a second route.
 * @param {unknown} config - plugin Config with optional volatile references.
 * @param {ReturnType<typeof resolveEnvironment> | undefined} last - last assembled environment.
 * @returns {object} detection, the currently targeted pair, and its source.
 */
export function statusView(config, last) {
  const detectedOs = last?.detectedOs ?? detectOs()
  const detectedShell = last?.detectedShell ?? detectShell(detectedOs, { pwsh: false, bash: false })
  const detectedBashFlavor = last?.detectedBashFlavor ?? detectBashFlavor(detectedOs)
  const { os, shell, bashFlavor: flavorChoice, location, powershellEdition } = snapshot(config)
  const targetOs = os === 'auto' ? detectedOs : os
  const targetShell = shell === 'auto' ? detectedShell : shell
  const targetBashFlavor = flavorChoice === 'auto' ? detectBashFlavor(targetOs) : flavorChoice
  const target = { os: targetOs, shell: targetShell, bashFlavor: targetBashFlavor, location, powershellEdition }
  const env = { ...target, tool: last?.tool, native: last?.native }
  const needsWrapper = env.shell !== env.native && env.native !== undefined
  return {
    detected: { os: detectedOs, shell: detectedShell, bashFlavor: detectedBashFlavor },
    target,
    tool: last?.tool,
    native: last?.native,
    tools: last?.tools ?? { pwsh: false, bash: false },
    shellEnv: process.env.SHELL ?? '',
    comSpec: process.env.ComSpec ?? '',
    wrapper: needsWrapper ? wrapperFor(env.shell, env.os) : null,
    example: exampleCommand(env),
    preview: rulesText(env),
    source: last === undefined ? 'host' : 'agent',
  }
}

/**
 * Shared gate for the settings route: browser-trust rejection, then method.
 *
 * @returns {boolean} true when the request was answered here.
 */
function gate(child, req, res) {
  const rejection = child.connection.requestRejection(req)
  if (rejection !== undefined) {
    res.statusCode = rejection
    res.end()
    return true
  }
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('allow', 'GET')
    res.end()
    return true
  }
  return false
}

/** Send a JSON payload with no-store caching. */
function json(res, code, body) {
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

/**
 * Register the prompt section and mark this plugin as owning its own settings
 * page (so a generic form never duplicates it).
 * @param {object} ctx - plugin context.
 * @param {unknown} config - parsed Config with volatile references.
 */
export function mount(ctx, config) {
  /** Latest assembled environment; the status channel prefers it because it knows the Agent's tools. */
  let lastEnvironment

  ctx.systemPrompt.section({
    name: RULES_SECTION,
    order: rulesOrder(ctx.systemPrompt),
    text: (context) => {
      const environment = resolveEnvironment(ctx, config, context?.scope)
      lastEnvironment = environment
      return rulesText(environment)
    },
  })

  if (typeof ctx.inject === 'function') {
    ctx.inject(['settings'], (child) => {
      const fiber = ctx.fiber
      if (fiber === undefined) return
      child.effect(() => child.settings.configure({ auto: false }, fiber), 'os-shell: own settings page')
    })

    // The Settings page reads detection from this authenticated GET route. It is
    // registered through the plugin's own `webServer` scope, so plugin unload
    // removes it, and it reuses the shared browser-trust fence for authorization.
    ctx.inject(['webServer', 'connection'], (child) => {
      child.effect(
        () =>
          child.webServer.register({
            kind: 'exact',
            path: STATUS_PATH,
            handler: (req, res) => {
              if (gate(child, req, res)) return
              json(res, 200, statusView(config, lastEnvironment))
            },
          }),
        `os-shell: GET ${STATUS_PATH}`,
      )
    })
  }
}

// Re-exported for callers that read the normalized config.
export { snapshot }
