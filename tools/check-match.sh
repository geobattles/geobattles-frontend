#!/usr/bin/env bash
set -euo pipefail

frontend=$(cd "$(dirname "$0")/.." && pwd)
backend=$(cd "${GEOBATTLES_BACKEND_DIR:-$frontend/../geo-backend}" && pwd)
work=$(mktemp -d)
database=""
web_pid=""
cleanup() {
    if [[ -n "$web_pid" ]]; then kill "$web_pid" 2>/dev/null || true; wait "$web_pid" 2>/dev/null || true; fi
    if [[ -n "$database" ]]; then docker rm -f "$database" >/dev/null; fi
    rm -rf -- "$work"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf 'Frontend %s\nBackend  %s\n' "$(git -C "$frontend" rev-parse HEAD)" "$(git -C "$backend" rev-parse HEAD)"

# Stage only repository sources, including local edits. Neither a developer's
# .env nor another server's generated Nuxt output is part of the fixture.
mkdir "$work/frontend"
(cd "$frontend" && git ls-files --cached --others --exclude-standard -z | tar --null -T - -cf -) | tar -xf - -C "$work/frontend"
export GEOBATTLES_MATCH_BUILD_ID="matchfixture-$(node -p 'crypto.randomUUID()')"
export VERSION="$GEOBATTLES_MATCH_BUILD_ID"
export GEOBATTLES_E2E_TARGET=isolated-local GEOBATTLES_E2E_MAPS=0 GEOBATTLES_E2E_MAPS_SCOPE=all
export NUXT_PUBLIC_GMAPS_API="" GMAPS_API=""
export POSTGRES_PASSWORD=$(node -p 'crypto.randomBytes(32).toString("hex")')
export JWT_KEY=$(node -p 'crypto.randomBytes(64).toString("hex")')

(cd "$backend" && CGO_ENABLED=0 go build -mod=readonly -tags matchfixture -ldflags "-X main.version=$VERSION" -o "$work/server" .)
# The fixture server shares only this disposable database's network namespace.
# PostgreSQL has no published port. Only the HTTP API is bound to host loopback.
database=$(docker run -d --rm --env POSTGRES_PASSWORD --env POSTGRES_DB=match --env POSTGRES_USER=match \
    --tmpfs /var/lib/postgresql/data --publish 127.0.0.1::8080 \
    --mount "type=bind,source=$work/server,target=/match/server,readonly" \
    --mount "type=bind,source=$backend/assets,target=/match/assets,readonly" \
    postgres:17-alpine@sha256:d3244e8ce3f165ee3c93d9c4a4b1d0fe48b3a89e2287b717fdcbbde92d405065)
ready=false
for _ in {1..90}; do
    if docker exec "$database" pg_isready -q -h 127.0.0.1 -U match -d match; then ready=true; break; fi
    sleep 1
done
if [[ "$ready" != true ]]; then echo "Disposable PostgreSQL did not become ready." >&2; exit 1; fi
export DB_PASSWORD="$POSTGRES_PASSWORD"
docker exec -d -w /match --env DB_PASSWORD --env JWT_KEY --env GMAPS_API --env DB_HOST=127.0.0.1 \
    --env DB_USER=match --env DB_NAME=match "$database" /match/server
export GEOBATTLES_API_URL="http://$(docker port "$database" 8080/tcp)"
export NUXT_PUBLIC_BACKEND_HOST="$GEOBATTLES_API_URL" NUXT_BACKEND_SERVER_HOST="$GEOBATTLES_API_URL"
curl --silent --fail --max-time 3 --retry 30 --retry-delay 1 --retry-all-errors "$GEOBATTLES_API_URL/readyz" >/dev/null || { echo "Fixture API did not become ready." >&2; exit 1; }

cd "$work/frontend"
npm ci --prefer-offline --no-audit --no-fund
./node_modules/.bin/tsc --noEmit --project e2e/tsconfig.json
if [[ "${GITHUB_ACTIONS:-}" == true ]]; then
    ./node_modules/.bin/playwright install --with-deps chromium
else
    ./node_modules/.bin/playwright install chromium
fi
./node_modules/.bin/nuxt build --envName matchfixture
export HOST=127.0.0.1
export PORT=$(node -e 'const s=require("node:net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')
export GEOBATTLES_BASE_URL="http://127.0.0.1:$PORT"
node .output/server/index.mjs >"$work/frontend.log" 2>&1 &
web_pid=$!
curl --silent --fail --max-time 3 --retry 15 --retry-delay 1 --retry-all-errors "$GEOBATTLES_BASE_URL/" >/dev/null || { echo "Fixture frontend did not become ready." >&2; exit 1; }
kill -0 "$web_pid"
./node_modules/.bin/playwright test --config e2e/match/playwright.config.ts
