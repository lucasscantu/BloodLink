# Use Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Compile contracts
RUN npx hardhat compile

# Expose port
EXPOSE 8545

# Start Hardhat node
CMD ["npx", "hardhat", "node"]
