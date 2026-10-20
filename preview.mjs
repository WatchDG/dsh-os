#!/usr/bin/env node
/**
 * dsh-os — preview the resolved rules without a running Harness.
 *
 * Usage:
 *
 *   node ./preview.mjs
 *   node ./preview.mjs --os windows --shell bash --bash-flavor wsl
 *   node ./preview.mjs --os linux --shell bash --location remote
 *   node ./preview.mjs --os windows --shell powershell --powershell-edition 7
 *
 * Flags left at `auto` follow the same detection as the plugin
 * (`process.platform` for the OS, WSL markers for the bash flavor).
 * The effective example command is printed after the rules.
 */

import { BASH_FLAVOR_VALUES, LOCATION_VALUES, OS_VALUES, POWERSHELL_EDITION_VALUES, SHELL_VALUES, normalizeConfig } from './lib/config.js'
import { detectBashFlavor, detectOs, detectShell } from './lib/env.js'
import { exampleCommand, rulesText } from './lib/rules.js'

/** Read a `--name value` (or `--name=value`) flag from `argv`. */
function flag(argv, name) {
  const prefixed = `--${name}`
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === prefixed) return argv[index + 1]
    if (arg.startsWith(`${prefixed}=`)) return arg.slice(prefixed.length + 1)
  }
  return undefined
}

function usage() {
  return [
    'Preview the resolved os-shell:rules section without a running Harness.',
    '',
    'Options:',
    `  --os <value>                   ${OS_VALUES.join(' | ')}`,
    `  --shell <value>                ${SHELL_VALUES.join(' | ')}`,
    `  --bash-flavor <value>          ${BASH_FLAVOR_VALUES.join(' | ')}`,
    `  --location <value>             ${LOCATION_VALUES.join(' | ')}`,
    `  --powershell-edition <value>   ${POWERSHELL_EDITION_VALUES.join(' | ')}`,
    '  --help                         show this text',
    '',
    'Examples:',
    '  node ./preview.mjs --os windows --shell bash --bash-flavor wsl',
    '  node ./preview.mjs --os linux --shell bash --location remote',
  ].join('\n')
}

const argv = process.argv.slice(2)
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(usage())
  process.exit(0)
}

const raw = normalizeConfig({
  os: flag(argv, 'os'),
  shell: flag(argv, 'shell'),
  bashFlavor: flag(argv, 'bash-flavor') ?? flag(argv, 'bashFlavor'),
  location: flag(argv, 'location'),
  powershellEdition: flag(argv, 'powershell-edition') ?? flag(argv, 'powershellEdition') ?? flag(argv, 'edition'),
})

const unknown = []
const picked = {
  os: flag(argv, 'os'),
  shell: flag(argv, 'shell'),
  bashFlavor: flag(argv, 'bash-flavor') ?? flag(argv, 'bashFlavor'),
  location: flag(argv, 'location'),
  powershellEdition: flag(argv, 'powershell-edition') ?? flag(argv, 'powershellEdition') ?? flag(argv, 'edition'),
}
if (picked.os !== undefined && raw.os === 'auto' && picked.os !== 'auto') unknown.push(`--os=${picked.os}`)
if (picked.shell !== undefined && raw.shell === 'auto' && picked.shell !== 'auto') unknown.push(`--shell=${picked.shell}`)
if (picked.bashFlavor !== undefined && raw.bashFlavor === 'auto' && picked.bashFlavor !== 'auto') unknown.push(`--bash-flavor=${picked.bashFlavor}`)
if (picked.location !== undefined && raw.location === 'local' && picked.location !== 'local') unknown.push(`--location=${picked.location}`)
if (picked.powershellEdition !== undefined && raw.powershellEdition === 'auto' && picked.powershellEdition !== 'auto') unknown.push(`--powershell-edition=${picked.powershellEdition}`)
if (unknown.length > 0) {
  console.error(`Unknown value: ${unknown.join(', ')}`)
  console.error(usage())
  process.exit(2)
}

const os = raw.os === 'auto' ? detectOs() : raw.os
const shell = raw.shell === 'auto' ? detectShell(os, { pwsh: false, bash: false }) : raw.shell
const bashFlavor = raw.bashFlavor === 'auto' ? detectBashFlavor(os) : raw.bashFlavor

const env = { os, shell, bashFlavor, location: raw.location, powershellEdition: raw.powershellEdition }
console.log(rulesText(env))
console.log('')
console.log(`Example: ${exampleCommand(env)}`)
