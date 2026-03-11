"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Shield, Camera, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImage || null);
    
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email || '');
            setPreviewUrl(user.profileImage || null);
        }
    }, [user]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('saving');
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            if (imageFile) {
                formData.append('profileImage', imageFile);
            }

            const response = await fetch('/auth/update-profile', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to update profile');
            }
        } catch (error: any) {
            console.error('Update failed:', error);
            setStatus('error');
            setErrorMsg(error.message || 'An unexpected error occurred');
        }
    };

    if (!user) return null;

    return (
        <div className="page-container-full">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-content-wrapper"
            >
                <div className="profile-header-section">
                    <h1 className="header-title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                        <User size={32} color="var(--primary)" />
                        계정 설정
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        관리자 프로필 정보를 관리하고 업데이트하세요.
                    </p>
                </div>

                <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '40px' }}>
                    
                    {/* Profile Card */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="glass-panel profile-sidebar-card" 
                        style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <div className="profile-avatar-wrapper" style={{ position: 'relative', marginBottom: '24px' }}>
                            <div 
                                className="profile-main-avatar"
                                style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '50%',
                                    border: '4px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                }}
                                onClick={handleImageClick}
                            >
                                {!previewUrl && <User size={80} color="var(--text-muted)" opacity={0.3} />}
                            </div>
                            <button 
                                onClick={handleImageClick}
                                className="avatar-edit-btn"
                                style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    background: 'var(--primary)',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    border: '4px solid var(--surface)',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                <Camera size={18} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageChange} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                            />
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{user.name}</h2>
                        <span className="badge badge-primary" style={{ marginBottom: '16px' }}>{user.role}</span>
                        
                        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
                        
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Mail size={16} />
                                <span>{user.email || '이메일 정보 없음'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Shield size={16} />
                                <span>{user.username}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form Section */}
                    <div className="glass-panel" style={{ padding: '40px' }}>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="form-group-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        이름
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-control" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="이름 입력"
                                        style={{ width: '100%', padding: '12px 16px' }}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        아이디 (수정 불가)
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-control" 
                                        value={user.username}
                                        disabled
                                        style={{ width: '100%', padding: '12px 16px', opacity: 0.6, cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    이메일 주소
                                </label>
                                <input 
                                    type="email" 
                                    className="input-control" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    style={{ width: '100%', padding: '12px 16px' }}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    권한
                                </label>
                                <input 
                                    type="text" 
                                    className="input-control" 
                                    value={user.role}
                                    disabled
                                    style={{ width: '100%', padding: '12px 16px', opacity: 0.6, cursor: 'not-allowed' }}
                                />
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                                <AnimatePresence>
                                    {status === 'success' && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                                        >
                                            <CheckCircle2 size={18} />
                                            프로필이 성공적으로 업데이트되었습니다.
                                        </motion.div>
                                    )}
                                    {status === 'error' && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                                        >
                                            <AlertCircle size={18} />
                                            {errorMsg}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={status === 'saving'}
                                    style={{ 
                                        padding: '12px 24px', 
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 700
                                    }}
                                >
                                    {status === 'saving' ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>

            <style jsx>{`
                .profile-content-wrapper {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 40px 20px;
                }
                .profile-main-avatar:hover {
                    box-shadow: 0 0 30px var(--primary-glow);
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
