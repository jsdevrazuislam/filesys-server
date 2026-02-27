import { SubscriptionPackage } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';
import { ICreatePackageDTO, ISubscriptionHistoryResponse, IUpdatePackageDTO } from './package.interface';

/**
 * PackageService handles business logic for Subscription Packages.
 */
export class PackageService {
    /**
     * Create a new subscription package.
     */
    static async createPackage(data: ICreatePackageDTO): Promise<SubscriptionPackage> {
        const maxFileSizeInBytes = BigInt(data.maxFileSize) * BigInt(1024 * 1024);
        const storageLimitInBytes = BigInt(data.storageLimit) * BigInt(1024 * 1024);

        return await prisma.subscriptionPackage.create({
            data: {
                ...data,
                maxFileSize: maxFileSizeInBytes,
                storageLimit: storageLimitInBytes,
            },
        });
    }

    /**
     * Get all subscription packages.
     */
    static async getAllPackages(): Promise<SubscriptionPackage[]> {
        return await prisma.subscriptionPackage.findMany();
    }

    /**
     * Get a package by ID.
     */
    static async getPackageById(id: string): Promise<SubscriptionPackage> {
        const pkg = await prisma.subscriptionPackage.findUnique({ where: { id } });
        if (!pkg) throw new AppError('Package not found', 404);
        return pkg;
    }

    /**
     * Update a package.
     */
    static async updatePackage(id: string, data: IUpdatePackageDTO): Promise<SubscriptionPackage> {
        const { maxFileSize, storageLimit, ...otherData } = data;

        const updateData: import('@prisma/client').Prisma.SubscriptionPackageUpdateInput = { ...otherData };
        if (maxFileSize !== undefined) {
            updateData.maxFileSize = BigInt(maxFileSize) * BigInt(1024 * 1024);
        }
        if (storageLimit !== undefined) {
            updateData.storageLimit = BigInt(storageLimit) * BigInt(1024 * 1024);
        }

        return await prisma.subscriptionPackage.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Delete a package.
     */
    static async deletePackage(id: string): Promise<void> {
        await prisma.subscriptionPackage.delete({ where: { id } });
    }

    /**
     * Subscribe a user to a package (Synchronous/Manual/Free).
     * For Stripe, we use webhooks, but this can serve as a fallback or for internal use.
     */
    static async subscribe(userId: string, packageId: string): Promise<void> {
        await this.getPackageById(packageId);

        await prisma.$transaction(async (tx) => {
            // Deactivate current active subscription
            await tx.userSubscriptionHistory.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false, endDate: new Date() },
            });

            // Create new active subscription
            await tx.userSubscriptionHistory.create({
                data: {
                    userId,
                    packageId,
                    isActive: true,
                    paymentStatus: 'active',
                    startDate: new Date(),
                },
            });
        });
    }

    /**
     * Get user subscription history.
     */
    static async getSubscriptionHistory(userId: string): Promise<ISubscriptionHistoryResponse[]> {
        return await prisma.userSubscriptionHistory.findMany({
            where: { userId },
            include: { package: true },
            orderBy: { startDate: 'desc' },
        });
    }
}
