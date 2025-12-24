import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Folder } from '../models/folder.model';
import { Note } from '../models/note.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, hasEnoughStorage } from '../utils/storage.utils';
import fs from 'fs';

/**
 * Get all folders for current user
 * @route GET /api/folders
 * @access Private
 */
export const getAllFolders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const folders = await Folder.find({ userId })
    .sort({ createdAt: -1 })
    .populate('parentFolder', 'name');

  successResponse(res, 'Folders retrieved successfully', { folders });
});

/**
 * Create a new folder
 * @route POST /api/folders
 * @access Private
 */
export const createFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { name, parentFolder } = req.body;

  if (!name) {
    throw ApiError.badRequest('Folder name is required');
  }

  // Create folder
  const folder = await Folder.create({
    userId,
    name,
    parentFolder: parentFolder || null,
  });

  successResponse(res, 'Folder created successfully', { folder });
});

/**
 * Update a folder
 * @route PUT /api/folders/:id
 * @access Private
 */
export const updateFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { name } = req.body;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  if (!name) {
    throw ApiError.badRequest('Folder name is required');
  }

  // Find and update folder
  const folder = await Folder.findOne({ _id: id, userId });

  if (!folder) {
    throw ApiError.notFound('Folder not found');
  }

  folder.name = name;
  folder.updatedAt = new Date();
  await folder.save();

  successResponse(res, 'Folder updated successfully', { folder });
});

/**
 * Delete a folder and all its contents
 * @route DELETE /api/folders/:id
 * @access Private
 */
export const deleteFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the folder
  const folder = await Folder.findOne({ _id: id, userId });

  if (!folder) {
    throw ApiError.notFound('Folder not found');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Find all notes in this folder
  const notes = await Note.find({ folderId: id });

  let totalFreedSpace = 0;

  // Delete all notes and their files
  for (const note of notes) {
    // If note has a file (image/pdf), delete the physical file
    if (note.fileUrl) {
      try {
        if (fs.existsSync(note.fileUrl)) {
          fs.unlinkSync(note.fileUrl);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    totalFreedSpace += note.fileSize;
  }

  // Delete all notes in folder
  await Note.deleteMany({ folderId: id });

  // Delete the folder
  await Folder.deleteOne({ _id: id });

  // Update user's storage usage
  user.storageUsed -= totalFreedSpace;
  
  // Ensure storage used doesn't go below 0
  if (user.storageUsed < 0) {
    user.storageUsed = 0;
  }
  
  await user.save();

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  successResponse(res, 'Folder and all its contents deleted successfully', {
    deletedNotesCount: notes.length,
    freedSpace: totalFreedSpace,
    storage: storageInfo,
  });
});

/**
 * Duplicate a folder (only text notes, not files)
 * @route POST /api/folders/:id/duplicate
 * @access Private
 */
export const duplicateFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the original folder
  const originalFolder = await Folder.findOne({ _id: id, userId });

  if (!originalFolder) {
    throw ApiError.notFound('Folder not found');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Create new folder with "(copy)" suffix
  const newFolder = await Folder.create({
    userId,
    name: `${originalFolder.name} (copy)`,
    parentFolder: originalFolder.parentFolder,
  });

  // Find all text notes in original folder (not files)
  const textNotes = await Note.find({ folderId: id, type: 'note' });

  let totalRequiredSpace = 0;
  
  // Calculate total space needed for duplication
  for (const note of textNotes) {
    totalRequiredSpace += note.fileSize;
  }

  // Check if user has enough storage
  if (!hasEnoughStorage(user.storageUsed, user.storageLimit, totalRequiredSpace)) {
    // Delete the newly created folder since we can't duplicate notes
    await Folder.deleteOne({ _id: newFolder._id });
    
    const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);
    throw ApiError.badRequest(
      `Not enough storage to duplicate folder. Required: ${(totalRequiredSpace / (1024 * 1024)).toFixed(2)} MB, Available: ${storageInfo.availableFormatted}`
    );
  }

  // Duplicate all text notes
  const duplicatedNotes = [];
  for (const note of textNotes) {
    const newNote = await Note.create({
      userId: note.userId,
      folderId: newFolder._id,
      title: note.title,
      content: note.content,
      type: note.type,
      fileSize: note.fileSize,
    });
    duplicatedNotes.push(newNote);
  }

  // Update user's storage usage
  user.storageUsed += totalRequiredSpace;
  await user.save();

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  successResponse(res, 'Folder duplicated successfully', {
    folder: newFolder,
    duplicatedNotesCount: duplicatedNotes.length,
    storage: storageInfo,
  });
});










