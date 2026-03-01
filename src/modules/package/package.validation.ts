import { z } from 'zod';

export const createPackageSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    maxFolders: z.coerce.number().int().positive(),
    maxNesting: z.coerce.number().int().positive(),
    allowedTypes: z.array(
      z
        .string()
        .regex(/^[a-z0-9]+\/[a-z0-9.*+-]+$/i, 'Invalid mime type format'),
    ),
    maxFileSize: z.coerce.number().positive(), // in MB (we'll convert to bytes in service)
    storageLimit: z.coerce.number().nonnegative(), // in MB
    totalFiles: z.coerce.number().int().positive().optional(),
    filesPerFolder: z.coerce.number().int().positive(),
    price: z.coerce.number().nonnegative(),
  }),
});

export const updatePackageSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    maxFolders: z.coerce.number().int().positive().optional(),
    maxNesting: z.coerce.number().int().positive().optional(),
    allowedTypes: z
      .array(
        z
          .string()
          .regex(/^[a-z0-9]+\/[a-z0-9.*+-]+$/i, 'Invalid mime type format'),
      )
      .optional(),
    maxFileSize: z.coerce.number().positive().optional(),
    storageLimit: z.coerce.number().nonnegative().optional(),
    totalFiles: z.coerce.number().int().positive().optional(),
    filesPerFolder: z.coerce.number().int().positive().optional(),
    price: z.coerce.number().nonnegative().optional(),
  }),
});
