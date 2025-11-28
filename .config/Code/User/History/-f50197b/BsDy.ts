// ------------ API handler ------------------
import axios, { AxiosInstance } from "axios";
export const api: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER_IP,
  // baseURL: "http://192.168.254.168:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
	console.warn("API Error:", error.response?.data || error.message);
	return Promise.reject(error);
  }
);