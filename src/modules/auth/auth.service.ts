import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { env } from '../../config';
import prisma from '../../config/db';
import {
    IAuthResponse,
    ILoginUserDTO,
    IRegisterUserDTO,
    IUserResponse,
} from './auth.interface';
import { EmailService } from '../email/email.service';

/**
 * AuthService handles business logic for Authentication.
 */
export class AuthService {
    /**
     * Registers a new user.
     * @param data User registration data (name, email, password)
     * @returns The created user (without password)
     */
    static async register(data: IRegisterUserDTO): Promise<IUserResponse> {
        const { name, email, password } = data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError('User already exists with this email', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: Role.USER, // Default role
            },
        });

        // Assign default 'Free' package if it exists
        try {
            const freePackage = await prisma.subscriptionPackage.findUnique({
                where: { name: 'Free' }
            });

            if (freePackage) {
                await prisma.userSubscriptionHistory.create({
                    data: {
                        userId: user.id,
                        packageId: freePackage.id,
                        isActive: true,
                        paymentStatus: 'active',
                        startDate: new Date(),
                    }
                });
            }
        } catch (error) {
            console.error('Failed to assign default package:', error);
        }

        // Send Verification Email
        const verificationToken = this.generateToken(user.id, user.role, '1h');
        await EmailService.sendEmail(
            'Verify Your Email',
            user.email,
            user.name,
            { verificationToken, user_name: user.name, client_url: env.CLIENT_URL },
            21
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Logs in a user and returns a JWT token.
     * @param data Login data (email, password)
     * @returns JWT token and user info
     */
    static async login(data: ILoginUserDTO): Promise<IAuthResponse> {
        const { email, password } = data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                subscriptionHistory: {
                    where: { isActive: true },
                    include: { package: true },
                    take: 1,
                },
            },
        });

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        if (!user.isVerified) {
            throw new AppError('Please verify your email to login', 401);
        }

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate JWT
        const token = this.generateToken(user.id, user.role, env.JWT_ACCESS_EXPIRES_IN);

        const { password: _, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
    }

    /**
     * Password reset request logic.
     * @param email User email
     */
    static async resetPasswordRequest(email: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new AppError('No user found with that email address', 404);
        }

        const resetToken = this.generateToken(user.id, user.role, '15m');

        await EmailService.sendEmail(
            'Password Reset Request',
            user.email,
            user.name,
            { resetToken, user_name: user.name },
            2 // Assume templateId 2 is for reset
        );
    }

    /**
     * Gets current user data.
     * @param id User ID
     * @returns User data
     */
    static async getCurrentUser(id: string): Promise<IUserResponse | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                subscriptionHistory: {
                    where: { isActive: true },
                    include: { package: true },
                    take: 1,
                },
            },
        });

        if (!user) return null;

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Verifies user email with token.
     */
    static async verifyEmail(token: string): Promise<void> {
        try {
            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string };
            const user = await prisma.user.findUnique({ where: { id: decoded.id } });

            if (!user) {
                throw new AppError('User not found', 404);
            }

            if (user.isVerified) {
                return; // Already verified
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true },
            });
        } catch (error) {
            throw new AppError('Invalid or expired verification token', 400);
        }
    }

    /**
     * Updates password using reset token.
     */
    static async updatePassword(token: string, newPassword: string): Promise<void> {
        try {
            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string };
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            await prisma.user.update({
                where: { id: decoded.id },
                data: { password: hashedPassword },
            });
        } catch (error) {
            throw new AppError('Invalid or expired reset token', 400);
        }
    }

    /**
     * Internal helper to generate JWT tokens.
     */
    private static generateToken(id: string, role: string, expiresIn: string): string {
        return jwt.sign({ id, role }, env.JWT_ACCESS_SECRET, {
            expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
        });
    }
}
