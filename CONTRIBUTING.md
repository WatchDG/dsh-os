# Contributing

Thanks for considering a contribution to `dsh-os`.

## Before you start

- Read the [README](README.md) to understand the bundle and its requirements.
- The plugin targets [DeepSeek Harness](https://www.deepseek.com/en/harness/)
  0.2.x and relies on `systemPrompt` plus the `settings` / `webServer` scopes.
- The plugin starts no processes and has no external prerequisites.

## Development

The package has one runtime dependency and no build step.

```bash
npm test                 # unit tests + manifest checks
npm run test:unit        # the same suites, explicit list
npm run pack:check       # inspect the files npm would publish
```

Requirements: Node.js 20 or newer.

Run the tests before opening a pull request. CI runs them on Linux and Windows
with Node.js 20, 22, and 24.

## Bundle checklist

This repository is a DSH plugin bundle, so keep these invariants:

- `package.json` declares `dsh.bundle.patch` and the patch inserts exactly one
  `os-shell` row pointing at the package name.
- Runtime modules live in `lib/` and are covered by the `files` array
  (`lib/*.js`). The manifest test fails when a module is missing from it.
- `locale/en.json` and `locale/ru.json` keep meaningful `meta.title` and
  `meta.description`; the icon stays a valid SVG below 256 KiB.
- The plugin remains single-dependency. Process I/O is out of scope: the
  plugin only reads `process.platform`, `process.env`, and the tool registry.
- Configuration stays backward compatible: unknown fields are ignored and all
  fields remain optional.
- Documentation links to both https://www.deepseek.com/en/harness/ and
  https://github.com/WatchDG/dsh-os.

## Code style

- ES modules, 2-space indentation, no semicolons, single quotes.
- Pure logic goes in `lib/config.js`, `lib/env.js`, or `lib/rules.js` so it
  can be tested without a Harness.
- Context wiring stays in `lib/plugin.js`.
- Add or update tests with every behavior change.

## Reporting issues

Open an issue at https://github.com/WatchDG/dsh-os/issues with the DSH version,
the operating system, the selected `os`/`shell`, and the relevant prompt
section or status payload.

## License

By contributing, you agree that your contributions are licensed under the
Apache License 2.0, as described in [LICENSE](LICENSE).
