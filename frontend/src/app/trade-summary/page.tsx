"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    RefreshCw,
    Download,
    Layers,
    Clock,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Filter,
    HelpCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

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
    const [timeWindow, setTimeWindow] = useState('orderedAt'); // 'orderedAt', '10s', '30s', '1m', '5m', '10m', '30m', '1h', 'day', 'all'
    const [availableCoins, setAvailableCoins] = useState<string[]>([]);

    // Expanded accordion row state
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

    // Min total amount filter (optional)
    const [minAmount, setMinAmount] = useState<string>('');

    // Sort options
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'quantity' | 'count'>('date');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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

    // 2. Fetch trade histories (all filtered list for client grouping & fast instant window switching)
    const fetchTrades = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);
            if (coin) query.append('coin', coin);
            if (side !== '전체') query.append('side', side);

            // Fetch from backend raw-list
            const res = await fetch(`/api/trade-history/raw-list?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRawTrades(data || []);
            } else {
                // Fallback to paged API with large size if raw-list fails
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
    }, [startDate, endDate, coin, side]);

    // Parse numeric string safely
    const parseNumber = (val: string | number | undefined | null): number => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const num = parseFloat(String(val).replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // Parse date into epoch millis
    const parseDateMillis = (dateStr: string | undefined): number => {
        if (!dateStr) return 0;
        const cleaned = dateStr.replace(' ', 'T');
        const d = new Date(cleaned);
        const t = d.getTime();
        return isNaN(t) ? 0 : t;
    };

    // Client-side grouping algorithm
    const groupedTrades = useMemo(() => {
        if (!rawTrades || rawTrades.length === 0) return [];

        // Sort ascending by time for sequential window grouping
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
                // Aggregate everything for the same coin, market, side
                matched = groups.find(g => g.coin === coinName && g.market === market && g.side === itemSide) || null;
            } else if (timeWindow === 'day') {
                // Group by calendar day (YYYY-MM-DD)
                const dayStr = executedAt.slice(0, 10);
                matched = groups.find(g =>
                    g.coin === coinName &&
                    g.market === market &&
                    g.side === itemSide &&
                    g.firstExecutedAt.slice(0, 10) === dayStr
                ) || null;
            } else if (timeWindow === 'orderedAt') {
                // Exact orderedAt match (1 single buy/sell order split across orderbook)
                matched = groups.find(g =>
                    g.coin === coinName &&
                    g.market === market &&
                    g.side === itemSide &&
                    orderedAt &&
                    g.orderedAt === orderedAt
                ) || null;
            } else {
                // Window clustering: if consecutive execution within windowMillis
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
                    id: `group-${coinName}-${market}-${itemSide}-${executedAt}-${Math.random().toString(36).substr(2, 6)}`,
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

        // Calculate average price
        for (const g of groups) {
            if (g.totalQuantity > 0) {
                g.avgPrice = g.totalAmount / g.totalQuantity;
            }
        }

        // Apply min amount filter if set
        const minVal = parseFloat(minAmount);
        let result = groups;
        if (!isNaN(minVal) && minVal > 0) {
            result = result.filter(g => g.totalAmount >= minVal);
        }

        // Sort groups
        result.sort((a, b) => {
            let diff = 0;
            if (sortBy === 'date') {
                diff = a.lastExecutedAt.localeCompare(b.lastExecutedAt);
            } else if (sortBy === 'amount') {
                diff = a.totalAmount - b.totalAmount;
            } else if (sortBy === 'quantity') {
                diff = a.totalQuantity - b.totalQuantity;
            } else if (sortBy === 'count') {
                diff = a.tradeCount - b.tradeCount;
            }
            return sortOrder === 'desc' ? -diff : diff;
        });

        return result;
    }, [rawTrades, timeWindow, minAmount, sortBy, sortOrder]);

    // KPI Summary Calculations
    const stats = useMemo(() => {
        let buyAmount = 0;
        let buyQty = 0;
        let buyCount = 0;
        let buyBlocks = 0;

        let sellAmount = 0;
        let sellQty = 0;
        let sellCount = 0;
        let sellBlocks = 0;

        let totalFees = 0;

        for (const g of groupedTrades) {
            totalFees += g.totalFee;
            if (g.side === '매수') {
                buyAmount += g.totalAmount;
                buyQty += g.totalQuantity;
                buyCount += 1;
                buyBlocks += g.tradeCount;
            } else if (g.side === '매도') {
                sellAmount += g.totalAmount;
                sellQty += g.totalQuantity;
                sellCount += 1;
                sellBlocks += g.tradeCount;
            }
        }

        return {
            buyAmount,
            buyQty,
            buyCount,
            buyBlocks,
            sellAmount,
            sellQty,
            sellCount,
            sellBlocks,
            totalOrders: groupedTrades.length,
            totalRawBlocks: rawTrades.length,
            totalFees,
        };
    }, [groupedTrades, rawTrades]);

    const toggleRow = (id: string) => {
        setExpandedIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleAllRows = (expand: boolean) => {
        const next: Record<string, boolean> = {};
        if (expand) {
            groupedTrades.forEach(g => { next[g.id] = true; });
        }
        setExpandedIds(next);
    };

    // Format currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(val));
    };

    // Format quantity
    const formatQuantity = (val: number) => {
        return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 8 }).format(val);
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
            '합산체결건수(블록수)',
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
        <div className="page-container-full" style={{ paddingBottom: '60px' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Top Nav & Breadcrumb */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '6px' }}>
                            <Link href="/trade-history" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
                                <ArrowLeft size={16} /> 원본 거래내역으로 이동
                            </Link>
                            <span style={{ color: 'var(--text-muted)' }}>/</span>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Aggregated Summary
                            </span>
                        </div>
                        <h1 className="header-title" style={{ fontSize: '2.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Layers style={{ color: 'var(--primary)' }} size={32} />
                            주문 및 시간대별 합산 내역
                        </h1>
                        <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                            분할 체결(블록구매)된 내역들을 동일 주문 또는 시간 범위와 코인 단위로 묶어 실제 총 구매/매도 금액을 확인합니다.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link
                            href="/trade-history"
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.85rem', padding: '10px 16px' }}
                        >
                            <Clock size={16} /> 블록별 개별 내역 보기
                        </Link>
                        <button
                            onClick={exportCSV}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '10px 16px' }}
                            title="CSV 다운로드"
                        >
                            <Download size={16} /> CSV 저장
                        </button>
                        <button
                            onClick={fetchTrades}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '10px 18px' }}
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 새로고침
                        </button>
                    </div>
                </div>

                {/* Key Summary Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {/* Buy Card */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>총 매수 합계</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', marginTop: '6px' }}>
                                    {formatCurrency(stats.buyAmount)} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>KRW</span>
                                </div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                                <TrendingUp size={22} />
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>합산 주문 <b>{stats.buyCount}</b>건</span>
                            <span>(원본 블록 {stats.buyBlocks}개 체결)</span>
                        </div>
                    </div>

                    {/* Sell Card */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>총 매도 합계</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6', marginTop: '6px' }}>
                                    {formatCurrency(stats.sellAmount)} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>KRW</span>
                                </div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                                <TrendingDown size={22} />
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>합산 주문 <b>{stats.sellCount}</b>건</span>
                            <span>(원본 블록 {stats.sellBlocks}개 체결)</span>
                        </div>
                    </div>

                    {/* Aggregated compression ratio */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>블록 압축률</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', marginTop: '6px' }}>
                                    {stats.totalOrders} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {stats.totalRawBlocks}건</span>
                                </div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)' }}>
                                <Layers size={22} />
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {stats.totalRawBlocks > 0
                                ? `${stats.totalRawBlocks}개의 분할 블록이 ${stats.totalOrders}개 주문으로 집계됨`
                                : '데이터 없음'}
                        </div>
                    </div>

                    {/* Total Fee Card */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>총 수수료 합계</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
                                    {formatCurrency(stats.totalFees)} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>KRW</span>
                                </div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                                <DollarSign size={22} />
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            거래소에 지불된 총 수수료 금액
                        </div>
                    </div>
                </div>

                {/* Filter and Grouping Bar */}
                <div className="glass-panel" style={{ padding: '22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem' }}>
                            <Filter size={18} style={{ color: 'var(--primary)' }} />
                            합산 기준 및 검색 조건 설정
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            선택하신 시간 기준에 따라 즉시 합산되어 표에 반영됩니다.
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>

                        {/* Grouping Window (Key Feature!) */}
                        <div style={{ gridColumn: 'span 1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                ⏱️ 시간 묶음 기준 (Window)
                            </label>
                            <select
                                value={timeWindow}
                                onChange={(e) => setTimeWindow(e.target.value)}
                                className="input-control"
                                style={{ borderColor: 'var(--primary)', fontWeight: 600 }}
                            >
                                <option value="orderedAt" style={{ color: '#000' }}>⭐ 동일 주문시간 (1회 주문 묶음)</option>
                                <option value="10s" style={{ color: '#000' }}>10초 이내 연속 체결</option>
                                <option value="30s" style={{ color: '#000' }}>30초 이내 연속 체결</option>
                                <option value="1m" style={{ color: '#000' }}>1분 이내 연속 체결</option>
                                <option value="5m" style={{ color: '#000' }}>5분 이내 연속 체결</option>
                                <option value="10m" style={{ color: '#000' }}>10분 이내 연속 체결</option>
                                <option value="30m" style={{ color: '#000' }}>30분 이내 연속 체결</option>
                                <option value="1h" style={{ color: '#000' }}>1시간 이내 연속 체결</option>
                                <option value="day" style={{ color: '#000' }}>동일 일자(하루 단위)</option>
                                <option value="all" style={{ color: '#000' }}>선택 기간 전체 합산</option>
                            </select>
                        </div>

                        {/* Period Filter */}
                        <div style={{ gridColumn: 'span 1' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                조회 기간 (시작 ~ 종료)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input-control"
                                    style={{ flex: 1 }}
                                />
                                <span style={{ color: 'var(--text-muted)' }}>~</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input-control"
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>

                        {/* Coin Selector */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                코인 선택
                            </label>
                            <select
                                value={coin}
                                onChange={(e) => setCoin(e.target.value)}
                                className="input-control"
                            >
                                <option value="" style={{ color: '#000' }}>모든 코인 (All)</option>
                                {availableCoins.map((c) => (
                                    <option key={c} value={c} style={{ color: '#000' }}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Side Selector */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                구분 (매수/매도)
                            </label>
                            <select
                                value={side}
                                onChange={(e) => setSide(e.target.value)}
                                className="input-control"
                            >
                                <option value="전체" style={{ color: '#000' }}>전체</option>
                                <option value="매수" style={{ color: '#000' }}>매수만</option>
                                <option value="매도" style={{ color: '#000' }}>매도만</option>
                            </select>
                        </div>

                        {/* Min Amount Filter */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                최소 금액 필터 (원)
                            </label>
                            <input
                                type="number"
                                placeholder="예: 100000"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="input-control"
                            />
                        </div>

                    </div>

                    {/* Sorting & Expand controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>정렬:</span>
                            <button
                                onClick={() => {
                                    if (sortBy === 'date') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                                    else { setSortBy('date'); setSortOrder('desc'); }
                                }}
                                className={`tab-btn ${sortBy === 'date' ? 'active' : ''}`}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                                시간순 {sortBy === 'date' && (sortOrder === 'desc' ? '▼' : '▲')}
                            </button>
                            <button
                                onClick={() => {
                                    if (sortBy === 'amount') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                                    else { setSortBy('amount'); setSortOrder('desc'); }
                                }}
                                className={`tab-btn ${sortBy === 'amount' ? 'active' : ''}`}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                                금액순 {sortBy === 'amount' && (sortOrder === 'desc' ? '▼' : '▲')}
                            </button>
                            <button
                                onClick={() => {
                                    if (sortBy === 'count') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                                    else { setSortBy('count'); setSortOrder('desc'); }
                                }}
                                className={`tab-btn ${sortBy === 'count' ? 'active' : ''}`}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                                체결건수순 {sortBy === 'count' && (sortOrder === 'desc' ? '▼' : '▲')}
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => toggleAllRows(true)}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                            >
                                전체 블록 펼치기
                            </button>
                            <button
                                onClick={() => toggleAllRows(false)}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                            >
                                전체 접기
                            </button>
                        </div>
                    </div>
                </div>

                {/* Aggregated Result Table */}
                <div className="data-table-container">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                                    <th>주문 및 체결시간</th>
                                    <th>마켓 / 코인</th>
                                    <th>종류</th>
                                    <th style={{ textAlign: 'center' }}>체결 블록</th>
                                    <th style={{ textAlign: 'right' }}>총 체결수량 (갯수)</th>
                                    <th style={{ textAlign: 'right' }}>평균 체결단가</th>
                                    <th style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>총 거래금액</th>
                                    <th style={{ textAlign: 'right' }}>수수료 / 정산금액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                                <RefreshCw size={20} className="animate-spin" />
                                                데이터를 집계 분석 중입니다...
                                            </div>
                                        </td>
                                    </tr>
                                ) : groupedTrades.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            조건에 해당하는 거래 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    groupedTrades.map((g, index) => {
                                        const isExpanded = !!expandedIds[g.id];
                                        const isBuy = g.side === '매수';

                                        return (
                                            <React.Fragment key={g.id || index}>
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(index * 0.015, 0.3) }}
                                                    style={{
                                                        borderBottom: isExpanded ? 'none' : '1px solid var(--glass-border)',
                                                        backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.03)' : undefined,
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => toggleRow(g.id)}
                                                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                                                >
                                                    {/* Chevron expand icon */}
                                                    <td style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)' }}>
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </td>

                                                    {/* Execution and Ordered Time */}
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                                                            {g.firstExecutedAt === g.lastExecutedAt
                                                                ? g.firstExecutedAt
                                                                : `${g.firstExecutedAt} ~ ${g.lastExecutedAt.slice(11)}`}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            주문: {g.orderedAt || '-'}
                                                        </div>
                                                    </td>

                                                    {/* Coin and Market */}
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                                                            {g.coin}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', opacity: 0.9 }}>
                                                            {g.market}
                                                        </div>
                                                    </td>

                                                    {/* Side */}
                                                    <td style={{ padding: '16px' }}>
                                                        <span
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 700,
                                                                backgroundColor: isBuy ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                                color: isBuy ? '#ef4444' : '#3b82f6',
                                                                border: isBuy ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                                            }}
                                                        >
                                                            {g.side}
                                                        </span>
                                                    </td>

                                                    {/* Trade Count Badge */}
                                                    <td style={{ textAlign: 'center', padding: '16px' }}>
                                                        <span
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '12px',
                                                                fontSize: '0.82rem',
                                                                fontWeight: 600,
                                                                backgroundColor: g.tradeCount > 1 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                                color: g.tradeCount > 1 ? 'var(--primary)' : 'var(--text-muted)',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                            }}
                                                        >
                                                            {g.tradeCount}건 블록
                                                        </span>
                                                    </td>

                                                    {/* Total Quantity */}
                                                    <td style={{ textAlign: 'right', padding: '16px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                                            {formatQuantity(g.totalQuantity)}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {g.coin}
                                                        </div>
                                                    </td>

                                                    {/* Weighted Average Price */}
                                                    <td style={{ textAlign: 'right', padding: '16px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                            {formatCurrency(g.avgPrice)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>KRW</span>
                                                        </div>
                                                        {g.tradeCount > 1 && g.minPrice !== g.maxPrice && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {formatCurrency(g.minPrice)} ~ {formatCurrency(g.maxPrice)}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Total Amount (Main highlight!) */}
                                                    <td style={{ textAlign: 'right', padding: '16px' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: isBuy ? '#ef4444' : '#3b82f6' }}>
                                                            {formatCurrency(g.totalAmount)}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            KRW
                                                        </div>
                                                    </td>

                                                    {/* Fees and Settlement */}
                                                    <td style={{ textAlign: 'right', padding: '16px' }}>
                                                        <div style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                                                            정산: {formatCurrency(g.totalSettlementAmount)}
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                            수수료: {formatCurrency(g.totalFee)}
                                                        </div>
                                                    </td>
                                                </motion.tr>

                                                {/* Expanded Accordion: Details of Raw Split Blocks */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid var(--glass-border)' }}>
                                                            <td colSpan={9} style={{ padding: '0 24px 20px 48px' }}>
                                                                <div style={{
                                                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                                    borderRadius: '12px',
                                                                    border: '1px solid var(--glass-border)',
                                                                    padding: '16px',
                                                                    marginTop: '8px'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <Layers size={15} />
                                                                            체결 블록 상세 내역 ({g.trades.length}건)
                                                                        </div>
                                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                            * 거래소에서 1회 주문이 호가 잔량에 맞춰 분할 체결된 원본 단위입니다.
                                                                        </div>
                                                                    </div>

                                                                    <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                                                                        <thead>
                                                                            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                                                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>순번</th>
                                                                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>체결시간</th>
                                                                                <th style={{ textAlign: 'right', padding: '6px 8px' }}>체결단가 (KRW)</th>
                                                                                <th style={{ textAlign: 'right', padding: '6px 8px' }}>체결수량</th>
                                                                                <th style={{ textAlign: 'right', padding: '6px 8px' }}>체결금액 (KRW)</th>
                                                                                <th style={{ textAlign: 'right', padding: '6px 8px' }}>수수료</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {g.trades.map((t, tIdx) => (
                                                                                <tr key={t.id || tIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                                                                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>#{tIdx + 1}</td>
                                                                                    <td style={{ padding: '6px 8px' }}>{t.executedAt}</td>
                                                                                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(parseNumber(t.price))}</td>
                                                                                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatQuantity(parseNumber(t.quantity))}</td>
                                                                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(parseNumber(t.totalAmount))}</td>
                                                                                    <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(parseNumber(t.fee))}</td>
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
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

