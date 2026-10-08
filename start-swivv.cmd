@echo off
cd /d "%~dp0"
echo Starting SWIVV dev server (HTTPS) — keep this window open, then browse https://localhost:5273/
echo On mobile (same Wi-Fi): https://192.168.1.11:5273/ — accept the security warning, it is our own dev certificate.
npm run dev
pause
