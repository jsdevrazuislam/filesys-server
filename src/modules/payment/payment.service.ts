import Stripe from 'stripe';

import { env } from '../../config';
import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * PaymentService handles Stripe interactions.
 */
export class PaymentService {
  /**
   * Create or retrieve Stripe customer for a user.
   */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, stripeCustomerId: true },
    });

    if (!user) throw new AppError('User not found', 404);

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for a subscription.
   */
  static async createCheckoutSession(
    userId: string,
    packageId: string,
  ): Promise<string> {
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg || !pkg.stripePriceId) {
      throw new AppError('Package not available for subscription', 400);
    }

    const customerId = await this.getOrCreateCustomer(userId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: pkg.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${env.CLIENT_URL}/user?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/user/subscription`,
      metadata: {
        userId,
        packageId,
      },
      subscription_data: {
        metadata: {
          userId,
          packageId,
        },
      },
    });

    return session.url!;
  }

  /**
   * Handle Webhook events from Stripe.
   */
  static async handleWebhook(signature: string, rawBody: Buffer) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new AppError(`Webhook Error: ${message}`, 400);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleSubscriptionSuccess(session);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
      // Add more events as needed
      default:
        logger.info(`Unhandled event type ${event.type}`);
    }
  }

  private static async handleSubscriptionSuccess(
    session: Stripe.Checkout.Session,
  ) {
    const userId = session.metadata?.userId;
    const packageId = session.metadata?.packageId;
    const stripeSubscriptionId = session.subscription as string;

    if (!userId || !packageId) return;

    await prisma.$transaction(async (tx) => {
      // Deactivate old active subscriptions
      await tx.userSubscriptionHistory.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      // Create new active subscription
      await tx.userSubscriptionHistory.create({
        data: {
          userId,
          packageId,
          stripeSubscriptionId,
          paymentStatus: 'active',
          isActive: true,
          startDate: new Date(),
        },
      });
    });
  }

  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ) {
    await prisma.userSubscriptionHistory.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        isActive: false,
        paymentStatus: 'cancelled',
        endDate: new Date(),
      },
    });
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as unknown as { subscription: string })
      .subscription;
    if (subscriptionId) {
      await prisma.userSubscriptionHistory.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          paymentStatus: 'failed',
          isActive: false, // Or keep true with grace period logic
        },
      });
    }
  }
}
