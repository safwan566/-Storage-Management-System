import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ProductService } from '../services/product.service';
import { successResponse, createdResponse, noContentResponse } from '../views/responses/success.response';
import { paginatedResponse } from '../views/responses/pagination.response';
import { SUCCESS_MESSAGES } from '../config/constants';
import { getPaginationResult } from '../utils/pagination.utils';
import { ApiError } from '../utils/ApiError';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  const productData = {
    ...req.body,
    createdBy: req.user.userId,
  };
  
  const product = await ProductService.createProduct(productData);
  
  createdResponse(res, SUCCESS_MESSAGES.PRODUCT_CREATED, product);
});

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search } = req.query;
  
  const options = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
  };
  
  const { products, totalItems, page: currentPage, limit: currentLimit } = 
    await ProductService.getAllProducts(options);
  
  const pagination = getPaginationResult(currentPage, currentLimit, totalItems);
  
  paginatedResponse(res, 'Products retrieved successfully', products, pagination);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.getProductById(req.params.id);
  
  successResponse(res, 'Product retrieved successfully', product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  const updates = {
    ...req.body,
    updatedBy: req.user.userId,
  };
  
  const product = await ProductService.updateProduct(req.params.id, updates);
  
  successResponse(res, SUCCESS_MESSAGES.PRODUCT_UPDATED, product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await ProductService.deleteProduct(req.params.id);
  
  noContentResponse(res);
});

export const getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await ProductService.getLowStockProducts();
  
  successResponse(res, 'Low stock products retrieved successfully', products);
});

