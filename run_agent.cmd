@echo off
title CTF Swarm Desktop Agent Engine
color 0A
cls
echo ============================================================
echo   🤖 CTF SWARM DESKTOP AGENT ENGINE (RUNNING ON YOUR PC)
echo ============================================================
echo   Status : Ready ^& Listening on http://localhost:7788
echo   Features: Image Stego + Recursive Nested Matryoshka ZIP
echo   Connect: Open https://ctfweb.vercel.app/ in your browser
echo ============================================================
echo.
echo [!] Starting Python Agent Server on port 7788...
python scripts\local_python_agent.py
pause
