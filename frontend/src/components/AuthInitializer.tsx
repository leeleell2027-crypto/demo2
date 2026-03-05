"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
    const checkAuth = useAuthStore((state) => state.checkAuth);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return <>{children}</>;
}
