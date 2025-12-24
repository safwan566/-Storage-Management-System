import { Document, Types } from 'mongoose';

export interface IFolder extends Document {
  _id: string;
  userId: Types.ObjectId;
  name: string;
  parentFolder?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFolderResponse {
  _id: string;
  userId: string;
  name: string;
  parentFolder?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
