import { z } from 'zod';

export const renameFileSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
    }),
});

export const signedUrlSchema = z.object({
    body: z.object({
        fileName: z.string().min(1, 'File name is required'),
        fileType: z.string().min(1, 'File type is required'),
        fileSize: z.number().positive('File size must be positive'),
        folderId: z.string().uuid().optional().nullable(),
    }),
});
