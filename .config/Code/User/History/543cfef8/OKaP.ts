import axios from "axios";

export const api_provider = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

api_provider.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);




