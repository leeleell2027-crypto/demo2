"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, ShieldCheck, Mail, Calendar } from 'lucide-react';

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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ padding: '40px', maxWidth: '500px', width: '100%' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'linear-gradient(45deg, var(--primary), #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
                }}>
                    <User size={40} color="white" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user.name} 님</h2>
                    <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Verified Member
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Mail size={20} color="var(--primary)" />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                        <div style={{ fontSize: '0.9rem' }}>{user.name.toLowerCase()}@example.com</div>
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Calendar size={20} color="var(--primary)" />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined Date</div>
                        <div style={{ fontSize: '0.9rem' }}>February 2026</div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleLogout}
                style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-main)',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            >
                <LogOut size={20} />
                Sign Out
            </button>
        </motion.div>
    );
};

export default ProfilePage;
