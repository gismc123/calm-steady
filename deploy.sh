#!/bin/bash
set -e

export BUILD_DATE=$(date +%Y.%m.%d-%H%M%S)

# Load credentials from .env if present
if [ -f "$(dirname "$0")/.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/.env" | xargs)
fi

CF_API_TOKEN="${CF_API_TOKEN:-}"
CF_ZONE_ID="${CF_ZONE_ID:-}"

echo "Deploying steady-v1.0-${BUILD_DATE}..."

git pull
docker compose build --no-cache
docker compose up -d

echo "Done. Deployed steady-v1.0-${BUILD_DATE}"

# Purge Cloudflare cache so users get fresh files immediately
if [ -n "$CF_API_TOKEN" ] && [ -n "$CF_ZONE_ID" ]; then
  echo "Purging Cloudflare cache..."
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' | grep -o '"success":[^,}]*'
  echo "Cloudflare cache purged."
else
  echo "Skipping Cloudflare purge (CF_API_TOKEN or CF_ZONE_ID not set)."
fi
