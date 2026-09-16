#!/bin/bash

# HospitalChain Stop Script
# This script stops all HospitalChain services
# Usage: chmod +x scripts/stop.sh && ./scripts/stop.sh

set -e

echo "=========================================="
echo "  HospitalChain - Stop Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill a process by name
kill_process() {
    local process_name=$1
    local pids
    pids=$(pgrep -f "$process_name" | grep -v "grep" | grep -v "stop.sh")
    
    if [ -z "$pids" ]; then
        echo "No $process_name processes found"
    else
        echo "Stopping $process_name..."
        for pid in $pids; do
            kill "$pid" 2>/dev/null || true
            echo "  Killed PID: $pid"
        done
    fi
}

# Stop Node.js processes
echo "Stopping Node.js processes..."
kill_process "node"
sleep 1

# Force kill if still running
echo "Checking for remaining processes..."
kill_process "npx hardhat node"
kill_process "tsx watch"
kill_process "vite"

# Stop Docker containers if available
if command -v docker >/dev/null 2>&1; then
    echo ""
    echo "Stopping Docker containers..."
    docker compose down 2>/dev/null || true
    docker stop hospitalchain-postgres 2>/dev/null || true
    docker stop hospitalchain-backend 2>/dev/null || true
    docker stop hospitalchain-blockchain 2>/dev/null || true
    docker stop hospitalchain-frontend 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}✓ All HospitalChain services stopped${NC}"
echo ""
