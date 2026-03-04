"use client";

import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div style={{ padding: '40px', color: 'white' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Settings size={32} color="var(--primary)" />
                General Settings
            </h1>
            <div className="glass-card" style={{ padding: '40px', marginTop: '30px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Configure your application settings here.</p>
            </div>
        </div>
    );
}
