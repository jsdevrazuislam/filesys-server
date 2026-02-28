import { Role, User } from '@prisma/client';

export interface IRegisterUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface ILoginUserDTO {
  email: string;
  password: string;
}

export interface IForgotPasswordDTO {
  email: string;
}

export interface IAuthResponse {
  token: string;
  refreshToken?: string;
  user: IUserResponse;
}

export interface IUserResponse extends Omit<User, 'password'> {
  subscriptionHistory?: Record<string, unknown>[];
}

export interface IDecodedUser {
  id: string;
  role: Role;
  email: string;
}
