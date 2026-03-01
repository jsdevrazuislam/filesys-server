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
  isLimitExceeded: boolean;
  exceededLimits: string[];
}

export class UserService {
  static async getUserStats(userId: string): Promise<IUserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptionHistory: {
          where: { isActive: true },
          include: { package: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) throw new AppError('User not found', 404);

    const activeSub = user.subscriptionHistory[0];
    const pkg = activeSub?.package;

    // Optimized aggregation
    const [stats, totalFolders] = await Promise.all([
      prisma.file.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { size: true },
      }),
      prisma.folder.count({ where: { userId } }),
    ]);

    const totalFiles = stats._count.id;
    const usedStorage = stats._sum.size || BigInt(0);
    const maxStorage = pkg?.storageLimit || BigInt(0);

    const storageUsagePercentage =
      maxStorage > BigInt(0)
        ? Number((usedStorage * BigInt(100)) / maxStorage)
        : 0;

    // Detect exceeded limits
    const exceededLimits: string[] = [];
    if (pkg) {
      if (pkg.totalFiles !== -1 && totalFiles > pkg.totalFiles) {
        exceededLimits.push('files');
      }
      if (pkg.maxFolders !== -1 && totalFolders > pkg.maxFolders) {
        exceededLimits.push('folders');
      }
      if (pkg.storageLimit !== BigInt(-1) && usedStorage > pkg.storageLimit) {
        exceededLimits.push('storage');
      }
    }

    return {
      totalFiles,
      totalFolders,
      usedStorage: usedStorage.toString(),
      maxStorage: maxStorage.toString(),
      storageUsagePercentage,
      planName: pkg?.name || 'No Plan',
      allowedTypes: pkg?.allowedTypes || [],
      isLimitExceeded: exceededLimits.length > 0,
      exceededLimits,
    };
  }
}
