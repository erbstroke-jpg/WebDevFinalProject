import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../middleware/error.middleware';


export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const user = await authService.getMe(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
};