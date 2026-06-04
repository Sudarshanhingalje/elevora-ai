#!/bin/bash
# Production Deployment Script for Elevora AI
set -e

echo "=== Elevora AI Production Deployment Starting ==="

# 1. Load Environment Variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "ERROR: .env file not found. Create it from .env.example before deploying."
    exit 1
fi

# 2. Build Frontend Assets
echo "--- Building Frontend Assets ---"
cd frontend
npm install
npm run build
cd ..

# 3. Compile and Package Backend
echo "--- Packaging Spring Boot Backend ---"
cd backend
./gradlew bootJar --no-daemon
cd ..

# 4. Stop existing containers (if any)
echo "--- Stopping Existing Services ---"
docker compose -f production-docker-compose.yml down --remove-orphans

# 5. Build and Start Production Containers
echo "--- Starting Production Services ---"
docker compose -f production-docker-compose.yml up -d --build

# 6. Verify Deployments
echo "--- Verifying Container Status ---"
sleep 5
docker compose -f production-docker-compose.yml ps

echo "=== Elevora AI Production Deployment Complete ==="
