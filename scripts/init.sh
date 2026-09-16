#!/bin/bash

# HospitalChain Initialization Script
# This script performs a complete initialization of the HospitalChain application
# Usage: chmod +x scripts/init.sh && ./scripts/init.sh

set -e

echo "=========================================="
echo "  HospitalChain - Complete Initialization"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker is available
check_docker() {
    if command_exists docker && docker ps >/dev/null 2>&1; then
        echo "Docker is available"
        return 0
    else
        echo "Docker is not available"
        return 1
    fi
}

echo "Checking prerequisites..."

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}ERROR: Node.js is required but not found${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
if ! command_exists npm; then
    echo -e "${RED}ERROR: npm is required but not found${NC}"
    exit 1
fi

# Check git
if ! command_exists git; then
    echo -e "${RED}ERROR: git is required but not found${NC}"
    exit 1
fi

# Check Docker
if check_docker; then
    echo -e "${GREEN}Docker: Available${NC}"
    USE_DOCKER=true
else
    echo -e "${YELLOW}Docker: Not available - will use local development${NC}"
    USE_DOCKER=false
fi

echo ""

# Initialize database
if [ "$USE_DOCKER" = true ]; then
    echo "Starting services with Docker..."
    cd "$PROJECT_ROOT"
    
    # Clean up any existing containers
    echo "Cleaning up existing containers..."
    docker compose down 2>/dev/null || true
    
    # Build and start containers
    echo "Building and starting containers..."
    docker compose build --no-cache 2>&1 | grep -v "audit\|fund\|deprecated" || true
    docker compose up -d 2>&1 | grep -v "audit\|fund\|deprecated" || true
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to start..."
    for i in {1..30}; do
        if docker exec hospitalchain-postgres pg_isready -U postgres >/dev/null 2>&1; then
            echo -e "${GREEN}PostgreSQL is ready${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    # Wait for backend to be ready
    echo "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:4000/health >/dev/null 2>&1; then
            echo -e "${GREEN}Backend is ready${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    # Wait for blockchain to be ready
    echo "Waiting for blockchain to start..."
    for i in {1..30}; do
        if curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' >/dev/null 2>&1; then
            echo -e "${GREEN}Blockchain is ready${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    # Wait for frontend to be ready
    echo "Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo -e "${GREEN}Frontend is ready${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
else
    echo "Starting services locally..."
    
    # Start PostgreSQL locally if possible
    if command_exists pg_ctl; then
        echo "Starting PostgreSQL..."
        pg_ctl start -D /usr/local/var/postgres 2>/dev/null || true
    fi
    
    # Install dependencies and start backend
    echo "Starting backend..."
    cd "$PROJECT_ROOT/backend"
    npm install 2>&1 | grep -v "audit\|fund\|deprecated" || true
    npx prisma generate
    npx prisma migrate dev --name init 2>/dev/null || true
    npm run dev &
    BACKEND_PID=$!
    
    # Start blockchain
    echo "Starting blockchain..."
    cd "$PROJECT_ROOT/blockchain"
    npm install 2>&1 | grep -v "audit\|fund\|deprecated" || true
    npx hardhat node --host 0.0.0.0 &
    BLOCKCHAIN_PID=$!
    
    # Start frontend
    echo "Starting frontend..."
    cd "$PROJECT_ROOT/frontend"
    npm install 2>&1 | grep -v "audit\|fund\|deprecated" || true
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for services
    echo "Waiting for services to start..."
    sleep 10
fi

echo ""
echo "=========================================="
echo "  Initialization Summary"
echo "=========================================="
echo ""

if [ "$USE_DOCKER" = true ]; then
    echo "Docker containers:"
    docker ps --filter "name=hospitalchain-*" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
else
    echo "Local processes:"
    echo "  Backend: PID $BACKEND_PID"
    echo "  Blockchain: PID $BLOCKCHAIN_PID"
    echo "  Frontend: PID $FRONTEND_PID"
fi

echo ""
echo "Services should be available at:"
echo "  Backend API: http://localhost:4000"
echo "  Frontend: http://localhost:3000"
echo "  Blockchain: http://localhost:8545"
echo ""
echo "=========================================="
echo "  HospitalChain is ready!"
echo "=========================================="
echo ""

# Run verification
cd "$PROJECT_ROOT"
if [ -f "$SCRIPT_DIR/verify.sh" ]; then
    echo "Running connection verification..."
    bash "$SCRIPT_DIR/verify.sh"
fi
