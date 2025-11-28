import type { axiosInstance } from "./ap_provider";


// API methods
export const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  },

  async post<T = any>(endpoint: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  },

  async put<T = any>(endpoint: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  },

  async patch<T = any>(endpoint: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.patch(endpoint, data);
    return response.data;
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  },

  async getGoogleAuthUrl(): Promise<string> {
    const response = await axiosInstance.get('/auth/login/google');
    return response.data.url;
  },
};

export default axiosInstance;