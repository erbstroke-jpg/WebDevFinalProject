import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // чтобы фронт мог тянуть аватары
    })
  );
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  // Раздача загруженных файлов
  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  // Healthcheck
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes — будем подключать по мере готовности модулей
  // app.use('/api/auth', authRoutes);
  // app.use('/api/users', usersRoutes);
  // app.use('/api/chats', chatsRoutes);
  // ...

  // 404 + ошибки — всегда последними
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};