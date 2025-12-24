import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { Folder } from '../models/folder.model';
import { filePathToUrl, getFileSizeInfo } from '../utils/file.utils';
import { getPaginationParams, getPaginationResult } from '../utils/pagination.utils';
import { paginatedResponse } from '../views/responses/pagination.response';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo } from '../utils/storage.utils';

function formatItemResponse(item: any, itemType: 'note' | 'folder') {
  const itemObj = item.toObject ? item.toObject() : item;
  
  if (itemType === 'folder') {
    return {
      ...itemObj,
      type: 'folder',
    };
  }

  // For notes (which includes images and PDFs)
  const formatted: any = {
    ...itemObj,
    fileUrl: itemObj.fileUrl ? filePathToUrl(itemObj.fileUrl) : itemObj.fileUrl,
  };

  // Add fileSizeFormatted for images and PDFs
  if (itemObj.type === 'image' || itemObj.type === 'pdf') {
    formatted.fileSizeFormatted = getFileSizeInfo(itemObj.fileSize).formatted;
  }

  return formatted;
}


export const getRecentItems = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { page, limit, type } = req.query;

  // Get pagination parameters (default: 10 items per page)
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10, // Default 10 per page
  });

  // Build queries for Notes and Folders
  const noteQuery: any = { userId };
  const folderQuery: any = { userId };

  // Filter by type if provided
  if (type && typeof type === 'string') {
    if (type === 'folder') {
      // Only get folders
      const totalItems = await Folder.countDocuments(folderQuery);
      const folders = await Folder.find(folderQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
  ;

      const formattedItems = folders.map(folder => formatItemResponse(folder, 'folder'));
      const pagination = getPaginationResult(pageNum, limitNum, totalItems);

      return paginatedResponse(res, 'Recent items retrieved successfully', formattedItems, pagination);
    } else if (['note', 'image', 'pdf'].includes(type)) {
      // Filter notes by type - only get notes (no folders)
      noteQuery.type = type;
      const totalItems = await Note.countDocuments(noteQuery);
      const notes = await Note.find(noteQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
;

      const formattedItems = notes.map(note => formatItemResponse(note, 'note'));
      const pagination = getPaginationResult(pageNum, limitNum, totalItems);

      return paginatedResponse(res, 'Recent items retrieved successfully', formattedItems, pagination);
    }
  }

  // Get total count first (when no type filter or invalid type)
  const totalNotes = await Note.countDocuments(noteQuery);
  const totalFolders = await Folder.countDocuments(folderQuery);
  const totalItems = totalNotes + totalFolders;

  // Get notes and folders separately
  const [notes, folders] = await Promise.all([
    Note.find(noteQuery)
      .sort({ createdAt: -1 })
,
    Folder.find(folderQuery)
      .sort({ createdAt: -1 })
,
  ]);

  // Combine and sort by createdAt
  const allItems = [
    ...notes.map(note => ({ item: note, type: 'note' as const, createdAt: note.createdAt })),
    ...folders.map(folder => ({ item: folder, type: 'folder' as const, createdAt: folder.createdAt })),
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Sort descending (newest first)
  });

  // Apply pagination manually
  const paginatedItems = allItems.slice(skip, skip + limitNum);

  // Format items based on their type
  const formattedItems = paginatedItems.map(({ item, type }) => {
    return formatItemResponse(item, type);
  });

  // Get pagination result
  const pagination = getPaginationResult(pageNum, limitNum, totalItems);

  return paginatedResponse(res, 'Recent items retrieved successfully', formattedItems, pagination);
});


export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { page, limit, type, search } = req.query;

  // Get pagination parameters (default: 10 items per page)
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  // Build queries for Notes and Folders
  const noteQuery: any = { userId, isFavorite: true };
  const folderQuery: any = { userId, isFavorite: true };

  // Add search filter
  if (search && typeof search === 'string') {
    noteQuery.title = { $regex: search, $options: 'i' };
    folderQuery.name = { $regex: search, $options: 'i' };
  }

  // Filter by type if provided
  if (type && typeof type === 'string') {
    if (type === 'folder') {
      const totalItems = await Folder.countDocuments(folderQuery);
      const folders = await Folder.find(folderQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
  ;

      const formattedItems = folders.map(folder => formatItemResponse(folder, 'folder'));
      const pagination = getPaginationResult(pageNum, limitNum, totalItems);

      return paginatedResponse(res, 'Favorite items retrieved successfully', formattedItems, pagination);
    } else if (['note', 'image', 'pdf'].includes(type)) {
      // Filter notes by type
      noteQuery.type = type;
      const totalItems = await Note.countDocuments(noteQuery);
      const notes = await Note.find(noteQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
;

      const formattedItems = notes.map(note => formatItemResponse(note, 'note'));
      const pagination = getPaginationResult(pageNum, limitNum, totalItems);

      return paginatedResponse(res, 'Favorite items retrieved successfully', formattedItems, pagination);
    }
  }

  // Get total count first (when no type filter or invalid type)
  const totalNotes = await Note.countDocuments(noteQuery);
  const totalFolders = await Folder.countDocuments(folderQuery);
  const totalItems = totalNotes + totalFolders;

  // Get notes and folders separately
  const [notes, folders] = await Promise.all([
    Note.find(noteQuery)
      .sort({ updatedAt: -1 })
,
    Folder.find(folderQuery)
      .sort({ updatedAt: -1 })
,
  ]);

  // Combine and sort by updatedAt
  const allItems = [
    ...notes.map(note => ({ item: note, type: 'note' as const, updatedAt: note.updatedAt })),
    ...folders.map(folder => ({ item: folder, type: 'folder' as const, updatedAt: folder.updatedAt })),
  ].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return dateB - dateA; // Sort descending (newest first)
  });

  // Apply pagination manually
  const paginatedItems = allItems.slice(skip, skip + limitNum);

  // Format items based on their type
  const formattedItems = paginatedItems.map(({ item, type }) => {
    return formatItemResponse(item, type);
  });

  // Get pagination result
  const pagination = getPaginationResult(pageNum, limitNum, totalItems);

  return paginatedResponse(res, 'Favorite items retrieved successfully', formattedItems, pagination);
});


export const getStorageStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Get user info
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Get counts by type
  const [
    totalNotes,
    totalImages,
    totalPDFs,
    totalFolders,
    totalFavorites,
  ] = await Promise.all([
    Note.countDocuments({ userId, type: 'note' }),
    Note.countDocuments({ userId, type: 'image' }),
    Note.countDocuments({ userId, type: 'pdf' }),
    Folder.countDocuments({ userId }),
    Note.countDocuments({ userId, isFavorite: true }),
  ]);

  // Get storage breakdown by type
  const notesSizeResult = await Note.aggregate([
    { $match: { userId: user._id, type: 'note' } },
    { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
  ]);

  const imagesSizeResult = await Note.aggregate([
    { $match: { userId: user._id, type: 'image' } },
    { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
  ]);

  const pdfsSizeResult = await Note.aggregate([
    { $match: { userId: user._id, type: 'pdf' } },
    { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
  ]);

  const notesSize = notesSizeResult[0]?.totalSize || 0;
  const imagesSize = imagesSizeResult[0]?.totalSize || 0;
  const pdfsSize = pdfsSizeResult[0]?.totalSize || 0;

  // Get storage info
  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  // Calculate percentage used
  const percentageUsed = user.storageLimit > 0 
    ? Math.round((user.storageUsed / user.storageLimit) * 100) 
    : 0;

  const stats = {
    storage: {
      used: user.storageUsed,
      usedFormatted: storageInfo.usedFormatted,
      limit: user.storageLimit,
      limitFormatted: storageInfo.limitFormatted,
      available: storageInfo.available,
      availableFormatted: storageInfo.availableFormatted,
      percentageUsed,
    },
    breakdown: {
      notes: {
        count: totalNotes,
        size: notesSize,
        sizeFormatted: getFileSizeInfo(notesSize).formatted,
      },
      images: {
        count: totalImages,
        size: imagesSize,
        sizeFormatted: getFileSizeInfo(imagesSize).formatted,
      },
      pdfs: {
        count: totalPDFs,
        size: pdfsSize,
        sizeFormatted: getFileSizeInfo(pdfsSize).formatted,
      },
    },
    counts: {
      totalNotes,
      totalImages,
      totalPDFs,
      totalFolders,
      totalFavorites,
      totalItems: totalNotes + totalImages + totalPDFs,
    },
  };

  successResponse(res, 'Storage statistics retrieved successfully', stats);
});

export const getItemsByDate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { date, page, limit, type } = req.query;

  // Validate date parameter
  if (!date || typeof date !== 'string') {
    throw ApiError.badRequest('Date parameter is required (format: YYYY-MM-DD)');
  }

  // Parse and validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw ApiError.badRequest('Invalid date format. Please use YYYY-MM-DD');
  }

  // Create date range for the selected date (start and end of day)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get pagination parameters (default: 20 items per page)
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  // Build queries for Notes and Folders with date range
  const noteQuery: any = {
    userId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };

  const folderQuery: any = {
    userId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };

  // Filter by type if provided
  if (type && typeof type === 'string') {
    if (type === 'folder') {
      // Only get folders
      const totalItems = await Folder.countDocuments(folderQuery);
      const folders = await Folder.find(folderQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
  ;

      const formattedItems = folders.map(folder => formatItemResponse(folder, 'folder'));
      const pagination = getPaginationResult(pageNum, limitNum, totalItems);

      return paginatedResponse(res, 'Items retrieved successfully', formattedItems, pagination);
    } else if (['note', 'image', 'pdf'].includes(type)) {
      // Filter notes by type
      noteQuery.type = type;
      const totalItems = await Note.countDocuments(noteQuery);
      const notes = await Note.find(noteQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
;

      const formattedItems = notes.map(note => formatItemResponse(note, 'note'));
      const pagination = getPaginationResult(pageNum, limitNum, totalItems);

      return paginatedResponse(res, 'Items retrieved successfully', formattedItems, pagination);
    }
  }

  // Get total count first (when no type filter or invalid type)
  const totalNotes = await Note.countDocuments(noteQuery);
  const totalFolders = await Folder.countDocuments(folderQuery);
  const totalItems = totalNotes + totalFolders;

  // Get notes and folders separately
  const [notes, folders] = await Promise.all([
    Note.find(noteQuery)
      .sort({ createdAt: -1 })
,
    Folder.find(folderQuery)
      .sort({ createdAt: -1 })
,
  ]);

  // Combine and sort by createdAt
  const allItems = [
    ...notes.map(note => ({ item: note, type: 'note' as const, createdAt: note.createdAt })),
    ...folders.map(folder => ({ item: folder, type: 'folder' as const, createdAt: folder.createdAt })),
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Sort descending (newest first)
  });

  // Apply pagination manually
  const paginatedItems = allItems.slice(skip, skip + limitNum);

  // Format items based on their type
  const formattedItems = paginatedItems.map(({ item, type }) => {
    return formatItemResponse(item, type);
  });

  // Get pagination result
  const pagination = getPaginationResult(pageNum, limitNum, totalItems);

  // Add summary information
  const summary = {
    date,
    totalItems,
    breakdown: {
      notes: notes.filter(n => n.type === 'note').length,
      images: notes.filter(n => n.type === 'image').length,
      pdfs: notes.filter(n => n.type === 'pdf').length,
      folders: folders.length,
    },
  };

  return res.status(200).json({
    success: true,
    message: 'Items retrieved successfully',
    data: formattedItems,
    summary,
    pagination,
  });
});
