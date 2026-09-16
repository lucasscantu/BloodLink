# HospitalChain Scripts

This directory contains helper scripts for development, testing, and deployment.

## Available Scripts

### 1. `init.sh` - Full Initialization

Sets up and starts all HospitalChain services without Docker.

**Usage:**
```bash
chmod +x scripts/init.sh
./scripts/init.sh
```

This script:
- Checks prerequisites (Node.js, npm, etc.)
- Installs all dependencies
- Generates Prisma client
- Compiles smart contracts
- Starts PostgreSQL (via Docker if available)
- Runs database migrations
- Deploys smart contracts
- Starts all services (blockchain, backend, frontend)

### 2. `dev.sh` - Development Mode

Starts all services for development. Automatically detects if Docker is available.

**Usage:**
```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

**Options:**
- If Docker is available, uses `docker compose up -d`
- If Docker is not available, starts services locally with `nohup`
- Prompts to show logs after starting

### 3. `stop.sh` - Stop All Services

Stops all HospitalChain services (both Docker and local).

**Usage:**
```bash
chmod +x scripts/stop.sh
./scripts/stop.sh
```

This script:
- Stops Node.js processes
- Stops Docker containers
- Cleans up resources

### 4. `seed.sh` - Seed Database

Populates the database with sample data for development and testing.

**Usage:**
```bash
chmod +x scripts/seed.sh
./scripts/seed.sh
```

**Data Created:**
- 3 Institutions (1 Hemocentro, 2 Hospitals)
- 5 Users (Admin, Hemocentro, Hospital A, Hospital B, Auditor)
- 23 Blood Bags (20 random + 3 specific for testing)
- 2 Demands
- Events for blood bags
- Temperature readings

**Login Credentials:**
| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@hospitalchain.com | admin123 | ADMIN |
| Hemocentro | user@hemocentro.sp.gov.br | hemocentro123 | HEMOCENTRO |
| Hospital A | user@hospitala.sp.gov.br | hospitala123 | HOSPITAL |
| Hospital B | user@hospitalb.sp.gov.br | hospitalb123 | HOSPITAL |
| Auditor | auditor@saude.gov.br | auditor123 | AUDITOR |

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/lucasscantu/BloodLink.git
cd BloodLink

# Make scripts executable
chmod +x scripts/*.sh

# Start with Docker
./scripts/dev.sh

# Or manually:
docker compose down
docker compose build
docker compose up -d
```

### Without Docker

```bash
# Clone the repository
git clone https://github.com/lucasscantu/BloodLink.git
cd BloodLink

# Make scripts executable
chmod +x scripts/*.sh

# Start services
./scripts/dev.sh
```

## Troubleshooting

### Docker Issues

If Docker containers fail to start:

1. **Docker Daemon Not Running:**
   ```bash
   sudo systemctl start docker
   ```

2. **Port Already in Use:**
   ```bash
   sudo lsof -i :5432  # Check PostgreSQL port
   sudo kill <PID>    # Kill conflicting process
   ```

3. **Permission Issues:**
   ```bash
   sudo chmod 666 /var/run/docker.sock
   ```

### Node.js Issues

1. **Node.js Not Installed:**
   ```bash
   # Install Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
   ```

2. **npm Install Fails:**
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

### Database Issues

1. **PostgreSQL Not Running:**
   ```bash
   # Start PostgreSQL via Docker
   docker run -d --name hospitalchain-postgres \
       -e POSTGRES_USER=postgres \
       -e POSTGRES_PASSWORD=postgres \
       -e POSTGRES_DB=hospitalchain \
       -p 5432:5432 \
       postgres:15-alpine
   ```

2. **Prisma Migration Issues:**
   ```bash
   cd backend
   npx prisma migrate reset
   npx prisma migrate dev
   ```

### Blockchain Issues

1. **Hardhat Node Not Starting:**
   ```bash
   cd blockchain
   npx hardhat node --host 0.0.0.0
   ```

2. **Contract Deployment Fails:**
   ```bash
   cd blockchain
   npx hardhat clean
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network localhost
   ```

## Environment Variables

The following environment variables are used:

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT secret key
- `BLOCKCHAIN_URL`: Blockchain node URL
- `BLOCKCHAIN_CHAIN_ID`: Blockchain chain ID (1337 for local)
- `PORT`: Backend port (4000)
- `NODE_ENV`: Environment (development/production)

### Frontend
- `VITE_API_URL`: Backend API URL
- `VITE_BLOCKCHAIN_URL`: Blockchain URL

### Blockchain
- Default Hardhat configuration uses port 8545

## Clean Up

To completely clean up and start fresh:

```bash
# Stop all services
./scripts/stop.sh

# Remove Docker containers and volumes
docker compose down -v

# Remove node_modules
rm -rf backend/node_modules frontend/node_modules blockchain/node_modules

# Remove logs
rm -rf logs

# Remove database data
docker volume rm hospitalchain-postgres-data
```

## Notes

- All scripts require Node.js 20+ and npm
- Docker is recommended but not required
- The `init.sh` script is the most comprehensive and handles everything
- Use `dev.sh` for day-to-day development
- Use `seed.sh` to reset the database with test data
