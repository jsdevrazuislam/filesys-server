import { NextFunction, Request, Response } from 'express';
import { PackageService } from './package.service';
import { sendResponse } from '../../utils/sendResponse';
import { ICreatePackageDTO, ISubscriptionHistoryResponse, IUpdatePackageDTO } from './package.interface';
import { SubscriptionPackage } from '@prisma/client';

/**
 * PackageController handles HTTP requests for Subscription Packages.
 */
export class PackageController {
    /**
     * Create a new package (Admin).
     */
    static createPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pkg = await PackageService.createPackage(req.body as ICreatePackageDTO);
            sendResponse<SubscriptionPackage>(res, {
                statusCode: 201,
                success: true,
                message: 'Package created successfully',
                data: pkg,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all packages.
     */
    static getAllPackages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const packages = await PackageService.getAllPackages();
            sendResponse<SubscriptionPackage[]>(res, {
                statusCode: 200,
                success: true,
                message: 'Packages fetched successfully',
                data: packages,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update a package (Admin).
     */
    static updatePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pkg = await PackageService.updatePackage(req.params.id as string, req.body as IUpdatePackageDTO);
            sendResponse<SubscriptionPackage>(res, {
                statusCode: 200,
                success: true,
                message: 'Package updated successfully',
                data: pkg,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete a package (Admin).
     */
    static deletePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await PackageService.deletePackage(req.params.id as string);
            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'Package deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Subscribe to a package (User).
     */
    static subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            await PackageService.subscribe(userId, req.body.packageId as string);
            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'Subscribed successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get subscription history.
     */
    static getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id as string;
            const history = await PackageService.getSubscriptionHistory(userId);
            sendResponse<ISubscriptionHistoryResponse[]>(res, {
                statusCode: 200,
                success: true,
                message: 'Subscription history fetched successfully',
                data: history,
            });
        } catch (error) {
            next(error);
        }
    };
}
