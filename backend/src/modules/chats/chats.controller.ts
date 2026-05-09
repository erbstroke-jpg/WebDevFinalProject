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

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const chat = await chatsService.getById(req.params.id as string, req.user.id);
      res.json(chat);
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

  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const chat = await chatsService.createGroup(req.user.id, req.body);
      res.status(201).json(chat);
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

  async getTopicMessages(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const id = req.params.id as string;
      const topicId = req.params.topicId as string;
      const cursor = req.query.cursor as string | undefined;
      const messages = await chatsService.getTopicMessages(id, topicId, req.user.id, cursor);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  },

  async listTopics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const id = req.params.id as string;
      const topics = await chatsService.listTopics(id, req.user.id);
      res.json(topics);
    } catch (error) {
      next(error);
    }
  },

  async createTopic(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const id = req.params.id as string;
      const topic = await chatsService.createTopic(id, req.user.id, req.body);
      res.status(201).json(topic);
    } catch (error) {
      next(error);
    }
  },

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const id = req.params.id as string;
      const { userId } = req.body;
      const chat = await chatsService.addMember(id, req.user.id, userId);
      res.json(chat);
    } catch (error) {
      next(error);
    }
  },

  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const id = req.params.id as string;
      const result = await chatsService.leave(id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  
  async updateChat(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const id = req.params.id as string;
      const chat = await chatsService.updateChat(id, req.user.id, req.body);
      res.json(chat);
    } catch (error) {
      next(error);
    }
  },
};