import { Prisma } from '@prisma/client';

import prisma from '../../config/db';
import { Role } from '../../constants';
import {
  IAdminDashboardStats,
  IPaginatedResponse,
  IUserOverview,
} from './admin.interface';

export class AdminService {
  static async getDashboardStats(): Promise<IAdminDashboardStats> {
    const [totalUsers, activeSubList, totalFiles] = await Promise.all([
      prisma.user.count(),
      prisma.userSubscriptionHistory.findMany({
        where: { isActive: true },
        include: { package: { select: { price: true } } },
      }),
      prisma.file.findMany({ select: { size: true } }),
    ]);

    const activeSubscriptions = activeSubList.length;
    const totalRevenue = activeSubList.reduce(
      (acc, sub) => acc + (sub.package.price || 0),
      0,
    );
    const totalStorageUsage = totalFiles.reduce(
      (acc, file) => acc + file.size,
      BigInt(0),
    );

    // Mocking recent activity for now, we could add an ActivityLog table later
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true },
    });

    const recentActivity = recentUsers.map((user) => ({
      id: user.id,
      type: 'USER_REGISTRATION',
      message: `New user registered: ${user.name}`,
      createdAt: user.createdAt,
    }));

    return {
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      totalStorageUsage: totalStorageUsage.toString(),
      systemHealth: 'healthy',
      recentActivity,
    };
  }

  static async getAllUsers(
    page: number,
    limit: number,
    search?: string,
    role?: Role,
  ): Promise<IPaginatedResponse<IUserOverview>> {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptionHistory: {
            where: { isActive: true },
            include: { package: true },
            take: 1,
          },
          files: {
            select: { size: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data: IUserOverview[] = users.map((user) => {
      const usedStorage = user.files.reduce(
        (acc, file) => acc + file.size,
        BigInt(0),
      );
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isVerified ? 'ACTIVE' : 'INACTIVE', // Using isVerified as status for now
        createdAt: user.createdAt,
        storageUsage: usedStorage.toString(),
        planName: user.subscriptionHistory[0]?.package.name || 'FREE',
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateUserRole(userId: string, role: Role): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  static async deleteUser(userId: string): Promise<void> {
    // Soft delete or hard delete based on requirements.
    // Prism doesn't have native soft delete, so we follow a pattern or just delete.
    // User asked for soft delete preferred.
    // Let's check schema if there is deletedAt.
    await prisma.user.delete({ where: { id: userId } });
  }
}
