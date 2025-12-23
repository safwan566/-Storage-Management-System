import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { OrderService } from '../services/order.service';
import { successResponse, createdResponse } from '../views/responses/success.response';
import { paginatedResponse } from '../views/responses/pagination.response';
import { SUCCESS_MESSAGES } from '../config/constants';
import { getPaginationResult } from '../utils/pagination.utils';
import { ApiError } from '../utils/ApiError';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  const orderData = {
    ...req.body,
    customer: req.user.userId,
    createdBy: req.user.userId,
  };
  
  const order = await OrderService.createOrder(orderData);
  
  createdResponse(res, SUCCESS_MESSAGES.ORDER_CREATED, order);
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, customer } = req.query;
  
  const options = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    status: status as string,
    customer: customer as string,
  };
  
  const { orders, totalItems, page: currentPage, limit: currentLimit } = 
    await OrderService.getAllOrders(options);
  
  const pagination = getPaginationResult(currentPage, currentLimit, totalItems);
  
  paginatedResponse(res, 'Orders retrieved successfully', orders, pagination);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.getOrderById(req.params.id);
  
  successResponse(res, 'Order retrieved successfully', order);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  const updates = {
    ...req.body,
    updatedBy: req.user.userId,
  };
  
  const order = await OrderService.updateOrder(req.params.id, updates);
  
  successResponse(res, SUCCESS_MESSAGES.ORDER_UPDATED, order);
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { cancellationReason } = req.body;
  
  const order = await OrderService.cancelOrder(req.params.id, cancellationReason);
  
  successResponse(res, SUCCESS_MESSAGES.ORDER_CANCELLED, order);
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  const { page, limit } = req.query;
  
  const options = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  };
  
  const { orders, totalItems, page: currentPage, limit: currentLimit } = 
    await OrderService.getOrdersByCustomer(req.user.userId, options);
  
  const pagination = getPaginationResult(currentPage, currentLimit, totalItems);
  
  paginatedResponse(res, 'Your orders retrieved successfully', orders, pagination);
});

