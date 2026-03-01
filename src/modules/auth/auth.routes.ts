import express from 'express';

import { auth } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import {
  loginSchema,
  passwordResetSchema,
  registerSchema,
} from './auth.validation';

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  AuthController.register,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/login', validateRequest(loginSchema), AuthController.login);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Instructions sent to email
 */
router.post(
  '/reset-password',
  validateRequest(passwordResetSchema),
  AuthController.resetPassword,
);

router.post('/complete-reset-password', AuthController.completePasswordReset);
router.post('/refresh', AuthController.refreshToken);

router.get('/verify-email', AuthController.verifyEmail);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched
 */
router.get(
  '/me',
  auth({ skipVerification: true }),
  AuthController.getCurrentUser,
);

export const AuthRoutes = router;
