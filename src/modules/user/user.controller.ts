import { NextFunction, Request, Response } from 'express';
import { UserService } from './user.service';
import { sendResponse } from '../../utils/sendResponse';

export class UserController {
    static getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const stats = await UserService.getUserStats(userId);

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'User statistics fetched successfully',
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    };
}
