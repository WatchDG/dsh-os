/**
 * dsh-os — the system-prompt rules section.
 *
 * The text is composed from one resolved environment (see `lib/env.js`), so
 * the model always gets exactly the syntax of the selected OS/shell pair —
 * plus an explicit invocation wrapper when the selected shell differs from
 * the tool's own dialect.
 */

import { fileURLToPath } from 'node:url'

/** Fallback placement when the shell tools' sections are unknown. */
export const FALLBACK_ORDER = 1014

/**
 * Per-context detail files shipped with the plugin bundle: one pack per OS
 * and one per shell, plus per-OS command equivalents, plus two cross-cutting
 * notes (remote sessions over SSH and the POSIX → native anti-patterns
 * table). The core rules stay short and point at exactly the files matching
 * the resolved context; the agent reads one with the harness `read` tool
 * when its topic bites, and never sees other contexts.
 */
export const TOPIC_FILES = [
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
  'ssh.md',
  'anti-patterns.md',
]

/**
 * The detail files relevant to one resolved context: the OS pack, the shell
 * pack, the OS command equivalents, and the SSH notes when the commands run
 * on a remote machine. The anti-patterns table is global and is always
 * linked separately by `topicsPointer()`.
 * @param {{ os: string, shell: string, location?: string }} env - resolved facts.
 * @returns {string[]} file names, no directories.
 */
export function contextTopicFiles(env) {
  const files = [`os-${env.os}.md`, `shell-${env.shell}.md`, `commands-${env.os}.md`]
  if (env.location === 'remote') files.push('ssh.md')
  return files
}

/**
 * Absolute bundle directory of the shipped topic files, resolved from this
 * module so the pointer stays correct wherever the bundle is installed.
 * Forward slashes read fine on every OS, including Windows.
 * @returns {string} absolute directory path with `/` separators.
 */
function topicsDir() {
  return fileURLToPath(new URL('../topics/', import.meta.url))
    .replaceAll('\\', '/')
    .replace(/\/$/, '')
}

const OS_LABELS = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
}

const SHELL_LABELS = {
  powershell: 'PowerShell',
  cmd: 'the Windows command prompt (cmd)',
  bash: 'bash',
  zsh: 'zsh',
  fish: 'fish',
  sh: 'the POSIX shell (sh)',
}

const FLAVOR_LABELS = {
  'git-bash': 'Git Bash',
  wsl: 'WSL',
  native: 'native',
  auto: 'auto',
}

/**
 * Display name of the resolved shell, including the PowerShell edition when
 * the user pinned it.
 * @param {{ shell: string, powershellEdition?: string }} env - resolved facts.
 * @returns {string} label for the header and the pointer.
 */
function shellLabelFor(env) {
  if (env.shell === 'powershell' && env.powershellEdition === '7') return 'PowerShell 7'
  if (env.shell === 'powershell' && env.powershellEdition === '5.1') return 'Windows PowerShell 5.1'
  return SHELL_LABELS[env.shell] ?? env.shell
}

/**
 * One pointer bullet naming the resolved context and its detail files.
 * Nothing outside the current OS/shell pair is mentioned, except the two
 * global notes (remote session, anti-patterns) when they apply.
 * @param {{ os: string, shell: string, bashFlavor?: string, location?: string }} env - resolved facts.
 * @returns {string} a markdown bullet.
 */
export function topicsPointer(env) {
  const dir = topicsDir()
  const [osFile, shellFile, commandsFile] = contextTopicFiles(env)
  const osLabel = OS_LABELS[env.os] ?? env.os
  const shellLabel = shellLabelFor(env)
  const context = env.shell === 'bash'
    ? `${osLabel} + ${shellLabel} (${FLAVOR_LABELS[env.bashFlavor] ?? FLAVOR_LABELS['git-bash']})`
    : `${osLabel} + ${shellLabel}`
  let bullet = `- Your context: **${context}**.`
  if (env.location === 'remote') {
    bullet += ` **Remote over SSH: the files below describe the remote machine.**`
  }
  bullet += ` Details, read only what your task needs: OS notes → \`${dir}/${osFile}\`, shell notes → \`${dir}/${shellFile}\`, command equivalents → \`${dir}/${commandsFile}\``
  if (env.location === 'remote') {
    bullet += `, remote notes → \`${dir}/ssh.md\``
  }
  bullet += `. Anti-patterns table → \`${dir}/anti-patterns.md\`: check it before writing a command from memory.`
  return bullet
}

/**
 * The command wrapper that reaches `shell` through the tool's own dialect.
 * @param {string} shell - target shell.
 * @param {string} os - resolved OS.
 * @returns {string} a wrapper template with `<command>` in place.
 */
export function wrapperFor(shell, os) {
  switch (shell) {
    case 'powershell':
      return os === 'windows'
        ? 'powershell -NoProfile -Command "<command>"'
        : 'pwsh -NoProfile -Command \'<command>\''
    case 'cmd':
      return 'cmd /c "<command>"'
    case 'bash':
      return 'bash -lc \'<command>\''
    case 'zsh':
      return 'zsh -lc \'<command>\''
    case 'fish':
      return 'fish -lc \'<command>\''
    case 'sh':
      return 'sh -c \'<command>\''
    default:
      return '<command>'
  }
}

/**
 * One example command that is guaranteed to work in the resolved shell.
 * The Settings page shows it next to the rules preview.
 * @param {{ shell: string }} env - resolved facts.
 * @returns {string} a single command line.
 */
export function exampleCommand(env) {
  switch (env.shell) {
    case 'powershell':
      return 'Get-ChildItem'
    case 'cmd':
      return 'dir'
    default:
      return 'ls -la'
  }
}

/**
 * One bullet about the harness `DSH_*` variables in the selected shell's
 * variable syntax.
 * @param {string} shell - resolved shell.
 * @returns {string} a markdown bullet.
 */
function envVariablesBullet(shell) {
  const read = shell === 'powershell'
    ? '$env:DSH_PROFILE'
    : shell === 'cmd'
      ? '%DSH_PROFILE%'
      : '$DSH_PROFILE'
  return `- Harness facts arrive as \`DSH_*\` environment variables (read \`${read}\`), and each call is a fresh process: pass the tool's \`workdir\` argument instead of relying on \`cd\`, and never rely on variables set by an earlier call.`
}

/**
 * Rules for a PowerShell target (Windows PowerShell 5.1 and PowerShell 7).
 * @param {string} os - resolved OS.
 * @param {string} [edition] - pinned edition (`5.1`, `7`, or `auto`).
 * @returns {string[]} markdown bullets.
 */
function powershellRules(os, edition = 'auto') {
  const chain = edition === '7'
    ? '- **Chain with `;` (always).** PowerShell 7 also accepts `&&` / `||`, but `;` works on 5.1 too — prefer `;` so snippets copy-paste everywhere. Run the next command only on success with `cmd1; if ($?) { cmd2 }`.'
    : '- **Chain with `;`, never `&&` or `||`.** Windows PowerShell 5.1 reports `The token \'&&\' is not a valid statement separator`; `;` works in every PowerShell version. Run the next command only on success with `cmd1; if ($?) { cmd2 }`.'
  return [
    chain,
    '- Environment variables: read `$env:NAME`, set `$env:NAME = \'value\'`. `$NAME`, `export NAME=value`, and `NAME=value command` are not PowerShell.',
    os === 'windows'
      ? '- Paths are native Windows (`C:\\work\\app`); quote paths containing spaces. Locate binaries with `where.exe`; fetch URLs with `curl.exe` or `Invoke-RestMethod`.'
      : '- Paths are POSIX (`/home/you/app`); quote paths containing spaces. PowerShell on this OS still reads environment variables with `$env:NAME`.',
    '- Prefer cmdlets to POSIX names: `Get-ChildItem`, `Get-Content`, `Set-Content`, `Select-String`, `Copy-Item`, `Move-Item`, `Remove-Item -Recurse -Force`, `New-Item`, `Test-Path`.',
    '- Single quotes keep text literal; double quotes interpolate `$variables`. Pipes, `>`, `>>`, and `2>&1` work as expected.',
    ...(os === 'windows'
      ? ['- `cmd /c "<command>"` reaches a cmd-only command when no cmdlet equivalent exists.']
      : []),
    '- Native commands report their code in `$LASTEXITCODE`, not `$?` (`$?` is only true/false). Check `if ($LASTEXITCODE -ne 0) { ... }` on the next line — any later command overwrites both.',
    '- Run saved scripts as `powershell -ExecutionPolicy Bypass -File script.ps1`.',
    ...(os === 'windows'
      ? ['- Console output may arrive in the OEM code page (often cp866/cp1251) and `>` writes UTF-16: when text turns into mojibake, prefer `chcp 65001`, `[Console]::OutputEncoding = [utf8]`, and `Out-File -Encoding utf8`.']
      : []),
    '- Verify the resolved absolute target path before any delete or move.',
  ]
}

/**
 * Rules for a cmd target.
 * @returns {string[]} markdown bullets.
 */
function cmdRules() {
  return [
    '- **Chain with `&&` (next only on success), `||` (next only on failure), or `&` (next always).**',
    '- Environment variables: `%NAME%`; `set NAME=value` affects only the same command line, because each call is a fresh process.',
    '- Paths are native Windows with backslashes (`C:\\work\\app`); quote paths containing spaces.',
    '- Use cmd built-ins — `dir`, `where`, `type`, `copy`, `move`, `del`, `mkdir`, `rmdir /s /q`, `findstr`. PowerShell cmdlets and `$env:` do not exist in cmd.',
    '- A command’s exit code is `%ERRORLEVEL%`; check it on the next line before anything else overwrites it.',
    '- Verify the resolved absolute target path before any delete or move.',
  ]
}

/**
 * Rules for bash, including Git Bash and WSL on Windows.
 * @param {string} os - resolved OS.
 * @param {string} [bashFlavor] - `git-bash`, `wsl`, or `native`.
 * @returns {string[]} markdown bullets.
 */
function bashRules(os, bashFlavor = 'git-bash') {
  const flavor = os === 'windows' ? bashFlavor : 'native'
  const paths = flavor === 'wsl'
    ? '- WSL paths look like `/mnt/c/Users/you/app` (drives live under `/mnt/<letter>/`). Reach Windows programs with `.exe` (`powershell.exe`, `where.exe`) and convert paths with `wslpath -w <path>`; keep shell scripts on LF line endings.'
    : flavor === 'git-bash'
      ? '- Git Bash paths look like `/c/Users/you/app`. In unquoted bash words `\\` is an escape character, so write Windows paths with forward slashes; native programs keep `.exe` (`where.exe`).'
      : os === 'macos'
        ? '- Paths use forward slashes; quote paths containing spaces. macOS ships BSD tools (`sed -i \'\'`, `date -r`, `stat -f`); install GNU versions with `brew` when a script needs them.'
        : '- Paths use forward slashes; quote paths containing spaces. GNU tools (`ls`, `grep`, `sed`, `find`, `xargs`) are available.'
  return [
    '- **Chain with `&&` (only on success), `||` (only on failure), or `;` (always).**',
    '- Environment variables: `$NAME` or `${NAME}`; set one command with `NAME=value command`, or `export NAME=value` when later commands on the same line need it.',
    paths,
    '- `rm -rf` and truncating redirections are destructive: verify the resolved absolute target path before any delete or move.',
  ]
}

/**
 * Rules for zsh.
 * @param {string} os - resolved OS.
 * @returns {string[]} markdown bullets.
 */
function zshRules(os) {
  return [
    '- **Chain with `&&` (only on success), `||` (only on failure), or `;` (always).**',
    '- Environment variables: `$NAME` or `${NAME}`; `export NAME=value` works.',
    os === 'macos'
      ? '- Paths use forward slashes; quote paths containing spaces. macOS ships BSD tools (`sed -i \'\'`, `date -r`, `stat -f`); install GNU versions with `brew` when a script needs them.'
      : '- Paths use forward slashes; quote paths containing spaces.',
    '- zsh globbing and `(command)` substitution differ from bash; do not assume bash-only `shopt` or `mapfile`.',
    '- Verify the resolved absolute target path before any delete or move.',
  ]
}

/**
 * Rules for fish.
 * @returns {string[]} markdown bullets.
 */
function fishRules() {
  return [
    '- **Chain with `;` plus `and` / `or`.** fish 3+ also accepts `&&` / `||`, but `and` / `or` work in every fish version.',
    '- Environment variables: `set -x NAME value` (there is no `export`); read them as `$NAME`.',
    '- Command substitution is `(command)`; paths use forward slashes and need quoting when they contain spaces.',
    '- `rm -rf` and truncating redirections are destructive: verify the resolved absolute target path before any delete or move.',
  ]
}

/**
 * Rules for a strict POSIX sh target.
 * @returns {string[]} markdown bullets.
 */
function shRules() {
  return [
    '- **Chain with `&&` (only on success), `||` (only on failure), or `;` (always).**',
    '- Variables: `$NAME` / `${NAME}`, `NAME=value command`, `export NAME=value`; no arrays and no `[[ ]]` — use `[ ... ]`.',
    '- Paths use forward slashes; quote paths containing spaces. Only POSIX tools are guaranteed.',
    '- `rm -rf` and truncating redirections are destructive: verify the resolved absolute target path before any delete or move.',
  ]
}

/**
 * OS-level bullets that hold for every shell on that OS.
 * @param {string} os - resolved OS.
 * @returns {string[]} markdown bullets.
 */
function osBullets(os) {
  if (os === 'windows') {
    return [
      '- File names keep their case but compare case-insensitively.',
      '- If a delete or overwrite fails with access denied, find and stop the process holding the file, then retry once.',
      '- OneDrive/Dropbox sync and Defender real-time scanning can lock files too: pause sync or move the workdir out before retrying.',
      '- Line endings: checkouts here are often CRLF while shell scripts need LF — enforce `* text=auto` and `*.sh text eol=lf` in `.gitattributes`.',
      '- Checkouts drop the executable bit: run `bash script.sh`, or restore it with `git update-index --chmod=+x`, when `./script.sh` reports permission denied.',
      '- Symlinks need Developer Mode or elevation (`New-Item -ItemType SymbolicLink`, `mklink` in cmd); without it, copy instead.',
      '- Run Python as `py -3` (fallback: `python`).',
      '- Do not create files named `CON`, `PRN`, `AUX`, `NUL`, `COM1`… and keep paths under ~260 chars.',
      '- Install tools with `winget` (`choco` or `scoop` as fallback).',
      '- Elevation needs a new elevated process — a running step cannot elevate itself.',
      '- Open files and URLs with `start "" <path>`.',
    ]
  }
  if (os === 'macos') {
    return [
      '- File names are usually case-insensitive — keep names unambiguous anyway.',
      '- Line endings are LF: when a script from a CRLF checkout fails, set `*.sh text eol=lf` in `.gitattributes` and re-check out.',
      '- Symlinks are ordinary (`ln -s target link`); keep them relative so clones elsewhere survive.',
      '- Install tools with Homebrew (`brew`).',
      '- Never run interactive `sudo` — it waits for a password and hangs the call.',
      '- A downloaded binary that “cannot be opened” carries quarantine: `xattr -d com.apple.quarantine <file>`.',
      '- Open files and URLs with `open`.',
    ]
  }
  return [
    '- File names are case-sensitive: `Readme.md` is not `README.md`.',
    '- Line endings are LF: CRLF checkouts break shebangs — enforce `*.sh text eol=lf` in `.gitattributes`.',
    '- Links are ordinary (`ln -s target link`); mark scripts executable (`chmod +x`).',
    '- Install tools with the distro manager (`apt`, `dnf`, `pacman`, `apk`…).',
    '- Never run interactive `sudo` — it waits for a password and hangs the call.',
    '- Open files and URLs with `xdg-open`.',
  ]
}

/**
 * Bullets appended when the commands run on a remote machine over SSH.
 * The text names no OS, so it composes with every context.
 * @returns {string[]} markdown bullets.
 */
function remoteBullets() {
  return [
    '- Remote session over SSH: the rules above describe the **remote** machine, not this Host — paths, installs, and file/URL openers all run there. Move files with `scp` or the editor remote session instead.',
  ]
}

/**
 * Compose the section text for one resolved environment.
 * @param {{ os: string, shell: string, tool?: string, native?: string, bashFlavor?: string, location?: string, powershellEdition?: string }} env - resolved facts.
 * @returns {string} markdown for the system prompt.
 */
export function rulesText(env) {
  const { os, shell, tool, native, bashFlavor, powershellEdition = 'auto', location = 'local' } = env
  const osLabel = OS_LABELS[os] ?? os
  const shellLabel = shellLabelFor(env)
  const lines = ['## Terminal environment', '']

  const remote = location === 'remote'
  const needsWrapper = shell !== native && native !== undefined
  if (needsWrapper) {
    lines.push(
      remote
        ? `You work on a **remote ${osLabel}** machine over SSH, and you write commands for **${shellLabel}**. The Host's \`${tool}\` tool executes **${SHELL_LABELS[native] ?? native}**, so run every command through \`${wrapperFor(shell, os)}\` with the whole command in place of \`<command>\`.`
        : `This machine runs **${osLabel}**, and you write commands for **${shellLabel}**. The Host's \`${tool}\` tool executes **${SHELL_LABELS[native] ?? native}**, so run every command through \`${wrapperFor(shell, os)}\` with the whole command in place of \`<command>\`.`,
    )
  } else {
    lines.push(
      remote
        ? `You work on a **remote ${osLabel}** machine over SSH, and shell commands execute in **${shellLabel}**${tool ? ` through the \`${tool}\` tool` : ''}. Write every command in ${shellLabel} syntax.`
        : `This machine runs **${osLabel}**, and shell commands execute in **${shellLabel}**${tool ? ` through the \`${tool}\` tool` : ''}. Write every command in ${shellLabel} syntax.`,
    )
  }
  lines.push('')

  if (shell === 'powershell') lines.push(...powershellRules(os, powershellEdition))
  else if (shell === 'cmd') lines.push(...cmdRules())
  else if (shell === 'zsh') lines.push(...zshRules(os))
  else if (shell === 'fish') lines.push(...fishRules())
  else if (shell === 'sh') lines.push(...shRules())
  else lines.push(...bashRules(os, bashFlavor))

  lines.push(...osBullets(os))

  if (remote) lines.push(...remoteBullets())

  lines.push(envVariablesBullet(shell))
  lines.push(
    shell === 'powershell' || shell === 'cmd'
      ? '- Discard output to `NUL`.'
      : '- Discard output to `/dev/null`.',
  )
  lines.push(topicsPointer(env))
  lines.push('- If a command fails with a syntax error, rewrite it in the syntax above; do not switch dialects mid-session.')
  return lines.join('\n')
}

/**
 * Place the rules directly after the first-party shell tool guidance, so they
 * read as part of "how to run terminal commands" rather than a separate policy.
 * @param {object} systemPrompt - prompt registry service.
 * @returns {number} numeric section order.
 */
export function rulesOrder(systemPrompt) {
  const shellOrder = systemPrompt?.getSectionOrder?.('TOOL_PWSH')
  return Number.isFinite(shellOrder) ? shellOrder + 4 : FALLBACK_ORDER
}
