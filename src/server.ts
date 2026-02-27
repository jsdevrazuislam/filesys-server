import app from './app';
import { env } from './config';
import prisma from './config/db';
import logger from './utils/logger';

// BigInt polyfill moved to app.ts

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('🚀 Database connected successfully');

    app.listen(env.PORT, () => {
      logger.info(
        `✅ Server is running on port http://localhost:${env.PORT} in ${env.NODE_ENV} mode`,
      );
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
