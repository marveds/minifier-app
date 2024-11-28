@echo off

:: Batch script to call separate scripts for different tasks

:: Part 1: Install Node.js and Dependencies
call win_setup_dependencies.cmd
if %ERRORLEVEL% neq 0 (
    echo Failed during dependency installation.
    pause
    exit /b 1
)

echo Dependencies installed successfully.

:: Part 2: Create the App and Launch It
call win_build_app.cmd
if %ERRORLEVEL% neq 0 (
    echo Failed during app creation or launch.
    pause
    exit /b 1
)

echo App created and launched successfully.

pause
