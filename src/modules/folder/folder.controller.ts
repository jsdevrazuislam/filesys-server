import { NextFunction, Request, Response } from 'express';

import { sendResponse } from '../../utils/sendResponse';
import {
  ICreateFolderDTO,
  IFolderResponse,
  IRenameFolderDTO,
} from './folder.interface';
import { FolderService } from './folder.service';

/**
 * FolderController handles HTTP requests for Folders.
 */
export class FolderController {
  /**
   * Create a new folder.
   */
  static createFolder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const folder = await FolderService.createFolder(
        req.user?.id as string,
        req.body as ICreateFolderDTO,
      );
      sendResponse<IFolderResponse>(res, {
        statusCode: 201,
        success: true,
        message: 'Folder created successfully',
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Rename a folder.
   */
  static renameFolder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const folder = await FolderService.renameFolder(
        req.user?.id as string,
        req.params.id as string,
        (req.body as IRenameFolderDTO).name,
      );
      sendResponse<IFolderResponse>(res, {
        statusCode: 200,
        success: true,
        message: 'Folder renamed successfully',
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a folder.
   */
  static deleteFolder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await FolderService.deleteFolder(
        req.user?.id as string,
        req.params.id as string,
      );
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Folder deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List folders.
   */
  static listFolders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parentId = req.query.parentId as string | undefined;
      const folders = await FolderService.listFolders(
        req.user?.id as string,
        parentId,
      );
      sendResponse<IFolderResponse[]>(res, {
        statusCode: 200,
        success: true,
        message: 'Folders fetched successfully',
        data: folders,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get folder hierarchy.
   */
  static getHierarchy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const hierarchy = await FolderService.getHierarchy(
        req.user?.id as string,
      );
      sendResponse<IFolderResponse[]>(res, {
        statusCode: 200,
        success: true,
        message: 'Hierarchy fetched successfully',
        data: hierarchy,
      });
    } catch (error) {
      next(error);
    }
  };
}
