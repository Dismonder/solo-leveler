@echo off
chcp 65001 >nul
title Solo Leveler - Publikacja Aktualizacji na GitHub
color 0B

echo ================================================================
echo       SOLO LEVELER - WYRZUĆ AKTUALIZACJĘ NA GITHUB
echo ================================================================
echo.

cd /d "%~dp0"

echo [1/5] Sprawdzanie i budowanie aplikacji webowej...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [BŁĄD] Kompilacja npm run build nie powiodła się!
    pause
    exit /b 1
)

echo.
echo [2/5] Synchronizacja z Androidem (Capacitor)...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [BŁĄD] cap sync android nie powiodło się!
    pause
    exit /b 1
)

echo.
echo [3/5] Kompilowanie paczki APK (Gradle assembleDebug)...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [BŁĄD] Kompilacja APK nie powiodła się!
    pause
    exit /b 1
)
cd ..

echo.
echo [4/5] Publikowanie wydania i przesyłanie APK na GitHub Releases...
node scripts/publish-release-to-github.js %*
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [BŁĄD] Publikacja na GitHub Releases nie powiodła się!
    pause
    exit /b 1
)

echo.
echo [5/5] Wypychanie zmian kodu do repozytorium Git (git push)...
git add .
git commit -m "release: auto-publish update to GitHub"
git push origin HEAD

echo.
color 0A
echo ================================================================
echo   SUKCES! Aktualizacja została pomyślnie opublikowana!
echo ================================================================
echo.
pause
