# Command equivalents across OSes

Pick the row for the current OS. Prefer the native tool over emulating
another OS’s binary.

| Task | Windows (PowerShell) | Windows (cmd) | macOS / Linux |
|---|---|---|---|
| File hash | `Get-FileHash -Algorithm SHA256 f` | `certutil -hashfile f SHA256` | `shasum -a 256 f` / `sha256sum f` |
| Unzip | `Expand-Archive f.zip -DestinationPath d` | `tar -xf f.zip -C d` (Win10+) | `tar -xf`, `unzip` |
| Zip | `Compress-Archive f -DestinationPath a.zip` | `tar -a -c -f a.zip f` | `tar`, `zip`, `ditto -c -k` (macOS) |
| Ping | `Test-Connection host` / `ping -n 4 host` | `ping -n 4 host` | `ping -c 4 host` |
| Port check | `Test-NetConnection host -Port p` | — | `nc -zv host p` / `curl` |
| Traceroute | `tracert host` | `tracert host` | `traceroute host` |
| Pause | `Start-Sleep -Seconds 5` | `timeout /t 5` | `sleep 5` |
| Null device | `NUL` | `NUL` | `/dev/null` |
| Clipboard out | `... \| Set-Clipboard` | `... \| clip` | `pbcopy` (macOS) / `xclip`, `xsel` |
| Clipboard in | `Get-Clipboard` | — | `pbpaste` (macOS) / `xclip -o` |
| Find in files | `Select-String -Pattern p -Path r` | `findstr /s p *` | `grep -rn p .` |
| Find by name | `Get-ChildItem -Recurse -Filter n` | `dir /s n` | `find . -name n` |
| Open file/URL | `start "" <path>` | `start "" <path>` | `open` (macOS) / `xdg-open` |
| Which binary | `Get-Command n` / `where.exe n` | `where n` | `command -v n` |
