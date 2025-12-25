import { Document, Types } from 'mongoose';

export interface IImage extends Document {
  userId: Types.ObjectId;
  folderId?: Types.ObjectId | null;
  title: string;
  fileUrl: string;
  fileSize: number;
  lastAccessedAt: Date;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IImageResponse {
  _id: string;
  userId: string;
  folderId?: string | null;
  title: string;
  fileUrl: string;
  fileSize: number;
  fileSizeFormatted?: string;
  lastAccessedAt: Date;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
