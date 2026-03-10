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
    Hash,
    Plus,
    Edit2,
    Trash2,
    Check,
    ChevronDown,
    Lock
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';

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

export interface MenuData {
    id: number;
    parentId: number | null;
    name: string;
    url: string | null;
    icon: string;
    sortOrder: number;
    isActive: boolean;
    role: string;
    children?: MenuData[];
}

const getIcon = (iconName: string, size = 18) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return <IconComponent size={size} />;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, logout: storeLogout } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notices-unread-count', user?.username],
        queryFn: async () => {
            const res = await fetch('/api/notices/unread-count');
            return res.json();
        },
        enabled: !!user,
        staleTime: 1000 * 30, // 30 seconds
        refetchInterval: 1000 * 60, // 1 minute
    });

    const hasNewNotices = useMemo(() => {
        return unreadCount > 0;
    }, [unreadCount]);

    const { data: menuTree = [], isLoading: menuLoading } = useQuery<MenuData[]>({
        queryKey: ['menu-tree'],
        queryFn: async () => {
            const res = await fetch('/api/menus/tree');
            if (!res.ok) throw new Error('Failed to fetch menus');
            return res.json();
        }
    });

    const filteredCategories = useMemo(() => {
        if (!user || !menuTree) return [];

        return menuTree.filter(menu => {
            if (!menu.role) return true;
            const allowedRoles = menu.role.split(',');
            return allowedRoles.includes(user.role);
        }).map(menu => ({
            id: menu.id.toString(),
            label: menu.name,
            icon: getIcon(menu.icon, 20),
            items: (menu.children || [])
                .filter(child => {
                    if (!child.role) return true;
                    const allowedRoles = child.role.split(',');
                    return allowedRoles.includes(user.role);
                })
                .map(child => ({
                    label: child.name,
                    href: child.url || '#',
                    icon: getIcon(child.icon, 18)
                }))
        }));
    }, [user, menuTree]);

    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        if (filteredCategories.length > 0 && !activeCategory) {
            setActiveCategory(filteredCategories[0].id);
        }
    }, [filteredCategories, activeCategory]);

    useEffect(() => {
        // Redirect if trying to access unauthorized category
        const currentCat = filteredCategories.find((c: any) => c.items.some((item: any) => pathname.startsWith(item.href)));
        if (currentCat && !filteredCategories.find((c: Category) => c.id === currentCat.id)) {
            router.push('/');
        }
    }, [pathname, filteredCategories, router]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isHeaderOpen, setIsHeaderOpen] = useState(true);

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

    const currentCategory = filteredCategories.find(c => c.id === activeCategory);

    if (authLoading) return null;

    if (!user) {
        return (
            <main className="auth-layout-container">
                {children}
            </main>
        );
    }

    return (
        <div className="main-wrapper">

            {/* Floating Toggle for Header when closed */}
            <AnimatePresence>
                {!isHeaderOpen && (
                    <motion.button
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onClick={() => setIsHeaderOpen(true)}
                        className="floating-toggle"
                        style={{
                            top: '10px',
                            right: '24px',
                        }}
                        title="Show Header"
                    >
                        <ChevronRight size={20} style={{ transform: 'rotate(90deg)' }} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Floating Toggle for Sidebar when closed */}
            <AnimatePresence>
                {!isSidebarOpen && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="sidebar-toggle-floating"
                        style={{
                            top: isHeaderOpen ? '85px' : '24px',
                        }}
                        title="Show Sidebar"
                    >
                        <ChevronRight size={20} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Top Navigation */}
            <AnimatePresence>
                {isHeaderOpen && (
                    <motion.header
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: '70px', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="glass-panel app-header"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`nav-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
                                style={{
                                    background: isSidebarOpen ? 'rgba(255,255,255,0.05)' : 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <Menu size={24} />
                            </button>

                            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px' }}>
                                        <LayoutDashboard size={24} color="white" />
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>DEMO APP</span>
                                </div>
                            </Link>

                            <nav style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                                {filteredCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveCategory(cat.id);
                                            if (cat.items.length > 0) {
                                                router.push(cat.items[0].href);
                                            }
                                        }}
                                        className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                    >
                                        {cat.icon}
                                        {cat.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="input-control"
                                    style={{
                                        padding: '6px 10px 6px 32px',
                                        width: '180px',
                                        fontSize: '0.85rem'
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => router.push('/notice')}
                                className="notification-btn"
                            >
                                <Bell size={18} />
                                {hasNewNotices && (
                                    <span className="notification-dot" />
                                )}
                            </button>
                            <div className="user-avatar" title={user.username} />

                            {/* Header Close Button */}
                            <button
                                onClick={() => setIsHeaderOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                                title="Hide Header"
                            >
                                <ChevronRight size={18} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Side Navigation */}
                <motion.aside
                    initial={false}
                    animate={{ width: isSidebarOpen ? '260px' : '0px', opacity: isSidebarOpen ? 1 : 0 }}
                    className="sidebar-aside"
                    style={{
                        borderRight: isSidebarOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    }}
                >
                    {/* Sidebar Close Button */}
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="sidebar-close-btn"
                            title="Close Sidebar"
                        >
                            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    )}

                    <div style={{ padding: '24px 16px', flex: 1 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{currentCategory?.label} Menu</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {currentCategory?.items.map((item: NavItem) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            className="sidebar-nav-item"
                                            style={{
                                                background: isActive ? 'var(--primary)' : 'transparent',
                                                color: isActive ? 'white' : 'var(--text-muted)',
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
                            className="sidebar-logout-btn"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>

                        <div className="sidebar-promo">
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Premium Pro</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Explore all features</div>
                            <button className="btn" style={{ width: '100%', background: 'white', color: 'black', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>Upgrade</button>
                        </div>
                    </div>
                </motion.aside>

                {/* Main Content */}
                <main className="content-main">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
