import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config';
import prisma from '../config/db';
import { IDecodedUser } from '../modules/auth/auth.interface';
import { AppError } from '../utils/AppError';

export const auth = (options: { skipVerification?: boolean } = {}) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      let token = '';

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
      }

      if (!token) {
        throw new AppError('Authentication token missing', 401);
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as IDecodedUser;

      // Fetch fresh user data to verify status
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { isVerified: true },
      });

      if (!user) {
        throw new AppError('User no longer exists', 401);
      }

      if (!user.isVerified && !options.skipVerification) {
        throw new AppError(
          'Please verify your email to access this resource',
          403,
        );
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError('Invalid token', 401));
      }
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError('Token expired', 401));
      }
      next(error);
    }
  };
};

export const validateRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action',
        403,
      );
    }
    next();
  };
};
