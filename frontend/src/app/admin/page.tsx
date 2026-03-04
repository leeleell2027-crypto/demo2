"use client";

import React from 'react';
import { Shield, Users, Lock, Eye } from 'lucide-react';

export default function AdminManagementPage() {
    return (
        <div style={{ padding: '40px', color: 'white' }}>
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                    <Shield size={20} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Administration</span>
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Management</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
                            <Users size={24} color="#6366f1" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>User Roles</h2>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Super Admin</span>
                            <span style={{ fontWeight: 600, color: '#10b981' }}>Full Access</span>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Middle Admin</span>
                            <span style={{ fontWeight: 600, color: '#f59e0b' }}>Financial Only</span>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>General Admin</span>
                            <span style={{ fontWeight: 600, color: '#6366f1' }}>Asset Only</span>
                        </li>
                    </ul>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '12px' }}>
                            <Lock size={24} color="#ec4899" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Security Policy</h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Manage access tokens, password policies, and session timeouts for all administrator accounts.
                    </p>
                    <button style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '10px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        Configure Policy
                    </button>
                </div>
            </div>
        </div>
    );
}
