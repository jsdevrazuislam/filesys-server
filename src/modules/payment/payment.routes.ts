import express from 'express';
import { PaymentController } from './payment.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @openapi
 * /payments/checkout:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Stripe checkout session
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
 *         description: Checkout URL returned
 */
router.post('/checkout', auth(), PaymentController.createCheckoutSession);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Internal Stripe Webhook endpoint
 *     responses:
 *       200:
 *         description: Webhook handled
 */
router.post('/webhook', PaymentController.handleWebhook);

export const PaymentRoutes = router;
