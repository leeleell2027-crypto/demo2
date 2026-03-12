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
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                            <Coins size={20} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Financial</span>
                        </div>
                        <h1 className="header-title" style={{ fontSize: '2.5rem', margin: 0 }}>거래량 TOP 5 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(KRW)</span></h1>
                    </div>

                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="btn btn-secondary"
                        style={{
                            padding: '10px 18px',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    >
                        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                        {isFetching ? '갱신 중...' : '데이터 갱신'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
                {data?.map((coin, index) => (
                    <motion.div
                        key={coin.market}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            background: '#ffffff',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0',
                            padding: '24px',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(200px, 1.5fr) 1.2fr 1.2fr 2fr',
                            alignItems: 'center',
                            gap: '24px',
                            transition: 'background 0.2s',
                            cursor: 'default',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
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
                                background: 'rgba(255, 77, 71, 0.1)',
                                borderRadius: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)',
                                fontSize: '1.25rem',
                                fontWeight: 800
                            }}>
                                {index + 1}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{coin.koreanName}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>{coin.market.split('-')[1]}</p>
                            </div>
                        </div>

                        {/* Price Section */}
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Price</p>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                ₩ {formatPrice(coin.trade_price)}
                            </div>
                        </div>

                        {/* Change Rate */}
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>24h Change</p>
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
                                <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>24h Volume</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>₩ {formatVolume(coin.acc_trade_price_24h)}</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '0', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(coin.acc_trade_price_24h / maxVolume) * 100}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, var(--primary), #ec4899)',
                                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <footer style={{ marginTop: '32px', padding: '16px', borderRadius: '0', background: '#ffffff', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <BarChart3 size={16} />
                <span>데이터는 30초마다 자동으로 갱신됩니다. 업비트 오픈 API 정보를 바탕으로 제공됩니다.</span>
            </footer>
        </div>
    );
}
