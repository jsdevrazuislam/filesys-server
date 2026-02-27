import { Folder } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';
import { ICreateFolderDTO, IFolderResponse } from './folder.interface';

/**
 * FolderService handles business logic for Folders.
 */
export class FolderService {
    /**
     * Validate user limits before folder creation.
     */
    private static async validateLimits(userId: string, parentId?: string | null) {
        const subscription = await prisma.userSubscriptionHistory.findFirst({
            where: { userId, isActive: true },
            include: { package: true },
        });

        if (!subscription) {
            throw new AppError('No active subscription found.', 403);
        }

        const { package: pkg } = subscription;

        const totalFolders = await prisma.folder.count({ where: { userId } });
        if (totalFolders >= pkg.maxFolders) {
            throw new AppError(`Limit reached (${pkg.maxFolders})`, 403);
        }

        let depthLevel = 0;
        if (parentId) {
            const parentFolder = await prisma.folder.findUnique({ where: { id: parentId } });
            if (!parentFolder) throw new AppError('Parent not found', 404);
            if (parentFolder.userId !== userId) throw new AppError('Unauthorized', 403);

            depthLevel = parentFolder.depthLevel + 1;
            if (depthLevel > pkg.maxNesting) {
                throw new AppError(`Max depth reached (${pkg.maxNesting})`, 403);
            }
        }

        return { depthLevel };
    }

    static async createFolder(userId: string, data: ICreateFolderDTO): Promise<Folder> {
        const { depthLevel } = await this.validateLimits(userId, data.parentId);

        return await prisma.folder.create({
            data: {
                name: data.name,
                userId,
                parentId: data.parentId || null,
                depthLevel,
            },
        });
    }

    static async renameFolder(userId: string, folderId: string, name: string): Promise<Folder> {
        const folder = await prisma.folder.findUnique({ where: { id: folderId } });
        if (!folder || folder.userId !== userId) throw new AppError('Folder not found', 404);

        return await prisma.folder.update({
            where: { id: folderId },
            data: { name },
        });
    }

    static async deleteFolder(userId: string, folderId: string): Promise<void> {
        const folder = await prisma.folder.findUnique({ where: { id: folderId } });
        if (!folder || folder.userId !== userId) throw new AppError('Folder not found', 404);

        await prisma.file.deleteMany({ where: { folderId } });
        await prisma.folder.delete({ where: { id: folderId } });
    }

    static async listFolders(userId: string, parentId?: string | null): Promise<IFolderResponse[]> {
        return await prisma.folder.findMany({
            where: {
                userId,
                parentId: parentId || null,
            },
            include: {
                _count: {
                    select: { children: true, files: true },
                },
            },
        });
    }

    static async getHierarchy(userId: string): Promise<IFolderResponse[]> {
        const allFolders = await prisma.folder.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });

        const folderMap: Record<string, IFolderResponse> = {};
        const roots: IFolderResponse[] = [];

        allFolders.forEach(folder => {
            folderMap[folder.id] = { ...folder, children: [] };
        });

        allFolders.forEach(folder => {
            if (folder.parentId) {
                if (folderMap[folder.parentId]) {
                    folderMap[folder.parentId].children?.push(folderMap[folder.id]);
                }
            } else {
                roots.push(folderMap[folder.id]);
            }
        });

        return roots;
    }
}
