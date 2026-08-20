@echo off
chcp 65001 >nul
title Solo Leveler - Publish Update to GitHub
cd /d "%~dp0"
call Wyrzuc-Aktualizacje-Na-Github.bat %*
