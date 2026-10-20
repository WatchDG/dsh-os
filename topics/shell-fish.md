# fish notes

Read this when the rules name fish as the shell.

## Syntax

- Chain with `;` plus `and` / `or`. (`&&` / `||` exist only in fish 3+;
  `and` / `or` work everywhere.)
- Set variables with `set -x NAME value` — there is no `export`.
  Read them as `$NAME`.
- Command substitution is `(command)`.
- Discard output to `/dev/null`.

## Exit codes and background

- The code is `$status`: `prog; or echo "failed: $status"`.
- `prog &` backgrounds like in bash; `jobs` lists only the current
  shell’s jobs, so persist PIDs in a file under the session workspace
  when a later step must stop the process.

## Paths

- Forward slashes; quote paths containing spaces.
