import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="page-container-full" style={{ color: 'white' }}>
            <h1 className="header-title" style={{ fontSize: '2.5rem' }}>
                <Settings size={32} color="var(--primary)" />
                General Settings
            </h1>
            <div className="glass-panel" style={{ padding: '40px', marginTop: '30px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>이곳에서 애플리케이션의 일반 설정을 관리할 수 있습니다.</p>

                <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ marginBottom: '10px' }}>테마 설정</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>다크 모드 및 컬러 테마를 변경합니다.</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ marginBottom: '10px' }}>알림 설정</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>이메일 및 브라우저 알림 활성화 여부를 선택합니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
