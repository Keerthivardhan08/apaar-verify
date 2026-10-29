#!/bin/bash
# APAAR Verify — 1-Click Local Runner (Linux / macOS)

set -e

echo "======================================================================"
echo "          APAAR Verify — Academic Data Integrity Platform"
echo "======================================================================"
echo ""

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 is required. Please install Python 3.10+."
    exit 1
fi

# 2. Check Node
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is required. Please install Node.js 18+."
    exit 1
fi

echo "[1/4] Installing backend dependencies..."
cd backend
python3 -m pip install -r requirements.txt --quiet

echo "[2/4] Initializing database, 58 AICTE Colleges, and synthetic student records..."
python3 seed_data.py
python3 seed_expanded_colleges.py

echo "[3/4] Installing frontend dependencies & building bundle..."
cd ../frontend
npm install --silent
npm run build

echo "[4/4] Starting unified APAAR Verify server on http://localhost:8000..."
echo ""
echo "======================================================================"
echo " Server is LIVE at: http://localhost:8000"
echo ""
echo " Default Login Accounts:"
echo "   - AICTE Administrator : admin@aicte.gov.in    / Demo@1234"
echo "   - AICTE Reviewer      : reviewer@aicte.gov.in / Demo@1234"
echo "   - IIT Demo Operator   : operator@iit-demo.edu / Demo@1234"
echo "   - NIT Demo Operator   : operator@nit-demo.edu / Demo@1234"
echo "   - Public Verifier     : http://localhost:8000/verify"
echo "======================================================================"
echo ""

cd ../backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
