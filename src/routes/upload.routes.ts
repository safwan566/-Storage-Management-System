import { Router } from 'express';
import { uploadImageFile, uploadPDFFile } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadImage, uploadPDF } from '../middlewares/fileUpload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Upload image file
 * @route POST /api/upload/image
 * @access Private
 */
router.post('/image', uploadImage, uploadImageFile);

/**
 * Upload PDF file
 * @route POST /api/upload/pdf
 * @access Private
 */
router.post('/pdf', uploadPDF, uploadPDFFile);

export default router;











