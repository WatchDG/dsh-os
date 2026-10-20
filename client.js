window.__ModuleLoader__.load({
  id: 'dsh-os',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Dictionary namespace owned by this plugin. */
    const NS = 'settings.os-shell'
    /** Host Loader row id; the settings namespace is the row's patch id. */
    const HOST_ENTRY = 'os-shell'
    /** Tolerate a Loader that namespaces the inserted row. */
    const NAMESPACES = [HOST_ENTRY, `include:${HOST_ENTRY}`, 'dsh-os']

    /** English copy. */
    const en = {
      nav: 'Terminal',
      title: 'Terminal environment',
      intro:
        'Every agent gets a short rules section describing the operating system and the shell its commands run in. Changes apply from the next model step.',
      osLabel: 'Operating system',
      shellLabel: 'Shell',
      bashFlavorLabel: 'Bash flavor (Windows)',
      locationLabel: 'Connection',
      editionLabel: 'PowerShell edition',
      osHint: 'Auto follows the machine this Host runs on.',
      shellHint: 'Auto follows the shell tool the agent actually has: PowerShell when pwsh is composed, bash otherwise. Picking another shell makes the rules add an explicit invocation wrapper for it.',
      bashFlavorHint: 'Only matters for bash on Windows: Git Bash mounts drives as /c/..., WSL as /mnt/c/.... Auto follows WSL markers, otherwise Git Bash.',
      locationHint: 'Remote means commands run on another machine over SSH: the rules then describe the remote side, not this Host.',
      editionHint: 'Auto stays safe on 5.1 (no && / ||). Pick 7 only when the target is known to run PowerShell 7+.',
      detected: 'Detected on this Host: {os} · {shell}.',
      detectedFlavor: 'Detected bash flavor: {flavor}.',
      viaTool: 'The shell comes from the {tool} tool the agent uses.',
      toolsLine: 'Agent shell tools: {tools}.',
      shellEnvLine: 'Host $SHELL: {value}.',
      comSpecLine: 'Host ComSpec: {value}.',
      wrapperLine: 'Wrapper for the selected shell: {wrapper}.',
      remoteBadge: 'Remote session over SSH — the rules describe the remote machine, not this Host.',
      target: 'Your selection overrides the rules: {os} · {shell}.',
      targetFlavor: 'Bash flavor in rules: {flavor}.',
      targetLocation: 'Connection in rules: {location}.',
      targetEdition: 'PowerShell edition in rules: {edition}.',
      previewTitle: 'Effective rules (what the agent sees)',
      copy: 'Copy',
      copied: 'Copied.',
      exampleLabel: 'Try:',
      detectionFailed: 'Detection is unavailable right now.',
      applying: 'Applying…',
      applied: 'Applied. New steps use the updated rules.',
      failed: 'The Host did not accept this value; the selection was left unchanged.',
      loading: 'Loading configuration…',
      unavailable: 'This plugin’s configuration is not served by the Host.',
      readonly: 'This profile stores settings read-only.',
      note: 'The rules live in the system prompt. A step that is already running keeps the prompt it started with.',
      'option.auto': 'Auto (detect)',
      'option.windows': 'Windows',
      'option.macos': 'macOS',
      'option.linux': 'Linux',
      'option.powershell': 'PowerShell',
      'option.cmd': 'cmd',
      'option.bash': 'bash',
      'option.zsh': 'zsh',
      'option.fish': 'fish',
      'option.sh': 'sh',
      'option.git-bash': 'Git Bash',
      'option.wsl': 'WSL',
      'option.native': 'Native',
      'option.local': 'Local',
      'option.remote': 'Remote (SSH)',
      'option.5.1': '5.1',
      'option.7': '7',
    }

    /** Russian copy. */
    const ru = {
      nav: 'Терминал',
      title: 'Окружение терминала',
      intro:
        'Каждый агент получает короткий блок правил про операционную систему и оболочку, в которой выполняются его команды. Изменения действуют со следующего шага модели.',
      osLabel: 'Операционная система',
      shellLabel: 'Оболочка',
      bashFlavorLabel: 'Разновидность bash (Windows)',
      locationLabel: 'Подключение',
      editionLabel: 'Версия PowerShell',
      osHint: '«Авто» — система, на которой запущен этот хост.',
      shellHint: '«Авто» — оболочка того инструмента, который реально есть у агента: PowerShell, если подключён pwsh, иначе bash. Если выбрать другую оболочку, правила добавят явную обёртку для её вызова.',
      bashFlavorHint: 'Важно только для bash на Windows: Git Bash монтирует диски как /c/..., WSL — как /mnt/c/.... «Авто» смотрит на WSL-маркеры, иначе считает Git Bash.',
      locationHint: '«Удалённое» — команды выполняются на другой машине по SSH: правила тогда описывают удалённую сторону, а не этот хост.',
      editionHint: '«Авто» безопасно для 5.1 (без && / ||). Выбирайте 7, только если точно знаете, что цель — PowerShell 7+.',
      detected: 'Определено на этом хосте: {os} · {shell}.',
      detectedFlavor: 'Определённая разновидность bash: {flavor}.',
      viaTool: 'Оболочка взята из инструмента агента: {tool}.',
      toolsLine: 'Shell-инструменты агента: {tools}.',
      shellEnvLine: '$SHELL хоста: {value}.',
      comSpecLine: 'ComSpec хоста: {value}.',
      wrapperLine: 'Обёртка для выбранной оболочки: {wrapper}.',
      remoteBadge: 'Удалённая сессия по SSH — правила описывают удалённую машину, а не этот хост.',
      target: 'Правила используют ваш выбор: {os} · {shell}.',
      targetFlavor: 'Разновидность bash в правилах: {flavor}.',
      targetLocation: 'Подключение в правилах: {location}.',
      targetEdition: 'Версия PowerShell в правилах: {edition}.',
      previewTitle: 'Итоговые правила (что увидит агент)',
      copy: 'Скопировать',
      copied: 'Скопировано.',
      exampleLabel: 'Попробовать:',
      detectionFailed: 'Не удалось получить определение.',
      applying: 'Применяю…',
      applied: 'Применено. Новые шаги используют обновлённые правила.',
      failed: 'Хост не принял значение; выбор остался прежним.',
      loading: 'Загружаю конфигурацию…',
      unavailable: 'Хост не отдаёт конфигурацию этого плагина.',
      readonly: 'В этом профиле настройки доступны только для чтения.',
      note: 'Правила входят в системный промпт. Уже запущенный шаг сохраняет промпт, с которым начался.',
      'option.auto': 'Авто (определить)',
      'option.windows': 'Windows',
      'option.macos': 'macOS',
      'option.linux': 'Linux',
      'option.powershell': 'PowerShell',
      'option.cmd': 'cmd',
      'option.bash': 'bash',
      'option.zsh': 'zsh',
      'option.fish': 'fish',
      'option.sh': 'sh',
      'option.git-bash': 'Git Bash',
      'option.wsl': 'WSL',
      'option.native': 'Нативный',
      'option.local': 'Локальное',
      'option.remote': 'Удалённое (SSH)',
      'option.5.1': '5.1',
      'option.7': '7',
    }

    const OS_OPTIONS = ['auto', 'windows', 'macos', 'linux']
    const SHELL_OPTIONS = ['auto', 'powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']
    const BASH_FLAVOR_OPTIONS = ['auto', 'git-bash', 'wsl', 'native']
    const LOCATION_OPTIONS = ['local', 'remote']
    const EDITION_OPTIONS = ['auto', '5.1', '7']

    /** Page-local styles; tokens only, so light/dark follows the host theme. */
    const CSS = `
.ossh-section{display:flex;flex-direction:column;gap:20px;width:100%;max-width:640px;padding:4px 0 24px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}
.ossh-title{margin:0;font-size:16px;font-weight:600}
.ossh-intro{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:19px}
.ossh-detected{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.ossh-badge{display:inline-block;padding:1px 8px;border-radius:999px;background:var(--dsw-alias-brand-primary);color:#fff;font-size:11px;line-height:18px}
.ossh-row{display:flex;flex-direction:column;gap:6px}
.ossh-label{font-size:13px;font-weight:500}
.ossh-select{height:32px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.ossh-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.ossh-select:disabled{color:var(--dsw-alias-label-secondary);cursor:not-allowed}
.ossh-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.ossh-status{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.ossh-error{color:var(--dsw-alias-state-error-primary)}
.ossh-preview{display:flex;flex-direction:column;gap:8px}
.ossh-preview-head{display:flex;align-items:center;gap:12px}
.ossh-preview-title{font-size:13px;font-weight:500}
.ossh-copy{height:28px;padding:0 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;cursor:pointer}
.ossh-pre{max-height:320px;overflow:auto;margin:0;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:18px;white-space:pre-wrap}
.ossh-example{font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:18px}
.ossh-note{margin:4px 0 0;padding-top:12px;border-top:.5px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
`

    /**
     * One labeled select row.
     * @param {object} props - row identity, copy, and the selected value.
     * @returns {object} React element.
     */
    function SelectRow(props) {
      const { id, label, hint, value, options, disabled, t, onChange } = props
      return h(
        'div',
        { className: 'ossh-row' },
        h('label', { className: 'ossh-label', htmlFor: id }, label),
        h(
          'select',
          {
            id,
            className: 'ossh-select',
            value,
            disabled,
            'aria-describedby': `${id}-hint`,
            onChange: (event) => onChange(event.target.value),
          },
          options.map((option) =>
            h('option', { key: option, value: option }, t(`option.${option}`)),
          ),
        ),
        h('div', { className: 'ossh-hint', id: `${id}-hint` }, hint),
      )
    }

    /**
     * Copy text with a textarea fallback for clipboard-less contexts.
     * @param {string} text - text to copy.
     * @param {Function} done - called once the text is on the clipboard.
     */
    function copyText(text, done) {
      const finish = () => {
        if (typeof done === 'function') done()
      }
      try {
        if (navigator !== undefined && navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text).then(finish).catch(() => fallbackCopy(text, finish))
          return
        }
      } catch {
        // Fall through to the textarea path below.
      }
      fallbackCopy(text, finish)
    }

    /**
     * Legacy copy path: a temporary textarea plus `execCommand`.
     * @param {string} text - text to copy.
     * @param {Function} done - called afterwards, whatever the outcome.
     */
    function fallbackCopy(text, done) {
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'absolute'
        area.style.left = '-9999px'
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        document.body.removeChild(area)
      } catch {
        // Copy is best-effort; the preview stays selectable by hand.
      }
      if (typeof done === 'function') done()
    }

    /**
     * The Settings → Terminal section.
     * @param {object} props - slot props: locale, form snapshot hook, writer.
     * @returns {object} React element.
     */
    function Section(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key
      const useEnv = typeof props.useEnv === 'function' ? props.useEnv : () => ({ status: 'unavailable' })
      const state = useEnv((snapshot) => snapshot) ?? { status: 'unavailable' }
      const [pending, setPending] = React.useState('')
      const [failed, setFailed] = React.useState(false)
      const [saved, setSaved] = React.useState(false)
      const [copied, setCopied] = React.useState(false)
      const [status, setStatus] = React.useState(null)
      const [detectionFailed, setDetectionFailed] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        if (typeof props.fetchStatus === 'function') {
          props
            .fetchStatus()
            .then((value) => {
              if (!alive) return
              if (value !== null && typeof value === 'object' && value.detected) {
                setStatus(value)
                setDetectionFailed(false)
              } else setDetectionFailed(true)
            })
            .catch(() => {
              if (alive) setDetectionFailed(true)
            })
        }
        return () => {
          alive = false
        }
      }, [])

      if (state.status === 'loading') {
        return h('div', { className: 'ossh-section' }, h('div', { className: 'ossh-status' }, t('loading')))
      }
      if (state.status === 'unavailable' || state.value === null || typeof state.value !== 'object') {
        return h(
          'div',
          { className: 'ossh-section' },
          h('h2', { className: 'ossh-title' }, t('title')),
          h('div', { className: 'ossh-status' }, t('unavailable')),
        )
      }

      const writable = state.writable === true && typeof props.setField === 'function'
      const value = state.value
      const shell = value.shell ?? 'auto'
      const isBash = shell === 'bash' || (shell === 'auto' && status !== null && status.detected !== undefined && status.detected.shell === 'bash' && status.target !== undefined && status.target.shell === 'bash')
      const isPowershell = shell === 'powershell' || (shell === 'auto' && status !== null && status.target !== undefined && status.target.shell === 'powershell')

      const refreshStatus = () => {
        if (typeof props.fetchStatus !== 'function') return
        props
          .fetchStatus()
          .then((value) => {
            if (value !== null && typeof value === 'object' && value.detected) {
              setStatus(value)
              setDetectionFailed(false)
            }
          })
          .catch(() => {})
      }

      const write = (field, next) => {
        if (typeof props.setField !== 'function') return
        setFailed(false)
        setSaved(false)
        setPending(field)
        props
          .setField(field, next)
          .then((accepted) => {
            if (accepted) {
              setSaved(true)
              refreshStatus()
            } else setFailed(true)
          })
          .catch(() => setFailed(true))
          .finally(() => setPending(''))
      }

      const toolsLabel = () => {
        if (status === null || status.tools === undefined) return null
        const names = []
        if (status.tools.pwsh) names.push('pwsh')
        if (status.tools.bash) names.push('bash')
        return names.length > 0 ? names.join(' + ') : '—'
      }

      return h(
        'div',
        { className: 'ossh-section' },
        h('style', { key: 'styles' }, CSS),
        h('h2', { className: 'ossh-title' }, t('title')),
        h('p', { className: 'ossh-intro' }, t('intro')),
        h(
          'div',
          { className: 'ossh-detected' },
          status === null
            ? null
            : [
                h(
                  'div',
                  { key: 'detected' },
                  t('detected', {
                    os: t(`option.${status.detected.os}`),
                    shell: t(`option.${status.detected.shell}`),
                  }),
                ),
                status.detected.shell === 'bash'
                  ? h('div', { key: 'flavor' }, t('detectedFlavor', { flavor: t(`option.${status.detected.bashFlavor}`) }))
                  : null,
                status.tool
                  ? h('div', { key: 'tool' }, t('viaTool', { tool: status.tool }))
                  : null,
                toolsLabel() !== null
                  ? h('div', { key: 'tools' }, t('toolsLine', { tools: toolsLabel() }))
                  : null,
                status.detected.os !== 'windows' && status.shellEnv
                  ? h('div', { key: 'shellenv' }, t('shellEnvLine', { value: status.shellEnv }))
                  : null,
                status.detected.os === 'windows' && status.comSpec
                  ? h('div', { key: 'comspec' }, t('comSpecLine', { value: status.comSpec }))
                  : null,
                status.wrapper
                  ? h('div', { key: 'wrapper' }, t('wrapperLine', { wrapper: status.wrapper }))
                  : null,
                status.target.os !== status.detected.os || status.target.shell !== status.detected.shell
                  ? h(
                      'div',
                      { key: 'target' },
                      t('target', {
                        os: t(`option.${status.target.os}`),
                        shell: t(`option.${status.target.shell}`),
                      }),
                    )
                  : null,
                status.target.shell === 'bash' && status.target.bashFlavor !== status.detected.bashFlavor
                  ? h('div', { key: 'target-flavor' }, t('targetFlavor', { flavor: t(`option.${status.target.bashFlavor}`) }))
                  : null,
                status.target.location === 'remote'
                  ? h('div', { key: 'target-location' }, t('targetLocation', { location: t('option.remote') }))
                  : null,
                status.target.shell === 'powershell' && status.target.powershellEdition !== 'auto'
                  ? h('div', { key: 'target-edition' }, t('targetEdition', { edition: t(`option.${status.target.powershellEdition}`) }))
                  : null,
                status.target.location === 'remote'
                  ? h('div', { key: 'remote' }, h('span', { className: 'ossh-badge' }, t('remoteBadge')))
                  : null,
              ],
          detectionFailed ? h('div', { className: 'ossh-status' }, t('detectionFailed')) : null,
        ),
        h(SelectRow, {
          key: 'os',
          id: 'os-shell-os',
          label: t('osLabel'),
          hint: t('osHint'),
          value: value.os ?? 'auto',
          options: OS_OPTIONS,
          disabled: !writable || pending !== '',
          t,
          onChange: (next) => write('os', next),
        }),
        h(SelectRow, {
          key: 'shell',
          id: 'os-shell-shell',
          label: t('shellLabel'),
          hint: t('shellHint'),
          value: shell,
          options: SHELL_OPTIONS,
          disabled: !writable || pending !== '',
          t,
          onChange: (next) => write('shell', next),
        }),
        h(SelectRow, {
          key: 'bashFlavor',
          id: 'os-shell-bash-flavor',
          label: t('bashFlavorLabel'),
          hint: t('bashFlavorHint'),
          value: value.bashFlavor ?? 'auto',
          options: BASH_FLAVOR_OPTIONS,
          disabled: !writable || pending !== '' || !isBash,
          t,
          onChange: (next) => write('bashFlavor', next),
        }),
        h(SelectRow, {
          key: 'location',
          id: 'os-shell-location',
          label: t('locationLabel'),
          hint: t('locationHint'),
          value: value.location ?? 'local',
          options: LOCATION_OPTIONS,
          disabled: !writable || pending !== '',
          t,
          onChange: (next) => write('location', next),
        }),
        h(SelectRow, {
          key: 'powershellEdition',
          id: 'os-shell-powershell-edition',
          label: t('editionLabel'),
          hint: t('editionHint'),
          value: value.powershellEdition ?? 'auto',
          options: EDITION_OPTIONS,
          disabled: !writable || pending !== '' || !isPowershell,
          t,
          onChange: (next) => write('powershellEdition', next),
        }),
        failed
          ? h('div', { className: 'ossh-error ossh-status', role: 'alert' }, t('failed'))
          : pending !== ''
            ? h('div', { className: 'ossh-status', role: 'status' }, t('applying'))
            : saved
              ? h('div', { className: 'ossh-status', role: 'status' }, t('applied'))
              : !writable
                ? h('div', { className: 'ossh-status' }, t('readonly'))
                : null,
        status !== null && typeof status.preview === 'string'
          ? h(
              'div',
              { className: 'ossh-preview' },
              h(
                'div',
                { className: 'ossh-preview-head' },
                h('div', { className: 'ossh-preview-title' }, t('previewTitle')),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ossh-copy',
                    onClick: () => {
                      setCopied(false)
                      copyText(status.preview, () => setCopied(true))
                    },
                  },
                  t('copy'),
                ),
                copied ? h('div', { className: 'ossh-status', role: 'status' }, t('copied')) : null,
              ),
              h('pre', { className: 'ossh-pre' }, status.preview),
              status.example ? h('div', { className: 'ossh-example' }, `${t('exampleLabel')} ${status.example}`) : null,
            )
          : null,
        h('p', { className: 'ossh-note' }, t('note')),
      )
    }

    /** Required services. `configForms` is provided by the Settings plugin. */
    const inject = ['slots', 'locale', 'configForms']

    /**
     * Register the dictionaries and the section while the Host serves its
     * configuration namespace.
     * @param {object} ctx - browser plugin context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, ru }), 'os-shell: dictionaries')
      const t = ctx.locale.bind(NS)

      ctx.effect(
        () =>
          ctx.configForms.whileServed(NAMESPACES, (served) => {
            const namespace = NAMESPACES.find((candidate) => served.has(candidate))
            if (namespace === undefined) return () => {}
            const form = ctx.configForms.get(namespace)
            return ctx.slots.inject('settings.section', () =>
              ctx.slots.register(
                {
                  name: 'settings.section',
                  id: 'os-shell',
                  order: 17,
                  label: () => t('nav'),
                  locale: NS,
                  inject: () => ({
                    hooks: { env: form },
                    setField: (field, next) => form.set(field, next),
                    fetchStatus: async () => {
                      const response = await fetch('/os-shell/status', {
                        method: 'GET',
                        headers: { accept: 'application/json' },
                        cache: 'no-store',
                      })
                      if (!response.ok) throw new Error(`os-shell: status HTTP ${response.status}`)
                      return response.json()
                    },
                  }),
                },
                Section,
              ),
            )
          }),
        'os-shell: settings page',
      )
    }

    return { inject, apply }
  },
})
