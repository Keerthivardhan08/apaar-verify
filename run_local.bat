@echo off
title APAAR Verify — 1-Click Local Runner
color 0A

echo ======================================================================
echo                APAAR Verify — Academic Data Integrity Platform
echo ======================================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found. Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

:: 2. Check Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm is not found. Please install Node.js 18+ and add it to PATH.
    pause
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd backend
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies failed to install. Continuing...
)

echo [2/4] Initializing database and synthetic seed records...
python seed_data.py

echo [3/4] Installing frontend dependencies & building bundle...
cd ..\frontend
call npm install --silent
call npm run build

echo [4/4] Starting unified APAAR Verify server on http://localhost:8000...
echo.
echo ======================================================================
echo  Server is LIVE at: http://localhost:8000
echo.
echo  Default Login Accounts:
echo    - AICTE Administrator : admin@aicte.gov.in    / Demo@1234
echo    - AICTE Reviewer      : reviewer@aicte.gov.in / Demo@1234
echo    - IIT Demo Operator   : operator@iit-demo.edu / Demo@1234
echo    - NIT Demo Operator   : operator@nit-demo.edu / Demo@1234
echo    - Public Verifier     : http://localhost:8000/verify
echo ======================================================================
echo.

start http://localhost:8000

cd ..\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
