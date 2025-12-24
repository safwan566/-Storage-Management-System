import { z } from 'zod';

/**
 * Schema for updating image metadata
 */
export const updateImageSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .optional(),
    folderId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid folder ID')
      .optional()
      .nullable(),
  }),
});

