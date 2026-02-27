import { NextFunction, Request, Response } from 'express';

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

      // Set session token in HTTP-Only cookie
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Set role hint (NON-HttpOnly) for Middleware/Frontend routing
      res.cookie('user_role', result.user.role, {
        httpOnly: false, // Accessible by JS/Middleware
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Set session hint (NON-HttpOnly) for API optimization
      res.cookie('has_session', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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
   * Handle user logout.
   */
  static logout = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.clearCookie('access_token');
      res.clearCookie('user_role');
      res.clearCookie('has_session');
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Logged out successfully',
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
