import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { upload } from './multer.config';
import { uploadsController } from './uploads.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', upload.single('file'), uploadsController.upload);

export default router;