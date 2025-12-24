import mongoose, { Schema } from 'mongoose';
import { IFolder } from '../types/folder.types';

const folderSchema = new Schema<IFolder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    parentFolder: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['folder'],
      required: [true, 'Type is required'],
      default: 'folder',
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
folderSchema.index({ userId: 1, createdAt: -1 });
folderSchema.index({ userId: 1, parentFolder: 1 });
folderSchema.index({ userId: 1, isFavorite: 1 });

// Prevent duplicate folder names at the same level for same user
folderSchema.index({ userId: 1, name: 1, parentFolder: 1 }, { unique: true });

export const Folder = mongoose.model<IFolder>('Folder', folderSchema);










