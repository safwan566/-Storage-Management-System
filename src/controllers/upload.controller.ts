import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, hasEnoughStorage } from '../utils/storage.utils';
import { normalizeFilePath, getFileSizeInfo, filePathToUrl } from '../utils/file.utils';
import fs from 'fs';
import path from 'path';

/**
 * Upload image file
 * @route POST /api/upload/image
 * @access Private
 */
export const uploadImageFile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  if (!req.file) {
    throw ApiError.badRequest('No image file provided');
  }

  const fileSize = req.file.size;
  const fileUrl = normalizeFilePath(req.file.path);
  const fileSizeInfo = getFileSizeInfo(fileSize);

  // Get current user's storage info
  const user = await User.findById(userId);
  
  if (!user) {
    // Delete uploaded file if user not found
    fs.unlinkSync(fileUrl);
    throw ApiError.notFound('User not found');
  }

  // Check if user has enough storage
  if (!hasEnoughStorage(user.storageUsed, user.storageLimit, fileSize)) {
    // Delete uploaded file if storage limit exceeded
    fs.unlinkSync(fileUrl);
    
    const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);
    throw ApiError.badRequest(
      `Storage limit exceeded. You need ${(fileSize / (1024 * 1024)).toFixed(2)} MB but only ${storageInfo.availableFormatted} is available`
    );
  }

  // Create note document for image
  const note = await Note.create({
    userId: user._id,
    folderId: req.body.folderId || null,
    title: req.body.title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
    type: 'image',
    fileUrl,
    fileSize,
  });

  // Update user's storage usage
  user.storageUsed += fileSize;
  await user.save();

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  // Add formatted file size to the response
  const noteResponse = {
    ...note.toObject(),
    fileUrl: note.fileUrl ? filePathToUrl(note.fileUrl) : note.fileUrl,
    fileSizeFormatted: fileSizeInfo.formatted,
  };

  successResponse(res, 'Image uploaded successfully', {
    note: noteResponse,
    storage: storageInfo,
  });
});

/**
 * Upload PDF file
 * @route POST /api/upload/pdf
 * @access Private
 */
export const uploadPDFFile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  if (!req.file) {
    throw ApiError.badRequest('No PDF file provided');
  }

  const fileSize = req.file.size;
  const fileUrl = normalizeFilePath(req.file.path);
  const fileSizeInfo = getFileSizeInfo(fileSize);

  // Get current user's storage info
  const user = await User.findById(userId);
  
  if (!user) {
    // Delete uploaded file if user not found
    fs.unlinkSync(fileUrl);
    throw ApiError.notFound('User not found');
  }

  // Check if user has enough storage
  if (!hasEnoughStorage(user.storageUsed, user.storageLimit, fileSize)) {
    // Delete uploaded file if storage limit exceeded
    fs.unlinkSync(fileUrl);
    
    const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);
    throw ApiError.badRequest(
      `Storage limit exceeded. You need ${(fileSize / (1024 * 1024)).toFixed(2)} MB but only ${storageInfo.availableFormatted} is available`
    );
  }

  // Create note document for PDF
  const note = await Note.create({
    userId: user._id,
    folderId: req.body.folderId || null,
    title: req.body.title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
    type: 'pdf',
    fileUrl,
    fileSize,
  });

  // Update user's storage usage
  user.storageUsed += fileSize;
  await user.save();

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  // Add formatted file size to the response
  const noteResponse = {
    ...note.toObject(),
    fileUrl: note.fileUrl ? filePathToUrl(note.fileUrl) : note.fileUrl,
    fileSizeFormatted: fileSizeInfo.formatted,
  };

  successResponse(res, 'PDF uploaded successfully', {
    note: noteResponse,
    storage: storageInfo,
  });
});





