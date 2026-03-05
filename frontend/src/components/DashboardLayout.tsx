"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Calendar,
    Image as ImageIcon,
    Settings,
    Wallet,
    LayoutDashboard,
    ChevronRight,
    Search,
    Bell,
    User,
    Menu,
    X,
    LogOut,
    Shield,
    Map as MapIcon,
    Hash
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface Category {
    id: string;
    label: string;
    icon: React.ReactNode;
    items: NavItem[];
}

const categories: Category[] = [
    {
        id: 'finance',
        label: 'Financial',
        icon: <Wallet size={20} />,
        items: [
            { label: 'Transactions', href: '/transactions', icon: <CreditCard size={18} /> },
            { label: 'Notice', href: '/notice', icon: <Hash size={18} /> },
        ]
    },
    {
        id: 'asset',
        label: 'Asset',
        icon: <ImageIcon size={20} />,
        items: [
            { label: 'Gallery', href: '/gallery', icon: <ImageIcon size={18} /> },
            { label: 'Map', href: '/map', icon: <MapIcon size={18} /> },
        ]
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: <Settings size={20} />,
        items: [
            { label: 'Profile', href: '/profile', icon: <User size={18} /> },
            { label: 'General', href: '/settings', icon: <Settings size={18} /> },
            { label: 'Calendar', href: '/settings/calendar', icon: <Calendar size={18} /> },
            { label: 'Admin Management', href: '/admin', icon: <Shield size={18} /> },
            { label: 'Holiday Management', href: '/holidays', icon: <Calendar size={18} /> },
        ]
    }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, logout: storeLogout } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();

    const filteredCategories = useMemo(() => {
        if (!user) return [];

        // Filter categories based on user role
        const allowedCategoryIds = user.role === 'SUPER_ADMIN'
            ? ['finance', 'asset', 'settings']
            : user.role === 'MIDDLE_ADMIN'
                ? ['finance', 'settings']
                : user.role === 'GENERAL_ADMIN'
                    ? ['asset']
                    : [];

        return categories
            .filter(cat => allowedCategoryIds.includes(cat.id))
            .map(cat => {
                // For settings category, filter specific items based on role
                if (cat.id === 'settings') {
                    return {
                        ...cat,
                        items: cat.items.filter(item => {
                            if (item.href === '/admin' || item.href === '/holidays') return user.role === 'SUPER_ADMIN';
                            if (item.href === '/settings/calendar') return user.role === 'SUPER_ADMIN' || user.role === 'MIDDLE_ADMIN';
                            return true;
                        })
                    };
                }
                return cat;
            });
    }, [user]);

    const [activeCategory, setActiveCategory] = useState('finance');

    useEffect(() => {
        // Redirect if trying to access unauthorized category
        const currentCat = categories.find((c: Category) => c.items.some((item: NavItem) => pathname.startsWith(item.href)));
        if (currentCat && !filteredCategories.find((c: Category) => c.id === currentCat.id)) {
            router.push('/');
        }
    }, [pathname, filteredCategories, router]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Sync activeCategory with pathname
    useEffect(() => {
        const cat = filteredCategories.find((c: Category) => c.items.some((item: NavItem) => pathname.startsWith(item.href)));
        if (cat) {
            setActiveCategory(cat.id);
        } else if (filteredCategories.length > 0 && !filteredCategories.find((c: Category) => c.id === activeCategory)) {
            setActiveCategory(filteredCategories[0].id);
        }
    }, [pathname, filteredCategories, activeCategory]);

    const handleLogout = async () => {
        try {
            await storeLogout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const currentCategory = categories.find(c => c.id === activeCategory);

    if (authLoading) return null;

    if (!user) {
        return (
            <main style={{ minHeight: '100vh', width: '100vw', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </main>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#0f172a', color: 'white', overflow: 'hidden' }}>
            {/* Top Navigation */}
            <header className="glass-panel" style={{
                height: '70px',
                borderRadius: 0,
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                padding: '0 24px',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px' }}>
                                <LayoutDashboard size={24} color="white" />
                            </div>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>DEMO APP</span>
                        </div>
                    </Link>

                    <nav style={{ display: 'flex', gap: '8px' }}>
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    if (cat.items.length > 0) {
                                        router.push(cat.items[0].href);
                                    }
                                }}
                                className={`btn ${activeCategory === cat.id ? 'btn-primary' : ''}`}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    background: activeCategory === cat.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    color: activeCategory === cat.id ? 'white' : 'var(--text-muted)',
                                }}
                            >
                                {cat.icon}
                                {cat.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="input-control"
                            style={{
                                padding: '8px 12px 8px 38px',
                                width: '200px'
                            }}
                        />
                    </div>
                    <button style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><Bell size={20} /></button>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), #ec4899)', border: '2px solid rgba(255,255,255,0.2)' }} />
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Side Navigation */}
                <motion.aside
                    initial={false}
                    animate={{ width: isSidebarOpen ? '260px' : '0px', opacity: isSidebarOpen ? 1 : 0 }}
                    style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <div style={{ padding: '24px 16px', flex: 1 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', padding: '0 12px' }}>
                            {currentCategory?.label} Menu
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {currentCategory?.items.map((item: NavItem) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                background: isActive ? 'var(--primary)' : 'transparent',
                                                color: isActive ? 'white' : 'var(--text-muted)',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: isActive ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {item.icon}
                                                {item.label}
                                            </div>
                                            {isActive && <motion.div layoutId="activeInd" ><ChevronRight size={16} /></motion.div>}
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            <LogOut size={18} />
                            Logout
                        </button>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Premium Pro</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Explore all features</div>
                            <button style={{ width: '100%', background: 'white', color: 'black', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>Upgrade</button>
                        </div>
                    </div>
                </motion.aside>

                {/* Main Content */}
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    position: 'relative'
                }}>
                    <AnimatePresence>
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
