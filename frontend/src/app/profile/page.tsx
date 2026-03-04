"use client";

import React from 'react';
import { User } from 'lucide-react';

export default function ProfilePage() {
    return (
        <div style={{ padding: '40px', color: 'white' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>
                <User size={32} color="var(--primary)" />
                My Profile
            </h1>
            <div className="glass-card" style={{ padding: '40px', marginTop: '30px' }}>
                <p style={{ color: 'var(--text-muted)' }}>This is your profile page. Information will be displayed here soon.</p>
            </div>
        </div>
    );
}
