@echo off
title APAAR Verify - Backend Server
echo ========================================================
echo Starting APAAR Verify Backend (FastAPI + Uvicorn)
echo Port: 8000 | Docs: http://localhost:8000/api/v1/docs
echo ========================================================
cd backend
python -m uvicorn app.main:app --reload --port 8000
pause
