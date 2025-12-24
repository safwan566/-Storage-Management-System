import { User } from '../models/user.model';
import { IUser, IUserResponse } from '../types/user.types';
import { ApiError } from '../utils/ApiError';
import { ERROR_MESSAGES } from '../config/constants';
import { QueryOptions } from '../types/common.types';
import { getPaginationParams } from '../utils/pagination.utils';

export class UserService {
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      throw ApiError.conflict(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }
    
    const user = await User.create(userData);
    return user;
  }
  
  static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    
    if (!user) {
      throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    return user;
  }
  
  static async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }
  
  static async getAllUsers(options: QueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    
    const query: Record<string, unknown> = {};
    
    if (options.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }
    
    const [users, totalItems] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    
    return { users, totalItems, page, limit };
  }
  
  static async updateUser(id: string, updates: Partial<IUser>): Promise<IUser> {
    // Prevent password update through this method
    if (updates.password) {
      delete updates.password;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    return user;
  }
  
  static async deleteUser(id: string): Promise<void> {
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }
  
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    
    user.password = newPassword;
    await user.save();
  }
  
  static async generatePasswordResetToken(email: string): Promise<{ user: IUser; code: string }> {
    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
    
    if (!user) {
      throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordToken = code;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    
    await user.save();
    
    return { user, code };
  }
  
  static async verifyResetCode(email: string, code: string): Promise<boolean> {
    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
    
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return false;
    }
    
    if (user.resetPasswordToken !== code) {
      return false;
    }
    
    if (user.resetPasswordExpires < new Date()) {
      return false;
    }
    
    return true;
  }
  
  static async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ email }).select('+password +resetPasswordToken +resetPasswordExpires');
    
    if (!user) {
      throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      throw ApiError.badRequest('No password reset requested');
    }
    
    if (user.resetPasswordToken !== code) {
      throw ApiError.badRequest('Invalid verification code');
    }
    
    if (user.resetPasswordExpires < new Date()) {
      throw ApiError.badRequest('Verification code has expired');
    }
    
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
  }
  
  static sanitizeUser(user: IUser): IUserResponse {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

