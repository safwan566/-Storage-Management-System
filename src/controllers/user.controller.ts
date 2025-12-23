import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UserService } from '../services/user.service';
import { successResponse, createdResponse, noContentResponse } from '../views/responses/success.response';
import { paginatedResponse } from '../views/responses/pagination.response';
import { SUCCESS_MESSAGES } from '../config/constants';
import { getPaginationResult } from '../utils/pagination.utils';

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body);
  const sanitizedUser = UserService.sanitizeUser(user);
  
  createdResponse(res, SUCCESS_MESSAGES.USER_CREATED, sanitizedUser);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search } = req.query;
  
  const options = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
  };
  
  const { users, totalItems, page: currentPage, limit: currentLimit } = 
    await UserService.getAllUsers(options);
  
  const sanitizedUsers = users.map((user) => UserService.sanitizeUser(user));
  
  const pagination = getPaginationResult(currentPage, currentLimit, totalItems);
  
  paginatedResponse(res, 'Users retrieved successfully', sanitizedUsers, pagination);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(req.params.id);
  const sanitizedUser = UserService.sanitizeUser(user);
  
  successResponse(res, 'User retrieved successfully', sanitizedUser);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.updateUser(req.params.id, req.body);
  const sanitizedUser = UserService.sanitizeUser(user);
  
  successResponse(res, SUCCESS_MESSAGES.USER_UPDATED, sanitizedUser);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await UserService.deleteUser(req.params.id);
  
  noContentResponse(res);
});

