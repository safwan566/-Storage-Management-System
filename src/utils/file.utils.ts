import path from 'node:path';

/**
 * Normalize file path to use forward slashes
 * Converts Windows backslashes to forward slashes
 */
export function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Get just the filename from a full path
 */
export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

/**
 * Format file size to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string with appropriate unit
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file size info with both bytes and formatted string
 */
export function getFileSizeInfo(bytes: number) {
  return {
    bytes,
    formatted: formatFileSize(bytes),
  };
}

/**
 * Convert file system path to URL path for client access
 * Removes 'public' prefix and converts to API route format
 * Examples:
 *   'public/uploads/image.jpg' -> '/api/uploads/image.jpg'
 *   'C:/path/public/uploads/image.jpg' -> '/api/uploads/image.jpg'
 *   'uploads/image.jpg' -> '/api/uploads/image.jpg'
 */
export function filePathToUrl(filePath: string): string {
  if (!filePath) return '';
  
  // Normalize the path first (convert backslashes to forward slashes)
  const normalized = normalizeFilePath(filePath);
  
  // Extract filename from path
  const filename = path.basename(normalized);
  
  // If path contains 'public/uploads/', extract just the filename
  // Otherwise, if it contains 'uploads/', extract the part after 'uploads/'
  if (normalized.includes('public/uploads/')) {
    const uploadsIndex = normalized.indexOf('public/uploads/');
    const relativePath = normalized.substring(uploadsIndex + 'public/uploads/'.length);
    return `/api/uploads/${relativePath}`;
  } else if (normalized.includes('uploads/')) {
    const uploadsIndex = normalized.indexOf('uploads/');
    const relativePath = normalized.substring(uploadsIndex + 'uploads/'.length);
    return `/api/uploads/${relativePath}`;
  }
  
  // Fallback: just use the filename
  return `/api/uploads/${filename}`;
}



