import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UserService } from '../services/user.service';
import { EmailService } from '../services/email.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { ApiError } from '../utils/ApiError';
import { successResponse, createdResponse } from '../views/responses/success.response';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  
  const user = await UserService.createUser({
    name,
    email,
    password,
    phone,
  });
  
  // Send welcome email
  await EmailService.sendWelcomeEmail({ name, email });
  
  const sanitizedUser = UserService.sanitizeUser(user);
  
  createdResponse(res, SUCCESS_MESSAGES.REGISTER_SUCCESS, sanitizedUser);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const user = await UserService.getUserByEmail(email);
  
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }
  
  if (!user.isActive) {
    throw ApiError.forbidden(ERROR_MESSAGES.USER_INACTIVE);
  }
  
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  const sanitizedUser = UserService.sanitizeUser(user);
  
  successResponse(res, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
    user: sanitizedUser,
    accessToken,
    refreshToken,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await UserService.getUserById(decoded.userId);
    
    if (!user.isActive) {
      throw ApiError.forbidden(ERROR_MESSAGES.USER_INACTIVE);
    }
    
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    
    successResponse(res, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    throw ApiError.unauthorized(ERROR_MESSAGES.TOKEN_INVALID);
  }
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const user = await UserService.getUserById(req.user.userId);
  const sanitizedUser = UserService.sanitizeUser(user);
  
  successResponse(res, 'Profile retrieved successfully', sanitizedUser);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const updates = req.body;
  const user = await UserService.updateUser(req.user.userId, updates);
  const sanitizedUser = UserService.sanitizeUser(user);
  
  successResponse(res, SUCCESS_MESSAGES.USER_UPDATED, sanitizedUser);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { currentPassword, newPassword } = req.body;
  
  await UserService.changePassword(req.user.userId, currentPassword, newPassword);
  
  successResponse(res, 'Password changed successfully');
});

