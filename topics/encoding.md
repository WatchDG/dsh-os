# Encodings, console code pages, and redirections

## Windows PowerShell 5.1

- The console speaks the OEM code page (Russian systems: cp866 input,
  cp1251 ANSI). Non-ASCII output may arrive garbled — that is mojibake,
  not broken data.
- `>` and `Out-File` default to UTF-16 (`Unicode`): files written that way
  look “spaced out” in POSIX tools. Write text explicitly:
  `... | Out-File -Encoding utf8 out.txt`.
- Mitigations, in order: `chcp 65001`, then
  `[Console]::InputEncoding = [Console]::OutputEncoding = [utf8]`.

## PowerShell 7+

- Defaults are UTF-8 everywhere; `>` writes UTF-8 without BOM.
- The 5.1 cautions apply only when remoting into, or being hosted by,
  Windows PowerShell 5.1.

## cmd

- `chcp 65001` switches the console to UTF-8 for the current window.
- `type` prints bytes as-is; redirecting non-ASCII through pipes may
  transcode — prefer PowerShell for text processing.

## POSIX shells

- Assume UTF-8. If output is garbled, check `locale` (`LANG` should end
  in `.UTF-8`), not the command.
- `date`, `ls`, and error messages localize month/day names: parse
  `--iso-8601` / `date -u +%FT%TZ` output instead of human formats.
