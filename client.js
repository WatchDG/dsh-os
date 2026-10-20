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
      osHint: 'Auto follows the machine this Host runs on.',
      shellHint: 'Auto follows the shell tool the agent actually has: PowerShell when pwsh is composed, bash otherwise. Picking another shell makes the rules add an explicit invocation wrapper for it.',
      detected: 'Detected on this Host: {os} · {shell}.',
      viaTool: 'The shell comes from the {tool} tool the agent uses.',
      target: 'Your selection overrides the rules: {os} · {shell}.',
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
    }

    /** Russian copy. */
    const ru = {
      nav: 'Терминал',
      title: 'Окружение терминала',
      intro:
        'Каждый агент получает короткий блок правил про операционную систему и оболочку, в которой выполняются его команды. Изменения действуют со следующего шага модели.',
      osLabel: 'Операционная система',
      shellLabel: 'Оболочка',
      osHint: '«Авто» — система, на которой запущен этот хост.',
      shellHint: '«Авто» — оболочка того инструмента, который реально есть у агента: PowerShell, если подключён pwsh, иначе bash. Если выбрать другую оболочку, правила добавят явную обёртку для её вызова.',
      detected: 'Определено на этом хосте: {os} · {shell}.',
      viaTool: 'Оболочка взята из инструмента агента: {tool}.',
      target: 'Правила используют ваш выбор: {os} · {shell}.',
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
    }

    const OS_OPTIONS = ['auto', 'windows', 'macos', 'linux']
    const SHELL_OPTIONS = ['auto', 'powershell', 'cmd', 'bash', 'zsh', 'fish', 'sh']

    /** Page-local styles; tokens only, so light/dark follows the host theme. */
    const CSS = `
.ossh-section{display:flex;flex-direction:column;gap:20px;width:100%;max-width:640px;padding:4px 0 24px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}
.ossh-title{margin:0;font-size:16px;font-weight:600}
.ossh-intro{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:19px}
.ossh-detected{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.ossh-row{display:flex;flex-direction:column;gap:6px}
.ossh-label{font-size:13px;font-weight:500}
.ossh-select{height:32px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.ossh-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.ossh-select:disabled{color:var(--dsw-alias-label-secondary);cursor:not-allowed}
.ossh-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.ossh-status{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.ossh-error{color:var(--dsw-alias-state-error-primary)}
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
      const disabled = !writable || pending !== ''
      const value = state.value

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
                status.tool
                  ? h('div', { key: 'tool' }, t('viaTool', { tool: status.tool }))
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
          disabled,
          t,
          onChange: (next) => write('os', next),
        }),
        h(SelectRow, {
          key: 'shell',
          id: 'os-shell-shell',
          label: t('shellLabel'),
          hint: t('shellHint'),
          value: value.shell ?? 'auto',
          options: SHELL_OPTIONS,
          disabled,
          t,
          onChange: (next) => write('shell', next),
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
