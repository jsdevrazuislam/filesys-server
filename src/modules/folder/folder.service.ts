import { Folder } from '@prisma/client';

import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import { FileService } from '../file/file.service';
import { ICreateFolderDTO, IFolderResponse } from './folder.interface';

/**
 * FolderService handles business logic for Folders.
 */
export class FolderService {
  /**
   * Validate user limits before folder creation.
   */
  private static async validateLimits(
    userId: string,
    parentId?: string | null,
  ) {
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
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (!parentFolder) throw new AppError('Parent not found', 404);
      if (parentFolder.userId !== userId)
        throw new AppError('Unauthorized', 403);

      depthLevel = parentFolder.depthLevel + 1;
      if (depthLevel > pkg.maxNesting) {
        throw new AppError(`Max depth reached (${pkg.maxNesting})`, 403);
      }
    }

    return { depthLevel };
  }

  static async createFolder(
    userId: string,
    data: ICreateFolderDTO,
  ): Promise<Folder> {
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

  static async renameFolder(
    userId: string,
    folderId: string,
    name: string,
  ): Promise<Folder> {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId)
      throw new AppError('Folder not found', 404);

    return await prisma.folder.update({
      where: { id: folderId },
      data: { name },
    });
  }

  static async deleteFolder(userId: string, folderId: string): Promise<void> {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId)
      throw new AppError('Folder not found', 404);

    // 1. Get all folder IDs in the tree (recursive)
    const allFolderIds = await this.getRecursiveFolderIds(folderId);
    allFolderIds.push(folderId);

    // 2. Find all files in these folders
    const files = await prisma.file.findMany({
      where: { folderId: { in: allFolderIds } },
    });

    // 3. Delete each file from Cloudinary (and DB)
    // We use a loop to ensure each Cloudinary resource is destroyed
    for (const file of files) {
      try {
        await FileService.deleteFile(userId, file.id);
      } catch (error) {
        // Log error but continue to ensure dynamic DB consistency
        logger.error(
          `Failed to delete file ${file.id} during folder delete`,
          error,
        );
      }
    }

    // 4. Delete all folders in the tree
    // We filter by userId as an extra safety measure
    await prisma.folder.deleteMany({
      where: {
        id: { in: allFolderIds },
        userId,
      },
    });
  }

  /**
   * Helper to get all sub-folder IDs recursively.
   */
  private static async getRecursiveFolderIds(
    folderId: string,
  ): Promise<string[]> {
    const children = await prisma.folder.findMany({
      where: { parentId: folderId },
      select: { id: true },
    });

    let ids = children.map((c) => c.id);
    for (const childId of ids) {
      const subIds = await this.getRecursiveFolderIds(childId);
      ids = [...ids, ...subIds];
    }

    return ids;
  }

  static async listFolders(
    userId: string,
    parentId?: string | null,
  ): Promise<IFolderResponse[]> {
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

    allFolders.forEach((folder) => {
      folderMap[folder.id] = { ...folder, children: [] };
    });

    allFolders.forEach((folder) => {
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
