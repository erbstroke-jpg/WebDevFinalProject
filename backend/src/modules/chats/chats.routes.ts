import { Router } from 'express';
import { chatsController } from './chats.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createGroupSchema,
  addMemberSchema,
  createTopicSchema,
  updateChatSchema,
} from './chats.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', chatsController.list);
router.get('/:id', chatsController.getById);
router.patch('/:id', validate(updateChatSchema), chatsController.updateChat);
router.post('/direct', chatsController.createDirect);
router.post('/group', validate(createGroupSchema), chatsController.createGroup);

router.get('/:id/messages', chatsController.getMessages);
router.get('/:id/topics/:topicId/messages', chatsController.getTopicMessages);

router.get('/:id/topics', chatsController.listTopics);
router.post('/:id/topics', validate(createTopicSchema), chatsController.createTopic);

router.post('/:id/members', validate(addMemberSchema), chatsController.addMember);
router.delete('/:id/leave', chatsController.leave);

export default router;