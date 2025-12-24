import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UserService } from '../services/user.service';
import { successResponse } from '../views/responses/success.response';
import { ApiError } from '../utils/ApiError';
import path from 'node:path';
import fs from 'node:fs/promises';
import { config } from '../config/environment';
import { logger } from '../config/logger';

/**
 * Update user profile (name and/or avatar)
 * @route PUT /api/users/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const updateData: { name?: string; avatar?: string } = {};

  // Update name if provided
  if (req.body.name) {
    updateData.name = req.body.name;
  }

  // Handle avatar upload if file is provided
  if (req.file) {
    // Get current user to check for existing avatar
    const currentUser = await UserService.getUserById(userId);
    
    // Delete old avatar if it exists
    if (currentUser.avatar) {
      const oldAvatarPath = path.join(config.upload.path, path.basename(currentUser.avatar));
      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        // Log error but don't fail the request if file doesn't exist
        logger.error('Error deleting old avatar:', error);
      }
    }

    // Set new avatar path (relative to uploads directory)
    updateData.avatar = `/uploads/${req.file.filename}`;
  }

  // Validate that at least one field is being updated
  if (!updateData.name && !updateData.avatar) {
    throw ApiError.badRequest('At least one field (name or image) must be provided for update');
  }

  // Update user profile
  const updatedUser = await UserService.updateUser(userId, updateData);
  const sanitizedUser = UserService.sanitizeUser(updatedUser);

  successResponse(res, 'Profile updated successfully', sanitizedUser);
});

/**
 * Change user password
 * @route PUT /api/users/change-password
 * @access Private
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const { currentPassword, newPassword } = req.body;

  await UserService.changePassword(userId, currentPassword, newPassword);

  successResponse(res, 'Password changed successfully');
});

/**
 * Delete user profile (account deletion)
 * @route DELETE /api/users/profile
 * @access Private
 */
export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  // Get user to check for avatar before deletion
  const user = await UserService.getUserById(userId);
  
  // Delete avatar file if it exists
  if (user.avatar) {
    const avatarPath = path.join(config.upload.path, path.basename(user.avatar));
    try {
      await fs.unlink(avatarPath);
    } catch (error) {
      // Log error but don't fail the request if file doesn't exist
      logger.error('Error deleting avatar file:', error);
    }
  }

  // Delete user account
  await UserService.deleteUser(userId);

  successResponse(res, 'Profile deleted successfully');
});

