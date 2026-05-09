import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AppError } from '../../middleware/error.middleware';

export const usersController = {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await usersService.findById(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const query = (req.query.q as string) || '';
      const users = await usersService.search(query, req.user.id);
      res.json(users);
    } catch (error) {
      next(error);
    }
  },
};