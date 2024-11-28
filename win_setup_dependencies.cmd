@echo off

:: Check if Node.js is installed
set PATH=%CD%\nodejs\node-v22.11.0-win-x64;%PATH%
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Downloading pre-compiled Node.js binary...
    :: Download pre-compiled Node.js binary
    powershell -Command "& { (New-Object Net.WebClient).DownloadFile('https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip', 'nodejs_binary.zip') }"
    :: Extract Node.js binary
    powershell -Command "Expand-Archive -Path nodejs_binary.zip -DestinationPath nodejs -Force"
    :: Add Node.js to PATH
    set PATH=%CD%\nodejs\node-v22.11.0-win-x64;%PATH%
    :: Clean up downloaded zip file
    del nodejs_binary.zip        
) else (
    echo Node.js is already installed.
)

set PATH=%CD%\nodejs\node-v22.11.0-win-x64;%PATH%

:: Install dependencies
echo Installing dependencies...
npm install || (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

pause