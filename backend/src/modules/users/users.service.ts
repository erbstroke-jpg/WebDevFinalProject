import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';

export const usersService = {
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError(404, 'User not found');
    return user;
  },

  async search(query: string, excludeUserId: string) {
    if (!query || query.length < 2) return [];

    return prisma.user.findMany({
      where: {
        AND: [
          { id: { not: excludeUserId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
      },
      take: 20,
    });
  },
};