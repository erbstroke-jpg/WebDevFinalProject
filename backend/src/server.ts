import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';

const start = async () => {
  try {
    // Проверяем подключение к БД
    await prisma.$connect();
    logger.info('Database connected');

    const app = createApp();
    const httpServer = http.createServer(app);

    // Сюда позже добавим Socket.io: initSocket(httpServer);

    httpServer.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port}`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });

    // Graceful shutdown
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