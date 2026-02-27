import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

// Configure storage (using memory for simplicity in this demo, usually S3 or Disk)
const storage = multer.memoryStorage();

/**
 * Multer middleware configuration for file uploads.
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Default limit 100MB (will be overridden by service logic)
  },
  fileFilter: (
    _req: Request,
    _file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    // Basic filter, more advanced check (signatures) can be done in service
    cb(null, true);
  },
});
