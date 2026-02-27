import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import ProfilePage from './components/ProfilePage'
import './App.css'

interface User {
  name: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {user ? (
        <ProfilePage user={user} onLogout={() => setUser(null)} />
      ) : (
        <LoginPage onLoginSuccess={(userData) => setUser(userData)} />
      )}
    </div>
  )
}

export default App
