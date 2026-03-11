"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';

interface ProfilePageProps {
    onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
    const { logout: storeLogout } = useAuthStore();

    // Recent Notices Query
    const { data: recentNoticesData, isLoading: loadingNotices } = useQuery({
        queryKey: ['notices', 'recent'],
        queryFn: async () => {
            const res = await fetch('/api/notices?page=0&size=5');
            const data = await res.json();
            return data.notices || [];
        }
    });

    const recentNotices = recentNoticesData || [];

    const handleLogout = async () => {
        try {
            await storeLogout();
            onLogout();
        } catch (error) {
            console.error('Logout failed', error);
            onLogout();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            month: '2-digit',
            day: '2-digit'
        });
    };

    const isToday = (dateString: string) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const now = new Date();
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    };

    return (
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>

            {/* Recent Notices Widget */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card"
                style={{
                    width: '400px',
                    padding: '30px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Mail size={20} color="var(--primary)" /> 최근 공지사항
                    </h3>
                    <Link href="/notice" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        more
                    </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loadingNotices ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>로딩 중...</div>
                    ) : recentNotices.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>공지사항이 없습니다.</div>
                    ) : recentNotices.map((notice: any) => (
                        <Link
                            key={notice.id}
                            href={`/notice?id=${notice.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <motion.div
                                whileHover={{ x: 5, background: 'rgba(255,255,255,0.03)' }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                                        {notice.title}
                                        {isToday(notice.createdAt) && (
                                            <span style={{
                                                fontSize: '0.6rem',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                fontWeight: 800,
                                                marginLeft: '6px',
                                                lineHeight: 1
                                            }}>NEW</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notice.memberName || notice.memberId}</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {formatDate(notice.createdAt)}
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
