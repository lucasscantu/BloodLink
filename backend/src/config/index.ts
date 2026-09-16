import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '4000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  blockchain: {
    url: process.env.BLOCKCHAIN_URL || 'http://localhost:8545',
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '1337'),
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
    contractAddress: process.env.BLOOD_BAG_CONTRACT_ADDRESS || '',
  },
  temperature: {
    min: parseFloat(process.env.TEMP_MIN || '2'),
    max: parseFloat(process.env.TEMP_MAX || '6'),
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

export type Config = typeof config;
