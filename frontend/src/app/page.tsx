"use client";

import { useAuth } from '@/components/AuthContext';
import LoginPage from '@/components/LoginPage';
import ProfilePage from '@/components/ProfilePage';

export default function Home() {
  const { user, login } = useAuth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', padding: '20px' }}>
      {user ? (
        <ProfilePage user={user} onLogout={() => { }} />
      ) : (
        <LoginPage onLoginSuccess={(userData) => login(userData)} />
      )}
    </div>
  );
}
