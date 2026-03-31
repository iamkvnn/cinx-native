import type { AxiosResponse } from "axios";

import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  SendOtpPayload,
  SendOtpResponse,
  UserProfileResponse,
} from "../../types/auth";
import axiosClient from "./axiosClient";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

const unwrapData = <T>(response: AxiosResponse<T | ApiEnvelope<T>>): T => {
  const payload = response.data;

  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

export const sendOtp = async (
  payload: SendOtpPayload,
): Promise<SendOtpResponse> => {
  const response = await axiosClient.post<
    SendOtpResponse | ApiEnvelope<SendOtpResponse>
  >("/auth/send-otp", payload);

  return unwrapData(response);
};

export const register = async (payload: RegisterPayload): Promise<void> => {
  await axiosClient.post("/auth/register", payload);
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await axiosClient.post<
    LoginResponse | ApiEnvelope<LoginResponse>
  >("/auth/login", payload);

  return unwrapData(response);
};

export const fetchCurrentUser = async (): Promise<UserProfileResponse> => {
  const response = await axiosClient.get<
    UserProfileResponse | ApiEnvelope<UserProfileResponse>
  >("/users/me");

  return unwrapData(response);
};

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<{ message?: string }> => {
  const response = await axiosClient.put<
    { message?: string } | ApiEnvelope<{ message?: string }>
  >("/auth/change-password", payload);

  return unwrapData(response);
};

export const logoutServer = async (): Promise<void> => {
  try {
    await axiosClient.post("/auth/logout", {});
  } catch {
    // Continue local logout even if server-side logout fails.
  }
};
