"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, ShieldCheck, Mail, Calendar, Hash, BadgeCheck, Image as ImageIcon, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ProfilePageProps {
    onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
    const { user, logout: storeLogout } = useAuthStore();
    const queryClient = useQueryClient();

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

    // Mocking more detailed member information for display
    const memberInfo = [
        { icon: <Mail size={18} />, label: "Email Address", value: `${user?.name.toLowerCase() || 'user'}@example.com` },
        { icon: <Hash size={18} />, label: "Member ID", value: `MEM-8842` },
        { icon: <BadgeCheck size={18} />, label: "Role", value: user?.role || "Premium Member" },
        { icon: <Calendar size={18} />, label: "Joined Date", value: "February 2026" },
    ];

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
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card"
                style={{
                    padding: '48px 40px',
                    width: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                {/* Profile Header (Vertical) */}
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px',
                        boxShadow: '0 12px 24px rgba(99, 102, 241, 0.4)',
                        position: 'relative'
                    }}
                >
                    <User size={48} color="white" />
                    <div style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        background: 'var(--success)',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '3px solid #1e293b'
                    }} />
                </motion.div>

                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>{user?.name} 님</h2>
                    <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <ShieldCheck size={16} /> 인증된 회원 계정
                    </p>
                </div>

                {/* Member Info Cards (Vertical Stack) */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
                    {memberInfo.map((info, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '16px 20px',
                                borderRadius: '16px',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{ color: 'var(--primary)' }}>{info.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {info.label}
                                </div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '2px' }}>
                                    {info.value}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <Link href="/transactions" style={{ flex: 1 }}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                <CreditCard size={18} />
                                거래 내역
                            </motion.button>
                        </Link>
                        <Link href="/gallery" style={{ flex: 1 }}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--primary)',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--primary)',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <ImageIcon size={18} />
                                갤러리
                            </motion.button>
                        </Link>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-main)',
                            padding: '16px',
                            borderRadius: '14px',
                            border: '1px solid var(--glass-border)',
                            fontWeight: 600,
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.color = '#fCA5A5';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                            e.currentTarget.style.color = 'var(--text-main)';
                        }}
                    >
                        <LogOut size={20} />
                        로그아웃 하기
                    </button>
                </div>
            </motion.div>

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
