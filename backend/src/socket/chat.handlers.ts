import { Server } from 'socket.io';
import { AuthedSocket } from './auth.socket';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

interface SendMessagePayload {
  chatId: string;
  topicId?: string | null;
  content: string;
  replyToId?: string | null;
}

export const registerChatHandlers = (io: Server, socket: AuthedSocket) => {
  const { userId } = socket.data;

  // Отправка сообщения
  socket.on('message:send', async (payload: SendMessagePayload, ack?: (res: unknown) => void) => {
    try {
      const { chatId, content, replyToId } = payload;

      if (!content?.trim()) {
        return ack?.({ ok: false, error: 'Empty message' });
      }

      // Проверка членства в чате
      const member = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId } },
      });
      if (!member) {
        return ack?.({ ok: false, error: 'Not a member of this chat' });
      }

      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          content: content.trim(),
          type: 'TEXT',
          replyToId: replyToId || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          replyTo: {
            include: {
              sender: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      });

      // Обновим updatedAt чата (для сортировки списка чатов)
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      // Рассылаем всем в комнате чата
      io.to(`chat:${chatId}`).emit('message:new', message);
      ack?.({ ok: true, message });
    } catch (error) {
      logger.error('message:send error', error);
      ack?.({ ok: false, error: 'Internal error' });
    }
  });

  // Индикатор «печатает»
  socket.on('typing:start', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('typing:start', {
      chatId,
      userId,
      username: socket.data.username,
    });
  });

  socket.on('typing:stop', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
  });

  // Прочитано до сообщения
  socket.on(
    'message:read',
    async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      try {
        await prisma.chatMember.update({
          where: { chatId_userId: { chatId, userId } },
          data: { lastReadMessageId: messageId },
        });

        socket.to(`chat:${chatId}`).emit('message:read', {
          chatId,
          messageId,
          userId,
        });
      } catch (error) {
        logger.error('message:read error', error);
      }
    }
  );
};