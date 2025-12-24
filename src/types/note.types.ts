import { Document, Types } from 'mongoose';

export interface INote extends Document {
  userId: Types.ObjectId;
  folderId?: Types.ObjectId | null;
  title: string;
  content: string;
  type: 'note' | 'image' | 'pdf';
  fileUrl?: string;
  fileSize: number;
  lastAccessedAt: Date;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoteResponse {
  _id: string;
  userId: string;
  folderId?: string | null;
  title: string;
  content: string;
  type: 'note' | 'image' | 'pdf';
  fileUrl?: string;
  fileSize: number;
  lastAccessedAt: Date;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
