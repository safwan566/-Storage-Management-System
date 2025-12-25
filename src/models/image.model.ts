import mongoose, { Schema } from 'mongoose';
import { IImage } from '../types/image.types';

const imageSchema = new Schema<IImage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
imageSchema.index({ userId: 1, createdAt: -1 });
imageSchema.index({ userId: 1, folderId: 1 });
imageSchema.index({ userId: 1, lastAccessedAt: -1 });
imageSchema.index({ userId: 1, isFavorite: 1 });

export const Image = mongoose.model<IImage>('Image', imageSchema);
