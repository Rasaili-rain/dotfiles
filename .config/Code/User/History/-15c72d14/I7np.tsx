import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Check for token in URL on load (handling the callback)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get('token');

    if (token) {
      localStorage.setItem('access_token', token);
      // Clean the URL
      window.history.replaceState({}, document.title, "/");
      fetchUserProfile(token);
    } else {
      // Check if we already have a token
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        fetchUserProfile(storedToken);
      }
    }
  }, []);

  // 2. Fetch User Profile using the JWT
  const fetchUserProfile = async (token: string) => {
    setLoading(true);
    try {
      // Note: Decoding the JWT on client side is okay for display, 
      // but verifying it with the backend is safer for data validity.
      // Here we just parse the payload to show name/pic quickly.
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const data = JSON.parse(jsonPayload);
      setUser(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load user session');
      logout();
    } finally {
      setLoading(false);
    }
  };

  // 3. Login Logic
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/login/google');
      const data = await response.json();
      // Redirect browser to Google
      window.location.href = data.url; 
    } catch (err) {
      setError("Could not connect to backend");
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          FastAPI + React OAuth
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse flex justify-center text-blue-500">
            Loading...
          </div>
        ) : user ? (
          <div className="space-y-4">
             {user.picture && (
              <img 
                src={user.picture} 
                alt="Profile" 
                className="w-20 h-20 rounded-full mx-auto border-4 border-blue-500"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Welcome, {user.name}</h2>
              <p className="text-gray-500 text-sm">{user.sub}</p>
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
            <p className="text-gray-600 mb-4">
              Sign in to access your dashboard securely.
            </p>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded shadow-sm transition duration-200"
            >
              <img 
                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                alt="Google" 
                className="w-6 h-6"
              />
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;