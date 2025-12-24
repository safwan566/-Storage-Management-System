import { Router } from 'express';
import { getStorageStats } from '../controllers/storage.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get storage statistics for current user
 * @route GET /api/storage/stats
 * @access Private
 */
router.get('/stats', getStorageStats);

export default router;







