import React, { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com";

export default function SimpleGoogleAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load Google script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleLogin = () => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });
    window.google.accounts.id.prompt();
  };

  const handleCredentialResponse = async (response) => {
    try {
      const res = await fetch('http://localhost:8000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Google Login</h1>
        
        {!user ? (
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
          >
            Sign in with Google
          </button>
        ) : (
          <div className="text-center space-y-4">
            <img
              src={user.picture}
              alt={user.name}
              className="w-20 h-20 rounded-full mx-auto"
            />
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}