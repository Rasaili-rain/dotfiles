import { api } from "./api_provider";


export const AuthAPI = {
  getGoogleLoginUrl: async () => {
    const res = await api.get<{ url: string }>("/auth/login/google");
    return res.data.url;
  }
};
