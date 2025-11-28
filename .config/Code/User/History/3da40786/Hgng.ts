

export const AuthAPI = {
  getGoogleLoginUrl: async () => {
    const res = await api.get<{ url: string }>("/auth/login/google");
    return res.data.url;
  }
};
