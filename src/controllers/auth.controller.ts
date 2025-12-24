import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UserService } from '../services/user.service';
import { EmailService } from '../services/email.service';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { ApiError } from '../utils/ApiError';
import { successResponse, createdResponse } from '../views/responses/success.response';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  
  const user = await UserService.createUser({
    name,
    email,
    password,
  });
  
  await EmailService.sendWelcomeEmail({ name, email });
  
  const sanitizedUser = UserService.sanitizeUser(user);
  
  createdResponse(res, 'User registered successfully', sanitizedUser);
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const user = await UserService.getUserByEmail(email);
  
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  
  if (!user.isActive) {
    throw ApiError.forbidden('Account is inactive');
  }
  
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  const sanitizedUser = UserService.sanitizeUser(user);
  
  successResponse(res, 'Login successful', {
    user: sanitizedUser,
    accessToken,
    refreshToken,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  const { code } = await UserService.generatePasswordResetToken(email);
  
  await EmailService.sendVerificationCode(email, code);
  
  successResponse(res, 'Verification code sent to your email');
});

export const verifyCode = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;
  
  const isValid = await UserService.verifyResetCode(email, code);
  
  if (!isValid) {
    throw ApiError.badRequest('Invalid or expired verification code');
  }
  
  successResponse(res, 'Verification code is valid');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  
  await UserService.resetPassword(email, code, newPassword);
  
  await EmailService.sendPasswordResetConfirmation(email);
  
  successResponse(res, 'Password reset successful');
});
