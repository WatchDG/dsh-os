# PowerShell notes

Read this when the rules name PowerShell as the shell.

## Exit codes

- `$?` is only true/false — never compare it to a number.
- Native executables report in `$LASTEXITCODE`: check
  `if ($LASTEXITCODE -ne 0) { ... }` on the next line, before any later
  command overwrites it. Cmdlets set `$?`; most leave `$LASTEXITCODE` alone.

## Versions

- Windows PowerShell 5.1: OEM code page (often cp866/cp1251), `>` writes
  UTF-16, `curl`/`wget` are aliases, and `&&`/`||` are syntax errors.
  Write syntax that works on 5.1.
- PowerShell 7+: UTF-8 everywhere, `>` writes UTF-8 without BOM.
- When text turns into mojibake: `chcp 65001`, then
  `[Console]::InputEncoding = [Console]::OutputEncoding = [utf8]`, and
  `Out-File -Encoding utf8` for files.

## Scripts

- Run saved scripts as `powershell -ExecutionPolicy Bypass -File script.ps1`.
- Use full cmdlet names in saved scripts (`Get-ChildItem`, not `ls`):
  aliases may not exist on the next machine.
- Single quotes are literal, double quotes interpolate `$variables`.
  The home directory is `$HOME` (`~` does not expand mid-string on 5.1).

## Processes

- Wait: `Start-Process prog -Wait -NoNewWindow`. Detach with `-PassThru`
  to keep `.Id` for a later `Stop-Process -Id`.
- List and kill: `Get-Process name`, `Stop-Process -Name n -Force`.
  There are no POSIX signals; `-Force` is the `kill -9` equivalent.

## Misc

- Discard output to `NUL`. Facts arrive as `$env:DSH_*`; every call is a
  fresh process, so pass `workdir` instead of relying on `cd`.
