#!/bin/bash
# Ralph Build Verification Script
# Usage: bash scripts/verify-build.sh
# Called by Ralph after each story to verify typecheck and build pass
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASS=0
FAIL=0

echo ""
echo "=============================================="
echo "  Build Verification"
echo "=============================================="

# 1. TypeScript Type Check
echo ""
echo "[1/3] TypeScript typecheck..."
if npx tsc --noEmit 2>&1; then
    echo -e "  ${GREEN}[PASS]${NC} tsc --noEmit"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} TypeScript errors found"
    FAIL=$((FAIL + 1))
fi

# 2. Prisma Generate (ensure client is up to date)
echo ""
echo "[2/3] Prisma client generation..."
if npx prisma generate 2>&1; then
    echo -e "  ${GREEN}[PASS]${NC} prisma generate"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Prisma generation failed"
    FAIL=$((FAIL + 1))
fi

# 3. Next.js Build
echo ""
echo "[3/3] Next.js build..."
if npx next build 2>&1; then
    echo -e "  ${GREEN}[PASS]${NC} next build"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Next.js build failed"
    FAIL=$((FAIL + 1))
fi

# Summary
echo ""
echo "=============================================="
echo "  Build: ${PASS} pass, ${FAIL} fail"
echo "=============================================="

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
