import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, hasEnoughStorage } from '../utils/storage.utils';
import { normalizeFilePath, getFileSizeInfo, filePathToUrl } from '../utils/file.utils';
import { getPaginationParams, getPaginationResult } from '../utils/pagination.utils';
import { paginatedResponse } from '../views/responses/pagination.response';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Format PDF response with additional fields
 */
function formatPDFResponse(pdf: any) {
  const pdfObj = pdf.toObject ? pdf.toObject() : pdf;
  return {
    ...pdfObj,
    fileUrl: pdfObj.fileUrl ? filePathToUrl(pdfObj.fileUrl) : pdfObj.fileUrl,
    fileSizeFormatted: getFileSizeInfo(pdfObj.fileSize).formatted,
  };
}

/**
 * Get all PDFs for current user with filtering and pagination
 * @route GET /api/pdfs
 * @access Private
 * @query {string} folderId - Filter by folder ID
 * @query {string} title - Search by title (case-insensitive partial match)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
export const getAllPDFs = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { folderId, title, page, limit } = req.query;

  // Build query
  interface PDFQuery {
    userId: string;
    type: string;
    folderId?: string | null;
    title?: RegExp;
  }
  
  const query: PDFQuery = { userId, type: 'pdf' };
  
  // Filter by folderId
  if (folderId && typeof folderId === 'string') {
    query.folderId = folderId;
  } else if (folderId === 'null' || folderId === '') {
    query.folderId = null;
  }

  // Filter by title (case-insensitive partial match)
  if (title && typeof title === 'string' && title.trim()) {
    query.title = new RegExp(title.trim(), 'i');
  }

  // Get pagination parameters
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  // Get total count for pagination
  const totalItems = await Note.countDocuments(query);

  // Get PDFs with pagination
  const pdfs = await Note.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('folderId', 'name');

  // Format PDFs with additional fields
  const formattedPDFs = pdfs.map(formatPDFResponse);

  // Get pagination result
  const pagination = getPaginationResult(pageNum, limitNum, totalItems);

  paginatedResponse(res, 'PDFs retrieved successfully', formattedPDFs, pagination);
});

/**
 * Get single PDF by ID
 * @route GET /api/pdfs/:id
 * @access Private
 */
export const getPDFById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const pdf = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'pdf' 
  }).populate('folderId', 'name');

  if (!pdf) {
    throw ApiError.notFound('PDF not found');
  }

  // Update last accessed time
  pdf.lastAccessedAt = new Date();
  await pdf.save();

  const formattedPDF = formatPDFResponse(pdf);

  successResponse(res, 'PDF retrieved successfully', { pdf: formattedPDF });
});

/**
 * Update PDF metadata (title, folder)
 * @route PATCH /api/pdfs/:id
 * @access Private
 */
export const updatePDF = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { title, folderId } = req.body;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the PDF
  const pdf = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'pdf' 
  });

  if (!pdf) {
    throw ApiError.notFound('PDF not found');
  }

  // Update metadata
  if (title !== undefined) {
    pdf.title = title;
  }
  
  if (folderId !== undefined) {
    pdf.folderId = folderId || null;
  }

  pdf.updatedAt = new Date();
  await pdf.save();

  // Populate folder information
  await pdf.populate('folderId', 'name');

  const formattedPDF = formatPDFResponse(pdf);

  successResponse(res, 'PDF updated successfully', { pdf: formattedPDF });
});

/**
 * Delete a PDF
 * @route DELETE /api/pdfs/:id
 * @access Private
 */
export const deletePDF = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the PDF
  const pdf = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'pdf' 
  });

  if (!pdf) {
    throw ApiError.notFound('PDF not found');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Delete the physical file
  if (pdf.fileUrl) {
    try {
      if (fs.existsSync(pdf.fileUrl)) {
        fs.unlinkSync(pdf.fileUrl);
      }
    } catch (error) {
      console.error('Error deleting PDF file:', error);
      // Continue with deletion even if file deletion fails
    }
  }

  // Decrease user's storage usage
  user.storageUsed -= pdf.fileSize;
  
  // Ensure storage used doesn't go below 0
  if (user.storageUsed < 0) {
    user.storageUsed = 0;
  }
  
  await user.save();

  // Delete PDF from database
  await Note.deleteOne({ _id: pdf._id });

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  successResponse(res, 'PDF deleted successfully', { storage: storageInfo });
});

/**
 * Duplicate a PDF
 * @route POST /api/pdfs/:id/duplicate
 * @access Private
 */
export const duplicatePDF = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Find the original PDF
  const originalPDF = await Note.findOne({ 
    _id: id, 
    userId, 
    type: 'pdf' 
  });

  if (!originalPDF) {
    throw ApiError.notFound('PDF not found');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Check if user has enough storage for the duplicate
  if (!hasEnoughStorage(user.storageUsed, user.storageLimit, originalPDF.fileSize)) {
    const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);
    throw ApiError.badRequest(
      `Storage limit exceeded. You need ${(originalPDF.fileSize / (1024 * 1024)).toFixed(2)} MB but only ${storageInfo.availableFormatted} is available`
    );
  }

  // Duplicate the physical file
  let newFileUrl = '';
  
  if (originalPDF.fileUrl && fs.existsSync(originalPDF.fileUrl)) {
    const ext = path.extname(originalPDF.fileUrl);
    const dir = path.dirname(originalPDF.fileUrl);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const newFileName = `pdf-${timestamp}-${random}${ext}`;
    newFileUrl = normalizeFilePath(path.join(dir, newFileName));

    try {
      fs.copyFileSync(originalPDF.fileUrl, newFileUrl);
    } catch (error) {
      console.error('Error copying file:', error);
      throw ApiError.internal('Failed to duplicate PDF file');
    }
  } else {
    throw ApiError.notFound('Original PDF file not found');
  }

  // Create duplicate note
  const duplicatePDF = await Note.create({
    userId: user._id,
    folderId: originalPDF.folderId,
    title: `${originalPDF.title} (Copy)`,
    type: 'pdf',
    fileUrl: newFileUrl,
    fileSize: originalPDF.fileSize,
  });

  // Update user's storage usage
  user.storageUsed += originalPDF.fileSize;
  await user.save();

  // Populate folder information
  await duplicatePDF.populate('folderId', 'name');

  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  const formattedPDF = formatPDFResponse(duplicatePDF);

  successResponse(res, 'PDF duplicated successfully', {
    pdf: formattedPDF,
    storage: storageInfo,
  });
});

