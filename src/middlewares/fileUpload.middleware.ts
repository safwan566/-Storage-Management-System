import multer, { FileFilterCallback } from 'multer';
import path from 'node:path';
import type { Request } from 'express';
import { ApiError } from '../utils/ApiError';
import { config } from '../config/environment';

// Storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.path);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = file.fieldname;
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        'Invalid file type. Only JPEG, JPG, PNG, and GIF images are allowed'
      )
    );
  }
};

// File filter for PDFs
const pdfFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Invalid file type. Only PDF files are allowed'));
  }
};

// Max file size: 10MB
const maxFileSize = 10 * 1024 * 1024;

// Multer instance for image uploads
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: maxFileSize,
  },
}).single('image');

// Alias for uploadImage
export const uploadSingleImage = uploadImage;

// Multer instance for PDF uploads
export const uploadPDF = multer({
  storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: maxFileSize,
  },
}).single('pdf');

// Export multer instance for custom configurations if needed
export { default as multerInstance } from 'multer';

