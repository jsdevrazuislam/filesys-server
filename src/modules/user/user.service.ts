import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';

export interface IUserStats {
    totalFiles: number;
    totalFolders: number;
    usedStorage: string; // BigInt as string
    maxStorage: string; // BigInt as string
    storageUsagePercentage: number;
    planName: string;
    allowedTypes: string[];
}

export class UserService {
    static async getUserStats(userId: string): Promise<IUserStats> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptionHistory: {
                    where: { isActive: true },
                    include: { package: true },
                    take: 1,
                },
            },
        });

        if (!user) throw new AppError('User not found', 404);

        const activeSub = user.subscriptionHistory[0];
        const pkg = activeSub?.package;

        const totalFiles = await prisma.file.count({ where: { userId } });
        const totalFolders = await prisma.folder.count({ where: { userId } });

        const files = await prisma.file.findMany({
            where: { userId },
            select: { size: true }
        });

        const usedStorage = files.reduce((acc, file) => acc + file.size, BigInt(0));
        const maxStorage = pkg?.storageLimit || BigInt(0);

        const storageUsagePercentage = maxStorage > BigInt(0)
            ? Number((usedStorage * BigInt(100)) / maxStorage)
            : 0;

        return {
            totalFiles,
            totalFolders,
            usedStorage: usedStorage.toString(),
            maxStorage: maxStorage.toString(),
            storageUsagePercentage,
            planName: pkg?.name || 'No Plan',
            allowedTypes: pkg?.allowedTypes || [],
        };
    }
}
