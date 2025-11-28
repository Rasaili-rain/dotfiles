import { api_provider } from "./api_provider";


export const AuthAPI = {
  getGoogleLoginUrl: async () => {
    const res = await api_provider.get<{ url: string }>("/auth/login/google");
    return res.data.url;
  }
};
