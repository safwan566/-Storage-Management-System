import { Product, IProduct } from '../models/product.model';
import { ApiError } from '../utils/ApiError';
import { ERROR_MESSAGES } from '../config/constants';
import { QueryOptions } from '../types/common.types';
import { getPaginationParams } from '../utils/pagination.utils';

export class ProductService {
  static async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
    const existingProduct = await Product.findOne({ sku: productData.sku });
    
    if (existingProduct) {
      throw ApiError.conflict('Product with this SKU already exists');
    }
    
    const product = await Product.create(productData);
    return product;
  }
  
  static async getProductById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!product) {
      throw ApiError.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    
    return product;
  }
  
  static async getProductBySku(sku: string): Promise<IProduct | null> {
    return Product.findOne({ sku: sku.toUpperCase() });
  }
  
  static async getAllProducts(options: QueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    
    const query: Record<string, unknown> = {};
    
    if (options.search) {
      query.$text = { $search: options.search };
    }
    
    const [products, totalItems] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email'),
      Product.countDocuments(query),
    ]);
    
    return { products, totalItems, page, limit };
  }
  
  static async updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      throw ApiError.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    
    return product;
  }
  
  static async deleteProduct(id: string): Promise<void> {
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      throw ApiError.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
  }
  
  static async updateStock(id: string, quantity: number): Promise<IProduct> {
    const product = await Product.findById(id);
    
    if (!product) {
      throw ApiError.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    
    product.quantity += quantity;
    
    if (product.quantity < 0) {
      throw ApiError.badRequest(ERROR_MESSAGES.INSUFFICIENT_STOCK);
    }
    
    await product.save();
    return product;
  }
  
  static async checkStock(id: string, requiredQuantity: number): Promise<boolean> {
    const product = await Product.findById(id);
    
    if (!product) {
      throw ApiError.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    
    return product.quantity >= requiredQuantity;
  }
  
  static async getLowStockProducts(): Promise<IProduct[]> {
    return Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
    }).sort({ quantity: 1 });
  }
}

