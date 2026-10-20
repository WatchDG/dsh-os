# Command equivalents on Linux

Read this when the rules name Linux as the OS. Prefer the native tool
over emulating another OS’s binary.

| Task | Command |
|---|---|
| File hash | `sha256sum f` |
| Unzip | `tar -xf f.tgz -C d`, `unzip f.zip -d d` |
| Zip | `tar -czf a.tgz f`, `zip -r a.zip f` |
| Ping | `ping -c 4 host` |
| Port check | `nc -zv host p` / `curl -v host:p` |
| Traceroute | `traceroute host` |
| Pause | `sleep 5` |
| Null device | `/dev/null` |
| Clipboard out | `... \| xclip` (or `xsel -b`) |
| Clipboard in | `xclip -o` |
| Find in files | `grep -rn p .` |
| Find by name | `find . -name n` |
| Open file/URL | `xdg-open <path>` |
| Which binary | `command -v n` |
