@echo off
rem ============================================================
rem  Fallback launcher for the JR Modular Systems site.
rem  Use this ONLY if double-clicking dist\index.html shows a
rem  blank page (some browsers block file:// modules).
rem  It serves the built site locally and opens your browser.
rem ============================================================
cd /d "%~dp0"

if not exist "dist\index.html" (
  echo Brak builda. Buduje strone...
  call npm run build
)

echo Uruchamiam lokalny podglad...
start "JR Modular - serwer (nie zamykaj)" /min cmd /c "npm run preview -- --port 4317 --strictPort"
timeout /t 4 /nobreak >nul
start "" "http://localhost:4317/"

echo.
echo Strona powinna otworzyc sie w przegladarce: http://localhost:4317/
echo Serwer dziala w zminimalizowanym oknie - zamknij je, aby zatrzymac.
echo.
pause
