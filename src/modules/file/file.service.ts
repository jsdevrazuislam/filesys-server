import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';
import cloudinary from '../../config/cloudinary';
import { ISignedUrlDTO, ISignedUrlResponse } from './file.interface';
import { File } from '@prisma/client';

/**
 * FileService handles business logic for Files (Cloudinary Signed Uploads).
 */
export class FileService {
    /**
     * Generates a signed URL for secure Cloudinary upload.
     * @param userId User ID
     * @param data Metadata (fileName, type, size, folderId)
     */
    static async getSignedUploadUrl(userId: string, data: ISignedUrlDTO, allowedTypes: string[]): Promise<ISignedUrlResponse> {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Normalize publicId to include the folder prefix for consistent DB storage
        const folderPrefix = 'saas_file_system';

        // Strip extension for images/videos as Cloudinary handles formats automatically
        let fileName = data.fileName.replace(/\s+/g, '_');
        if (data.fileType.startsWith('image/') || data.fileType.startsWith('video/')) {
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
            cloudinary.config().api_secret!
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
    static async confirmUpload(userId: string, data: { name: string; size: number; mimeType: string; s3Key: string; folderId?: string | null }): Promise<File> {
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
                invalidate: true
            });

            if (result.result !== 'ok' && result.result !== 'not found') {
                throw new Error(`Cloudinary error: ${result.result}`);
            }
        } catch (error: any) {
            throw new AppError(`Failed to delete file from Cloudinary: ${error.message}`, 500);
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
        if (!file || file.userId !== userId) throw new AppError('File not found or unauthorized', 404);
        return file;
    }

    static async renameFile(userId: string, fileId: string, name: string): Promise<File> {
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file || file.userId !== userId) throw new AppError('File not found or unauthorized', 404);

        return await prisma.file.update({
            where: { id: fileId },
            data: { name },
        });
    }

    /**
     * Gets a signed URL to view or download a file from Cloudinary.
     */
    static async getFileUrl(userId: string, fileId: string, _action: 'view' | 'download'): Promise<string> {
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file || file.userId !== userId) throw new AppError('File not found or unauthorized', 404);

        const cleanPublicId = file.s3Key;

        let resourceType: 'image' | 'video' | 'raw' = 'raw';
        if (file.mimeType.startsWith('image/')) resourceType = 'image';
        else if (file.mimeType.startsWith('video/')) resourceType = 'video';

        const url = cloudinary.url(cleanPublicId, {
            resource_type: resourceType,
            sign_url: true
        });

        console.log(url);

        return url;
    }
}
