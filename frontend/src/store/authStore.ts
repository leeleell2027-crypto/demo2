import { create } from 'zustand';

interface User {
    name: string;
    role: string;
    username: string;
}

interface AuthState {
    user: User | null;
    loading: boolean;
    login: (userData: User) => void;
    logout: () => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    login: (userData) => set({ user: userData }),
    logout: async () => {
        try {
            await fetch('/auth/logout', { method: 'POST' });
            set({ user: null });
        } catch (error) {
            console.error('Logout failed:', error);
            set({ user: null });
        }
    },
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    checkAuth: async () => {
        set({ loading: true });
        try {
            const response = await fetch('/auth/me');
            if (response.ok) {
                const userData = await response.json();
                set({ user: userData });
            } else {
                set({ user: null });
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            set({ user: null });
        } finally {
            set({ loading: false });
        }
    },
}));
