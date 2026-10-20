# Anti-patterns table

Read this table before writing a command from memory: it maps the POSIX
habit agents reach for first to what each supported shell actually accepts.

| Habit (POSIX) | PowerShell | cmd | fish | sh |
|---|---|---|---|---|
| Chain on success: `a && b` | `a; if ($?) { b }` (`&&` is a syntax error on 5.1) | `a && b` works | `a; and b` | `a && b` works |
| Chain always: `a; b` | `a; b` works | `a & b` (a bare `;` does not exist) | `a; b` works | `a; b` works |
| Variable: `$NAME` | `$env:NAME` | `%NAME%` | `$NAME` works | `$NAME` works |
| Set for one command: `N=v cmd` | `$env:N = 'v'; cmd` | `set N=v & cmd` (same line only) | `N=v cmd` works | `N=v cmd` works |
| Export: `export N=v` | `$env:N = 'v'` | `set N=v` (same line only) | `set -x N v` | `export N=v` works |
| Home: `~` / `$HOME` | `$HOME` (`~` does not expand mid-string on 5.1) | `%USERPROFILE%` | `~` / `$HOME` work | `~` / `$HOME` work |
| Null device: `/dev/null` | `NUL` | `NUL` | `/dev/null` works | `/dev/null` works |
| Which binary: `which n` | `Get-Command n` / `where.exe n` | `where n` | `command -v n` | `command -v n` |
| Kill: `kill -9 PID` | `Stop-Process -Id PID -Force` | `taskkill /F /PID PID` | `kill -9 PID` works | `kill -9 PID` works |
| Symlink: `ln -s t l` | `New-Item -ItemType SymbolicLink` (needs Developer Mode/elevation) | `mklink` (elevation) | `ln -s t l` works | `ln -s t l` works |
| Here-doc / arrays / `[[ ]]` | Not PowerShell — use cmdlets and `@()` | Not cmd — keep lines flat | Arrays differ from bash; no `[[ ]]` in POSIX mode | No arrays, no `[[ ]]` — use `[ ... ]` |

Rules of thumb:

- When the core rules forbid something (`&&` in 5.1, `export` in fish),
  the table is not permission to use it anyway — the rules win.
- Prefer the native column over transliterating POSIX: `Get-ChildItem`,
  not `ls`-via-alias, on PowerShell.
- Each tool call is a fresh process: `cd`, `export`/`set`, and `pushd`
  never survive to the next call in any shell.
