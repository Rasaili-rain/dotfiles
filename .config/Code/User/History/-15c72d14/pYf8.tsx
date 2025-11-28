import { useState, useEffect } from "react";
import type { User } from "./types";
import { AuthAPI, UserAPI } from "./lib/api/api";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");

    if (token) {
      localStorage.setItem("access_token", token);
      window.history.replaceState({}, document.title, "/");
      fetchUser(token);
    } else {
      const stored = localStorage.getItem("access_token");
      if (stored) fetchUser(stored);
    }
  }, []);

  const fetchUser = async (token: string) => {
    setLoading(true);

    try {
      const userData = await UserAPI.getMe(token);

      // decode JWT
      const payload = JSON.parse(atob(token.split(".")[1]));

      setUser({
        // ...userData,
        name: payload.name,
        picture: payload.picture,
        email:payload.email,
      });
    } catch (err) {
      setError("Failed to load user session");
      logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const url = await AuthAPI.getGoogleLoginUrl();
      window.location.href = url;
    } catch {
      setError("Could not connect to backend");
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">FastAPI + React OAuth</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {loading ? (
          <div className="animate-pulse flex justify-center text-blue-500 text-lg">Loading...</div>
        ) : user ? (
          <div className="space-y-4">
            {user.picture && (
              <img
                src={user.picture}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto border-4 border-blue-500 shadow-md"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Welcome, {user.name || "User"}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>

            <div className="pt-4">
              <button
                onClick={logout}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600 mb-4">Sign in to access your dashboard securely.</p>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded shadow-sm transition duration-200"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
