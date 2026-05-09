import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput } from './auth.validation';

export const authService = {
  async register(input: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new AppError(409, 'Email already registered');
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existingUsername) {
      throw new AppError(409, 'Username already taken');
    }

    const password = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        password,
        displayName: input.displayName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Не возвращаем password
    const { password: _password, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },
};