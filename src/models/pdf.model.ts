import mongoose, { Schema } from 'mongoose';
import { IPDF } from '../types/pdf.types';

const pdfSchema = new Schema<IPDF>(
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
pdfSchema.index({ userId: 1, createdAt: -1 });
pdfSchema.index({ userId: 1, folderId: 1 });
pdfSchema.index({ userId: 1, lastAccessedAt: -1 });
pdfSchema.index({ userId: 1, isFavorite: 1 });

export const PDF = mongoose.model<IPDF>('PDF', pdfSchema);
