#!/bin/bash
# Ralph API Verification Script
# Usage: bash scripts/verify-api.sh [BASE_URL]
# Tests all API endpoints against the PRD requirements
set -e

BASE_URL="${1:-http://localhost:3000}"
COOKIE_JAR=$(mktemp)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

echo ""
echo "=============================================="
echo "  API Verification — $BASE_URL"
echo "=============================================="

# ─── US-003: Session Creation ───
echo ""
echo "── US-003: POST /api/session ──"

RESP=$(curl -s -w "\n%{http_code}" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/session")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "  ${GREEN}[PASS]${NC} HTTP 201 Created"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected 201, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

SESSION_ID=$(echo "$BODY" | jq -r '.data.sessionId // empty')
SUB=$(echo "$BODY" | jq -r '.data.subscription // empty')
if [ -n "$SESSION_ID" ] && [ "$SUB" = "FREE" ]; then
    echo -e "  ${GREEN}[PASS]${NC} Response: sessionId=$SESSION_ID, subscription=$SUB"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Missing sessionId or wrong subscription: $BODY"
    FAIL=$((FAIL + 1))
fi

# ─── US-004: Step Submission (with validation) ───
echo ""
echo "── US-004: POST /api/quiz/step ──"

# Test 1: Valid AGE_RANGE step
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -d '{"step":"AGE_RANGE","data":{"ageRange":"18-29"}}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    NEXT=$(echo "$BODY" | jq -r '.data.nextStep // empty')
    if [ -n "$NEXT" ]; then
        echo -e "  ${GREEN}[PASS]${NC} AGE_RANGE saved, nextStep=$NEXT"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} No nextStep in response"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "  ${RED}[FAIL]${NC} Expected 200, got $HTTP_CODE: $BODY"
    FAIL=$((FAIL + 1))
fi

# Test 2: Invalid data (height=3000)
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -d '{"step":"BODY_DATA","data":{"age":28,"height":3000,"currentWeight":85,"targetWeight":75}}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "400" ]; then
    ERR_CODE=$(echo "$BODY" | jq -r '.error.code // empty')
    if [ "$ERR_CODE" = "VALIDATION_ERROR" ]; then
        echo -e "  ${GREEN}[PASS]${NC} Height=3000 rejected with VALIDATION_ERROR"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} Wrong error code: $ERR_CODE"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "  ${RED}[FAIL]${NC} Expected 400, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# Test 3: No session (without cookie)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quiz/step" \
    -H "Content-Type: application/json" \
    -d '{"step":"GENDER","data":{"gender":"male"}}')
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "  ${GREEN}[PASS]${NC} No-cookie request rejected with 401"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected 401, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# ─── Submit remaining steps ───
echo ""
echo "── Submitting remaining steps for full flow test ──"

for STEP_DATA in \
    '{"step":"GENDER","data":{"gender":"male"}}' \
    '{"step":"BODY_DATA","data":{"age":28,"height":175,"currentWeight":85,"targetWeight":75}}' \
    '{"step":"GOALS","data":{"goals":["lose_weight","tone_muscle"]}}' \
    '{"step":"EXERCISE_FREQUENCY","data":{"frequency":"moderate","hoursPerWeek":3}}'; do

    RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/quiz/step" \
        -H "Content-Type: application/json" -d "$STEP_DATA")
    HTTP_CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | head -n -1)
    STEP=$(echo "$STEP_DATA" | jq -r '.step')
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "  ${GREEN}[PASS]${NC} $STEP saved"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} $STEP failed: $BODY"
        FAIL=$((FAIL + 1))
    fi
done

# ─── US-005: Progress Recovery ───
echo ""
echo "── US-005: GET /api/quiz/progress ──"

RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/quiz/progress")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    IS_COMPLETED=$(echo "$BODY" | jq -r '.data.isCompleted // false')
    COMPLETED_COUNT=$(echo "$BODY" | jq -r '.data.completedSteps | length // 0')
    if [ "$IS_COMPLETED" = "true" ] && [ "$COMPLETED_COUNT" -eq 5 ]; then
        echo -e "  ${GREEN}[PASS]${NC} Progress: isCompleted=true, ${COMPLETED_COUNT}/5 steps done"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} Expected isCompleted=true with 5 steps, got completed=$IS_COMPLETED count=$COMPLETED_COUNT"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "  ${RED}[FAIL]${NC} Expected 200, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# ─── US-006: Complete Quiz ───
echo ""
echo "── US-006: POST /api/quiz/complete ──"

RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/quiz/complete")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}[PASS]${NC} Quiz completed"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected 200, got $HTTP_CODE: $BODY"
    FAIL=$((FAIL + 1))
fi

# Duplicate complete should return 409
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/quiz/complete")
HTTP_CODE=$(echo "$RESP" | tail -1)
if [ "$HTTP_CODE" = "409" ]; then
    echo -e "  ${GREEN}[PASS]${NC} Duplicate complete returns 409"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected 409 for duplicate, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# ─── US-007: Results (FREE) ───
echo ""
echo "── US-007: GET /api/results (FREE) ──"

RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/results")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    SUB=$(echo "$BODY" | jq -r '.data.subscription // empty')
    BMI=$(echo "$BODY" | jq -r '.data.bmi // empty')
    WP=$(echo "$BODY" | jq -r '.data.weeklyProjection')
    PD=$(echo "$BODY" | jq -r '.data.planDetails')
    LOCK=$(echo "$BODY" | jq -r '.data.lockMessage // empty')

    if [ "$SUB" = "FREE" ] && [ -n "$BMI" ] && [ "$WP" = "null" ] && [ "$PD" = "null" ] && [ -n "$LOCK" ]; then
        echo -e "  ${GREEN}[PASS]${NC} FREE results: BMI=$BMI, locked data hidden, lockMessage present"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} FREE differentiation wrong: sub=$SUB bmi=$BMI wp=$WP pd=$PD lock=$LOCK"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "  ${RED}[FAIL]${NC} Expected 200, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# ─── US-008: Payment ───
echo ""
echo "── US-008: POST /api/pay ──"

RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/pay" \
    -H "Content-Type: application/json" -d '{"amount":99}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    NEW_SUB=$(echo "$BODY" | jq -r '.data.subscription // empty')
    if [ "$NEW_SUB" = "PREMIUM" ]; then
        echo -e "  ${GREEN}[PASS]${NC} Payment successful, subscription=$NEW_SUB"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} Subscription not upgraded: $NEW_SUB"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "  ${RED}[FAIL]${NC} Expected 200, got $HTTP_CODE: $BODY"
    FAIL=$((FAIL + 1))
fi

# Duplicate payment should return 409
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/pay" \
    -H "Content-Type: application/json" -d '{"amount":99}')
HTTP_CODE=$(echo "$RESP" | tail -1)
if [ "$HTTP_CODE" = "409" ]; then
    echo -e "  ${GREEN}[PASS]${NC} Duplicate payment returns 409 ALREADY_PREMIUM"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}[FAIL]${NC} Expected 409 for duplicate, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# Verify results now show PREMIUM
echo ""
echo "── US-007: GET /api/results (PREMIUM) ──"

RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/results")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    SUB=$(echo "$BODY" | jq -r '.data.subscription // empty')
    WP=$(echo "$BODY" | jq -r '.data.weeklyProjection | type // empty')
    PD=$(echo "$BODY" | jq -r '.data.planDetails | type // empty')

    if [ "$SUB" = "PREMIUM" ] && [ "$WP" = "array" ] && [ "$PD" = "object" ]; then
        WP_COUNT=$(echo "$BODY" | jq -r '.data.weeklyProjection | length')
        echo -e "  ${GREEN}[PASS]${NC} PREMIUM results: subscription=$SUB, weeklyProjection[$WP_COUNT], planDetails present"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} PREMIUM data wrong: sub=$SUB wp_type=$WP pd_type=$PD"
        FAIL=$((FAIL + 1))
    fi
fi

# ─── US-009: Test Premium Session ───
echo ""
echo "── US-009: GET /api/test/premium-session ──"

RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/test/premium-session")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    TEST_SID=$(echo "$BODY" | jq -r '.data.sessionId // empty')
    if [ -n "$TEST_SID" ]; then
        echo -e "  ${GREEN}[PASS]${NC} Test premium session created: $TEST_SID"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} No sessionId in response"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "  ${RED}[FAIL]${NC} Expected 200, got $HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# ─── Summary ───
echo ""
echo "=============================================="
echo "  API Tests: ${PASS} pass, ${FAIL} fail"
echo "=============================================="

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi

# Output test session ID for documentation
echo ""
echo "Test sessionId (for FREE user): $SESSION_ID"
if [ -n "$TEST_SID" ]; then
    echo "Test sessionId (for PREMIUM user): $TEST_SID"
fi
