# sh notes

Read this when the rules name the POSIX shell (sh) as the shell.

## Syntax

- Chain with `&&` (only on success), `||` (only on failure), or `;` (always).
- Variables: `$NAME` / `${NAME}`, `NAME=value command`,
  `export NAME=value`. No arrays and no `[[ ]]` — use `[ ... ]`.
- Only POSIX tools are guaranteed. Discard output to `/dev/null`.

## Exit codes and background

- The code is `$?`; `set -e` aborts on failure (no `pipefail` in `sh`).
- `prog &` backgrounds, `wait` reaps. Persist PIDs in a file under the
  session workspace when a later step must stop the process — `jobs`
  lists only the current shell’s jobs.
