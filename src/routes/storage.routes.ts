import { Router } from 'express';
import { getRecentItems } from '../controllers/storage.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get recent items (all types: notes, images, PDFs, folders) with pagination
 * @route GET /api/storage/recent
 * @access Private
 */
router.get('/recent', getRecentItems);

export default router;
