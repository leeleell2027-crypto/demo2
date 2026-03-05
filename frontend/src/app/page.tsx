"use client";

import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/components/LoginPage';
import ProfilePage from '@/components/ProfilePage';

export default function Home() {
  const { user, login } = useAuthStore();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', padding: '20px' }}>
      {user ? (
        <ProfilePage onLogout={() => { }} />
      ) : (
        <LoginPage onLoginSuccess={(userData) => login(userData)} />
      )}
    </div>
  );
}
