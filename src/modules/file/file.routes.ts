import express from 'express';

import { auth } from '../../middlewares/authMiddleware';
import {
  attachSubscription,
  checkSubscriptionLimit,
} from '../../middlewares/subscriptionMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { FileController } from './file.controller';
import { renameFileSchema, signedUrlSchema } from './file.validation';

const router = express.Router();

/**
 * @openapi
 * /files/signed-url:
 *   post:
 *     tags: [Files]
 *     summary: Generate a signed URL for Cloudinary upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, fileType, fileSize]
 *             properties:
 *               fileName: { type: string }
 *               fileType: { type: string }
 *               fileSize: { type: number }
 *               folderId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Signed URL generated
 */
router.post(
  '/signed-url',
  auth(),
  attachSubscription,
  checkSubscriptionLimit('UPLOAD_FILE'),
  validateRequest(signedUrlSchema),
  FileController.getSignedUrl,
);

/**
 * @openapi
 * /files/confirm:
 *   post:
 *     tags: [Files]
 *     summary: Confirm file upload and save to database
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, size, mimeType, s3Key]
 *             properties:
 *               name: { type: string }
 *               size: { type: number }
 *               mimeType: { type: string }
 *               s3Key: { type: string }
 *               folderId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: File saved successfully
 */
router.post(
  '/confirm',
  auth(),
  attachSubscription,
  checkSubscriptionLimit('UPLOAD_FILE'),
  FileController.confirmUpload,
);

/**
 * @openapi
 * /files:
 *   get:
 *     tags: [Files]
 *     summary: List files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Files fetched
 */
router.get('/', auth(), FileController.listFiles);

/**
 * @openapi
 * /files/{id}:
 *   get:
 *     tags: [Files]
 *     summary: Get file details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File fetched
 */
router.get('/:id', auth(), FileController.getFile);

/**
 * @openapi
 * /files/{id}:
 *   patch:
 *     tags: [Files]
 *     summary: Rename a file
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
 *         description: File renamed
 */
router.patch(
  '/:id',
  auth(),
  validateRequest(renameFileSchema),
  FileController.renameFile,
);

/**
 * @openapi
 * /files/{id}:
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/:id', auth(), FileController.deleteFile);

/**
 * @openapi
 * /files/{id}/view:
 *   get:
 *     tags: [Files]
 *     summary: View a file securely
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File view URL generated
 */
router.get('/:id/view', auth(), FileController.viewFile);

/**
 * @openapi
 * /files/{id}/download:
 *   get:
 *     tags: [Files]
 *     summary: Download a file securely
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File download URL generated
 */
router.get('/:id/download', auth(), FileController.downloadFile);

export const FileRoutes = router;
