import { Request, Response, NextFunction } from 'express';
import { chatsService } from './chats.service';
import { AppError } from '../../middleware/error.middleware';

export const chatsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const chats = await chatsService.listForUser(req.user.id);
      res.json(chats);
    } catch (error) {
      next(error);
    }
  },

  async createDirect(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const { userId } = req.body;
      if (!userId) throw new AppError(400, 'userId required');
      const chat = await chatsService.getOrCreateDirect(req.user.id, userId);
      res.json(chat);
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const id = req.params.id as string;
      const cursor = req.query.cursor as string | undefined;
      const messages = await chatsService.getMessages(id, req.user.id, cursor);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  },
};