"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Layers, Maximize } from 'lucide-react';

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

const MapPage = () => {
    const mapElement = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [useFallback, setUseFallback] = useState(false);

    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
    const isDefaultKey = GOOGLE_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

    useEffect(() => {
        if (isDefaultKey) {
            setUseFallback(true);
            return;
        }

        // 구글 지도 콜백 함수 정의
        window.initMap = () => {
            setMapLoaded(true);
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=initMap`;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
            setUseFallback(true);
        };

        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            delete (window as any).initMap;
        };
    }, [GOOGLE_API_KEY, isDefaultKey]);

    useEffect(() => {
        if (!mapLoaded || !mapElement.current || !window.google || useFallback) return;

        try {
            const location = { lat: 37.5665, lng: 126.9780 }; // 서울 중심
            const mapOptions = {
                center: location,
                zoom: 15,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true,
                streetViewControl: true,
                rotateControl: true,
                fullscreenControl: true,
                styles: [
                    {
                        "elementType": "geometry",
                        "stylers": [{ "color": "#242f3e" }]
                    },
                    {
                        "elementType": "labels.text.stroke",
                        "stylers": [{ "color": "#242f3e" }]
                    },
                    {
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#746855" }]
                    },
                    // ... 다크 모드 스타일 추가 가능
                ]
            };

            const map = new window.google.maps.Map(mapElement.current, mapOptions);

            new window.google.maps.Marker({
                position: location,
                map: map,
                title: "서울 시청"
            });
        } catch (e) {
            console.error("Google Map init error:", e);
            setUseFallback(true);
        }
    }, [mapLoaded, useFallback]);

    return (
        <div className="page-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="header-title" style={{ fontSize: '1.75rem', marginBottom: '4px' }}>지도 서비스 (Google Maps)</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>구글 지도를 통한 글로벌 위치 정보를 확인하세요.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn" style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                        <Navigation size={18} />
                        현재 위치
                    </button>
                    <button className="btn btn-primary" style={{ padding: '10px 16px', color: 'white' }}>
                        <MapPin size={18} />
                        장소 검색
                    </button>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    flex: 1,
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '24px',
                    border: '1px solid var(--glass-border)',
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: '600px'
                }}
            >
                {useFallback ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {/* OpenStreetMap Fallback */}
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            marginHeight={0}
                            marginWidth={0}
                            src="https://www.openstreetmap.org/export/embed.html?bbox=126.96%2C37.55%2C126.99%2C37.58&amp;layer=mapnik"
                            style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.8) contrast(1.2)', opacity: 0.6 }}
                            title="OpenStreetMap Fallback"
                        />

                        {/* Key Setting Guide Overlay */}
                        <div className="glass-panel animate-fade-in" style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            maxWidth: '360px',
                            padding: '24px',
                            zIndex: 100,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(66, 133, 244, 0.3)'
                        }}>
                            <h3 className="header-title" style={{ color: '#4285F4', marginBottom: '16px', fontSize: '1.1rem' }}>
                                <MapPin size={20} /> Google Maps 활성화 안내
                            </h3>
                            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'white', marginBottom: '16px' }}>
                                구글 지도 API 키가 설정되지 않았습니다. 실제 구글 지도를 사용하시려면 다음 과정을 수행해 주세요.
                            </p>
                            <ol style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', marginBottom: '20px', lineHeight: '1.8' }}>
                                <li><b>Google Cloud Platform</b> 프로젝트 생성</li>
                                <li><b>Maps JavaScript API</b> 활성화</li>
                                <li>사용자 인증 정보에서 <b>API 키</b> 생성</li>
                                <li><b>결제 계정</b> 연결 (필수)</li>
                                <li><b>.env.local</b> 파일에 키 입력</li>
                            </ol>
                            <div style={{ fontSize: '0.8rem', padding: '12px', background: 'rgba(66, 133, 244, 0.1)', borderRadius: '10px', color: '#4285F4', fontWeight: 700, border: '1px border-solid rgba(66, 133, 244, 0.3)', fontFamily: 'monospace' }}>
                                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=발급받은키
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {!mapLoaded && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                구글 지도를 로드하는 중...
                            </div>
                        )}
                        <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
                    </>
                )}

                {/* Floating Map Controls */}
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', display: 'flex', gap: '12px', zIndex: 10 }}>
                    <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px' }}><Layers size={18} /></button>
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px' }}><Maximize size={18} /></button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default MapPage;
