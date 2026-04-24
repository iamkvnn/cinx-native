import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type InternalAxiosRequestConfig } from "axios";

import env from "../../env";

const axiosClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

let failedQueue: any[] = [];
let isRefreshing = false;

function processQueue(error: any, token: string | null = null) {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    failedQueue = [];
  }

axiosClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const token = await AsyncStorage.getItem(env.accessToken);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
);

axiosClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`🛬 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (__DEV__) {
          console.error('❌ API Error:', error.response?.data || error.message);
        }
        // Handle 401 - Unauthorized
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (isRefreshing) {
             return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
             }).then(token => {
                originalRequest.headers.Authorization = 'Bearer ' + token;
                return axiosClient(originalRequest);
             }).catch(err => {
                return Promise.reject(err);
             });
          }

          originalRequest._retry = true;
          isRefreshing = true;
          const useAuthStore = (await import("../../store/useAuthStore")).useAuthStore;

          try {
            const refreshToken = await AsyncStorage.getItem(env.refreshToken);

             if (!refreshToken) {
                useAuthStore.getState().logout()
                throw new Error('No refresh token available');
             }

             // Call refresh endpoint manually to avoid circular dependency
             const response = await axios.post(`${env.apiUrl}/api/v1/auth/refresh-token`, { 
                 token: refreshToken 
             });

             const { accessToken, refreshToken: newRefreshToken } = response.data.data;

              await AsyncStorage.setItem(env.accessToken, accessToken);
              await AsyncStorage.setItem(env.refreshToken, newRefreshToken);
             
             axiosClient.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
             originalRequest.headers.Authorization = 'Bearer ' + accessToken;

             processQueue(null, accessToken);
             
             return axiosClient(originalRequest);
          } catch (err) {
             processQueue(err, null);
             useAuthStore.getState().logout();
             return Promise.reject(err);
          } finally {
             isRefreshing = false;
          }
        }

    return Promise.reject(error);
  },
);

export default axiosClient;
