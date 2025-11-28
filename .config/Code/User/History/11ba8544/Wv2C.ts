import type { User } from "../types";
import { api_provider } from "./api_provider";

export const UserAPI = {
  getMe: async (token: string): Promise<User> => {
    const res = await api_provider.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};
