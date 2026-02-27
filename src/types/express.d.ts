import { SubscriptionPackage, UserSubscriptionHistory } from '@prisma/client';

import { IDecodedUser } from '../modules/auth/auth.interface';

declare global {
  namespace Express {
    interface Request {
      user?: IDecodedUser;
      subscription?: UserSubscriptionHistory;
      package?: SubscriptionPackage;
    }
  }
}
