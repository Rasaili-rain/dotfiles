import { api_provider } from "./api_provider";


export const AuthAPI = {
  getGoogleLoginUrl: async () => {
	const res = await api_provider.get<{ url: string }>("/auth/login/google");
	return res.data.url;
  }
};


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
