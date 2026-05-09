import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';

export const chatsService = {
  /** Получить или создать личный чат между двумя пользователями */
  async getOrCreateDirect(userIdA: string, userIdB: string) {
    if (userIdA === userIdB) {
      throw new AppError(400, 'Cannot create chat with yourself');
    }

    const otherUser = await prisma.user.findUnique({ where: { id: userIdB } });
    if (!otherUser) throw new AppError(404, 'User not found');

    // Ищем уже существующий DIRECT
    const existing = await prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId: userIdA } } },
          { members: { some: { userId: userIdB } } },
        ],
      },
      include: this.includeFull(userIdA),
    });

    if (existing) return this.formatChat(existing, userIdA);

    const created = await prisma.chat.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId: userIdA }, { userId: userIdB }],
        },
      },
      include: this.includeFull(userIdA),
    });

    return this.formatChat(created, userIdA);
  },

  /** Список чатов пользователя */
  async listForUser(userId: string) {
    const chats = await prisma.chat.findMany({
      where: { members: { some: { userId } } },
      include: this.includeFull(userId),
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map((c) => this.formatChat(c, userId));
  },

  /** История сообщений с keyset-пагинацией */
  async getMessages(chatId: string, userId: string, cursor?: string, limit = 30) {
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new AppError(403, 'Not a member of this chat');

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        topicId: null, // в этом блоке только без топиков
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
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    return messages.reverse(); // в UI хочется порядок: старые → новые
  },

  /** Хелпер: include для полного объекта чата */
  includeFull(_currentUserId: string) {
    return {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              status: true,
              lastSeenAt: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        include: {
          sender: { select: { id: true, username: true, displayName: true } },
        },
      },
    };
  },

  /** Хелпер: для DIRECT чатов выводим имя/аватар собеседника */
  formatChat(chat: any, currentUserId: string) {
    if (chat.type === 'DIRECT') {
      const other = chat.members.find((m: any) => m.userId !== currentUserId);
      return {
        ...chat,
        displayName: other?.user.displayName || 'Unknown',
        displayAvatarUrl: other?.user.avatarUrl || null,
        lastMessage: chat.messages[0] || null,
        messages: undefined,
      };
    }

    return {
      ...chat,
      displayName: chat.name,
      displayAvatarUrl: chat.avatarUrl,
      lastMessage: chat.messages[0] || null,
      messages: undefined,
    };
  },
};