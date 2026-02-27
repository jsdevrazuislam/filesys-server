import { NextFunction, Request, Response } from 'express';

import { sendResponse } from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

export class PaymentController {
  static createCheckoutSession = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { packageId } = req.body;
      const url = await PaymentService.createCheckoutSession(
        req.user?.id as string,
        packageId,
      );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Checkout session created',
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  };

  static handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      // Stripe webhook needs raw body
      await PaymentService.handleWebhook(
        signature,
        (req as unknown as { rawBody: Buffer }).rawBody,
      );

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  };
}
