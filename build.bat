@echo off
setlocal

REM Remove Git from PATH
set "PATH=%PATH:C:\Program Files\Git\usr\bin;=%"
set "PATH=%PATH:C:\Program Files\Git\cmd;=%"
set "PATH=%PATH:C:\Program Files\Git\mingw64\bin;=%"

echo Building with modified PATH (Git removed)...
cd /d "%~dp0src-tauri"
cargo build

endlocal
