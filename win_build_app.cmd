@echo off

:: Check if Node.js is installed
set PATH=%CD%\nodejs\node-v22.11.0-win-x64;%PATH%
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please run .\win_setup_dependencies.cmd to install
) else (
    echo Node.js is already installed.
)

@REM :: Create the app locally
@REM npm run package:win || (
@REM     echo Failed to create the app.
@REM     pause
@REM     exit /b 1
@REM )

:: npm install electron-builder --save-dev

:: Create the app locally
 npm run make-msi || (
    echo Failed to create the app.
    pause
    exit /b 1
 )

pause
