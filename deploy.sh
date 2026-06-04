#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "usage: deploy.sh <tenant_slug> <docker_image> <container_name>" >&2
  exit 1
fi

tenant_slug="$1"
docker_image="$2"
container_name="$3"

if ! [[ "$tenant_slug" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]]; then
  echo "invalid tenant_slug" >&2
  exit 1
fi

if [ -z "$docker_image" ] || [ -z "$container_name" ]; then
  echo "docker_image and container_name are required" >&2
  exit 1
fi

required_env=(DB_HOST DB_NAME DB_USERNAME DB_PASSWORD REDIS_HOST REDIS_PASSWORD)
for name in "${required_env[@]}"; do
  if [ -z "${!name:-}" ]; then
    echo "missing environment variable: $name" >&2
    exit 1
  fi
done

network_name="elevora-${tenant_slug}-network"

if ! docker network inspect "$network_name" >/dev/null 2>&1; then
  docker network create --driver bridge "$network_name" >/dev/null
fi

docker pull "$docker_image" >/dev/null

if docker ps -a --format '{{.Names}}' | grep -Fxq "$container_name"; then
  docker rm -f "$container_name" >/dev/null
fi

container_id="$(
  docker run -d \
    --name "$container_name" \
    --network "$network_name" \
    --memory 512m \
    --cpus 0.5 \
    --restart unless-stopped \
    -e TENANT_SLUG="$tenant_slug" \
    -e DB_HOST="$DB_HOST" \
    -e DB_NAME="$DB_NAME" \
    -e DB_USERNAME="$DB_USERNAME" \
    -e DB_PASSWORD="$DB_PASSWORD" \
    -e REDIS_HOST="$REDIS_HOST" \
    -e REDIS_PASSWORD="$REDIS_PASSWORD" \
    "$docker_image"
)"

if [ -z "$container_id" ]; then
  echo "container start failed" >&2
  exit 1
fi

echo "$container_id"
