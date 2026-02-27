import express from 'express';

import { AdminRoutes } from './modules/admin/admin.routes';
import { AuthRoutes } from './modules/auth/auth.routes';
import { FileRoutes } from './modules/file/file.routes';
import { FolderRoutes } from './modules/folder/folder.routes';
import { PackageRoutes } from './modules/package/package.routes';
import { PaymentRoutes } from './modules/payment/payment.routes';
import { UserRoutes } from './modules/user/user.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/packages',
    route: PackageRoutes,
  },
  {
    path: '/folders',
    route: FolderRoutes,
  },
  {
    path: '/files',
    route: FileRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
