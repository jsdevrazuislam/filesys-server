import { File } from '@prisma/client';

import cloudinary from '../../config/cloudinary';
import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import { ISignedUrlDTO, ISignedUrlResponse } from './file.interface';

/**
 * FileService handles business logic for Files (Cloudinary Signed Uploads).
 */
export class FileService {
  /**
   * Generates a signed URL for secure Cloudinary upload.
   * @param userId User ID
   * @param data Metadata (fileName, type, size, folderId)
   */
  static async getSignedUploadUrl(
    userId: string,
    data: ISignedUrlDTO,
    allowedTypes: string[],
  ): Promise<ISignedUrlResponse> {
    // Service-Layer Enforcement (Second line of defense)
    await this.checkLimits(userId, {
      size: data.fileSize,
      mimeType: data.fileType,
      folderId: data.folderId,
    });

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Normalize publicId to include the folder prefix for consistent DB storage
    const folderPrefix = 'saas_file_system';

    // Strip extension for images/videos as Cloudinary handles formats automatically
    let fileName = data.fileName.replace(/\s+/g, '_');
    if (
      data.fileType.startsWith('image/') ||
      data.fileType.startsWith('video/')
    ) {
      fileName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    }

    const rawPublicId = `users/${userId}/${Date.now()}-${fileName}`;
    const publicId = `${folderPrefix}/${rawPublicId}`;

    // Cloudinary signature logic
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        public_id: publicId,
      },
      cloudinary.config().api_secret!,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/upload`,
      signature,
      timestamp,
      apiKey: cloudinary.config().api_key!,
      cloudName: cloudinary.config().cloud_name!,
      publicId,
      allowedTypes,
    };
  }

  /**
   * Finalizes file creation in DB after Cloudinary upload.
   */
  static async confirmUpload(
    userId: string,
    data: {
      name: string;
      size: number;
      mimeType: string;
      s3Key: string;
      folderId?: string | null;
    },
  ): Promise<File> {
    // Service-Layer Enforcement (Final check before DB write)
    await this.checkLimits(userId, {
      size: data.size,
      mimeType: data.mimeType,
      folderId: data.folderId,
    });

    let s3Key = data.s3Key;
    const folderPrefix = 'saas_file_system';

    // Enforce folder prefix if missing
    if (!s3Key.startsWith(`${folderPrefix}/`)) {
      s3Key = `${folderPrefix}/${s3Key}`;
    }

    return await prisma.file.create({
      data: {
        name: data.name,
        size: BigInt(data.size),
        mimeType: data.mimeType,
        userId,
        folderId: data.folderId || null,
        s3Key: s3Key,
      },
    });
  }

  /**
   * Internal limit enforcement logic.
   * Can be used as a second line of defense.
   */
  private static async checkLimits(
    userId: string,
    data: { size: number; mimeType: string; folderId?: string | null },
  ) {
    const subscription = await prisma.userSubscriptionHistory.findFirst({
      where: { userId, isActive: true },
      include: { package: true },
      orderBy: { startDate: 'desc' },
    });

    if (!subscription) {
      throw new AppError('No active subscription found.', 403);
    }

    const pkg = subscription.package;

    // 1. File Size Check
    if (BigInt(data.size) > pkg.maxFileSize) {
      throw new AppError(
        `File size exceeds limit (${Number(pkg.maxFileSize) / (1024 * 1024)}MB).`,
        403,
      );
    }

    // 2. File Type Check
    const isAllowed = pkg.allowedTypes
      .flatMap((type) => type.split(','))
      .some((type) => {
        const allowed = type.trim().toLowerCase();
        if (allowed === '*/*' || allowed === data.mimeType.toLowerCase())
          return true;
        if (allowed.endsWith('/*')) {
          return data.mimeType
            .toLowerCase()
            .startsWith(allowed.replace('/*', ''));
        }
        return false;
      });

    if (!isAllowed) {
      throw new AppError(`File type ${data.mimeType} is not allowed.`, 403);
    }

    // 3. Storage & Counts (Optimized to single query)
    const stats = await prisma.file.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { size: true },
    });

    const fileCount = stats._count.id;
    const usedStorage = stats._sum.size || BigInt(0);

    const folderCheck = data.folderId
      ? prisma.file.count({ where: { folderId: data.folderId } })
      : Promise.resolve(0);

    const filesInFolder = await folderCheck;

    // Check total files
    if (fileCount >= pkg.totalFiles) {
      throw new AppError('Total file limit reached for your plan.', 403);
    }

    // Check storage quota
    if (usedStorage + BigInt(data.size) > pkg.storageLimit) {
      throw new AppError('Storage quota exceeded for your plan.', 403);
    }

    // Check files per folder
    if (data.folderId && filesInFolder >= pkg.filesPerFolder) {
      throw new AppError('Folder file limit reached.', 403);
    }
  }

  /**
   * Deletes a file from DB and Cloudinary.
   */
  static async deleteFile(userId: string, fileId: string): Promise<void> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new AppError('File not found', 404);
    if (file.userId !== userId) throw new AppError('Unauthorized', 403);

    // Determine Cloudinary resource type
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (file.mimeType.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimeType.startsWith('video/')) {
      resourceType = 'video';
    }

    // Delete from Cloudinary first
    try {
      const result = await cloudinary.uploader.destroy(file.s3Key, {
        resource_type: resourceType,
        invalidate: true,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary error: ${result.result}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(
        `Failed to delete file from Cloudinary: ${message}`,
        500,
      );
    }

    // Then delete from DB
    await prisma.file.delete({ where: { id: fileId } });
  }

  static async listFiles(userId: string, folderId?: string | null) {
    return await prisma.file.findMany({
      where: { userId, folderId: folderId || null },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getFile(userId: string, fileId: string): Promise<File> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== userId)
      throw new AppError('File not found or unauthorized', 404);
    return file;
  }

  static async renameFile(
    userId: string,
    fileId: string,
    name: string,
  ): Promise<File> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== userId)
      throw new AppError('File not found or unauthorized', 404);

    return await prisma.file.update({
      where: { id: fileId },
      data: { name },
    });
  }

  /**
   * Gets a signed URL to view or download a file from Cloudinary.
   */
  static async getFileUrl(
    userId: string,
    fileId: string,
    _action: 'view' | 'download',
  ): Promise<string> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== userId)
      throw new AppError('File not found or unauthorized', 404);

    const cleanPublicId = file.s3Key;

    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (file.mimeType.startsWith('image/')) resourceType = 'image';
    else if (file.mimeType.startsWith('video/')) resourceType = 'video';

    const url = cloudinary.url(cleanPublicId, {
      resource_type: resourceType,
      sign_url: true,
    });

    logger.info(`File URL generated: ${url}`);

    return url;
  }
}
