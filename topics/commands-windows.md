# Command equivalents on Windows

Read this when the rules name Windows as the OS. Prefer the native tool
over emulating another OS’s binary.

| Task | PowerShell | cmd |
|---|---|---|
| File hash | `Get-FileHash -Algorithm SHA256 f` | `certutil -hashfile f SHA256` |
| Unzip | `Expand-Archive f.zip -DestinationPath d` | `tar -xf f.zip -C d` (Win10+) |
| Zip | `Compress-Archive f -DestinationPath a.zip` | `tar -a -c -f a.zip f` |
| Ping | `Test-Connection host` / `ping -n 4 host` | `ping -n 4 host` |
| Port check | `Test-NetConnection host -Port p` | — |
| Traceroute | `tracert host` | `tracert host` |
| Pause | `Start-Sleep -Seconds 5` | `timeout /t 5` |
| Null device | `NUL` | `NUL` |
| Clipboard out | `... \| Set-Clipboard` | `... \| clip` |
| Clipboard in | `Get-Clipboard` | — |
| Find in files | `Select-String -Pattern p -Path r` | `findstr /s p *` |
| Find by name | `Get-ChildItem -Recurse -Filter n` | `dir /s n` |
| Open file/URL | `start "" <path>` | `start "" <path>` |
| Which binary | `Get-Command n` / `where.exe n` | `where n` |
