import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type InternalAxiosRequestConfig } from "axios";

import env from "../../env";

const axiosClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const token = await AsyncStorage.getItem(env.accessToken);

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await AsyncStorage.removeItem(env.accessToken);
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
