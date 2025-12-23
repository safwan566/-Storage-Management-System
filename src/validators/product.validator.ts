import { z } from 'zod';
import { PRODUCT_STATUS } from '../config/constants';

const dimensionsSchema = z.object({
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters').max(200, 'Product name cannot exceed 200 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
    sku: z.string().min(1, 'SKU is required').toUpperCase(),
    price: z.number().positive('Price must be positive'),
    costPrice: z.number().positive('Cost price must be positive'),
    quantity: z.number().int().min(0, 'Quantity cannot be negative'),
    category: z.string().min(1, 'Category is required'),
    brand: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum([PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.OUT_OF_STOCK]).optional(),
    specifications: z.record(z.unknown()).optional(),
    tags: z.array(z.string()).optional(),
    weight: z.number().positive('Weight must be positive').optional(),
    dimensions: dimensionsSchema.optional(),
    minStockLevel: z.number().int().min(0, 'Minimum stock level cannot be negative').optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters').max(200, 'Product name cannot exceed 200 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters').optional(),
    sku: z.string().min(1, 'SKU is required').toUpperCase().optional(),
    price: z.number().positive('Price must be positive').optional(),
    costPrice: z.number().positive('Cost price must be positive').optional(),
    quantity: z.number().int().min(0, 'Quantity cannot be negative').optional(),
    category: z.string().min(1, 'Category is required').optional(),
    brand: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum([PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.OUT_OF_STOCK]).optional(),
    specifications: z.record(z.unknown()).optional(),
    tags: z.array(z.string()).optional(),
    weight: z.number().positive('Weight must be positive').optional(),
    dimensions: dimensionsSchema.optional(),
    minStockLevel: z.number().int().min(0, 'Minimum stock level cannot be negative').optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

