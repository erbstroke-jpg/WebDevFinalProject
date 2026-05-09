import { Server } from 'socket.io';
import { AuthedSocket } from './auth.socket';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { MessageType } from '@prisma/client';

interface SendMessagePayload {
  chatId: string;
  topicId?: string | null;
  content?: string;
  replyToId?: string | null;
  attachment?: {
    url: string;
    fileName: string;
    fileSize: number;
    fileMimeType: string;
    messageType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  };
}

export const registerChatHandlers = (io: Server, socket: AuthedSocket) => {
  const { userId } = socket.data;

  socket.on('message:send', async (payload: SendMessagePayload, ack?: (res: unknown) => void) => {
    try {
      const { chatId, topicId, content, replyToId, attachment } = payload;

      if (!content?.trim() && !attachment) {
        return ack?.({ ok: false, error: 'Empty message' });
      }

      const member = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId } },
      });
      if (!member) return ack?.({ ok: false, error: 'Not a member of this chat' });

      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return ack?.({ ok: false, error: 'Chat not found' });

      if (chat.isSupergroup && !topicId) {
        return ack?.({ ok: false, error: 'topicId is required in supergroups' });
      }
      if (!chat.isSupergroup && topicId) {
        return ack?.({ ok: false, error: 'topicId not allowed in this chat type' });
      }

      const type: MessageType = attachment ? attachment.messageType : 'TEXT';

      const message = await prisma.message.create({
        data: {
          chatId,
          topicId: topicId || null,
          senderId: userId,
          content: content?.trim() || null,
          type,
          replyToId: replyToId || null,
          fileUrl: attachment?.url || null,
          fileName: attachment?.fileName || null,
          fileSize: attachment?.fileSize || null,
          fileMimeType: attachment?.fileMimeType || null,
        },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          replyTo: {
            include: {
              sender: { select: { id: true, username: true, displayName: true } },
            },
          },
          reads: { select: { userId: true, readAt: true } },
        },
      });

      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      io.to(`chat:${chatId}`).emit('message:new', message);
      ack?.({ ok: true, message });
    } catch (error) {
      logger.error('message:send error', error);
      ack?.({ ok: false, error: 'Internal error' });
    }
  });

  socket.on('typing:start', ({ chatId, topicId }: { chatId: string; topicId?: string }) => {
    socket.to(`chat:${chatId}`).emit('typing:start', {
      chatId,
      topicId: topicId || null,
      userId,
      username: socket.data.username,
    });
  });

  socket.on('typing:stop', ({ chatId, topicId }: { chatId: string; topicId?: string }) => {
    socket.to(`chat:${chatId}`).emit('typing:stop', {
      chatId,
      topicId: topicId || null,
      userId,
    });
  });

  // Прочитать все сообщения до указанного (включительно)
  socket.on(
    'message:read',
    async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      try {
        const member = await prisma.chatMember.findUnique({
          where: { chatId_userId: { chatId, userId } },
        });
        if (!member) return;

        const target = await prisma.message.findUnique({
          where: { id: messageId },
          select: { id: true, createdAt: true, chatId: true, topicId: true },
        });
        if (!target || target.chatId !== chatId) return;

        // Все непрочитанные сообщения текущего юзера до target включительно
        // (не считаем свои, не считаем уже прочитанные)
        const unread = await prisma.message.findMany({
          where: {
            chatId,
            ...(target.topicId ? { topicId: target.topicId } : { topicId: null }),
            createdAt: { lte: target.createdAt },
            senderId: { not: userId },
            type: { not: 'SYSTEM' },
            reads: { none: { userId } },
          },
          select: { id: true },
        });

        if (unread.length === 0) {
          // Просто обновим lastReadMessageId
          await prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId } },
            data: { lastReadMessageId: messageId },
          });
          return;
        }

        // Создаём записи MessageRead пакетом
        await prisma.messageRead.createMany({
          data: unread.map((m) => ({ messageId: m.id, userId })),
          skipDuplicates: true,
        });

        await prisma.chatMember.update({
          where: { chatId_userId: { chatId, userId } },
          data: { lastReadMessageId: messageId },
        });

        // Сообщаем в комнату чата, что эти сообщения прочитаны
        io.to(`chat:${chatId}`).emit('message:read', {
          chatId,
          topicId: target.topicId || null,
          userId,
          messageIds: unread.map((m) => m.id),
        });
      } catch (error) {
        logger.error('message:read error', error);
      }
    }
  );

  socket.on('chat:join', async ({ chatId }: { chatId: string }) => {
    try {
      const member = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId } },
      });
      if (member) socket.join(`chat:${chatId}`);
    } catch (error) {
      logger.error('chat:join error', error);
    }
  });
};