"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, ShieldCheck, Mail, Calendar, Hash, BadgeCheck } from 'lucide-react';

interface ProfilePageProps {
    user: { name: string };
    onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
    const handleLogout = async () => {
        try {
            await fetch('/auth/logout', { method: 'POST' });
            onLogout();
        } catch (error) {
            console.error('Logout failed', error);
            onLogout();
        }
    };

    // Mocking more detailed member information for display
    const memberInfo = [
        { icon: <Mail size={18} />, label: "Email Address", value: `${user.name.toLowerCase()}@example.com` },
        { icon: <Hash size={18} />, label: "Member ID", value: `MEM-${Math.floor(Math.random() * 9000) + 1000}` },
        { icon: <BadgeCheck size={18} />, label: "Role", value: "Premium Member" },
        { icon: <Calendar size={18} />, label: "Joined Date", value: "February 2026" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card"
            style={{
                padding: '48px 40px',
                maxWidth: '440px',
                width: '100%',
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
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>{user.name} 님</h2>
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

            {/* Logout Button (Bottom) */}
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
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
        </motion.div>
    );
};

export default ProfilePage;
