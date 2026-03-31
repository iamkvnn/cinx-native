import type { AxiosResponse } from "axios";

import type { AuthUser } from "../../types/auth";
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

export interface UpdateProfilePayload {
  fullName?: string;
  avatar?: string;
}

export interface SendUpdateOtpPayload {
  email?: string;
  phone?: string;
}

export interface UpdateSensitiveInfoPayload {
  newEmail?: string;
  newPhone?: string;
  newPassword?: string;
  otp: string;
}

export const updateProfile = async (
  payload: UpdateProfilePayload,
): Promise<AuthUser> => {
  const response = await axiosClient.put<AuthUser | ApiEnvelope<AuthUser>>(
    "/users/profile",
    payload,
  );

  return unwrapData(response);
};

export const sendUpdateOtp = async (
  payload: SendUpdateOtpPayload,
): Promise<{ message?: string }> => {
  const response = await axiosClient.post<
    { message?: string } | ApiEnvelope<{ message?: string }>
  >("/users/send-update-otp", payload, {
    timeout: 30000,
  });

  return unwrapData(response);
};

export const updateSensitiveInfo = async (
  payload: UpdateSensitiveInfoPayload,
): Promise<AuthUser> => {
  const response = await axiosClient.put<AuthUser | ApiEnvelope<AuthUser>>(
    "/users/update-sensitive",
    payload,
  );

  return unwrapData(response);
};
