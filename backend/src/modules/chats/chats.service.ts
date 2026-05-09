import { getIO } from '../../socket';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { CreateGroupInput, CreateTopicInput } from './chats.validation';

export const chatsService = {
  /** Получить или создать личный чат между двумя пользователями */
  async getOrCreateDirect(userIdA: string, userIdB: string) {
    if (userIdA === userIdB) {
      throw new AppError(400, 'Cannot create chat with yourself');
    }

    const otherUser = await prisma.user.findUnique({ where: { id: userIdB } });
    if (!otherUser) throw new AppError(404, 'User not found');

    const existing = await prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId: userIdA } } },
          { members: { some: { userId: userIdB } } },
        ],
      },
      include: this.includeFull(),
    });

    if (existing) return this.formatChat(existing, userIdA);

    const created = await prisma.chat.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId: userIdA }, { userId: userIdB }],
        },
      },
      include: this.includeFull(),
    });

    const io = getIO();
    for (const m of created.members) {
      io.to(`user:${m.userId}`).emit('chat:created', this.formatChat(created, m.userId));
    }

    return this.formatChat(created, userIdA);
  },

  /** Создать группу или супергруппу */
  async createGroup(ownerId: string, input: CreateGroupInput) {
    const memberIds = Array.from(new Set([...input.memberIds, ownerId]));
 
    // Проверим что все юзеры существуют
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    });
    if (users.length !== memberIds.length) {
      throw new AppError(400, 'Some user IDs are invalid');
    }

    const chat = await prisma.chat.create({
      data: {
        type: input.isSupergroup ? 'SUPERGROUP' : 'GROUP',
        name: input.name,
        description: input.description,
        isSupergroup: input.isSupergroup,
        ownerId,
        members: {
          create: memberIds.map((userId) => ({
            userId,
            role: userId === ownerId ? 'OWNER' : 'MEMBER',
          })),
        },
        // Для супергруппы создаём дефолтный топик "General"
        ...(input.isSupergroup && {
          topics: {
            create: {
              name: 'General',
              iconEmoji: '👋',
              createdById: ownerId,
            },
          },
        }),
      },
      include: this.includeFull(),
    });

    // Уведомляем всех участников о новом чате через их личные комнаты
    const formatted = this.formatChat(chat, ownerId);
    const io = getIO();
    for (const m of chat.members) {
      io.to(`user:${m.userId}`).emit('chat:created', this.formatChat(chat, m.userId));
    }

    return formatted;
  },

  /** Список чатов пользователя */
  async listForUser(userId: string) {
    const chats = await prisma.chat.findMany({
      where: { members: { some: { userId } } },
      include: this.includeFull(),
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map((c) => this.formatChat(c, userId));
  },

  /** Получить чат по ID (с проверкой членства) */
  async getById(chatId: string, userId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: this.includeFull(),
    });

    if (!chat) throw new AppError(404, 'Chat not found');

    const isMember = chat.members.some((m) => m.userId === userId);
    if (!isMember) throw new AppError(403, 'Not a member of this chat');

    return this.formatChat(chat, userId);
  },

  /** Сообщения чата (для DIRECT/GROUP — без topicId) */
  async getMessages(chatId: string, userId: string, cursor?: string, limit = 30) {
    await this.assertMember(chatId, userId);

    const messages = await prisma.message.findMany({
      where: { chatId, topicId: null },
      include: this.messageInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    return messages.reverse();
  },

  /** Сообщения топика (для SUPERGROUP) */
  async getTopicMessages(
    chatId: string,
    topicId: string,
    userId: string,
    cursor?: string,
    limit = 30
  ) {
    await this.assertMember(chatId, userId);

    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic || topic.chatId !== chatId) throw new AppError(404, 'Topic not found');

    const messages = await prisma.message.findMany({
      where: { chatId, topicId },
      include: this.messageInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    return messages.reverse();
  },

  /** Список топиков чата */
  async listTopics(chatId: string, userId: string) {
    await this.assertMember(chatId, userId);

    return prisma.topic.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  },

  /** Создать топик в супергруппе */
  async createTopic(chatId: string, userId: string, input: CreateTopicInput) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) throw new AppError(404, 'Chat not found');
    if (!chat.isSupergroup) throw new AppError(400, 'Topics are only allowed in supergroups');
    const member = chat.members.find((m) => m.userId === userId);
    if (!member) throw new AppError(403, 'Not a member of this chat');

    const topic = await prisma.topic.create({
      data: {
        chatId,
        name: input.name,
        iconEmoji: input.iconEmoji,
        createdById: userId,
      },
    });

    // Системное сообщение в "General" о создании топика
    const general = await prisma.topic.findFirst({
      where: { chatId, name: 'General' },
    });
    if (general && general.id !== topic.id) {
      await prisma.message.create({
        data: {
          chatId,
          topicId: general.id,
          senderId: userId,
          type: 'SYSTEM',
          content: `created topic ${topic.iconEmoji || ''} ${topic.name}`,
        },
      });
    }

    return topic;
  },

  /** Добавить участника в группу */
  async addMember(chatId: string, requesterId: string, userIdToAdd: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) throw new AppError(404, 'Chat not found');
    if (chat.type === 'DIRECT') throw new AppError(400, 'Cannot add to direct chat');

    const requester = chat.members.find((m) => m.userId === requesterId);
    if (!requester) throw new AppError(403, 'Not a member');

    if (chat.members.some((m) => m.userId === userIdToAdd)) {
      throw new AppError(409, 'User already in chat');
    }

    const userToAdd = await prisma.user.findUnique({ where: { id: userIdToAdd } });
    if (!userToAdd) throw new AppError(404, 'User not found');

    await prisma.chatMember.create({
      data: { chatId, userId: userIdToAdd, role: 'MEMBER' },
    });
    // Сообщаем добавленному юзеру что у него теперь новый чат
    const fullChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: this.includeFull(),
    });
    if (fullChat) {
      getIO().to(`user:${userIdToAdd}`).emit('chat:created', this.formatChat(fullChat, userIdToAdd));
    }

    // Системное сообщение
    const targetTopicId = chat.isSupergroup
      ? (await prisma.topic.findFirst({ where: { chatId, name: 'General' } }))?.id
      : null;

    await prisma.message.create({
      data: {
        chatId,
        topicId: targetTopicId,
        senderId: requesterId,
        type: 'SYSTEM',
        content: `added ${userToAdd.displayName} to the chat`,
      },
    });

    return this.getById(chatId, requesterId);
  },

  async updateChat(chatId: string, userId: string, input: { name?: string; description?: string | null; avatarUrl?: string | null }) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) throw new AppError(404, 'Chat not found');
    if (chat.type === 'DIRECT') throw new AppError(400, 'Cannot update direct chat');

    const member = chat.members.find((m) => m.userId === userId);
    if (!member) throw new AppError(403, 'Not a member');
    if (chat.ownerId !== userId && member.role !== 'OWNER' && member.role !== 'ADMIN') {
      throw new AppError(403, 'Only owner or admin can update the chat');
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;

    await prisma.chat.update({ where: { id: chatId }, data });

    // Получаем обновлённый чат и рассылаем всем участникам
    const updated = await prisma.chat.findUnique({
      where: { id: chatId },
      include: this.includeFull(),
    });
    if (!updated) throw new AppError(404, 'Chat disappeared');

    const io = getIO();
    for (const m of updated.members) {
      io.to(`user:${m.userId}`).emit('chat:updated', this.formatChat(updated, m.userId));
    }

    return this.formatChat(updated, userId);
  },


  /** Покинуть чат */
  async leave(chatId: string, userId: string) {
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new AppError(404, 'Not a member');

    await prisma.chatMember.delete({
      where: { chatId_userId: { chatId, userId } },
    });

    return { ok: true };
  },

  // ============== Хелперы ==============

  async assertMember(chatId: string, userId: string) {
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new AppError(403, 'Not a member of this chat');
    return member;
  },

  messageInclude() {
    return {
      sender: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      replyTo: {
        include: {
          sender: { select: { id: true, username: true, displayName: true } },
        },
      },
    };
  },

  includeFull() {
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
      topics: {
        orderBy: { createdAt: 'asc' as const },
      },
    };
  },

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