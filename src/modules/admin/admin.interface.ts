export interface IAdminDashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    totalRevenue: number;
    totalStorageUsage: string; // BigInt as string
    systemHealth: 'healthy' | 'degraded' | 'down';
    recentActivity: {
        id: string;
        type: string;
        message: string;
        createdAt: Date;
    }[];
}

export interface IUserOverview {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    storageUsage: string;
    planName: string;
}

export interface IPaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
