#!/bin/bash

# HospitalChain Initialization Script
# This script sets up and starts all services without Docker
# Usage: chmod +x scripts/init.sh && ./scripts/init.sh

set -e

echo "=========================================="
echo "  HospitalChain - Initialization Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$(id -u)" = "0" ]; then
    echo -e "${RED}ERROR: Do not run as root!${NC}"
    echo "This script should be run as a regular user."
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    echo "npm should be installed with Node.js"
    exit 1
fi

if ! command_exists git; then
    echo -e "${YELLOW}WARNING: git is not installed${NC}"
    echo "git is recommended for version control"
fi

if ! command_exists psql; then
    echo -e "${YELLOW}WARNING: psql (PostgreSQL client) is not installed${NC}"
    echo "PostgreSQL will be started via Docker or needs to be installed locally"
fi

echo -e "${GREEN}✓ All prerequisites checked${NC}"
echo ""

# Step 1: Install dependencies
echo "=========================================="
echo "Step 1: Installing dependencies..."
echo "=========================================="
echo ""

# Backend
echo "Installing backend dependencies..."
cd backend
if [ -f "package-lock.json" ]; then
    npm ci 2>&1 | grep -v "audit\|fund\|deprecated" || true
else
    npm install 2>&1 | grep -v "audit\|fund\|deprecated" || true
fi
cd ..

# Frontend
echo "Installing frontend dependencies..."
cd frontend
if [ -f "package-lock.json" ]; then
    npm ci 2>&1 | grep -v "audit\|fund\|deprecated" || true
else
    npm install 2>&1 | grep -v "audit\|fund\|deprecated" || true
fi
cd ..

# Blockchain
echo "Installing blockchain dependencies..."
cd blockchain
if [ -f "package-lock.json" ]; then
    npm ci 2>&1 | grep -v "audit\|fund\|deprecated" || true
else
    npm install 2>&1 | grep -v "audit\|fund\|deprecated" || true
fi
cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Generate Prisma client
echo "=========================================="
echo "Step 2: Generating Prisma client..."
echo "=========================================="
echo ""

cd backend
npx prisma generate
cd ..

echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Step 3: Compile blockchain contracts
echo "=========================================="
echo "Step 3: Compiling smart contracts..."
echo "=========================================="
echo ""

cd blockchain
npx hardhat compile
cd ..

echo -e "${GREEN}✓ Smart contracts compiled${NC}"
echo ""

# Step 4: Start PostgreSQL
echo "=========================================="
echo "Step 4: Starting PostgreSQL..."
echo "=========================================="
echo ""

# Check if PostgreSQL is running
if command_exists pg_isready; then
    if pg_isready -h localhost -U postgres >/dev/null 2>&1; then
        echo "PostgreSQL is already running"
    else
        # Try to start PostgreSQL via Docker
        if command_exists docker; then
            echo "Starting PostgreSQL with Docker..."
            docker run -d --name hospitalchain-postgres \
                -e POSTGRES_USER=postgres \
                -e POSTGRES_PASSWORD=postgres \
                -e POSTGRES_DB=hospitalchain \
                -p 5432:5432 \
                -v hospitalchain-postgres-data:/var/lib/postgresql/data \
                postgres:15-alpine
            
            # Wait for PostgreSQL to start
            echo "Waiting for PostgreSQL to start..."
            for i in {1..30}; do
                if pg_isready -h localhost -U postgres >/dev/null 2>&1; then
                    echo "PostgreSQL is ready!"
                    break
                fi
                sleep 2
                echo -n "."
            done
        else
            echo -e "${YELLOW}WARNING: Docker is not available${NC}"
            echo "Please ensure PostgreSQL is running locally:"
            echo "  - User: postgres"
            echo "  - Password: postgres"
            echo "  - Database: hospitalchain"
            echo "  - Port: 5432"
        fi
    fi
else
    echo -e "${YELLOW}WARNING: pg_isready not found${NC}"
    echo "PostgreSQL may not be properly configured"
fi

echo ""

# Step 5: Run database migrations
echo "=========================================="
echo "Step 5: Running database migrations..."
echo "=========================================="
echo ""

cd backend
npx prisma migrate dev --name init 2>&1 || npx prisma db push
cd ..

echo -e "${GREEN}✓ Database migrations applied${NC}"
echo ""

# Step 6: Deploy smart contracts
echo "=========================================="
echo "Step 6: Deploying smart contracts..."
echo "=========================================="
echo ""

cd blockchain
# Start Hardhat node in background
npx hardhat node --host 0.0.0.0 &
HARDHAT_PID=$!

# Wait for Hardhat to start
echo "Waiting for Hardhat node to start..."
sleep 5

# Deploy contracts
npx hardhat run scripts/deploy.ts --network localhost

# Kill Hardhat node (we'll restart it properly later)
kill $HARDHAT_PID 2>/dev/null || true

cd ..

echo -e "${GREEN}✓ Smart contracts deployed${NC}"
echo ""

# Step 7: Start services
echo "=========================================="
echo "Step 7: Starting services..."
echo "=========================================="
echo ""

# Create logs directory
mkdir -p logs

# Start Hardhat node in background
echo "Starting Hardhat node..."
cd blockchain
nohup npx hardhat node --host 0.0.0.0 > ../logs/blockchain.log 2>&1 &
BLOCKCHAIN_PID=$!
echo "Hardhat node started (PID: $BLOCKCHAIN_PID)"
cd ..

# Wait a bit
sleep 3

# Start backend in background
echo "Starting backend server..."
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend server started (PID: $BACKEND_PID)"
cd ..

# Wait a bit
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend server started (PID: $FRONTEND_PID)"
cd ..

# Wait a bit
sleep 2

echo ""
echo -e "${GREEN}=========================================="${NC}
echo -e "${GREEN}  HospitalChain is now running!"${NC}
echo -e "${GREEN}=========================================="${NC}
echo ""
echo "Services:"
echo "  🔗 Blockchain: http://localhost:8545"
echo "  🚀 Backend API: http://localhost:4000"
echo "  🌐 Frontend: http://localhost:3000"
echo ""
echo "Logs:"
echo "  📝 Blockchain: logs/blockchain.log"
echo "  📝 Backend: logs/backend.log"
echo "  📝 Frontend: logs/frontend.log"
echo ""
echo "To stop all services:"
echo "  ./scripts/stop.sh"
echo ""
echo "Or manually:"
echo "  kill $BLOCKCHAIN_PID $BACKEND_PID $FRONTEND_PID"
echo ""
