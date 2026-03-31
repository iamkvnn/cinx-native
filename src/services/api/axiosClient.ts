import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type InternalAxiosRequestConfig } from "axios";

const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiBaseUrl) {
  console.warn(
    "Missing EXPO_PUBLIC_API_URL. Set it in .env to call backend APIs.",
  );
}

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
);

export default axiosClient;
