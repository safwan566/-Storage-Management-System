import { z } from 'zod';

export const createFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Folder name is required').max(100, 'Folder name cannot exceed 100 characters'),
    parentFolder: z.string().optional(),
  }),
});

export const updateFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Folder name is required').max(100, 'Folder name cannot exceed 100 characters'),
  }),
});







