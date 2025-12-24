import { Router } from 'express';
import { getRecentItems, getFavorites, getStorageStats, getItemsByDate } from '../controllers/storage.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getStorageStats);
router.get('/by-date', getItemsByDate);
router.get('/recent', getRecentItems);
router.get('/favorites', getFavorites);

export default router;
