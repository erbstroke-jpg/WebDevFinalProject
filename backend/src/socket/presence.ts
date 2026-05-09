// Простой in-memory presence (без Redis — нам хватит для одного процесса)
import { prisma } from '../config/prisma';

const onlineUsers = new Map<string, Set<string>>(); // userId -> set of socketIds

export const presence = {
  add(userId: string, socketId: string) {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socketId);
  },

  async remove(userId: string, socketId: string): Promise<boolean> {
    const sockets = onlineUsers.get(userId);
    if (!sockets) return true;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
      // Обновляем lastSeenAt в БД при последнем disconnect
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date(), status: 'offline' },
      });
      return true; // ушёл совсем
    }
    return false; // ещё есть активные сокеты
  },

  isOnline(userId: string): boolean {
    return onlineUsers.has(userId);
  },

  getOnlineUserIds(): string[] {
    return Array.from(onlineUsers.keys());
  },
};