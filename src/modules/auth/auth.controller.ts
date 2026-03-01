import { NextFunction, Request, Response } from 'express';

import { AppError } from '../../utils/AppError';
import { sendResponse } from '../../utils/sendResponse';
import {
  IAuthResponse,
  ILoginUserDTO,
  IRegisterUserDTO,
  IUserResponse,
} from './auth.interface';
import { AuthService } from './auth.service';

/**
 * AuthController handles HTTP requests for Authentication.
 */
export class AuthController {
  /**
   * Handle user registration.
   */
  static register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await AuthService.register(req.body as IRegisterUserDTO);
      sendResponse<IUserResponse>(res, {
        statusCode: 201,
        success: true,
        message:
          'User registered successfully. Please check your email for verification.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle user login.
   */
  static login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await AuthService.login(req.body as ILoginUserDTO);

      // Set session tokens in HTTP-Only cookies
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: 'none',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      if (result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      // Set non-sensitive hints for the frontend (readable by js-cookie)
      res.cookie('has_session', 'true', {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('user_role', result.user.role, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendResponse<IAuthResponse>(res, {
        statusCode: 200,
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle token refresh.
   */
  static refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        throw new AppError('Refresh token missing', 401);
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      // Set session tokens in HTTP-Only cookies
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Update hints (roles might have changed, though unlikely here)
      res.cookie('has_session', 'true', {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('user_role', result.role, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Token refreshed successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle password reset request.
   */
  static resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await AuthService.resetPasswordRequest(req.body.email);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Password reset instructions sent to your email.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle email verification.
   */
  static verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { token } = req.query;
      await AuthService.verifyEmail(token as string);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Email verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle password reset completion.
   */
  static completePasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      await AuthService.updatePassword(token, newPassword);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Password updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get currently logged-in user.
   */
  static getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // req.user is attached by auth middleware
      const userId = req.user!.id;
      const user = await AuthService.getCurrentUser(userId);
      sendResponse<IUserResponse | null>(res, {
        statusCode: 200,
        success: true,
        message: 'User profile fetched successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}
