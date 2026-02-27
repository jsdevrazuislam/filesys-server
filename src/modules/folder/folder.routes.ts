import express from 'express';

import { auth } from '../../middlewares/authMiddleware';
import {
  attachSubscription,
  checkSubscriptionLimit,
} from '../../middlewares/subscriptionMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { FolderController } from './folder.controller';
import { createFolderSchema, renameFolderSchema } from './folder.validation';

const router = express.Router();

/**
 * @openapi
 * /folders:
 *   post:
 *     tags: [Folders]
 *     summary: Create a new folder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               parentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         description: Folder created
 */
router.post(
  '/',
  auth(),
  attachSubscription,
  checkSubscriptionLimit('CREATE_FOLDER'),
  validateRequest(createFolderSchema),
  FolderController.createFolder,
);

/**
 * @openapi
 * /folders:
 *   get:
 *     tags: [Folders]
 *     summary: List folders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Folders fetched
 */
router.get('/', auth(), FolderController.listFolders);

/**
 * @openapi
 * /folders/hierarchy:
 *   get:
 *     tags: [Folders]
 *     summary: Get folder hierarchy (tree view)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchy fetched
 */
router.get('/hierarchy', auth(), FolderController.getHierarchy);

/**
 * @openapi
 * /folders/{id}:
 *   patch:
 *     tags: [Folders]
 *     summary: Rename a folder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Folder renamed
 */
router.patch(
  '/:id',
  auth(),
  validateRequest(renameFolderSchema),
  FolderController.renameFolder,
);

/**
 * @openapi
 * /folders/{id}:
 *   delete:
 *     tags: [Folders]
 *     summary: Delete a folder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Folder deleted
 */
router.delete('/:id', auth(), FolderController.deleteFolder);

export const FolderRoutes = router;
