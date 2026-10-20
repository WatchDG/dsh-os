# cmd notes

Read this when the rules name cmd as the shell.

## Exit codes

- The code is `%ERRORLEVEL%`; check it on the next line.
- `if errorlevel N` means “N or greater”; for an exact match use
  `if %ERRORLEVEL%==3 ...`.

## Session

- Every drive keeps its own current directory: switch drives with `cd /d`.
- `set NAME=value` affects only the same command line — a later call
  starts clean, so pass `workdir` instead of relying on `cd`.
- `echo` with no arguments prints the echo state (`on`/`off`); `echo.`
  prints an empty line.

## Built-ins

- `dir where type copy move del mkdir rmdir /s /q findstr`.
  PowerShell cmdlets and `$env:` do not exist here.

## Processes and text

- Detach: `start "" prog`; block: `start /wait prog`.
- List and kill: `tasklist`, `taskkill /PID n /F`, `taskkill /IM prog.exe /F`.
- Discard output to `NUL`. Console code page: `chcp 65001`.

## Open

- Open files and URLs with `start "" <path>`.
