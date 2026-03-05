"use client";

import React from 'react';
import { User } from 'lucide-react';

export default function ProfilePage() {
    return (
        <div className="page-container" style={{ color: 'white' }}>
            <h1 className="header-title" style={{ fontSize: '2.5rem' }}>
                <User size={32} color="var(--primary)" />
                My Profile
            </h1>
            <div className="glass-panel" style={{ padding: '40px', marginTop: '30px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>This is your profile page. Information will be displayed here soon.</p>
            </div>
        </div>
    );
}
