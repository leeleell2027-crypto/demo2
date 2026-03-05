"use client";

import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="page-container" style={{ color: 'white' }}>
            <h1 className="header-title" style={{ fontSize: '2.5rem' }}>
                <Settings size={32} color="var(--primary)" />
                General Settings
            </h1>
            <div className="glass-panel" style={{ padding: '40px', marginTop: '30px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Configure your application settings here.</p>
            </div>
        </div>
    );
}
