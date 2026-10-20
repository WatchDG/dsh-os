# Command equivalents on macOS

Read this when the rules name macOS as the OS. Prefer the native tool
over emulating another OS’s binary.

| Task | Command |
|---|---|
| File hash | `shasum -a 256 f` |
| Unzip | `tar -xf f.tgz -C d`, `unzip f.zip -d d` |
| Zip | `tar -czf a.tgz f`, `zip -r a.zip f`, `ditto -c -k f a.zip` |
| Ping | `ping -c 4 host` |
| Port check | `nc -zv host p` / `curl -v host:p` |
| Traceroute | `traceroute host` |
| Pause | `sleep 5` |
| Null device | `/dev/null` |
| Clipboard out | `... \| pbcopy` |
| Clipboard in | `pbpaste` |
| Find in files | `grep -rn p .` |
| Find by name | `find . -name n` |
| Open file/URL | `open <path>` |
| Which binary | `command -v n` |

Stock tools are BSD: `sed -i ''`, `date -r`, `stat -f`. Install GNU
versions with `brew` when a script needs them.
