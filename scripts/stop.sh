#!/bin/bash

# HospitalChain Stop Script
# This script stops all HospitalChain services
# Usage: chmod +x scripts/stop.sh && ./scripts/stop.sh

echo "=========================================="
echo "  HospitalChain - Stop All Services"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Stop Docker containers
if command -v docker >/dev/null 2>&1; then
    echo "Stopping Docker containers..."
    cd "$PROJECT_ROOT"
    docker compose down 2>/dev/null || true
    echo "Docker containers stopped"
else
    echo "Docker not available, stopping local processes..."
fi

# Kill local Node processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npx hardhat node" 2>/dev/null || true
pkill -f "node dist/server.js" 2>/dev/null || true

echo ""
echo "All HospitalChain services have been stopped."
echo ""
