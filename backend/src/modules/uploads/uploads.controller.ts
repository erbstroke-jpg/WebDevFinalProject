import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { detectMessageType } from './multer.config';

export const uploadsController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      if (!req.file) throw new AppError(400, 'No file uploaded');

      const file = req.file;

      // /uploads раздаются express.static-ом по env.uploadDir
      // file.path вида .../uploads/images/12345-ab.jpg
      // нужно вернуть только хвост от /uploads/...
      const relPath = file.path
        .replace(/\\/g, '/')
        .split('/uploads/')[1];

      const url = `/uploads/${relPath}`;

      res.json({
        url,
        fileName: file.originalname,
        fileSize: file.size,
        fileMimeType: file.mimetype,
        messageType: detectMessageType(file.mimetype),
      });
    } catch (error) {
      next(error);
    }
  },
};