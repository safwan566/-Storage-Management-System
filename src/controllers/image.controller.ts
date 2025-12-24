import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, hasEnoughStorage } from '../utils/storage.utils';
import { normalizeFilePath, getFileSizeInfo, filePathToUrl } from '../utils/file.utils';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Format image response with additional fields
 */
function formatImageResponse(image: any) {
  const imageObj = image.toObject ? image.toObject() : image;
  return {
    ...imageObj,
    fileUrl: imageObj.fileUrl ? filePathToUrl(imageObj.fileUrl) : imageObj.fileUrl,
    fileSizeFormatted: getFileSizeInfo(imageObj.fileSize).formatted,
  };
}

/**
 * Get all images for current user
 * @route GET /api/images
 * @access Private
 */
export const getAllImages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { folderId } = req.query;

  // Build query
  interface ImageQuery {
    userId: string;
    type: string;
    folderId?: string | null;
  }
  
  const query: ImageQuery = { userId, type: 'image' };
  
  if (folderId && typeof folderId === 'string') {
    query.folderId = folderId;
  }

  const images = await Note.find(query)
    .sort({ createdAt: -1 })
    .populate('folderId', 'name');

  // Format images with additional fields
  const formattedImages = images.map(formatImageResponse);

  successResponse(res, 'Images retrieved successfully', { 
    images: formattedImages,
    count: formattedImages.length 
  });
});

/**
 * Get single image by ID
 * @route GET /api/images/:id
 * @access Private
 */
export const getImageById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const image = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'image' 
  }).populate('folderId', 'name');

  if (!image) {
    throw ApiError.notFound('Image not found');
  }

  // Update last accessed time
  image.lastAccessedAt = new Date();
  await image.save();

  const formattedImage = formatImageResponse(image);

  successResponse(res, 'Image retrieved successfully', { image: formattedImage });
});

/**
 * Update image metadata (title, folder)
 * @route PATCH /api/images/:id
 * @access Private
 */
export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { title, folderId } = req.body;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the image
  const image = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'image' 
  });

  if (!image) {
    throw ApiError.notFound('Image not found');
  }

  // Update metadata
  if (title !== undefined) {
    image.title = title;
  }
  
  if (folderId !== undefined) {
    image.folderId = folderId || null;
  }

  image.updatedAt = new Date();
  await image.save();

  // Populate folder information
  await image.populate('folderId', 'name');

  const formattedImage = formatImageResponse(image);

  successResponse(res, 'Image updated successfully', { image: formattedImage });
});

/**
 * Delete an image
 * @route DELETE /api/images/:id
 * @access Private
 */
export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the image
  const image = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'image' 
  });

  if (!image) {
    throw ApiError.notFound('Image not found');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Delete the physical file
  if (image.fileUrl) {
    try {
      if (fs.existsSync(image.fileUrl)) {
        fs.unlinkSync(image.fileUrl);
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
      // Continue with deletion even if file deletion fails
    }
  }

  // Decrease user's storage usage
  user.storageUsed -= image.fileSize;
  
  // Ensure storage used doesn't go below 0
  if (user.storageUsed < 0) {
    user.storageUsed = 0;
  }
  
  await user.save();

  // Delete image from database
  await Note.deleteOne({ _id: image._id });

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  successResponse(res, 'Image deleted successfully', { storage: storageInfo });
});

/**
 * Duplicate an image
 * @route POST /api/images/:id/duplicate
 * @access Private
 */
export const duplicateImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the original image
  const originalImage = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'image' 
  });

  if (!originalImage) {
    throw ApiError.notFound('Image not found');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Check if user has enough storage for the duplicate
  if (!hasEnoughStorage(user.storageUsed, user.storageLimit, originalImage.fileSize)) {
    const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);
    throw ApiError.badRequest(
      `Storage limit exceeded. You need ${(originalImage.fileSize / (1024 * 1024)).toFixed(2)} MB but only ${storageInfo.availableFormatted} is available`
    );
  }

  // Duplicate the physical file
  let newFileUrl = '';
  
  if (originalImage.fileUrl && fs.existsSync(originalImage.fileUrl)) {
    const ext = path.extname(originalImage.fileUrl);
    const dir = path.dirname(originalImage.fileUrl);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const newFileName = `image-${timestamp}-${random}${ext}`;
    newFileUrl = normalizeFilePath(path.join(dir, newFileName));

    try {
      fs.copyFileSync(originalImage.fileUrl, newFileUrl);
    } catch (error) {
      console.error('Error copying file:', error);
      throw ApiError.internal('Failed to duplicate image file');
    }
  } else {
    throw ApiError.notFound('Original image file not found');
  }

  // Create duplicate note
  const duplicateImage = await Note.create({
    userId: user._id,
    folderId: originalImage.folderId,
    title: `${originalImage.title} (Copy)`,
    type: 'image',
    fileUrl: newFileUrl,
    fileSize: originalImage.fileSize,
  });

  // Update user's storage usage
  user.storageUsed += originalImage.fileSize;
  await user.save();

  // Populate folder information
  await duplicateImage.populate('folderId', 'name');

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  const formattedImage = formatImageResponse(duplicateImage);

  successResponse(res, 'Image duplicated successfully', {
    image: formattedImage,
    storage: storageInfo,
  });
});

