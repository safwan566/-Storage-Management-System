import { Router } from 'express';
import {
  createNote,
  getAllNotes,
  getRecentNotes,
  getNoteById,
  updateNote,
  deleteNote,
  toggleNoteFavorite,
  duplicateNote,
} from '../controllers/note.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createNoteSchema, updateNoteSchema } from '../validators/note.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Create a new text note
 * @route POST /api/notes
 * @access Private
 */
router.post('/', validate(createNoteSchema), createNote);

/**
 * Get all notes for current user
 * @route GET /api/notes
 * @access Private
 */
router.get('/', getAllNotes);

/**
 * Get recent notes (last 10 accessed)
 * @route GET /api/notes/recent
 * @access Private
 */
router.get('/recent', getRecentNotes);

/**
 * Get single note by ID
 * @route GET /api/notes/:id
 * @access Private
 */
router.get('/:id', getNoteById);

/**
 * Toggle favorite status of a note
 * @route PATCH /api/notes/:id/favorite
 * @access Private
 */
router.patch('/:id/favorite', toggleNoteFavorite);

/**
 * Duplicate a note
 * @route POST /api/notes/:id/duplicate
 * @access Private
 */
router.post('/:id/duplicate', duplicateNote);

/**
 * Update a text note
 * @route PATCH /api/notes/:id
 * @access Private
 */
router.patch('/:id', validate(updateNoteSchema), updateNote);

/**
 * Delete a note
 * @route DELETE /api/notes/:id
 * @access Private
 */
router.delete('/:id', deleteNote);

export default router;





