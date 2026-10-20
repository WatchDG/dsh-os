# zsh notes

Read this when the rules name zsh as the shell.

## Exit codes and background

- The code is `$?`; backgrounding, `wait`, `kill`, and PID files work as
  in bash. `jobs` lists only the current shell’s jobs — persist PIDs in a
  file under the session workspace when a later step must stop the process.

## Differences from bash

- Glob qualifiers and `(command)` substitution behave differently; do not
  assume bash-only `shopt` or `mapfile`.
- `export NAME=value` works; read variables as `$NAME` / `${NAME}`.
- Discard output to `/dev/null`.

## macOS

- The stock tools are BSD (`sed -i ''`, `date -r`, `stat -f`); install GNU
  versions with `brew` when a script needs them.
