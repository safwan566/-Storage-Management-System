/**
 * Storage utility functions for handling file size conversions and formatting
 */

/**
 * Convert bytes to GB with 2 decimal places
 * @param bytes - Size in bytes
 * @returns Size in GB with 2 decimal places
 */
export const bytesToGB = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb.toFixed(2);
};

/**
 * Convert GB to bytes
 * @param gb - Size in GB
 * @returns Size in bytes
 */
export const gbToBytes = (gb: number): number => {
  return Math.floor(gb * 1024 * 1024 * 1024);
};

/**
 * Format bytes to human-readable format (B, KB, MB, GB)
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with appropriate unit
 */
export const formatStorage = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Calculate percentage of storage used
 * @param used - Storage used in bytes
 * @param limit - Storage limit in bytes
 * @returns Percentage with 2 decimal places
 */
export const storagePercentage = (used: number, limit: number): string => {
  if (limit === 0) return '0.00';
  const percentage = (used / limit) * 100;
  return percentage.toFixed(2);
};

/**
 * Check if user has enough storage space
 * @param currentUsed - Current storage used in bytes
 * @param storageLimit - Storage limit in bytes
 * @param requiredSpace - Required space in bytes
 * @returns Boolean indicating if space is available
 */
export const hasEnoughStorage = (
  currentUsed: number,
  storageLimit: number,
  requiredSpace: number
): boolean => {
  return currentUsed + requiredSpace <= storageLimit;
};

/**
 * Get storage information object
 * @param used - Storage used in bytes
 * @param limit - Storage limit in bytes
 * @returns Storage information object
 */
export const getStorageInfo = (used: number, limit: number) => {
  const available = limit - used;
  
  return {
    used,
    limit,
    available: available > 0 ? available : 0,
    usedGB: bytesToGB(used),
    limitGB: bytesToGB(limit),
    availableGB: bytesToGB(available > 0 ? available : 0),
    percentage: storagePercentage(used, limit),
    usedFormatted: formatStorage(used),
    limitFormatted: formatStorage(limit),
    availableFormatted: formatStorage(available > 0 ? available : 0),
  };
};












