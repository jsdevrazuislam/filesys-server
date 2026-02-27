import { NextFunction, Request, Response } from 'express';
import { AdminService } from './admin.service';
import { sendResponse } from '../../utils/sendResponse';
import { Role } from '../../constants';

export class AdminController {
    static getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const stats = await AdminService.getDashboardStats();
            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'Admin statistics fetched successfully',
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    };

    static getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = req.query.search as string | undefined;
            const role = req.query.role as string | undefined;

            const result = await AdminService.getAllUsers(page, limit, search, role);
            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'Users fetched successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    static updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            await AdminService.updateUserRole(userId as string, role as Role);
            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'User role updated successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    static deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            await AdminService.deleteUser(userId as string);
            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'User deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };
}
