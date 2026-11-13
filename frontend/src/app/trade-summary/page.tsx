"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Table,
    BarChart2,
    RefreshCw,
    Layers,
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface TradeHistoryItem {
    id: number;
    executedAt: string;
    coin: string;
    market: string;
    side: string;
    quantity: string;
    price: string;
    totalAmount: string;
    fee: string;
    settlementAmount: string;
    orderedAt: string;
}

interface GroupedTrade {
    id: string;
    coin: string;
    market: string;
    side: string;
    orderedAt: string;
    firstExecutedAt: string;
    lastExecutedAt: string;
    tradeCount: number;
    totalQuantity: number;
    totalAmount: number;
    avgPrice: number;
    totalFee: number;
    totalSettlementAmount: number;
    minPrice: number;
    maxPrice: number;
    trades: TradeHistoryItem[];
}

export default function TradeSummaryPage() {
    const [rawTrades, setRawTrades] = useState<TradeHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [coin, setCoin] = useState('');
    const [side, setSide] = useState('전체');
    const [timeWindow, setTimeWindow] = useState('orderedAt');
    const [availableCoins, setAvailableCoins] = useState<string[]>([]);

    // Pagination
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(20);

    // Accordion row expansion state
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

    // 1. Fetch available coins
    useEffect(() => {
        const fetchCoins = async () => {
            try {
                const res = await fetch('/api/trade-history/coins');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableCoins(data || []);
                }
            } catch (err) {
                console.error('Error fetching coins:', err);
            }
        };
        fetchCoins();
    }, []);

    // 2. Fetch trade histories
    const fetchTrades = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);
            if (coin) query.append('coin', coin);
            if (side !== '전체') query.append('side', side);

            const res = await fetch(`/api/trade-history/raw-list?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRawTrades(data || []);
            } else {
                const fallbackQuery = new URLSearchParams({
                    page: '1',
                    size: '5000',
                });
                if (startDate) fallbackQuery.append('startDate', startDate);
                if (endDate) fallbackQuery.append('endDate', endDate);
                if (coin) fallbackQuery.append('coin', coin);
                if (side !== '전체') fallbackQuery.append('side', side);

                const fallbackRes = await fetch(`/api/trade-history?${fallbackQuery.toString()}`);
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    setRawTrades(fallbackData.content || []);
                }
            }
        } catch (error) {
            console.error('Error fetching trades:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrades();
        setPage(1);
    }, [startDate, endDate, coin, side]);

    // Numeric parsing helper
    const parseNumber = (val: string | number | undefined | null): number => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const num = parseFloat(String(val).replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // Date parsing helper
    const parseDateMillis = (dateStr: string | undefined): number => {
        if (!dateStr) return 0;
        const cleaned = dateStr.replace(' ', 'T');
        const d = new Date(cleaned);
        const t = d.getTime();
        return isNaN(t) ? 0 : t;
    };

    // Grouping & Aggregation Logic
    const groupedTrades = useMemo(() => {
        if (!rawTrades || rawTrades.length === 0) return [];

        const sorted = [...rawTrades].sort((a, b) => {
            const timeA = a.executedAt || a.orderedAt || '';
            const timeB = b.executedAt || b.orderedAt || '';
            return timeA.localeCompare(timeB);
        });

        const windowMillis = (() => {
            switch (timeWindow) {
                case '10s': return 10 * 1000;
                case '30s': return 30 * 1000;
                case '1m': return 60 * 1000;
                case '5m': return 5 * 60 * 1000;
                case '10m': return 10 * 60 * 1000;
                case '30m': return 30 * 60 * 1000;
                case '1h': return 60 * 60 * 1000;
                default: return 0;
            }
        })();

        const groups: GroupedTrade[] = [];

        for (const item of sorted) {
            const coinName = item.coin || '';
            const market = item.market || '';
            const itemSide = item.side || '';
            const orderedAt = (item.orderedAt || '').trim();
            const executedAt = (item.executedAt || orderedAt).trim();

            const qty = parseNumber(item.quantity);
            const price = parseNumber(item.price);
            let amount = parseNumber(item.totalAmount);
            if (amount <= 0 && qty > 0 && price > 0) {
                amount = qty * price;
            }
            const fee = parseNumber(item.fee);
            let settlement = parseNumber(item.settlementAmount);
            if (settlement <= 0 && amount > 0) {
                settlement = amount;
            }

            const execMillis = parseDateMillis(executedAt);
            let matched: GroupedTrade | null = null;

            if (timeWindow === 'all') {
                matched = groups.find(g => g.coin === coinName && g.market === market && g.side === itemSide) || null;
            } else if (timeWindow === 'day') {
                const dayStr = executedAt.slice(0, 10);
                matched = groups.find(g =>
                    g.coin === coinName &&
                    g.market === market &&
                    g.side === itemSide &&
                    g.firstExecutedAt.slice(0, 10) === dayStr
                ) || null;
            } else if (timeWindow === 'orderedAt') {
                matched = groups.find(g =>
                    g.coin === coinName &&
                    g.market === market &&
                    g.side === itemSide &&
                    orderedAt &&
                    g.orderedAt === orderedAt
                ) || null;
            } else {
                for (let i = groups.length - 1; i >= 0; i--) {
                    const g = groups[i];
                    if (g.coin === coinName && g.market === market && g.side === itemSide) {
                        const lastMillis = parseDateMillis(g.lastExecutedAt);
                        if (Math.abs(execMillis - lastMillis) <= windowMillis) {
                            matched = g;
                            break;
                        }
                    }
                }
            }

            if (matched) {
                matched.tradeCount += 1;
                matched.totalQuantity += qty;
                matched.totalAmount += amount;
                matched.totalFee += fee;
                matched.totalSettlementAmount += settlement;
                if (price > 0) {
                    matched.minPrice = Math.min(matched.minPrice, price);
                    matched.maxPrice = Math.max(matched.maxPrice, price);
                }
                if (executedAt > matched.lastExecutedAt) {
                    matched.lastExecutedAt = executedAt;
                }
                if (executedAt < matched.firstExecutedAt) {
                    matched.firstExecutedAt = executedAt;
                }
                matched.trades.push(item);
            } else {
                groups.push({
                    id: `group-${coinName}-${market}-${itemSide}-${executedAt}-${groups.length}`,
                    coin: coinName,
                    market: market,
                    side: itemSide,
                    orderedAt: orderedAt || executedAt,
                    firstExecutedAt: executedAt,
                    lastExecutedAt: executedAt,
                    tradeCount: 1,
                    totalQuantity: qty,
                    totalAmount: amount,
                    avgPrice: price,
                    totalFee: fee,
                    totalSettlementAmount: settlement,
                    minPrice: price,
                    maxPrice: price,
                    trades: [item],
                });
            }
        }

        for (const g of groups) {
            if (g.totalQuantity > 0) {
                g.avgPrice = g.totalAmount / g.totalQuantity;
            }
        }

        // Sort descending by latest execution time
        groups.sort((a, b) => b.lastExecutedAt.localeCompare(a.lastExecutedAt));
        return groups;
    }, [rawTrades, timeWindow]);

    // Overall KPI Summary
    const stats = useMemo(() => {
        let buyAmount = 0;
        let buyBlocks = 0;
        let buyCount = 0;

        let sellAmount = 0;
        let sellBlocks = 0;
        let sellCount = 0;

        let totalFees = 0;

        for (const g of groupedTrades) {
            totalFees += g.totalFee;
            if (g.side === '매수' || g.side?.toLowerCase().includes('buy')) {
                buyAmount += g.totalAmount;
                buyCount += 1;
                buyBlocks += g.tradeCount;
            } else {
                sellAmount += g.totalAmount;
                sellCount += 1;
                sellBlocks += g.tradeCount;
            }
        }

        return {
            buyAmount,
            buyCount,
            buyBlocks,
            sellAmount,
            sellCount,
            sellBlocks,
            totalOrders: groupedTrades.length,
            totalRawBlocks: rawTrades.length,
            totalFees,
        };
    }, [groupedTrades, rawTrades]);

    // Paged slice for current page
    const totalElements = groupedTrades.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const pagedTrades = useMemo(() => {
        const start = (page - 1) * size;
        return groupedTrades.slice(start, start + size);
    }, [groupedTrades, page, size]);

    // Page totals for tfoot
    const pageTotals = useMemo(() => {
        let settlementSum = 0;
        let feeSum = 0;
        let amountSum = 0;
        for (const t of pagedTrades) {
            settlementSum += t.totalSettlementAmount;
            feeSum += t.totalFee;
            amountSum += t.totalAmount;
        }
        return { settlementSum, feeSum, amountSum };
    }, [pagedTrades]);

    const toggleRow = (id: string) => {
        setExpandedIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Formatters
    const formatCurrency = (val: number | string | undefined | null) => {
        if (val === undefined || val === null || val === '') return '0';
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
        if (isNaN(num)) return String(val);
        return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(num));
    };

    const formatQuantity = (val: number | string | undefined | null) => {
        if (val === undefined || val === null || val === '') return '0';
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
        if (isNaN(num)) return String(val);
        return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 8 }).format(num);
    };

    // Export CSV
    const exportCSV = () => {
        if (groupedTrades.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        const headers = [
            '주문시간',
            '체결시작시간',
            '체결완료시간',
            '코인',
            '마켓',
            '종류',
            '체결블록수',
            '총체결수량',
            '평균체결단가',
            '총거래금액',
            '총수수료',
            '총정산금액'
        ];

        const rows = groupedTrades.map(g => [
            `"${g.orderedAt}"`,
            `"${g.firstExecutedAt}"`,
            `"${g.lastExecutedAt}"`,
            `"${g.coin}"`,
            `"${g.market}"`,
            `"${g.side}"`,
            g.tradeCount,
            g.totalQuantity,
            Math.round(g.avgPrice),
            Math.round(g.totalAmount),
            Math.round(g.totalFee),
            Math.round(g.totalSettlementAmount)
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `trade_summary_${timeWindow}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-container-full">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Header Section (Exactly matching trade-history design) */}
                <div style={{ marginBottom: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                                    <Table size={20} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Financial</span>
                                </div>
                                <h1 className="header-title" style={{ fontSize: '2.5rem', margin: 0 }}>Trade History</h1>
                            </div>
                        </div>

                        {/* Top Navigation Tabs & Actions */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '12px' }}>
                                <Link
                                    href="/trade-history"
                                    className="tab-btn"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Table size={16} /> Table
                                </Link>
                                <Link
                                    href="/trade-history?view=chart"
                                    className="tab-btn"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <BarChart2 size={16} /> Stats
                                </Link>
                                <Link
                                    href="/trade-history?view=btc"
                                    className="tab-btn"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <RefreshCw size={16} /> BTC
                                </Link>
                                <button
                                    className="tab-btn active"
                                    style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Layers size={16} /> 주문/시간별 합산
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={exportCSV}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.85rem' }}
                                    title="CSV 엑셀 파일 다운로드"
                                >
                                    <Download size={16} /> CSV
                                </button>
                                <button
                                    onClick={fetchTrades}
                                    disabled={loading}
                                    className="btn btn-primary"
                                    style={{ color: '#ffffff' }}
                                    title="새로고침"
                                >
                                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Banner (Matching exactly with Trade History banner) */}
                    <div style={{
                        padding: '14px 20px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>💡</span>
                            <div>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>분할 체결(블록구매) 내역을 동일 주문 또는 특정 시간 범위와 코인 단위로 합산하여 조회합니다.</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>100만 원 매수 시 나뉘어 체결된 건들의 총 매수 금액과 수량을 확인할 수 있습니다.</span>
                            </div>
                        </div>
                        <Link
                            href="/trade-history"
                            className="btn btn-primary"
                            style={{ color: '#fff', fontSize: '0.85rem', padding: '8px 16px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                            블록별 개별 내역 보기 →
                        </Link>
                    </div>

                    {/* KPI Summary Cards (Light Theme Clean Style) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        {/* Buy Total */}
                        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>총 매수 합계</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>
                                        {formatCurrency(stats.buyAmount)} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>KRW</span>
                                    </div>
                                </div>
                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                합산 주문 <b>{stats.buyCount}</b>건 (체결 블록 {stats.buyBlocks}개)
                            </div>
                        </div>

                        {/* Sell Total */}
                        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>총 매도 합계</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>
                                        {formatCurrency(stats.sellAmount)} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>KRW</span>
                                    </div>
                                </div>
                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                    <TrendingDown size={20} />
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                합산 주문 <b>{stats.sellCount}</b>건 (체결 블록 {stats.sellBlocks}개)
                            </div>
                        </div>

                        {/* Compression Ratio */}
                        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>블록 압축률</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '6px' }}>
                                        {stats.totalOrders} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {stats.totalRawBlocks}건</span>
                                    </div>
                                </div>
                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 77, 77, 0.1)', color: 'var(--primary)' }}>
                                    <Layers size={20} />
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {stats.totalRawBlocks > 0
                                    ? `${stats.totalRawBlocks}개 블록이 ${stats.totalOrders}개 주문으로 집계됨`
                                    : '데이터 없음'}
                            </div>
                        </div>

                        {/* Total Fees */}
                        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>총 수수료</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                                        {formatCurrency(stats.totalFees)} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>KRW</span>
                                    </div>
                                </div>
                                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.04)', color: 'var(--text-muted)' }}>
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                전체 거래에 부과된 거래소 수수료
                            </div>
                        </div>
                    </div>

                    {/* Filter Section (Row 2, Matching trade-history Exactly) */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', borderRadius: '12px' }}>
                        {/* PERIOD */}
                        <div style={{ flex: '1', minWidth: '280px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                PERIOD
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input-control"
                                />
                                <span style={{ color: 'var(--text-muted)' }}>~</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input-control"
                                />
                            </div>
                        </div>

                        {/* TIME WINDOW (Grouping Criterion) */}
                        <div style={{ minWidth: '210px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                TIME WINDOW (시간 기준)
                            </label>
                            <select
                                value={timeWindow}
                                onChange={(e) => setTimeWindow(e.target.value)}
                                className="input-control"
                                style={{ fontWeight: 600 }}
                            >
                                <option value="orderedAt" style={{ color: 'black' }}>⭐ 동일 주문시간 (Ordered At)</option>
                                <option value="10s" style={{ color: 'black' }}>10초 이내 연속 체결</option>
                                <option value="30s" style={{ color: 'black' }}>30초 이내 연속 체결</option>
                                <option value="1m" style={{ color: 'black' }}>1분 이내 연속 체결</option>
                                <option value="5m" style={{ color: 'black' }}>5분 이내 연속 체결</option>
                                <option value="10m" style={{ color: 'black' }}>10분 이내 연속 체결</option>
                                <option value="30m" style={{ color: 'black' }}>30분 이내 연속 체결</option>
                                <option value="1h" style={{ color: 'black' }}>1시간 이내 연속 체결</option>
                                <option value="day" style={{ color: 'black' }}>동일 일자 (하루 단위)</option>
                                <option value="all" style={{ color: 'black' }}>조회 기간 전체 합산</option>
                            </select>
                        </div>

                        {/* COIN */}
                        <div style={{ minWidth: '130px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                COIN
                            </label>
                            <select
                                value={coin}
                                onChange={(e) => { setCoin(e.target.value); setPage(1); }}
                                className="input-control"
                            >
                                <option value="" style={{ color: 'black' }}>All Coins</option>
                                {availableCoins.map((c) => (
                                    <option key={c} value={c} style={{ color: 'black' }}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* SIDE */}
                        <div style={{ minWidth: '110px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                SIDE
                            </label>
                            <select
                                value={side}
                                onChange={(e) => { setSide(e.target.value); setPage(1); }}
                                className="input-control"
                            >
                                <option value="전체" style={{ color: 'black' }}>All</option>
                                <option value="매수" style={{ color: 'black' }}>Buy</option>
                                <option value="매도" style={{ color: 'black' }}>Sell</option>
                            </select>
                        </div>

                        {/* ROWS */}
                        <div style={{ minWidth: '110px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                ROWS
                            </label>
                            <select
                                value={size}
                                onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
                                className="input-control"
                            >
                                <option value={20} style={{ color: 'black' }}>20 rows</option>
                                <option value={50} style={{ color: 'black' }}>50 rows</option>
                                <option value={100} style={{ color: 'black' }}>100 rows</option>
                            </select>
                        </div>

                        {/* SEARCH BUTTON */}
                        <button
                            onClick={() => {
                                setPage(1);
                                fetchTrades();
                            }}
                            className="btn btn-primary"
                            style={{ color: '#ffffff', padding: '10px 32px', fontWeight: 'bold' }}
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Content Section (Table exactly matching trade-history) */}
                <div className="data-table-container">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '36px' }}></th>
                                    <th>체결시간</th>
                                    <th>마켓/코인</th>
                                    <th>종류</th>
                                    <th style={{ textAlign: 'right' }}>수량/단가</th>
                                    <th style={{ textAlign: 'right' }}>정산금액/수수료</th>
                                    <th style={{ textAlign: 'right' }}>거래금액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            로딩 중...
                                        </td>
                                    </tr>
                                ) : pagedTrades.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            등록된 거래 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    pagedTrades.map((t, i) => {
                                        const isExpanded = !!expandedIds[t.id];
                                        const isBuy = t.side === '매수' || t.side?.toLowerCase().includes('buy');

                                        return (
                                            <React.Fragment key={t.id || i}>
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.01 }}
                                                    style={{
                                                        borderBottom: isExpanded ? 'none' : '1px solid var(--glass-border)',
                                                        backgroundColor: isExpanded ? '#fafafa' : undefined,
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => toggleRow(t.id)}
                                                    whileHover={{ backgroundColor: '#f9fafb' }}
                                                >
                                                    {/* Accordion Toggle Indicator */}
                                                    <td style={{ padding: '16px 8px 16px 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                        {t.tradeCount > 1 && (
                                                            isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                                        )}
                                                    </td>

                                                    {/* Execution Time & Ordered Time */}
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontWeight: '500' }}>
                                                            {t.firstExecutedAt === t.lastExecutedAt
                                                                ? t.firstExecutedAt
                                                                : `${t.firstExecutedAt} ~ ${t.lastExecutedAt.slice(11)}`}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            주문: {t.orderedAt || '-'}
                                                        </div>
                                                    </td>

                                                    {/* Market / Coin */}
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{t.coin}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', opacity: 0.8 }}>{t.market}</div>
                                                    </td>

                                                    {/* Side & Block Count */}
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 'bold',
                                                                backgroundColor: isBuy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                color: isBuy ? '#10b981' : '#ef4444'
                                                            }}>
                                                                {t.side}
                                                            </span>
                                                            {t.tradeCount > 1 && (
                                                                <span style={{
                                                                    fontSize: '0.72rem',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    background: '#f4f4f5',
                                                                    color: 'var(--text-muted)',
                                                                    fontWeight: 600
                                                                }}>
                                                                    {t.tradeCount}건 체결
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Quantity / Avg Price */}
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <div style={{ fontWeight: '500' }}>{formatQuantity(t.totalQuantity)}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            @ {formatCurrency(t.avgPrice)}
                                                        </div>
                                                    </td>

                                                    {/* Settlement / Fee */}
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <div style={{ fontWeight: '500' }}>{formatCurrency(t.totalSettlementAmount)}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#f59e0b' }}>
                                                            수수료: {formatCurrency(t.totalFee)}
                                                        </div>
                                                    </td>

                                                    {/* Total Amount (Main Focus!) */}
                                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: isBuy ? '#ef4444' : '#3b82f6', fontSize: '1.05rem' }}>
                                                        {formatCurrency(t.totalAmount)}
                                                    </td>
                                                </motion.tr>

                                                {/* Expanded Details Sub-Table */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--glass-border)' }}>
                                                            <td colSpan={7} style={{ padding: '0 24px 20px 48px' }}>
                                                                <div style={{
                                                                    background: '#ffffff',
                                                                    border: '1px solid var(--glass-border)',
                                                                    borderRadius: '8px',
                                                                    padding: '16px',
                                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <Layers size={14} style={{ color: 'var(--primary)' }} />
                                                                            분할 체결 블록 상세 ({t.trades.length}건)
                                                                        </div>
                                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                            * 거래소에서 1회 주문이 호가별로 나뉘어 체결된 원본 내역입니다.
                                                                        </div>
                                                                    </div>

                                                                    <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                                                                        <thead>
                                                                            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)', background: '#f4f4f5' }}>
                                                                                <th style={{ textAlign: 'left', padding: '8px 10px' }}>순번</th>
                                                                                <th style={{ textAlign: 'left', padding: '8px 10px' }}>체결시간</th>
                                                                                <th style={{ textAlign: 'right', padding: '8px 10px' }}>체결단가 (KRW)</th>
                                                                                <th style={{ textAlign: 'right', padding: '8px 10px' }}>체결수량</th>
                                                                                <th style={{ textAlign: 'right', padding: '8px 10px' }}>체결금액 (KRW)</th>
                                                                                <th style={{ textAlign: 'right', padding: '8px 10px' }}>수수료</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {t.trades.map((item, idx) => (
                                                                                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f4f4f5' }}>
                                                                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>#{idx + 1}</td>
                                                                                    <td style={{ padding: '8px 10px' }}>{item.executedAt}</td>
                                                                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                                                                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatQuantity(item.quantity)}</td>
                                                                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.totalAmount)}</td>
                                                                                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f59e0b' }}>{formatCurrency(item.fee)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>

                            {/* Table Footer (Matching exactly with trade-history tfoot) */}
                            {!loading && pagedTrades.length > 0 && (
                                <tfoot style={{ background: '#fafafa', borderTop: '2px solid var(--glass-border)' }}>
                                    <tr style={{ borderBottom: 'none' }}>
                                        <td colSpan={4} style={{ padding: '20px 16px', fontWeight: 'bold', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            페이지 합계 (Page Totals)
                                        </td>
                                        <td style={{ padding: '20px 16px', textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1rem' }}>
                                                {formatQuantity(pagedTrades.reduce((sum, t) => sum + t.totalQuantity, 0))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 16px', textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>
                                                {formatCurrency(pageTotals.settlementSum)}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '4px' }}>
                                                수수료: {formatCurrency(pageTotals.feeSum)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>
                                            {formatCurrency(pageTotals.amountSum)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Pagination Controls (Matching trade-history Exactly) */}
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalCount={totalElements}
                        onPageChange={setPage}
                        style={{ borderTop: '1px solid var(--glass-border)', background: '#ffffff', padding: '24px 0 24px' }}
                    />
                </div>

            </div>
        </div>
    );
}
