import { Order, IOrder } from '../models/order.model';
import { Product } from '../models/product.model';
import { ApiError } from '../utils/ApiError';
import { ERROR_MESSAGES, ORDER_STATUS } from '../config/constants';
import { QueryOptions } from '../types/common.types';
import { getPaginationParams } from '../utils/pagination.utils';
import mongoose from 'mongoose';

interface CreateOrderData {
  customer: string;
  items: Array<{ product: string; quantity: number }>;
  shippingAddress: IOrder['shippingAddress'];
  billingAddress?: IOrder['billingAddress'];
  paymentMethod: string;
  notes?: string;
  shippingCost?: number;
  discount?: number;
  createdBy: string;
}

export class OrderService {
  static async createOrder(orderData: CreateOrderData): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Validate products and calculate totals
      const orderItems = [];
      let subtotal = 0;
      
      for (const item of orderData.items) {
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          throw ApiError.notFound(`Product not found: ${item.product}`);
        }
        
        if (product.quantity < item.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
          );
        }
        
        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;
        
        orderItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price: product.price,
          subtotal: itemSubtotal,
        });
        
        // Reduce stock
        product.quantity -= item.quantity;
        await product.save({ session });
      }
      
      // Calculate totals
      const tax = subtotal * 0.1; // 10% tax
      const shippingCost = orderData.shippingCost || 0;
      const discount = orderData.discount || 0;
      const total = subtotal + tax + shippingCost - discount;
      
      // Create order
      const [order] = await Order.create(
        [
          {
            customer: orderData.customer,
            items: orderItems,
            subtotal,
            tax,
            shippingCost,
            discount,
            total,
            shippingAddress: orderData.shippingAddress,
            billingAddress: orderData.billingAddress || orderData.shippingAddress,
            paymentMethod: orderData.paymentMethod,
            notes: orderData.notes,
            createdBy: orderData.createdBy,
          },
        ],
        { session }
      );
      
      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  static async getOrderById(id: string): Promise<IOrder> {
    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name sku images')
      .populate('createdBy', 'name email');
    
    if (!order) {
      throw ApiError.notFound(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }
    
    return order;
  }
  
  static async getAllOrders(options: QueryOptions & { status?: string; customer?: string }) {
    const { page, limit, skip } = getPaginationParams(options);
    
    const query: Record<string, unknown> = {};
    
    if (options.status) {
      query.status = options.status;
    }
    
    if (options.customer) {
      query.customer = options.customer;
    }
    
    const [orders, totalItems] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('customer', 'name email')
        .populate('createdBy', 'name email'),
      Order.countDocuments(query),
    ]);
    
    return { orders, totalItems, page, limit };
  }
  
  static async updateOrder(id: string, updates: Partial<IOrder>): Promise<IOrder> {
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      throw ApiError.notFound(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }
    
    return order;
  }
  
  static async cancelOrder(id: string, reason: string): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const order = await Order.findById(id).session(session);
      
      if (!order) {
        throw ApiError.notFound(ERROR_MESSAGES.ORDER_NOT_FOUND);
      }
      
      if (order.status === ORDER_STATUS.CANCELLED) {
        throw ApiError.badRequest(ERROR_MESSAGES.ORDER_ALREADY_CANCELLED);
      }
      
      if (order.status === ORDER_STATUS.DELIVERED) {
        throw ApiError.badRequest(ERROR_MESSAGES.ORDER_CANNOT_BE_CANCELLED);
      }
      
      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } },
          { session }
        );
      }
      
      order.status = ORDER_STATUS.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = reason;
      await order.save({ session });
      
      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  static async getOrdersByCustomer(customerId: string, options: QueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    
    const [orders, totalItems] = await Promise.all([
      Order.find({ customer: customerId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments({ customer: customerId }),
    ]);
    
    return { orders, totalItems, page, limit };
  }
}

