# Exit codes per shell

How to tell whether the previous command failed. Check on the very next
line: any later command overwrites the code.

## PowerShell (`pwsh`, `powershell`)

- `$?` is only true/false — never compare it to a number.
- Native executables report their code in `$LASTEXITCODE`:
  `prog.exe; if ($LASTEXITCODE -ne 0) { ... }`.
- Cmdlets and language statements set `$?`; most do not touch
  `$LASTEXITCODE`. After a cmdlet, test `$?`.

## cmd

- The code is `%ERRORLEVEL%`: `prog.exe & if errorlevel 1 ...`.
- `if errorlevel N` means “N or greater”; for an exact match use
  `if %ERRORLEVEL%==3 ...` on the next line.

## bash / zsh / sh

- The code is `$?`: `prog || echo "failed: $?"`.
- In multi-line calls, save it first: `prog; code=$?; ...`.
- `set -e` aborts on failure, `set -o pipefail` extends that to pipelines
  (bash/zsh only, not POSIX `sh`).

## fish

- The code is `$status`: `prog; or echo "failed: $status"`.
