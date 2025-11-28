import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);




