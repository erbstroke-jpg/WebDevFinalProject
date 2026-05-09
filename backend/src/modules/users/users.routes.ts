import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware); // все маршруты требуют JWT

router.get('/search', usersController.search);
router.get('/:id', usersController.getById);

export default router;