"use client";

import React from 'react';
import { ImageIcon } from 'lucide-react';
import ImageExplorer from '../../../components/ImageExplorer';

export default function ImageExplorerPage() {
    return (
        <div className="page-container-full">
            {/* Header Section */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                            <ImageIcon size={20} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Board</span>
                        </div>
                        <h1 className="header-title" style={{ fontSize: '2.5rem', margin: 0 }}>Image Gallery</h1>
                    </div>
                </div>
            </div>

            <ImageExplorer />
        </div>
    );
}
