@echo off

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Installing Node.js...
    :: Download Node.js installer
    powershell -Command "& { (New-Object Net.WebClient).DownloadFile('https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi', 'nodejs_installer.msi') }"
    :: Install Node.js silently
    msiexec /i nodejs_installer.msi /quiet /norestart
    :: Clean up installer
    del nodejs_installer.msi
) else (
    echo Node.js is already installed.
)

:: Navigate to the directory containing app files
:: set /p appDir="Enter the directory path for the app files: "
:: cd /d "%appDir%"

:: Install dependencies
npm install

:: Create the app locally
npm run make

pause
