# Background work and killing processes

Every tool call is a fresh, non-interactive process: prefer commands that
finish over daemons you must babysit.

## PowerShell

- Foreground wait: `Start-Process prog -Wait -NoNewWindow`.
- Detached start: `Start-Process prog` (returns immediately; capture with
  `-PassThru` to get `.Id` for a later `Stop-Process -Id`).
- List/kill: `Get-Process name`, `Stop-Process -Name n -Force`.
- No POSIX signals: there is no `SIGTERM`/`SIGHUP` semantics; `-Force`
  is the equivalent of `kill -9`.

## cmd

- `start "" prog` detaches; `start /wait prog` blocks.
- List/kill: `tasklist`, `taskkill /PID n /F`, `taskkill /IM prog.exe /F`.

## bash / zsh / sh

- `prog &` backgrounds; `wait` reaps; `nohup prog &` survives hangup.
- `kill PID` (TERM), `kill -9 PID` (KILL). `pkill -f pattern` by pattern.
- `jobs` lists only the current shell’s jobs — useless across tool calls,
  because each call is a new shell. Persist PIDs in a file under the
  session workspace when a later step must stop the process.

## fish

- Same `prog &` model; exit status lands in `$status`.
- `kill`, `pkill`, and PID files behave as in bash.
