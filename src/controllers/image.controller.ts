import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Image } from '../models/image.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, hasEnoughStorage } from '../utils/storage.utils';
import { normalizeFilePath, getFileSizeInfo, filePathToUrl } from '../utils/file.utils';
import { getPaginationParams, getPaginationResult } from '../utils/pagination.utils';
import { paginatedResponse } from '../views/responses/pagination.response';
import fs from 'node:fs';
import path from 'node:path';

function formatImageResponse(image: any) {
  const imageObj = image.toObject ? image.toObject() : image;
  return {
    ...imageObj,
    fileUrl: imageObj.fileUrl ? filePathToUrl(imageObj.fileUrl) : imageObj.fileUrl,
    fileSizeFormatted: getFileSizeInfo(imageObj.fileSize).formatted,
  };
}


export const getAllImages = asyncHandler(async (req: Request, res: Response) => {
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

  // Build query
  const query: any = { userId };

  // Add search filter
  if (search && typeof search === 'string') {
    query.title = { $regex: search, $options: 'i' };
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
  const totalItems = await Image.countDocuments(query);

  // Get images with pagination
  const images = await Image.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Format images with additional fields
  const formattedImages = images.map(formatImageResponse);

  // Get pagination result
  const pagination = getPaginationResult(pageNum, limitNum, totalItems);

  return paginatedResponse(res, 'Images retrieved successfully', formattedImages, pagination);
});


export const getImageById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const image = await Image.findOne({ 
    _id: id, 
    userId
  });

  if (!image) {
    throw ApiError.notFound('Image not found');
  }

  // Update last accessed time
  image.lastAccessedAt = new Date();
  await image.save();

  const formattedImage = formatImageResponse(image);

  successResponse(res, 'Image retrieved successfully', { image: formattedImage });
});

export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { title, folderId } = req.body;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the image
  const image = await Image.findOne({ 
    _id: id, 
    userId
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

  const formattedImage = formatImageResponse(image);

  successResponse(res, 'Image updated successfully', { image: formattedImage });
});


export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the image
  const image = await Image.findOne({ 
    _id: id, 
    userId
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
  await Image.deleteOne({ _id: image._id });

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  successResponse(res, 'Image deleted successfully', { storage: storageInfo });
});

export const duplicateImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the original image
  const originalImage = await Image.findOne({ 
    _id: id, 
    userId
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

  // Create duplicate image
  const duplicateImage = await Image.create({
    userId: user._id,
    folderId: originalImage.folderId,
    title: `${originalImage.title} (Copy)`,
    fileUrl: newFileUrl,
    fileSize: originalImage.fileSize,
  });

  // Update user's storage usage
  user.storageUsed += originalImage.fileSize;
  await user.save();

  // Populate folder information

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  const formattedImage = formatImageResponse(duplicateImage);

  successResponse(res, 'Image duplicated successfully', {
    image: formattedImage,
    storage: storageInfo,
  });
});

export const toggleImageFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const image = await Image.findOne({ 
    _id: id, 
    userId
  });

  if (!image) {
    throw ApiError.notFound('Image not found');
  }

  image.isFavorite = !image.isFavorite;
  await image.save();

  const formattedImage = formatImageResponse(image);

  successResponse(
    res,
    `Image ${image.isFavorite ? 'added to' : 'removed from'} favorites`,
    { image: formattedImage }
  );
});
