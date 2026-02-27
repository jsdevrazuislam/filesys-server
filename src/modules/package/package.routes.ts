import express from 'express';

import { Role } from '../../constants';
import { auth, validateRole } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { PackageController } from './package.controller';
import { createPackageSchema, updatePackageSchema } from './package.validation';

const router = express.Router();

/**
 * @openapi
 * /packages:
 *   get:
 *     tags: [Packages]
 *     summary: Get all subscription packages
 *     responses:
 *       200:
 *         description: Packages fetched successfully
 */
router.get('/', PackageController.getAllPackages);

/**
 * @openapi
 * /packages:
 *   post:
 *     tags: [Packages]
 *     summary: Create a new package (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       201:
 *         description: Package created
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  auth(),
  validateRole(Role.ADMIN),
  validateRequest(createPackageSchema),
  PackageController.createPackage,
);

/**
 * @openapi
 * /packages/{id}:
 *   patch:
 *     tags: [Packages]
 *     summary: Update a package (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       200:
 *         description: Package updated
 */
router.patch(
  '/:id',
  auth(),
  validateRole(Role.ADMIN),
  validateRequest(updatePackageSchema),
  PackageController.updatePackage,
);

/**
 * @openapi
 * /packages/{id}:
 *   delete:
 *     tags: [Packages]
 *     summary: Delete a package (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Package deleted
 */
router.delete(
  '/:id',
  auth(),
  validateRole(Role.ADMIN),
  PackageController.deletePackage,
);

/**
 * @openapi
 * /packages/subscribe:
 *   post:
 *     tags: [Subscription]
 *     summary: Subscribe to a package
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageId]
 *             properties:
 *               packageId: { type: string }
 *     responses:
 *       200:
 *         description: Subscribed successfully
 */
router.post('/subscribe', auth(), PackageController.subscribe);

/**
 * @openapi
 * /packages/history:
 *   get:
 *     tags: [Subscription]
 *     summary: Get user subscription history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History fetched
 */
router.get('/history', auth(), PackageController.getHistory);

export const PackageRoutes = router;
