import { NextFunction, Request, Response } from 'express';
import { FileService } from './file.service';
import { sendResponse } from '../../utils/sendResponse';
import { ISignedUrlDTO, ISignedUrlResponse } from './file.interface';
import { File } from '@prisma/client';

/**
 * FileController handles HTTP requests for Files.
 */
export class FileController {
    /**
     * Get a signed URL for Cloudinary upload.
     */
    static getSignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const allowedTypes = req.package?.allowedTypes || [];
            const result = await FileService.getSignedUploadUrl(userId, req.body as ISignedUrlDTO, allowedTypes);

            sendResponse<ISignedUrlResponse>(res, {
                statusCode: 200,
                success: true,
                message: 'Signed URL generated successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Confirm file upload and save to DB.
     */
    static confirmUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const file = await FileService.confirmUpload(userId, req.body);

            sendResponse<File>(res, {
                statusCode: 201,
                success: true,
                message: 'File upload confirmed',
                data: file,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * List files.
     */
    static listFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const folderId = req.query.folderId as string | undefined;
            const files = await FileService.listFiles(userId, folderId);

            sendResponse<File[]>(res, {
                statusCode: 200,
                success: true,
                message: 'Files fetched successfully',
                data: files,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get file details.
     */
    static getFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const file = await FileService.getFile(userId, req.params.id as string);

            sendResponse<File>(res, {
                statusCode: 200,
                success: true,
                message: 'File fetched successfully',
                data: file,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rename a file.
     */
    static renameFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const file = await FileService.renameFile(userId, req.params.id as string, req.body.name);

            sendResponse<File>(res, {
                statusCode: 200,
                success: true,
                message: 'File renamed successfully',
                data: file,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete a file.
     */
    static deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            await FileService.deleteFile(userId, req.params.id as string);

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'File deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * View a file
     */
    static viewFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const url = await FileService.getFileUrl(userId, req.params.id as string, 'view');

            sendResponse<{ url: string }>(res, {
                statusCode: 200,
                success: true,
                message: 'File view URL generated',
                data: { url },
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Download a file
     */
    static downloadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const url = await FileService.getFileUrl(userId, req.params.id as string, 'download');

            sendResponse<{ url: string }>(res, {
                statusCode: 200,
                success: true,
                message: 'File download URL generated',
                data: { url },
            });
        } catch (error) {
            next(error);
        }
    };
}
