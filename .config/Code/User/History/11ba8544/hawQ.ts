import type { User } from "../types";

export const UserAPI = {
  getMe: async (token: string): Promise<User> => {
    const res = await api.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};
