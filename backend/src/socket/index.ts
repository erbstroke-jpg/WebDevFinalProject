import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { socketAuthMiddleware, AuthedSocket } from './auth.socket';
import { registerChatHandlers } from './chat.handlers';
import { presence } from './presence';
import { prisma } from '../config/prisma';

let io: Server;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const authed = socket as AuthedSocket;
    const { userId, username } = authed.data;
    logger.info(`Socket connected: ${username} (${socket.id})`);

    // Регистрируем presence
    presence.add(userId, socket.id);
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'online' },
    });

    // Личная комната — для адресных уведомлений
    socket.join(`user:${userId}`);

    // Авто-подписка на все чаты пользователя
    const memberships = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true },
    });
    memberships.forEach((m) => socket.join(`chat:${m.chatId}`));

    // Сообщаем всем «онлайн»
    io.emit('user:online', { userId });

    // Регистрируем обработчики событий
    registerChatHandlers(io, authed);

    socket.on('disconnect', async () => {
      const wentOffline = await presence.remove(userId, socket.id);
      if (wentOffline) {
        io.emit('user:offline', { userId, lastSeenAt: new Date() });
      }
      logger.info(`Socket disconnected: ${username} (${socket.id})`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};