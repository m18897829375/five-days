#!/bin/bash
# EdgeOne Post-Deployment Verification Script
# Usage: bash scripts/verify-edgeone.sh [BASE_URL]
# Defaults to http://localhost:3000 if no argument provided
set -e

BASE_URL="${1:-http://localhost:3000}"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASS=0
FAIL=0

echo ""
echo "=============================================="
echo "  EdgeOne Verification — $BASE_URL"
echo "=============================================="

# ─── 1. POST /api/session ───
echo ""
echo "── [1/12] POST /api/session ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/session")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')
SESSION_ID=$(echo "$BODY" | jq -r '.data.sessionId // empty')

if [ "$HTTP_CODE" = "201" ] && [ "$SUCCESS" = "true" ] && [ -n "$SESSION_ID" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 201, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 201 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 2. POST /api/quiz/step (AGE_RANGE) ───
echo ""
echo "── [2/12] POST /api/quiz/step (AGE_RANGE) ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -H "Cookie: sessionId=$SESSION_ID" \
    -d '{"step":"AGE_RANGE","data":{"ageRange":"18-29"}}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 3. POST /api/quiz/step (GENDER) ───
echo ""
echo "── [3/12] POST /api/quiz/step (GENDER) ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -H "Cookie: sessionId=$SESSION_ID" \
    -d '{"step":"GENDER","data":{"gender":"male"}}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 4. POST /api/quiz/step (BODY_DATA) ───
echo ""
echo "── [4/12] POST /api/quiz/step (BODY_DATA) ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -H "Cookie: sessionId=$SESSION_ID" \
    -d '{"step":"BODY_DATA","data":{"age":28,"height":175,"currentWeight":85,"targetWeight":75}}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 5. POST /api/quiz/step (GOALS) ───
echo ""
echo "── [5/12] POST /api/quiz/step (GOALS) ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -H "Cookie: sessionId=$SESSION_ID" \
    -d '{"step":"GOALS","data":{"goals":["lose_weight"]}}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 6. POST /api/quiz/step (EXERCISE_FREQUENCY) ───
echo ""
echo "── [6/12] POST /api/quiz/step (EXERCISE_FREQUENCY) ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -H "Cookie: sessionId=$SESSION_ID" \
    -d '{"step":"EXERCISE_FREQUENCY","data":{"frequency":"moderate"}}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 7. GET /api/quiz/progress ───
echo ""
echo "── [7/12] GET /api/quiz/progress ──"

RESP=$(curl -s -w "\n%{http_code}" -H "Cookie: sessionId=$SESSION_ID" "$BASE_URL/api/quiz/progress")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 8. POST /api/quiz/complete ───
echo ""
echo "── [8/12] POST /api/quiz/complete ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quiz/complete" \
    -H "Cookie: sessionId=$SESSION_ID")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 9. GET /api/results (FREE) ───
echo ""
echo "── [9/12] GET /api/results (FREE) ──"

RESP=$(curl -s -w "\n%{http_code}" -H "Cookie: sessionId=$SESSION_ID" "$BASE_URL/api/results")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 10. POST /api/pay ───
echo ""
echo "── [10/12] POST /api/pay ──"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/pay" \
    -H "Content-Type: application/json" \
    -H "Cookie: sessionId=$SESSION_ID" \
    -d '{"amount":1}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 11. GET /api/results (PREMIUM) ───
echo ""
echo "── [11/12] GET /api/results (PREMIUM) ──"

RESP=$(curl -s -w "\n%{http_code}" -H "Cookie: sessionId=$SESSION_ID" "$BASE_URL/api/results")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── 12. GET /api/test/premium-session ───
echo ""
echo "── [12/12] GET /api/test/premium-session ──"

RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/test/premium-session")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SUCCESS=$(echo "$BODY" | jq -r '.success // false')

if [ "$HTTP_CODE" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 200, success=true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected HTTP 200 + success=true, got $HTTP_CODE, success=$SUCCESS"
    FAIL=$((FAIL + 1))
fi

# ─── Summary ───
echo ""
echo "=============================================="
echo "  EdgeOne Verification: ${PASS} pass, ${FAIL} fail"
echo "=============================================="

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
