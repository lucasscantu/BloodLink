#!/bin/bash

# HospitalChain Development Script
# This script provides a simple way to run all services for development
# Usage: chmod +x scripts/dev.sh && ./scripts/dev.sh

set -e

echo "=========================================="
echo "  HospitalChain - Development Mode"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to check if a port is in use
port_in_use() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :$port >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep ":$port " >/dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -tuln | grep ":$port " >/dev/null 2>&1
    else
        # Fallback: try to connect
        (echo >/dev/tcp/localhost/$port) &>/dev/null
    fi
}

# Function to wait for a port
wait_for_port() {
    local port=$1
    local service=$2
    local max_attempts=${3:-30}
    local attempt=0
    
    echo "Waiting for $service on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if port_in_use $port; then
            echo -e "${GREEN}✓ $service is ready on port $port${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    
    echo -e "${RED}✗ $service failed to start on port $port${NC}"
    return 1
}

# Check if Docker is available
if command -v docker >/dev/null 2>&1 && [ -f /var/run/docker.sock ]; then
    USE_DOCKER=true
else
    USE_DOCKER=false
fi

if [ "$USE_DOCKER" = true ]; then
    echo "Docker detected! Using Docker Compose..."
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Start with Docker Compose
    echo "Starting services with Docker Compose..."
    docker compose down 2>/dev/null || true
    docker compose build --no-cache 2>&1 | grep -v "buildx\|BuildKit" || true
    docker compose up -d
    
    echo ""
    echo "Waiting for services to start..."
    echo ""
    
    # Wait for services
    wait_for_port 5432 "PostgreSQL" 30
    wait_for_port 8545 "Blockchain" 30
    wait_for_port 4000 "Backend" 30
    wait_for_port 3000 "Frontend" 30
    
    echo ""
    echo -e "${GREEN}=========================================="${NC}
    echo -e "${GREEN}  HospitalChain is running with Docker!"${NC}
    echo -e "${GREEN}=========================================="${NC}
    echo ""
    echo "Services:"
    echo "  🗄️  PostgreSQL: http://localhost:5432"
    echo "  🔗 Blockchain: http://localhost:8545"
    echo "  🚀 Backend:   http://localhost:4000"
    echo "  🌐 Frontend:  http://localhost:3000"
    echo ""
    echo "To stop:"
    echo "  docker compose down"
    echo "  OR"
    echo "  ./scripts/stop.sh"
    echo ""
    
else
    echo "Docker not available. Using local development mode..."
    echo ""
    
    # Check prerequisites
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}ERROR: Node.js is not installed${NC}"
        echo "Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${RED}ERROR: npm is not installed${NC}"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Create logs directory
    mkdir -p logs
    
    # Open multiple terminal windows/tabs
    echo "Starting services in separate terminal windows..."
    echo ""
    
    # Method 1: Using setsid to run in background
    echo "Starting PostgreSQL..."
    if command -v pg_isready >/dev/null 2>&1 && pg_isready -h localhost -U postgres >/dev/null 2>&1; then
        echo "PostgreSQL is already running"
    else
        echo -e "${YELLOW}WARNING: PostgreSQL is not running${NC}"
        echo "Please start PostgreSQL manually or use Docker"
    fi
    
    echo ""
    
    # Start Hardhat node
    echo "Starting Blockchain (Hardhat)..."
    cd blockchain
    nohup npx hardhat node --host 0.0.0.0 > ../logs/blockchain.log 2>&1 &
    BLOCKCHAIN_PID=$!
    echo "  Blockchain PID: $BLOCKCHAIN_PID"
    cd ..
    
    # Start backend
    echo "Starting Backend..."
    cd backend
    nohup npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "  Backend PID: $BACKEND_PID"
    cd ..
    
    # Start frontend
    echo "Starting Frontend..."
    cd frontend
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "  Frontend PID: $FRONTEND_PID"
    cd ..
    
    echo ""
    echo "Waiting for services to start..."
    echo ""
    
    # Wait for services
    wait_for_port 8545 "Blockchain" 30
    wait_for_port 4000 "Backend" 30
    wait_for_port 3000 "Frontend" 30
    
    echo ""
    echo -e "${GREEN}=========================================="${NC}
    echo -e "${GREEN}  HospitalChain is running!"${NC}
    echo -e "${GREEN}=========================================="${NC}
    echo ""
    echo "Services:"
    echo "  🔗 Blockchain: http://localhost:8545"
    echo "  🚀 Backend:   http://localhost:4000"
    echo "  🌐 Frontend:  http://localhost:3000"
    echo ""
    echo "Logs:"
    echo "  📝 Blockchain: logs/blockchain.log"
    echo "  📝 Backend:   logs/backend.log"
    echo "  📝 Frontend:  logs/frontend.log"
    echo ""
    echo "To stop:"
    echo "  ./scripts/stop.sh"
    echo ""
    echo "Process IDs:"
    echo "  Blockchain: $BLOCKCHAIN_PID"
    echo "  Backend:   $BACKEND_PID"
    echo "  Frontend:  $FRONTEND_PID"
    echo ""
fi

# Tail logs
read -p "Show logs? (y/n): " show_logs
if [ "$show_logs" = "y" ] || [ "$show_logs" = "Y" ]; then
    echo ""
    echo "Tail logs (Ctrl+C to stop):"
    echo ""
    tail -f logs/*.log
fi
