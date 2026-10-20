/**
 * dsh-os — the system-prompt rules section.
 *
 * The text is composed from one resolved environment (see `lib/env.js`), so
 * the model always gets exactly the syntax of the selected OS/shell pair —
 * plus an explicit invocation wrapper when the selected shell differs from
 * the tool's own dialect.
 */

/** Fallback placement when the shell tools' sections are unknown. */
export const FALLBACK_ORDER = 1014

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
 * @returns {string[]} markdown bullets.
 */
function powershellRules(os) {
  return [
    '- **Chain with `;`, never `&&` or `||`.** Windows PowerShell 5.1 reports `The token \'&&\' is not a valid statement separator`; `;` works in every PowerShell version. Run the next command only on success with `cmd1; if ($?) { cmd2 }`.',
    '- Environment variables: read `$env:NAME`, set `$env:NAME = \'value\'`. `$NAME`, `export NAME=value`, and `NAME=value command` are not PowerShell.',
    os === 'windows'
      ? '- Paths are native Windows (`C:\\work\\app`); quote paths containing spaces. Use `where.exe` rather than `which`, and `curl.exe` or `Invoke-RestMethod` rather than the `curl` alias.'
      : '- Paths are POSIX (`/home/you/app`); quote paths containing spaces. PowerShell on this OS still reads environment variables with `$env:NAME`.',
    '- Prefer cmdlets to POSIX names: `Get-ChildItem`, `Get-Content`, `Set-Content`, `Select-String`, `Copy-Item`, `Move-Item`, `Remove-Item -Recurse -Force`, `New-Item`, `Test-Path`.',
    '- Single quotes keep text literal; double quotes interpolate `$variables`. Pipes, `>`, `>>`, and `2>&1` work as expected.',
    ...(os === 'windows'
      ? ['- `cmd /c "<command>"` reaches a cmd-only command when no cmdlet equivalent exists.']
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
    '- Verify the resolved absolute target path before any delete or move.',
  ]
}

/**
 * Rules for bash, including Git Bash and WSL on Windows.
 * @param {string} os - resolved OS.
 * @returns {string[]} markdown bullets.
 */
function bashRules(os) {
  const paths = os === 'macos'
    ? '- Paths use forward slashes; quote paths containing spaces. macOS ships BSD tools (`sed -i \'\'`, `date -r`, `stat -f`); install GNU versions with `brew` when a script needs them.'
    : os === 'windows'
      ? '- Git Bash paths look like `/c/Users/you/app`, WSL paths like `/mnt/c/...`. In unquoted bash words `\\` is an escape character, so write Windows paths with forward slashes; native programs keep `.exe` (`where.exe`).'
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
 * Compose the section text for one resolved environment.
 * @param {{ os: string, shell: string, tool?: string, native?: string }} env - resolved facts.
 * @returns {string} markdown for the system prompt.
 */
export function rulesText(env) {
  const { os, shell, tool, native } = env
  const osLabel = OS_LABELS[os] ?? os
  const shellLabel = SHELL_LABELS[shell] ?? shell
  const lines = ['## Terminal environment', '']

  const needsWrapper = shell !== native && native !== undefined
  if (needsWrapper) {
    lines.push(
      `This machine runs **${osLabel}**, and you write commands for **${shellLabel}**. The Host's \`${tool}\` tool executes **${SHELL_LABELS[native] ?? native}**, so run every command through \`${wrapperFor(shell, os)}\` with the whole command in place of \`<command>\`.`,
    )
  } else {
    lines.push(
      `This machine runs **${osLabel}**, and shell commands execute in **${shellLabel}**${tool ? ` through the \`${tool}\` tool` : ''}. Write every command in ${shellLabel} syntax.`,
    )
  }
  lines.push('')

  if (shell === 'powershell') lines.push(...powershellRules(os))
  else if (shell === 'cmd') lines.push(...cmdRules())
  else if (shell === 'zsh') lines.push(...zshRules(os))
  else if (shell === 'fish') lines.push(...fishRules())
  else if (shell === 'sh') lines.push(...shRules())
  else lines.push(...bashRules(os))

  lines.push(envVariablesBullet(shell))
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
