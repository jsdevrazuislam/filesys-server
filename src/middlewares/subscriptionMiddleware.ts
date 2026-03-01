import { SubscriptionPackage, UserSubscriptionHistory } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import prisma from '../config/db';
import { AppError } from '../utils/AppError';

export type ActionType = 'UPLOAD_FILE' | 'CREATE_FOLDER';

/**
 * Middleware: Attach the active subscription and package to the request.
 * Falls back to the 'Free' tier defaults if no active subscription exists.
 */
export const attachSubscription = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const subscriptionData = await prisma.userSubscriptionHistory.findFirst({
      where: { userId: req.user.id, isActive: true },
      include: { package: true },
      orderBy: { startDate: 'desc' },
    });

    // Cast to avoid TS complaining about optional includes
    const subscription = subscriptionData as
      | (UserSubscriptionHistory & { package: SubscriptionPackage })
      | null;

    if (subscription && subscription.package) {
      req.subscription = subscription;
      req.package = subscription.package;
    } else {
      // Try to find a 'Free' package in the DB as fallback
      const dbFreePackage = await prisma.subscriptionPackage.findUnique({
        where: { name: 'Free' },
      });

      if (dbFreePackage) {
        req.subscription = {
          id: 'free-db-fallback',
        } as UserSubscriptionHistory;
        req.package = dbFreePackage;
      } else {
        // FULL RESTRICTION: No packages exist in system
        const anyPackageCount = await prisma.subscriptionPackage.count();
        if (anyPackageCount === 0) {
          req.subscription = { id: 'locked-system' } as UserSubscriptionHistory;
          req.package = {
            name: 'Locked',
            maxFolders: 0,
            maxNesting: 0,
            allowedTypes: [],
            maxFileSize: BigInt(0),
            storageLimit: BigInt(0),
            totalFiles: 0,
            filesPerFolder: 0,
          } as unknown as SubscriptionPackage;
        } else {
          // Fallback to a safe minimum if 'Free' isn't specifically named but packages exist
          req.subscription = { id: 'safe-fallback' } as UserSubscriptionHistory;
          req.package = {
            name: 'Restricted',
            maxFolders: 1,
            maxNesting: 0,
            allowedTypes: ['image/jpeg', 'image/png'],
            maxFileSize: BigInt(1 * 1024 * 1024),
            storageLimit: BigInt(5 * 1024 * 1024),
            totalFiles: 5,
            filesPerFolder: 5,
          } as unknown as SubscriptionPackage;
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Factory Middleware: Validates specific action limits against the attached package.
 * Requires `attachSubscription` to run before this.
 */
export const checkSubscriptionLimit = (action: ActionType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.package) {
        throw new AppError('Subscription context missing', 500);
      }

      const pkg = req.package;

      switch (action) {
        case 'UPLOAD_FILE': {
          // 1. Check file size (req.body might have it, or we rely on multer checking earlier, but here we validate intention)
          // The client sends fileSize and fileType via body for getSignedUrl
          const fileSize = req.body.fileSize || req.body.size;
          const mimeType =
            req.body.fileType || req.body.mimeType || req.file?.mimetype;
          const folderId = req.body.folderId;

          if (fileSize && BigInt(fileSize) > pkg.maxFileSize) {
            throw new AppError(
              `File exceeds the ${Number(pkg.maxFileSize) / (1024 * 1024)}MB size limit for your plan.`,
              400,
            );
          }

          if (mimeType) {
            const isAllowed = pkg.allowedTypes
              .flatMap((type) => type.split(','))
              .some((type) => {
                const allowed = type.trim().toLowerCase();
                if (allowed === '*/*' || allowed === mimeType.toLowerCase())
                  return true;
                if (allowed.endsWith('/*')) {
                  return mimeType
                    .toLowerCase()
                    .startsWith(allowed.replace('/*', ''));
                }
                return false;
              });

            if (!isAllowed) {
              throw new AppError(
                `File type ${mimeType} is not allowed on your plan.`,
                403,
              );
            }
          }

          // 2. Check total file limits and storage quota (Optimized to single query)
          const stats = await prisma.file.aggregate({
            where: { userId: req.user.id },
            _count: { id: true },
            _sum: { size: true },
          });

          const fileCount = stats._count.id;
          const usedStorage = stats._sum.size || BigInt(0);
          const newFileSize = fileSize ? BigInt(fileSize) : BigInt(0);

          if (fileCount >= pkg.totalFiles) {
            throw new AppError(
              'You have reached the maximum total files limit for your plan.',
              403,
            );
          }

          // Check total storage quota limit
          if (usedStorage + newFileSize > pkg.storageLimit) {
            throw new AppError(
              `Storage capacity exceeded. Your plan allows up to ${
                Number(pkg.storageLimit) / (1024 * 1024)
              }MB.`,
              403,
            );
          }

          // 3. Check folder file limits if uploading to a folder
          if (folderId) {
            const filesInFolder = await prisma.file.count({
              where: { folderId },
            });
            if (filesInFolder >= pkg.filesPerFolder) {
              throw new AppError(
                'You have reached the maximum files per folder limit.',
                403,
              );
            }
          }

          break;
        }

        case 'CREATE_FOLDER': {
          const parentId = req.body.parentId;

          // 1. Check total folders limit
          const totalFolders = await prisma.folder.count({
            where: { userId: req.user.id },
          });
          if (totalFolders >= pkg.maxFolders) {
            throw new AppError(
              'You have reached the maximum folders limit for your plan.',
              403,
            );
          }

          // 2. Check folder nesting limit
          if (parentId) {
            const parentFolder = await prisma.folder.findUnique({
              where: { id: parentId },
              select: { depthLevel: true, userId: true },
            });
            if (!parentFolder) {
              throw new AppError('Parent folder not found.', 404);
            }
            if (parentFolder.userId !== req.user.id) {
              throw new AppError('Access denied.', 403);
            }

            if (parentFolder.depthLevel >= pkg.maxNesting) {
              throw new AppError(
                `Maximum folder nesting level (${pkg.maxNesting}) reached for your plan.`,
                403,
              );
            }
          }

          break;
        }

        default:
          throw new AppError('Unknown feature action requested.', 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
