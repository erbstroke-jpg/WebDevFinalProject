import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';
import { initSocket } from './socket';

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    const app = createApp();
    const httpServer = http.createServer(app);

    initSocket(httpServer);
    logger.info('Socket.io initialized');

    httpServer.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port}`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down...`);
      httpServer.close(() => logger.info('HTTP server closed'));
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();