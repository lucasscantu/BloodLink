import { createApp } from './app';
import { config } from './config';
import { prisma } from './prisma';

const app = createApp();
const PORT = config.server.port;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                               ║
║   🏥 HospitalChain API Server                                ║
║                                                               ║
║   Port: ${PORT}                                            ║
║   Environment: ${config.server.nodeEnv}                              ║
║   Database: Connected                                       ║
║   Blockchain: ${config.blockchain.url}                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export { app };
