# Remote session notes (SSH)

Read this when the rules name a remote machine (`location: remote`): the
prompt describes the remote side, not the Host you sit at.

## Mental model

- Paths, installs, environment variables, and file/URL openers all run on
  the remote machine. A local `start` / `open` / `xdg-open` will not show
  you a remote file.
- Move files with `scp`, `sftp`, or the editor's remote session — never by
  pasting remote paths into Host-local commands.
- The wrapper in the rules (`ssh <host> '<command>'` and friends) is the
  only bridge: every command line is a fresh SSH invocation unless you hold
  an explicit persistent session.

## Line endings and permissions

- The remote side is usually LF-only: keep `*.sh text eol=lf` in
  `.gitattributes` so checkouts from a CRLF machine do not break shebangs.
- Fresh checkouts often lose the executable bit: run `bash script.sh`, or
  restore it with `chmod +x` / `git update-index --chmod=+x` on the remote.
- Symlinks created locally may not survive the transfer: prefer relative
  links (`ln -s ../target link`) and re-create them on the remote.

## Environment

- Each call is a fresh login without your interactive profile: do not rely
  on `~/.bashrc` aliases, exported variables, or a `cd` from an earlier
  call — pass absolute paths and inline `NAME=value` assignments.
- Never run interactive `sudo` over this channel: it waits for a password
  and hangs the call. Ask for a pre-arranged privilege path instead.
- Assume UTF-8 on both ends; when output turns into mojibake, check
  `LANG` (it should end in `.UTF-8`) before blaming the bytes.
