import { Router } from 'express';
import {
  getAllFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  duplicateFolder,
  toggleFolderFavorite,
} from '../controllers/folder.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createFolderSchema, updateFolderSchema } from '../validators/folder.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get all folders for current user
 * @route GET /api/folders
 * @access Private
 */
router.get('/', getAllFolders);

/**
 * Get single folder by ID
 * @route GET /api/folders/:id
 * @access Private
 */
router.get('/:id', getFolderById);

/**
 * Create a new folder
 * @route POST /api/folders
 * @access Private
 */
router.post('/', validate(createFolderSchema), createFolder);

/**
 * Toggle favorite status of a folder
 * @route PATCH /api/folders/:id/favorite
 * @access Private
 */
router.patch('/:id/favorite', toggleFolderFavorite);

/**
 * Update a folder
 * @route PATCH /api/folders/:id
 * @access Private
 */
router.patch('/:id', validate(updateFolderSchema), updateFolder);

/**
 * Duplicate a folder (only text notes)
 * @route POST /api/folders/:id/duplicate
 * @access Private
 */
router.post('/:id/duplicate', duplicateFolder);

/**
 * Delete a folder and all its contents
 * @route DELETE /api/folders/:id
 * @access Private
 */
router.delete('/:id', deleteFolder);

export default router;





