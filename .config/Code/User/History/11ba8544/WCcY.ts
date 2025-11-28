import type { User } from "../types";
import { api } from "./api_provider";

export const UserAPI = {
  getMe: async (token: string): Promise<User> => {
    const res = await api.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};
