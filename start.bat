@echo off
cd /d "%~dp0"
echo Starting MediaHub Pro...
echo Open http://localhost:3000 in your browser
call npx next dev --webpack
pause
