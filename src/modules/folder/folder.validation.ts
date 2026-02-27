import { z } from 'zod';

export const createFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    parentId: z.uuid().optional().nullable(),
  }),
});

export const renameFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
  }),
});
