# bash notes

Read this when the rules name bash as the shell.

## Exit codes

- The code is `$?`; save it first when later lines need it: `prog; code=$?`.
- `set -e` aborts on failure, `set -o pipefail` extends that to pipelines
  (bash-only, not POSIX `sh`).

## Background

- `prog &` backgrounds, `wait` reaps, `nohup prog &` survives hangup.
- `kill PID` (TERM), `kill -9 PID` (KILL), `pkill -f pattern` by pattern.
- `jobs` lists only the current shell’s jobs — useless across tool calls,
  because each call is a new shell. Persist PIDs in a file under the
  session workspace when a later step must stop the process.

## Scripts and files

- Start scripts with `#!/usr/bin/env bash` and `chmod +x`.
- Quote globs passed to external tools (`grep -rn "p*" .`) so bash does
  not expand them first.
- Discard output to `/dev/null`.

## Paths

- Forward slashes; native programs keep `.exe` where they exist.
- Git Bash: `/c/Users/you/app`. WSL: `/mnt/c/...`. In unquoted words `\\`
  is an escape character — write Windows paths with forward slashes.
