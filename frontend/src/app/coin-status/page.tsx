"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    RefreshCw,
    ArrowUpRight,
    Coins
} from 'lucide-react';

interface TickerData {
    market: string;
    trade_price: number;
    acc_trade_price_24h: number;
    signed_change_rate: number;
    signed_change_price: number;
    high_price: number;
    low_price: number;
    koreanName: string;
}

const fetchTop5 = async (): Promise<TickerData[]> => {
    const res = await fetch('/api/coin/top5');
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

export default function CoinStatusPage() {
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['top5Coins'],
        queryFn: fetchTop5,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const formatPrice = (price: number | undefined | null) => {
        if (price === undefined || price === null || isNaN(price)) return '0';
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    const formatVolume = (volume: number | undefined | null) => {
        if (volume === undefined || volume === null || volume === 0) return '0';

        const units = ['', '만', '억', '조'];
        let res = volume;
        let unitIdx = 0;

        while (res >= 10000 && unitIdx < units.length - 1) {
            res /= 10000;
            unitIdx++;
        }

        // Use 1 decimal place for values >= 10, 2 for < 10, unless it's a whole number
        const formattedRes = res.toLocaleString('ko-KR', {
            maximumFractionDigits: res >= 100 ? 0 : 1
        });

        return `${formattedRes}${units[unitIdx]}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-red-400">
                <p>데이터를 불러오는데 실패했습니다.</p>
                <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-white">다시 시도</button>
            </div>
        );
    }

    const maxVolume = data ? Math.max(...data.map(d => d.acc_trade_price_24h)) : 1;

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '8px' }}>
                        <Coins size={20} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Overview</span>
                    </div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                        거래량 TOP 5 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(KRW)</span>
                    </h1>
                </div>

                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}
                >
                    <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                    {isFetching ? '갱신 중...' : '데이터 갱신'}
                </button>
            </header>

            <div style={{ display: 'grid', gap: '16px' }}>
                {data?.map((coin, index) => (
                    <motion.div
                        key={coin.market}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '20px',
                            padding: '24px',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(200px, 1.5fr) 1.2fr 1.2fr 2fr',
                            alignItems: 'center',
                            gap: '24px',
                            transition: 'transform 0.2s, border-color 0.2s',
                            cursor: 'default',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        {/* Rank Badge */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'transparent'
                        }} />

                        {/* Name & Symbol */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#6366f1',
                                fontSize: '1.25rem',
                                fontWeight: 800
                            }}>
                                {index + 1}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{coin.koreanName}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0', fontWeight: 600 }}>{coin.market.split('-')[1]}</p>
                            </div>
                        </div>

                        {/* Price Section */}
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Price</p>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                ₩ {formatPrice(coin.trade_price)}
                            </div>
                        </div>

                        {/* Change Rate */}
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>24h Change</p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: coin.signed_change_rate > 0 ? '#10b981' : coin.signed_change_rate < 0 ? '#ef4444' : 'white',
                                fontWeight: 700,
                                fontSize: '1.1rem'
                            }}>
                                {coin.signed_change_rate > 0 ? <TrendingUp size={18} /> : coin.signed_change_rate < 0 ? <TrendingDown size={18} /> : null}
                                {(coin.signed_change_rate * 100).toFixed(2)}%
                                <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 500 }}>
                                    ({coin.signed_change_price > 0 ? '+' : ''}{formatPrice(coin.signed_change_price)})
                                </span>
                            </div>
                        </div>

                        {/* Volume Bar */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>24h Volume</span>
                                <span style={{ fontWeight: 700 }}>₩ {formatVolume(coin.acc_trade_price_24h)}</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(coin.acc_trade_price_24h / maxVolume) * 100}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <footer style={{ marginTop: '32px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                <BarChart3 size={16} />
                <span>데이터는 30초마다 자동으로 갱신됩니다. 업비트 오픈 API 정보를 바탕으로 제공됩니다.</span>
            </footer>
        </div>
    );
}
