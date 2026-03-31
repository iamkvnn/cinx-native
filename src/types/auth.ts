export interface LoginTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SendOtpPayload {
  email: string;
  purpose: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  otp: string;
}

export interface SendOtpResponse {
  message?: string;
}

export interface AuthUser {
  id?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  rewardPoints?: number;
  [key: string]: unknown;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export type UserProfileResponse = AuthUser;

export interface LoginResult {
  tokens: LoginTokens;
  user: AuthUser | null;
}
