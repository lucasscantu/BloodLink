#!/bin/bash

# HospitalChain Test Script
# This script runs all tests for the HospitalChain application
# Usage: chmod +x scripts/test.sh && ./scripts/test.sh

set -e

echo "=========================================="
echo "  HospitalChain - Test Suite"
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

# Function to run a test suite
run_tests() {
    local service=$1
    local directory=$2
    local command=$3
    
    echo -e "${BLUE}=========================================="${NC}
    echo -e "${BLUE}  Testing: $service"${NC}
    echo -e "${BLUE}=========================================="${NC}
    echo ""
    
    cd "$PROJECT_ROOT/$directory"
    
    if [ -f "package.json" ]; then
        echo "Installing dependencies..."
        npm install 2>&1 | grep -v "audit\|fund\|deprecated" || true
        echo ""
    fi
    
    echo "Running tests..."
    if eval "$command"; then
        echo -e "${GREEN}✓ $service tests passed${NC}"
    else
        echo -e "${RED}✗ $service tests failed${NC}"
        return 1
    fi
    
    echo ""
    cd "$PROJECT_ROOT"
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites checked${NC}"
echo ""

# Check if PostgreSQL is running
echo "Checking PostgreSQL..."
if command_exists pg_isready; then
    if pg_isready -h localhost -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${YELLOW}WARNING: PostgreSQL is not running${NC}"
        echo "Starting PostgreSQL with Docker..."
        docker run -d --name hospitalchain-postgres-test \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=hospitalchain \
            -p 5432:5432 \
            postgres:15-alpine
        
        echo "Waiting for PostgreSQL to start..."
        for i in {1..30}; do
            if pg_isready -h localhost -U postgres >/dev/null 2>&1; then
                echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
                break
            fi
            sleep 2
            echo -n "."
        done
    fi
else
    echo -e "${YELLOW}WARNING: pg_isready not found${NC}"
fi

echo ""

# Generate Prisma client
echo "Generating Prisma client..."
cd "$PROJECT_ROOT/backend"
npx prisma generate
cd "$PROJECT_ROOT"
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Run tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Backend tests
echo "=========================================="
echo "  BACKEND TESTS"
echo "=========================================="
echo ""

if run_tests "Backend Unit Tests" "backend" "npm test"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Blockchain tests
echo "=========================================="
echo "  BLOCKCHAIN TESTS"
echo "=========================================="
echo ""

# Start Hardhat node in background for testing
cd "$PROJECT_ROOT/blockchain"
npx hardhat node --host 0.0.0.0 &
HARDHAT_PID=$!

# Wait for Hardhat to start
echo "Waiting for Hardhat node to start..."
sleep 5

if run_tests "Blockchain Smart Contract Tests" "blockchain" "npx hardhat test"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Kill Hardhat node
kill $HARDHAT_PID 2>/dev/null || true
cd "$PROJECT_ROOT"

echo ""
echo "=========================================="
echo "  TEST SUMMARY"
echo "=========================================="
echo ""
echo "Total test suites: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}=========================================="${NC}
    echo -e "${GREEN}  ✓ ALL TESTS PASSED!"${NC}
    echo -e "${GREEN}=========================================="${NC}
    exit 0
else
    echo -e "${RED}=========================================="${NC}
    echo -e "${RED}  ✗ SOME TESTS FAILED"${NC}
    echo -e "${RED}=========================================="${NC}
    exit 1
fi
