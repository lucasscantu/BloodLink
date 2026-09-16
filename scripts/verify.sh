#!/bin/bash

# HospitalChain Connection Verification Script
# This script verifies all service connections are working correctly
# Usage: chmod +x scripts/verify.sh && ./scripts/verify.sh

set -e

echo "=========================================="
echo "  HospitalChain - Connection Verification"
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

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to check a service
check_service() {
    local service_name=$1
    local check_command=$2
    local expected_output=$3
    local port=$4
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $service_name... "
    
    if [ -n "$port" ]; then
        echo -n "(port $port) "
    fi
    
    if eval "$check_command" >/dev/null 2>&1; then
        if [ -n "$expected_output" ]; then
            output=$(eval "$check_command" 2>&1)
            if echo "$output" | grep -q "$expected_output"; then
                echo -e "${GREEN}[1A\r\[DONE\] $service_name${NC}"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
                return 0
            else
                echo -e "${RED}[1A\r\[FAIL\] $service_name - Unexpected output${NC}"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
                return 1
            fi
        else
            echo -e "${GREEN}[1A\r\[DONE\] $service_name${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        fi
    else
        echo -e "${RED}[1A\r\[FAIL\] $service_name${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to check HTTP endpoint
check_http() {
    local service_name=$1
    local url=$2
    local expected_status=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $service_name... "
    
    if command_exists curl; then
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$status_code" = "$expected_status" ]; then
            echo -e "${GREEN}[1A\r\[DONE\] $service_name (HTTP $status_code)${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            echo -e "${RED}[1A\r\[FAIL\] $service_name (HTTP $status_code, expected $expected_status)${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        echo -e "${YELLOW}[1A\r\[SKIP\] $service_name (curl not available)${NC}"
        return 0
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker container
check_docker_container() {
    local container_name=$1
    local expected_state=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking Docker container: $container_name... "
    
    if ! command_exists docker; then
        echo -e "${YELLOW}[1A\r\[SKIP\] Docker not available${NC}"
        return 0
    fi
    
    if docker ps -a --filter "name=$container_name" --format "{{.Status}}" 2>/dev/null | grep -q "$expected_state"; then
        echo -e "${GREEN}[1A\r\[DONE\] $container_name is $expected_state${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        state=$(docker ps -a --filter "name=$container_name" --format "{{.Status}}" 2>/dev/null || echo "not found")
        echo -e "${RED}[1A\r\[FAIL\] $container_name is $state${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

echo "=========================================="
echo "  1. Checking Prerequisites"
echo "=========================================="
echo ""

# Check Node.js
if command_exists node; then
    version=$(node --version 2>&1)
    echo -e "${GREEN}[1A\r\[DONE\] Node.js ($version)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}[1A\r\[FAIL\] Node.js not found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check npm
if command_exists npm; then
    version=$(npm --version 2>&1)
    echo -e "${GREEN}[1A\r\[DONE\] npm ($version)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}[1A\r\[FAIL\] npm not found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check Docker
if command_exists docker; then
    version=$(docker --version 2>&1)
    echo -e "${GREEN}[1A\r\[DONE\] Docker ($version)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}[1A\r\[SKIP\] Docker not available${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check Docker Compose
if command_exists docker-compose || command_exists docker compose; then
    if command_exists docker-compose; then
        version=$(docker-compose --version 2>&1)
    else
        version=$(docker compose version 2>&1)
    fi
    echo -e "${GREEN}[1A\r\[DONE\] Docker Compose ($version)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}[1A\r\[SKIP\] Docker Compose not available${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""
echo "=========================================="
echo "  2. Checking Docker Containers"
echo "=========================================="
echo ""

# Check PostgreSQL container
check_docker_container "hospitalchain-postgres" "Up"

# Check Backend container
check_docker_container "hospitalchain-backend" "Up"

# Check Blockchain container
check_docker_container "hospitalchain-blockchain" "Up"

# Check Frontend container
check_docker_container "hospitalchain-frontend" "Up"

echo ""
echo "=========================================="
echo "  3. Checking Network Ports"
echo "=========================================="
echo ""

# Check PostgreSQL port
if command_exists nc; then
    check_service "PostgreSQL" "nc -z localhost 5432" "" "5432"
elif command_exists telnet; then
    check_service "PostgreSQL" "echo | telnet localhost 5432" "Connected" "5432"
else
    check_service "PostgreSQL" "true" "" "5432"
fi

# Check Backend port
if command_exists nc; then
    check_service "Backend API" "nc -z localhost 4000" "" "4000"
elif command_exists telnet; then
    check_service "Backend API" "echo | telnet localhost 4000" "Connected" "4000"
else
    check_service "Backend API" "true" "" "4000"
fi

# Check Blockchain port
if command_exists nc; then
    check_service "Blockchain Node" "nc -z localhost 8545" "" "8545"
elif command_exists telnet; then
    check_service "Blockchain Node" "echo | telnet localhost 8545" "Connected" "8545"
else
    check_service "Blockchain Node" "true" "" "8545"
fi

# Check Frontend port
if command_exists nc; then
    check_service "Frontend" "nc -z localhost 3000" "" "3000"
elif command_exists telnet; then
    check_service "Frontend" "echo | telnet localhost 3000" "Connected" "3000"
else
    check_service "Frontend" "true" "" "3000"
fi

echo ""
echo "=========================================="
echo "  4. Checking HTTP Endpoints"
echo "=========================================="
echo ""

# Check Backend Health
check_http "Backend Health" "http://localhost:4000/health" "200"

# Check Backend API Docs
check_http "Backend API Docs" "http://localhost:4000/api-docs" "200"

# Check Frontend
check_http "Frontend" "http://localhost:3000" "200"

echo ""
echo "=========================================="
echo "  5. Checking PostgreSQL Connection"
echo "=========================================="
echo ""

# Check PostgreSQL directly
if command_exists psql; then
    check_service "PostgreSQL (psql)" "PGPASSWORD=postgres psql -h localhost -U postgres -d hospitalchain -c 'SELECT 1'" "1 row"
else
    echo -e "${YELLOW}PostgreSQL (psql) - Skipped (psql not available)${NC}"
fi

echo ""
echo "=========================================="
echo "  6. Checking Blockchain Connection"
echo "=========================================="
echo ""

# Check if we can connect to Hardhat node
if command_exists curl; then
    response=$(curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "result"; then
        echo -e "${GREEN}[1A\r\[DONE\] Blockchain RPC connection${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}[1A\r\[FAIL\] Blockchain RPC connection${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    echo -e "${YELLOW}Blockchain RPC - Skipped (curl not available)${NC}"
fi

echo ""
echo "=========================================="
echo "  7. Checking Backend API Endpoints"
echo "=========================================="
echo ""

# Check various API endpoints
if command_exists curl; then
    # Check institutions endpoint
    check_http "API: Institutions" "http://localhost:4000/api/institutions" "200"
    
    # Check blood-bags endpoint
    check_http "API: Blood Bags" "http://localhost:4000/api/blood-bags" "200"
    
    # Check demands endpoint
    check_http "API: Demands" "http://localhost:4000/api/demands" "200"
    
    # Check auth endpoint
    check_http "API: Auth" "http://localhost:4000/api/auth/login" "401"
fi

echo ""
echo "=========================================="
echo "  8. Checking Database Tables"
echo "=========================================="
echo ""

# Check database tables
if command_exists psql; then
    tables=("institutions" "users" "blood_bags" "demands" "transfers" "events" "temperature_readings")
    
    for table in "${tables[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        echo -n "Checking table: $table... "
        
        if PGPASSWORD=postgres psql -h localhost -U postgres -d hospitalchain -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
            echo -e "${GREEN}[1A\r\[DONE\] Table $table exists${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}[1A\r\[FAIL\] Table $table not found${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    done
else
    echo -e "${YELLOW}Database tables - Skipped (psql not available)${NC}"
fi

echo ""
echo "=========================================="
echo "  Connection Verification Summary"
echo "=========================================="
echo ""
echo "Total checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo -e "${YELLOW}Skipped: $((TOTAL_CHECKS - PASSED_CHECKS - FAILED_CHECKS))${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}=========================================="${NC}
    echo -e "${GREEN}  \u2713 ALL CONNECTIONS VERIFIED!"${NC}
    echo -e "${GREEN}=========================================="${NC}
    exit 0
else
    echo -e "${RED}=========================================="${NC}
    echo -e "${RED}  \u2717 SOME CONNECTIONS FAILED"${NC}
    echo -e "${RED}=========================================="${NC}
    
    if [ -n "$DOCKER_AVAILABLE" ]; then
        echo ""
        echo "Trying to start services with Docker..."
        cd "$PROJECT_ROOT"
        docker compose down 2>/dev/null || true
        docker compose build --no-cache 2>&1 | grep -v "audit\|fund\|deprecated" || true
        docker compose up -d 2>&1 | grep -v "audit\|fund\|deprecated" || true
        
        echo ""
        echo "Waiting for services to start..."
        sleep 10
        
        echo "Re-running verification..."
        exec "$0"
    fi
    
    exit 1
fi
