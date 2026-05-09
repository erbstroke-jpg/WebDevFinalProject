import { Router } from 'express';
import { chatsController } from './chats.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', chatsController.list);
router.post('/direct', chatsController.createDirect);
router.get('/:id/messages', chatsController.getMessages);

export default router;