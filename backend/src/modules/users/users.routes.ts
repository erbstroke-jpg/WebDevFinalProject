import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema } from './users.validation';

const router = Router();

router.use(authMiddleware);

router.get('/search', usersController.search);
router.patch('/me', validate(updateProfileSchema), usersController.updateMe);
router.get('/:id', usersController.getById);

export default router;