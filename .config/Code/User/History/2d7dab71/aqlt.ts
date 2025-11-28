import { axiosInstance } from "./api_provider";

// API methods
export const api = {
  async getGoogleAuthUrl(): Promise<string> {
    const response = await axiosInstance.get("/auth/login/google");
    return response.data.url;
  },

  async healthCheck():Promise<boolean>{
    const response = await axiosInstance.get("/");
    return response.status === 200;
  }
};

export default axiosInstance;
