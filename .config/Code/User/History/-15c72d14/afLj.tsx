import { useState, useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { api } from "./utils/api";

function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    initializeAuth();
    api
      .healthCheck()
      .then(setApiHealthy)
      .catch(() => setApiHealthy(false));
  }, [initializeAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? <Dashboard /> : <Login />}
      {/* API health indicator */}
      <div
        className="fixed top-2 right-2 w-3 h-3 rounded-full border border-gray-300"
        style={{
          backgroundColor: apiHealthy === null ? "gray" : apiHealthy ? "green" : "red",
        }}
        title={apiHealthy === null ? "Checking API..." : apiHealthy ? "API is healthy" : "API offline"}
      />
    </>
  );
}

export default App;
