import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error(" Request Error:", {
      message: error.message,
      config: error.config,
      timestamp: new Date().toISOString(),
    });
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log all errors
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data,
      timestamp: new Date().toISOString(),
    });

    // Handle 401 Unauthorized - logout user
    if (error.response?.status === 401) {
      console.warn("Unauthorized - Logging out user");
      useAuthStore.getState().logout();
    }

    // Extract error message
    const errorMessage = (error.response?.data as any)?.detail || error.message || "Something went wrong";

    return Promise.reject(new Error(errorMessage));
  }
);
