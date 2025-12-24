import { Document, Types } from 'mongoose';

export interface IFolder extends Document {
  userId: Types.ObjectId;
  name: string;
  parentFolder?: Types.ObjectId | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: 'folder';
}

export interface IFolderResponse {
  _id: string;
  userId: string;
  name: string;
  parentFolder?: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
