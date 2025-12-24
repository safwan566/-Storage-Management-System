import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { Note } from '../models/note.model';
import { Folder } from '../models/folder.model';
import { filePathToUrl, getFileSizeInfo } from '../utils/file.utils';
import { getPaginationParams, getPaginationResult } from '../utils/pagination.utils';
import { paginatedResponse } from '../views/responses/pagination.response';

/**
 * Format item response based on type
 */
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

/**
 * Get recent items (all types: notes, images, PDFs, folders) with pagination
 * Shows recently added items sorted by creation date
 * @route GET /api/storage/recent
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} type - Filter by type: 'note', 'image', 'pdf', 'folder' (optional)
 */
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
        .populate('parentFolder', 'name');

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
        .populate('folderId', 'name');

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
      .populate('folderId', 'name'),
    Folder.find(folderQuery)
      .sort({ createdAt: -1 })
      .populate('parentFolder', 'name'),
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
