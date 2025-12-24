import mongoose, { Schema } from 'mongoose';
import { INote } from '../types/note.types';

const noteSchema = new Schema<INote>(
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
    content: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['note', 'image', 'pdf'],
      required: [true, 'Type is required'],
    },
    fileUrl: {
      type: String,
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
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, folderId: 1 });
noteSchema.index({ userId: 1, lastAccessedAt: -1 });
noteSchema.index({ userId: 1, type: 1 });
noteSchema.index({ userId: 1, isFavorite: 1 });

export const Note = mongoose.model<INote>('Note', noteSchema);










