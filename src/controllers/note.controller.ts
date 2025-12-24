import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, hasEnoughStorage } from '../utils/storage.utils';
import { filePathToUrl } from '../utils/file.utils';
import { getPaginationParams, getPaginationResult } from '../utils/pagination.utils';
import { paginatedResponse } from '../views/responses/pagination.response';
import fs from 'node:fs';

/**
 * Create a new text note
 * @route POST /api/notes
 * @access Private
 */
export const createNote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { title, content, folderId } = req.body;

  if (!title) {
    throw ApiError.badRequest('Title is required');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Calculate text size in bytes
  const textSize = Buffer.byteLength((title || '') + (content || ''), 'utf8');

  // Check if user has enough storage
  if (!hasEnoughStorage(user.storageUsed, user.storageLimit, textSize)) {
    const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);
    throw ApiError.badRequest(
      `Storage limit exceeded. Available space: ${storageInfo.availableFormatted}`
    );
  }

  // Create note
  const note = await Note.create({
    userId: user._id,
    folderId: folderId || null,
    title,
    content: content || '',
    type: 'note',
    fileSize: textSize,
  });

  // Update user's storage usage
  user.storageUsed += textSize;
  await user.save();

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  // Format note with URL conversion
  const noteObj = note.toObject();
  const formattedNote = {
    ...noteObj,
    fileUrl: noteObj.fileUrl ? filePathToUrl(noteObj.fileUrl) : noteObj.fileUrl,
  };

  successResponse(res, 'Note created successfully', {
    note: formattedNote,
    storage: storageInfo,
  });
});

/**
 * Get all notes for current user with pagination and search
 * @route GET /api/notes
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} search - Search by title or content (optional)
 * @query {string} folderId - Filter by folder ID (optional)
 * @query {boolean} isFavorite - Filter by favorite status (optional)
 */
export const getAllNotes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { page, limit, search, folderId, isFavorite } = req.query;

  // Get pagination parameters (default: 20 items per page)
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  // Build query - ONLY for text notes (type='note')
  const query: any = { userId, type: 'note' };

  // Add search filter
  if (search && typeof search === 'string') {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  // Add folder filter
  if (folderId && typeof folderId === 'string') {
    query.folderId = folderId;
  }

  // Add favorite filter
  if (isFavorite !== undefined) {
    query.isFavorite = isFavorite === 'true';
  }

  // Get total count
  const totalItems = await Note.countDocuments(query);

  // Get notes with pagination
  const notes = await Note.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
;

  // Format notes with URL conversion
  const formattedNotes = notes.map(note => {
    const noteObj = note.toObject();
    return {
      ...noteObj,
      fileUrl: noteObj.fileUrl ? filePathToUrl(noteObj.fileUrl) : noteObj.fileUrl,
    };
  });

  // Get pagination result
  const pagination = getPaginationResult(pageNum, limitNum, totalItems);

  return paginatedResponse(res, 'Notes retrieved successfully', formattedNotes, pagination);
});

/**
 * Get recent notes (last 10 accessed)
 * @route GET /api/notes/recent
 * @access Private
 */
export const getRecentNotes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const notes = await Note.find({ userId })
    .sort({ lastAccessedAt: -1 })
    .limit(10)
;

  // Format notes with URL conversion
  const formattedNotes = notes.map(note => {
    const noteObj = note.toObject();
    return {
      ...noteObj,
      fileUrl: noteObj.fileUrl ? filePathToUrl(noteObj.fileUrl) : noteObj.fileUrl,
    };
  });

  successResponse(res, 'Recent notes retrieved successfully', { notes: formattedNotes });
});

/**
 * Get single note by ID
 * @route GET /api/notes/:id
 * @access Private
 */
export const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const note = await Note.findOne({ _id: id, userId });

  if (!note) {
    throw ApiError.notFound('Note not found');
  }

  // Update last accessed time
  note.lastAccessedAt = new Date();
  await note.save();

  // Format note with URL conversion
  const noteObj = note.toObject();
  const formattedNote = {
    ...noteObj,
    fileUrl: noteObj.fileUrl ? filePathToUrl(noteObj.fileUrl) : noteObj.fileUrl,
  };

  successResponse(res, 'Note retrieved successfully', { note: formattedNote });
});

/**
 * Update a text note
 * @route PUT /api/notes/:id
 * @access Private
 */
export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { title, content } = req.body;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the note
  const note = await Note.findOne({ _id: id, userId });

  if (!note) {
    throw ApiError.notFound('Note not found');
  }

  // Only allow updating text notes
  if (note.type !== 'note') {
    throw ApiError.badRequest('Only text notes can be updated. Files cannot be modified.');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Calculate old and new sizes
  const oldSize = note.fileSize;
  const newSize = Buffer.byteLength((title || note.title) + (content || note.content || ''), 'utf8');
  const sizeDifference = newSize - oldSize;

  // If new size is larger, check if user has enough storage
  if (sizeDifference > 0) {
    if (!hasEnoughStorage(user.storageUsed, user.storageLimit, sizeDifference)) {
      const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);
      throw ApiError.badRequest(
        `Storage limit exceeded. Available space: ${storageInfo.availableFormatted}`
      );
    }
  }

  // Update note
  note.title = title || note.title;
  note.content = content !== undefined ? content : note.content;
  note.fileSize = newSize;
  note.updatedAt = new Date();
  await note.save();

  // Update user's storage usage
  user.storageUsed += sizeDifference;
  await user.save();

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  // Format note with URL conversion
  const noteObj = note.toObject();
  const formattedNote = {
    ...noteObj,
    fileUrl: noteObj.fileUrl ? filePathToUrl(noteObj.fileUrl) : noteObj.fileUrl,
  };

  successResponse(res, 'Note updated successfully', {
    note: formattedNote,
    storage: storageInfo,
  });
});

/**
 * Delete a note
 * @route DELETE /api/notes/:id
 * @access Private
 */
export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the note
  const note = await Note.findOne({ _id: id, userId });

  if (!note) {
    throw ApiError.notFound('Note not found');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // If note has a file (image/pdf), delete the physical file
  if (note.fileUrl) {
    try {
      if (fs.existsSync(note.fileUrl)) {
        fs.unlinkSync(note.fileUrl);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue with note deletion even if file deletion fails
    }
  }

  // Decrease user's storage usage
  user.storageUsed -= note.fileSize;
  
  // Ensure storage used doesn't go below 0
  if (user.storageUsed < 0) {
    user.storageUsed = 0;
  }
  
  await user.save();

  // Delete note from database
  await Note.deleteOne({ _id: note._id });

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  successResponse(res, 'Note deleted successfully', { storage: storageInfo });
});

/**
 * Toggle favorite status of a note
 * @route PATCH /api/notes/:id/favorite
 * @access Private
 */
export const toggleNoteFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const note = await Note.findOne({ _id: id, userId });

  if (!note) {
    throw ApiError.notFound('Note not found');
  }

  note.isFavorite = !note.isFavorite;
  await note.save();

  // Format note with URL conversion
  const noteObj = note.toObject();
  const formattedNote = {
    ...noteObj,
    fileUrl: noteObj.fileUrl ? filePathToUrl(noteObj.fileUrl) : noteObj.fileUrl,
  };

  successResponse(
    res,
    `Note ${note.isFavorite ? 'added to' : 'removed from'} favorites`,
    { note: formattedNote }
  );
});



