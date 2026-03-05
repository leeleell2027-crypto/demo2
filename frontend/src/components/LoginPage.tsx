"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                onLoginSuccess(data);
            } else {
                const errorMsg = await response.text();
                setError(errorMsg || '로그인에 실패했습니다. 정보를 다시 확인해주세요.');
            }
        } catch (err) {
            setError('서버와 통신 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card"
            style={{ padding: '48px', maxWidth: '400px', width: '100%' }}
        >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    background: 'var(--primary)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)'
                }}>
                    <Lock color="white" size={32} />
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Welcome Back</h1>
                <p style={{ color: 'var(--text-muted)' }}>로그인하여 서비스를 계속 이용하세요</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Username</label>
                    <div style={{ position: 'relative' }}>
                        <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text"
                            placeholder="사용자 아이디"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="input-control"
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-control"
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--error)',
                            color: 'var(--error)',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                        marginTop: '12px',
                        padding: '14px',
                        fontSize: '1rem',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Logging in...' : (
                        <>
                            <LogIn size={20} />
                            Sign In
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default LoginPage;
