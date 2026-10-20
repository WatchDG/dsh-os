# Package managers, elevation, and OS gates

## Which manager lives where

- Windows: `winget`, `choco`, `scoop`. Never `apt`/`brew`.
- macOS: `brew` (Apple Silicon: `/opt/homebrew`; Intel: `/usr/local`).
  Never `apt`/`winget`.
- Linux: the distro manager (`apt`, `dnf`, `pacman`, `apk`, `zypper`…).
  Never `brew`/`winget`.
- Installing toolchains is a user decision: propose the exact command,
  do not run it silently.

## Elevation

- Non-interactive calls cannot answer a password/UAC prompt. Never run
  bare `sudo` on POSIX — it hangs the call. If elevation is truly needed,
  say which command needs it and stop.
- Windows has no in-place `sudo` in scripts: elevation means starting a
  new elevated process (UAC prompt). The Win11 `sudo` / `gsudo` helpers
  are opt-in and may not exist.

## macOS gates

- Downloaded binaries may carry `com.apple.quarantine` (“cannot be
  opened” / “unidentified developer”): `xattr -d com.apple.quarantine <file>`.
- SIP protects `/System` and parts of `/usr` even for root — do not fight it.
- Compilers and `git` need the Command Line Tools: `xcode-select --install`
  (interactive; ask the user).
- Services: `launchd`/`launchctl`, not `systemd`.

## Windows services and Linux services

- Windows: `sc.exe`, `Get-Service` / `Start-Service` (elevation often needed).
- Linux with systemd: `systemctl`; without it, the distro’s init scripts.
  Never assume `systemd` on containers or WSL.
