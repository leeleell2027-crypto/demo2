"use client";

import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import ProfilePage from '@/components/ProfilePage';

interface User {
  name: string;
}

export default function Home() {
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
        <div className="animate-fade-in" style={{ color: 'var(--text-muted)' }}>인증 확인 중...</div>
      </div>
    );
  }

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', padding: '20px' }}>
      {user ? (
        <ProfilePage user={user} onLogout={() => setUser(null)} />
      ) : (
        <LoginPage onLoginSuccess={(userData) => setUser(userData)} />
      )}
    </main>
  );
}
