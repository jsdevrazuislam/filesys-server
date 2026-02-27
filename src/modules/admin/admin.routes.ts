import express from 'express';
import { AdminController } from './admin.controller';
import { auth, validateRole } from '../../middlewares/authMiddleware';
import { Role } from '../../constants';

const router = express.Router();

// All routes here are admin only
router.use(auth(), validateRole(Role.ADMIN));

router.get('/stats', AdminController.getDashboardStats);
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:userId/role', AdminController.updateUserRole);
router.delete('/users/:userId', AdminController.deleteUser);

export const AdminRoutes = router;
