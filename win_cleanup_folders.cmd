@echo off

:: Script to remove specific folders: \nodejs, \node_modules, \dist, \out

:: Define the folders to remove
set folders=nodejs node_modules dist out

:: Loop through each folder and remove if it exists
for %%f in (%folders%) do (
    if exist %%f (
        echo Removing folder %%f...
        attrib -r -s -h %%f\*.* /s /d
        rmdir /s /q %%f
        if %ERRORLEVEL% neq 0 (
            echo Failed to remove %%f.
            pause
            exit /b 1
        )
    ) else (
        echo Folder %%f does not exist.
    )
)

echo All specified folders have been removed (if they existed).
pause