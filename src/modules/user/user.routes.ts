import express from 'express';

import { auth } from '../../middlewares/authMiddleware';
import { UserController } from './user.controller';

const router = express.Router();

/**
 * @openapi
 * /api/user/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Returns file and folder counts, storage usage, and plan information.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stats', auth(), UserController.getStats);

export const UserRoutes = router;
