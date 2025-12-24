import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { successResponse } from '../views/responses/success.response';
import { getStorageInfo, formatStorage } from '../utils/storage.utils';

/**
 * Get storage statistics for current user
 * @route GET /api/storage/stats
 * @access Private
 */
export const getStorageStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Get current user
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Get breakdown by type using aggregation
  const breakdown = await Note.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: '$type',
        totalSize: { $sum: '$fileSize' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Format breakdown for response
  const formattedBreakdown = breakdown.map((item) => ({
    type: item._id,
    totalSize: item.totalSize,
    totalSizeFormatted: formatStorage(item.totalSize),
    count: item.count,
  }));

  // Get storage info
  const storageInfo = getStorageInfo(user.storageUsed, user.storageLimit);

  successResponse(res, 'Storage statistics retrieved successfully', {
    storageUsed: storageInfo.used,
    storageLimit: storageInfo.limit,
    storageAvailable: storageInfo.available,
    storageUsedGB: storageInfo.usedGB,
    storageLimitGB: storageInfo.limitGB,
    storageAvailableGB: storageInfo.availableGB,
    storageUsedFormatted: storageInfo.usedFormatted,
    storageLimitFormatted: storageInfo.limitFormatted,
    storageAvailableFormatted: storageInfo.availableFormatted,
    percentage: storageInfo.percentage,
    breakdown: formattedBreakdown,
  });
});







