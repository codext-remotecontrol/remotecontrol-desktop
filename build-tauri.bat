@echo off
setlocal

REM Add MinGW to PATH
set "PATH=C:\Users\M\AppData\Local\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin;%PATH%"

echo Building Tauri with MinGW toolchain...
cd /d "%~dp0src-tauri"
cargo build

endlocal
