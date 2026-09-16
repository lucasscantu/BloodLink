#!/bin/bash

# HospitalChain Database Seed Script
# This script seeds the database with test data
# Usage: chmod +x scripts/seed.sh && ./scripts/seed.sh

set -e

echo "=========================================="
echo "  HospitalChain - Database Seeding"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if we're using Docker
if [ -n "$DOCKER_CONTAINER" ] || docker ps --filter "name=hospitalchain-postgres" --format "{{.Names}}" 2>/dev/null | grep -q "hospitalchain-postgres"; then
    # Using Docker
    echo "Seeding database in Docker..."
    cd "$PROJECT_ROOT/backend"
    docker exec hospitalchain-backend npx prisma db seed 2>&1 || \
    docker exec -it hospitalchain-backend node dist/seeds/seed.js 2>&1 || \
    echo "Manual seeding required"
else
    # Local development
    echo "Seeding database locally..."
    cd "$PROJECT_ROOT/backend"
    npx prisma db seed 2>&1 || true
fi

echo ""
echo "Database seeding completed."
echo ""
