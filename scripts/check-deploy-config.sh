#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_file() {
  local path="$1"
  [[ -f "$ROOT_DIR/$path" ]] || fail "missing $path"
}

assert_contains() {
  local path="$1"
  local expected="$2"
  grep -Fq "$expected" "$ROOT_DIR/$path" || fail "$path missing: $expected"
}

assert_not_contains() {
  local path="$1"
  local unexpected="$2"
  if grep -Fq "$unexpected" "$ROOT_DIR/$path"; then
    fail "$path should not contain: $unexpected"
  fi
}

assert_file "backend/Dockerfile"
assert_file "backend/.dockerignore"
assert_file "backend/.env.example"
assert_file "deploy/nginx-api.anxietypha.my.id.conf"

assert_contains "docker-compose.yml" "backend:"
assert_contains "docker-compose.yml" "\"127.0.0.1:3000:3000\""
assert_not_contains "docker-compose.yml" "\"5432:5432\""
assert_not_contains "docker-compose.yml" "\"80:80\""
assert_not_contains "docker-compose.yml" "\"443:443\""

assert_contains "deploy/nginx-api.anxietypha.my.id.conf" "server_name api.anxietypha.my.id;"
assert_contains "deploy/nginx-api.anxietypha.my.id.conf" "proxy_pass http://127.0.0.1:3000;"
assert_contains "frontend/.env.example" "EXPO_PUBLIC_API_URL=https://api.anxietypha.my.id"
assert_contains "frontend/src/config.ts" "https://api.anxietypha.my.id"
assert_not_contains "frontend/src/config.ts" "10.0.2.2"
assert_not_contains "frontend/src/config.ts" "192.168."

assert_contains "backend/src/server.ts" "/health"
assert_contains "backend/src/server.ts" "validateServerEnv"
assert_not_contains "backend/src/modules/auth/auth.service.ts" "changeme_in_production"
assert_not_contains "backend/src/middleware/auth.middleware.ts" "changeme_in_production"

echo "Deploy configuration checks passed."
