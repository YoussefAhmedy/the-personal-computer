#!/bin/bash
# Quick smoke test: starts the server against a throwaway copy of the
# database, exercises the main API paths, and reports pass/fail. Useful
# after changing code, upgrading dependencies, or before deploying.
#
# Usage: bash smoke-test.sh   (run from the backend/ directory)

set -uo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "No .env found. Copy .env.example to .env first."
  exit 1
fi

PORT=3099
BASE="http://localhost:$PORT"
TMP_DB="/tmp/pc-smoketest-$$.db"
COOKIES="/tmp/pc-smoketest-cookies-$$.txt"
trap 'rm -f "$TMP_DB" "$TMP_DB"-* "$COOKIES"; kill $SERVER_PID 2>/dev/null' EXIT

export DB_PATH="$TMP_DB"
export PORT
export SITE_PASSCODE="smoketest-code"
export ADMIN_USERNAME="smoketest-admin"
export ADMIN_PASSWORD="smoketest-password-123"

node src/db/seed.js --reset > /dev/null 2>&1
node server.js > /tmp/pc-smoketest-server.log 2>&1 &
SERVER_PID=$!
sleep 1.5

pass=0; fail=0
check() {
  if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "  ✓ $1"
  else fail=$((fail+1)); echo "  ✗ $1 (expected $2, got $3)"; fi
}

echo "Checking server health and static files..."
check "health endpoint" 200 "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/health)"
check "main site served" 200 "$(curl -s -o /dev/null -w '%{http_code}' $BASE/)"
check "admin console served" 200 "$(curl -sL -o /dev/null -w '%{http_code}' $BASE/admin)"

echo "Checking access control..."
check "content blocked pre-auth" 401 "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/memories)"
check "admin blocked pre-auth" 401 "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/admin/overview)"

curl -s -c "$COOKIES" -o /dev/null $BASE/
CSRF=$(grep pc_csrf "$COOKIES" | awk '{print $7}')

echo "Checking visitor login..."
check "wrong access code rejected" 401 "$(curl -s -c "$COOKIES" -b "$COOKIES" -o /dev/null -w '%{http_code}' -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"passcode":"wrong"}')"
check "correct access code accepted" 200 "$(curl -s -c "$COOKIES" -b "$COOKIES" -o /dev/null -w '%{http_code}' -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"passcode\":\"$SITE_PASSCODE\"}")"
check "content bundle accessible after login" 200 "$(curl -s -c "$COOKIES" -b "$COOKIES" -o /dev/null -w '%{http_code}' $BASE/api/bundle)"

echo "Checking admin login and CSRF protection..."
check "admin login accepted" 200 "$(curl -s -c "$COOKIES" -b "$COOKIES" -o /dev/null -w '%{http_code}' -X POST $BASE/api/auth/admin/login -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")"
check "admin overview accessible" 200 "$(curl -s -b "$COOKIES" -o /dev/null -w '%{http_code}' $BASE/api/admin/overview)"
check "admin write WITHOUT csrf token rejected" 403 "$(curl -s -b "$COOKIES" -c "$COOKIES" -o /dev/null -w '%{http_code}' -X POST $BASE/api/admin/notes -H "Content-Type: application/json" -d '{"title":"x"}')"

echo "Checking security headers..."
HEADERS=$(curl -s -D - -o /dev/null $BASE/)
if echo "$HEADERS" | grep -qi "content-security-policy"; then pass=$((pass+1)); echo "  ✓ CSP header present"
else fail=$((fail+1)); echo "  ✗ CSP header missing"; fi

echo ""
if [ "$fail" -eq 0 ]; then
  echo "All $pass checks passed."
else
  echo "$pass passed, $fail FAILED. Server log:"
  tail -30 /tmp/pc-smoketest-server.log
  exit 1
fi
