import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { create } from "zustand";

import { fetchCurrentUser, login as loginApi } from "../services/api/authApi";
import type { AuthUser, LoginResult } from "../types/auth";

const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

const persistTokens = async (
  accessToken: string,
  refreshToken?: string,
): Promise<void> => {
  await AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);

  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    return;
  }

  await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const backendMessage =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.response?.data as { error?: string } | undefined)?.error;

    return backendMessage ?? "Xac thuc that bai.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Xac thuc that bai.";
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  hydrateAuth: () => Promise<void>;
  clearError: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
  hydrateAuth: async () => {
    const [accessToken, refreshToken] = await AsyncStorage.multiGet([
      ACCESS_TOKEN_STORAGE_KEY,
      REFRESH_TOKEN_STORAGE_KEY,
    ]).then((pairs) => [pairs[0]?.[1] ?? null, pairs[1]?.[1] ?? null]);

    if (!accessToken) {
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
      return;
    }

    let user: AuthUser | null = null;

    try {
      user = await fetchCurrentUser();
    } catch {
      user = null;
    }

    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await loginApi({ email, password });

      await persistTokens(tokens.accessToken, tokens.refreshToken);

      let user: AuthUser | null = null;

      try {
        user = await fetchCurrentUser();
      } catch {
        user = null;
      }

      const result: LoginResult = {
        tokens,
        user,
      };

      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return result;
    } catch (error) {
      const message = getErrorMessage(error);

      set({
        isLoading: false,
        error: message,
        isAuthenticated: false,
      });

      throw new Error(message);
    }
  },
  logout: async () => {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_STORAGE_KEY,
      REFRESH_TOKEN_STORAGE_KEY,
    ]);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
