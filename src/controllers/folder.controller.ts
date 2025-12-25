import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Folder } from '../models/folder.model';
import { Note } from '../models/note.model';
import { Image } from '../models/image.model';
import { PDF } from '../models/pdf.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, hasEnoughStorage } from '../utils/storage.utils';
import { getPaginationParams, getPaginationResult } from '../utils/pagination.utils';
import { paginatedResponse } from '../views/responses/pagination.response';
import { filePathToUrl, getFileSizeInfo } from '../utils/file.utils';
import fs from 'fs';


export const getAllFolders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { page, limit, search, parentFolder, isFavorite } = req.query;

  // Get pagination parameters (default: 20 items per page)
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  // Build query
  const query: any = { userId };

  // Add search filter
  if (search && typeof search === 'string') {
    query.name = { $regex: search, $options: 'i' };
  }

  // Add parent folder filter
  if (parentFolder !== undefined) {
    if (parentFolder === 'null') {
      query.parentFolder = null;
    } else if (typeof parentFolder === 'string') {
      query.parentFolder = parentFolder;
    }
  }

  // Add favorite filter
  if (isFavorite !== undefined) {
    query.isFavorite = isFavorite === 'true';
  }

  // Get total count
  const totalItems = await Folder.countDocuments(query);

  // Get folders with pagination
  const folders = await Folder.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Get pagination result
  const pagination = getPaginationResult(pageNum, limitNum, totalItems);

  return paginatedResponse(res, 'Folders retrieved successfully', folders, pagination);
});

export const getFolderById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const folder = await Folder.findOne({ _id: id, userId });

  if (!folder) {
    throw ApiError.notFound('Folder not found');
  }

  // Get all items in this folder (including subfolders)
  const [notes, images, pdfs, subfolders] = await Promise.all([
    Note.find({ folderId: id, userId }).sort({ createdAt: -1 }),
    Image.find({ folderId: id, userId }).sort({ createdAt: -1 }),
    PDF.find({ folderId: id, userId }).sort({ createdAt: -1 }),
    Folder.find({ parentFolder: id, userId }).sort({ createdAt: -1 }),
  ]);

  // Format notes
  const formattedNotes = notes.map(note => {
    const noteObj = note.toObject();
    return {
      ...noteObj,
      type: 'note',
    };
  });

  // Format images
  const formattedImages = images.map(image => {
    const imageObj = image.toObject();
    return {
      ...imageObj,
      type: 'image',
      fileUrl: imageObj.fileUrl ? filePathToUrl(imageObj.fileUrl) : imageObj.fileUrl,
      fileSizeFormatted: getFileSizeInfo(imageObj.fileSize).formatted,
    };
  });

  // Format PDFs
  const formattedPDFs = pdfs.map(pdf => {
    const pdfObj = pdf.toObject();
    return {
      ...pdfObj,
      type: 'pdf',
      fileUrl: pdfObj.fileUrl ? filePathToUrl(pdfObj.fileUrl) : pdfObj.fileUrl,
      fileSizeFormatted: getFileSizeInfo(pdfObj.fileSize).formatted,
    };
  });

  // Format subfolders
  const formattedSubfolders = subfolders.map(subfolder => {
    const subfolderObj = subfolder.toObject();
    return {
      ...subfolderObj,
      type: 'folder',
    };
  });

  // Combine all items
  const items = [...formattedSubfolders, ...formattedNotes, ...formattedImages, ...formattedPDFs];

  successResponse(res, 'Folder retrieved successfully', {
    folder,
    items,
    counts: {
      folders: subfolders.length,
      notes: notes.length,
      images: images.length,
      pdfs: pdfs.length,
      total: items.length,
    },
  });
});

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

  // Find all items in this folder
  const [notes, images, pdfs] = await Promise.all([
    Note.find({ folderId: id }),
    Image.find({ folderId: id }),
    PDF.find({ folderId: id }),
  ]);

  let totalFreedSpace = 0;

  // Delete all notes (text notes don't have files)
  for (const note of notes) {
    totalFreedSpace += note.fileSize;
  }

  // Delete all images and their files
  for (const image of images) {
    if (image.fileUrl) {
      try {
        if (fs.existsSync(image.fileUrl)) {
          fs.unlinkSync(image.fileUrl);
        }
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }
    totalFreedSpace += image.fileSize;
  }

  // Delete all PDFs and their files
  for (const pdf of pdfs) {
    if (pdf.fileUrl) {
      try {
        if (fs.existsSync(pdf.fileUrl)) {
          fs.unlinkSync(pdf.fileUrl);
        }
      } catch (error) {
        console.error('Error deleting PDF file:', error);
      }
    }
    totalFreedSpace += pdf.fileSize;
  }

  // Delete all items in folder
  await Promise.all([
    Note.deleteMany({ folderId: id }),
    Image.deleteMany({ folderId: id }),
    PDF.deleteMany({ folderId: id }),
  ]);

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
  const textNotes = await Note.find({ folderId: id });

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

export const toggleFolderFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const folder = await Folder.findOne({ _id: id, userId });

  if (!folder) {
    throw ApiError.notFound('Folder not found');
  }

  folder.isFavorite = !folder.isFavorite;
  await folder.save();

  successResponse(
    res,
    `Folder ${folder.isFavorite ? 'added to' : 'removed from'} favorites`,
    { folder }
  );
});






