"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Search, ArrowLeft, Download, Filter, Calendar, MapPin, ReceiptText, ChevronLeft, ChevronRight, LayoutGrid, Table, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Transaction {
    date: string;
    time: string;
    card: string;
    merchant: string;
    amountKrw: string;
    amountUsd: string;
    paymentMethod: string;
    merchantInfo: string;
    discount: string;
    points: string;
    status: string;
    dueDate: string;
    approvalNo: string;
}


// Global cache to prevent duplicate fetches across component remounts (Strict Mode)
const apiCache: { [key: string]: { promise?: Promise<any>, data?: any, timestamp?: number } } = {};

const fetchWithCache = async (url: string, signal?: AbortSignal) => {
    const now = Date.now();
    const cached = apiCache[url];

    // 1. If we have fresh data (less than 5 seconds old), return it immediately
    if (cached?.data && (now - (cached.timestamp || 0) < 5000)) {
        return cached.data;
    }

    // 2. If a request is already in flight, wait for it
    if (cached?.promise) {
        return cached.promise;
    }

    // 3. Start a new request
    const promise = (async () => {
        try {
            const response = await fetch(url, { signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            apiCache[url] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            delete apiCache[url];
            throw error;
        }
    })();

    apiCache[url] = { promise };
    return promise;
};

const TransactionsContent = () => {
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchMerchant, setSearchMerchant] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'chart'>('table');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [holidays, setHolidays] = useState<any[]>([]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [pageSize] = useState(10);
    const [totalSearchAmount, setTotalSearchAmount] = useState(0);
    const [totalSearchPoints, setTotalSearchPoints] = useState(0);

    // Date range search state
    const [startDate, setStartDate] = useState(() => {
        if (dateParam) return dateParam;
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        if (dateParam) return dateParam;
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    });
    const [dateRangeType, setDateRangeType] = useState(dateParam ? 'custom' : 'month'); // today, week, month, custom
    const [calendarSearchMerchant, setCalendarSearchMerchant] = useState('');
    const [chartSearchMerchant, setChartSearchMerchant] = useState('');

    // Refs for optimization
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastInitiatedParams = useRef("");
    const lastCompletedParams = useRef("");

    // Removed the initial mount useEffect that was setting dates,
    // as it's now handled by the initial state logic above to prevent duplicate API calls.

    const handleDateRangeChange = (type: string) => {
        setDateRangeType(type);
        const today = new Date();
        let start = new Date();

        if (type === 'today') {
            // No change to start (already today)
        } else if (type === 'week') {
            start.setDate(today.getDate() - 7);
        } else if (type === 'month') {
            start.setDate(1);
        }

        const formatDate = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        if (type !== 'custom') {
            setStartDate(formatDate(start));
            setEndDate(formatDate(today));
        }
    };

    // Date param is now handled in the state initializers to avoid double-fetching.

    useEffect(() => {
        // Prevent empty date searches
        if (!startDate || !endDate) return;

        const currentParams = JSON.stringify({ page, pageSize, viewMode, searchMerchant, startDate, endDate });

        // Debounce: Wait for 100ms before initiating the fetch
        const debounceTimer = setTimeout(() => {
            // Already handled by fetchWithCache internally, but we can still use lastInitiatedParams
            // to avoid starting the debounce logic if exactly the same fetch is already planned.
            if (lastInitiatedParams.current === currentParams) return;

            const controller = new AbortController();
            abortControllerRef.current = controller;
            lastInitiatedParams.current = currentParams;

            const fetchTransactions = async (signal: AbortSignal) => {
                setLoading(true);
                try {
                    if (viewMode === 'calendar' || viewMode === 'chart') {
                        // Fetch Transactions and Holidays in parallel using cache
                        const [transactionData, holidayData] = await Promise.all([
                            fetchWithCache('/api/transactions', signal),
                            fetchWithCache('/api/holidays/all', signal)
                        ]);

                        if (signal.aborted) return;

                        setTransactions(transactionData);
                        setHolidays(holidayData || []);
                        setTotal(transactionData.length);
                        setTotalPages(1);
                    } else {
                        const url = `/api/transactions/paged?page=${page}&size=${pageSize}&searchMerchant=${encodeURIComponent(searchMerchant)}&startDate=${startDate}&endDate=${endDate}`;
                        const data = await fetchWithCache(url, signal);

                        if (signal.aborted) return;

                        setTransactions(data.transactions);
                        setTotal(data.total);
                        setTotalPages(data.totalPages);
                        if (data.searchStats) {
                            setTotalSearchAmount(data.searchStats.sumAmount || 0);
                            setTotalSearchPoints(data.searchStats.sumPoints || 0);
                        }
                    }
                    lastCompletedParams.current = currentParams;
                    setLoading(false);
                } catch (err: any) {
                    if (err.name === 'AbortError') return;
                    console.error('Error fetching transactions:', err);
                    setError('Failed to load transaction data. Please make sure the backend is running.');
                    setLoading(false);
                } finally {
                    if (lastInitiatedParams.current === currentParams) {
                        lastInitiatedParams.current = "";
                    }
                }
            };

            fetchTransactions(controller.signal);
        }, 100);

        return () => {
            clearTimeout(debounceTimer);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (lastInitiatedParams.current === currentParams) {
                lastInitiatedParams.current = "";
            }
        };
    }, [page, pageSize, viewMode, searchMerchant, startDate, endDate]);

    const allSearchFilteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Use specific merchant search based on view mode
            const merchantToMatch = viewMode === 'calendar' ? calendarSearchMerchant : chartSearchMerchant;
            const merchantMatch = !merchantToMatch || (t.merchant || '').toLowerCase().includes(merchantToMatch.toLowerCase());
            return merchantMatch;
        });
    }, [transactions, calendarSearchMerchant, chartSearchMerchant, viewMode]);

    const filteredTransactions = useMemo(() => {
        if (viewMode === 'calendar' || viewMode === 'chart') {
            return allSearchFilteredTransactions.filter(t => {
                const transDate = new Date(t.date);
                return transDate.getFullYear() === currentMonth.getFullYear() &&
                    transDate.getMonth() === currentMonth.getMonth();
            });
        }
        return allSearchFilteredTransactions;
    }, [allSearchFilteredTransactions, viewMode, currentMonth]);

    const chartData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dailyAggregation: { [key: string]: number } = {};

        // Initialize all days of the month with 0
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            dailyAggregation[dateStr] = 0;
        }

        filteredTransactions.forEach(t => {
            const dateStr = t.date; // YYYY-MM-DD
            const amount = Number(String(t.amountKrw || 0).replace(/,/g, ''));
            if (dailyAggregation.hasOwnProperty(dateStr)) {
                dailyAggregation[dateStr] += amount;
            }
        });

        return Object.entries(dailyAggregation)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, total]) => ({ date, total, day: parseInt(date.substring(8)) }));
    }, [filteredTransactions, currentMonth]);

    const stats = useMemo(() => {
        if (viewMode === 'table') {
            // In table mode, use the search-wide stats provided by the backend
            return {
                total: totalSearchAmount,
                avgMonthly: 0, // Backend doesn't provide this yet for table, maybe calculate if needed
                dailyAvg: 0,
                max: 0, // Backend doesn't provide this yet
                points: totalSearchPoints
            };
        }

        // Use transactions that match BOTH search criteria and the currently viewed period (month)
        const sourceData = filteredTransactions.filter(t => t.status !== '승인취소');

        if (sourceData.length === 0) {
            return { total: 0, avgMonthly: 0, dailyAvg: 0, max: 0, points: 0 };
        }

        const total = sourceData.reduce((sum, t) => sum + Number(String(t.amountKrw).replace(/,/g, '') || 0), 0);
        const points = sourceData.reduce((sum, t) => sum + Number(String(t.points).replace(/,/g, '') || 0), 0);
        const max = sourceData.reduce((maxVal, t) => {
            const amt = Number(String(t.amountKrw).replace(/,/g, '') || 0);
            return amt > maxVal ? amt : maxVal;
        }, 0);

        const months = new Set(sourceData.map(t => t.date.substring(0, 7)));
        const avgMonthly = months.size > 0 ? total / months.size : 0;

        const daysInSelectedMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const dailyAvg = total / daysInSelectedMonth;

        return { total, avgMonthly, dailyAvg, max, points };
    }, [filteredTransactions, allSearchFilteredTransactions, currentMonth, viewMode, totalSearchAmount, totalSearchPoints]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'decimal' }).format(Math.floor(value));
    };

    return (
        <div className="page-container" style={{ color: 'white' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header Section */}
                {/* Header Section - Split into 2 Rows */}
                <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Row 1: Title & View Mode Tabs */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                                    <CreditCard size={20} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Card Statement</span>
                                </div>
                                <h1 className="header-title" style={{ fontSize: '2.5rem' }}>Transaction History</h1>
                            </div>
                        </div>

                        <div className="glass-panel view-mode-tabs">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`btn ${viewMode === 'table' ? 'btn-primary' : ''} view-mode-tab`}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                    color: viewMode === 'table' ? 'black' : 'white',
                                }}
                            >
                                <Table size={18} /> Table
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                                    color: viewMode === 'calendar' ? 'black' : 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <LayoutGrid size={18} /> Calendar
                            </button>
                            <button
                                onClick={() => setViewMode('chart')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: viewMode === 'chart' ? 'var(--primary)' : 'transparent',
                                    color: viewMode === 'chart' ? 'black' : 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <BarChart2 size={18} /> Chart
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Search & Filter Controls */}
                    <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {viewMode === 'table' && (
                                <>
                                    <div className="glass-panel" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', marginRight: '8px' }}>
                                        {['today', 'week', 'month'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => handleDateRangeChange(type)}
                                                className={`btn ${dateRangeType === type ? 'btn-primary' : ''}`}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    background: dateRangeType === type ? 'var(--primary)' : 'transparent',
                                                    color: dateRangeType === type ? 'black' : 'white',
                                                }}
                                            >
                                                {type === 'today' ? '당일' : type === 'week' ? '주간' : '월간'}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setDateRangeType('custom');
                                            }}
                                            className="input-control"
                                            style={{ padding: '8px 12px' }}
                                        />
                                        <span style={{ color: 'var(--text-muted)' }}>~</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setDateRangeType('custom');
                                            }}
                                            className="input-control"
                                            style={{ padding: '8px 12px' }}
                                        />
                                    </div>
                                    <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 8px' }} />
                                </>
                            )}
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="가맹점 검색..."
                                    value={viewMode === 'table' ? searchMerchant : viewMode === 'calendar' ? calendarSearchMerchant : chartSearchMerchant}
                                    onChange={(e) => {
                                        if (viewMode === 'table') setSearchMerchant(e.target.value);
                                        else if (viewMode === 'calendar') setCalendarSearchMerchant(e.target.value);
                                        else setChartSearchMerchant(e.target.value);
                                    }}
                                    className="input-control"
                                    style={{ paddingLeft: '44px', width: '220px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-secondary">
                                <Filter size={18} /> Filter
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ color: 'black' }}
                                onClick={() => window.location.reload()}
                            >
                                <Download size={18} /> Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {[
                        { label: viewMode === 'calendar' ? 'Monthly Total' : 'Total Spending', value: `${formatCurrency(stats.total)} 원`, icon: <ReceiptText size={20} />, color: '#6366f1' },
                        { label: viewMode === 'calendar' ? 'Daily Average' : 'Avg Monthly', value: `${formatCurrency(viewMode === 'calendar' ? stats.dailyAvg : stats.avgMonthly)} 원`, icon: <Calendar size={20} />, color: '#10b981' },
                        { label: viewMode === 'calendar' ? 'Monthly Max' : 'Max Transaction', value: `${formatCurrency(stats.max)} 원`, icon: <MapPin size={20} />, color: '#f59e0b' },
                        { label: viewMode === 'calendar' ? 'Monthly Points' : 'Total Points', value: `${formatCurrency(stats.points)} P`, icon: <CreditCard size={20} />, color: '#ec4899' },
                    ].map((stat, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{stat.label}</span>
                                <div style={{ background: `${stat.color}15`, color: stat.color, padding: '8px', borderRadius: '10px' }}>{stat.icon}</div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Content Section */}
                {viewMode === 'table' ? (
                    <div className="data-table-container">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Merchant (이용하신곳)</th>
                                        <th style={{ textAlign: 'right' }}>Amount (KRW)</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Points</th>
                                        <th>Approval No</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '80px 0', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                                                <div style={{ color: 'var(--text-muted)' }}>Loading transactions...</div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '80px 24px', textAlign: 'center' }}>
                                                <div style={{ color: '#ef4444', marginBottom: '8px', fontWeight: 600 }}>{error}</div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => window.location.reload()}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
                                                >
                                                    Try Again
                                                </motion.button>
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                <ReceiptText size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                                <p>No transactions found.</p>
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.map((t, i) => (
                                        <motion.tr
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                        >
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 600 }}>{t.date}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.time}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{t.merchant}</div>
                                                <div style={{ fontSize: '0.75rem', color: t.merchantInfo ? '#a78bfa' : 'var(--text-muted)' }}>{t.merchantInfo || t.card}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px', textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>
                                                {t.amountKrw} 원
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{ fontSize: '0.85rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    {t.paymentMethod}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    background: t.status === '승인취소' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: t.status === '승인취소' ? '#ef4444' : '#10b981',
                                                    border: t.status === '승인취소' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                                                }}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 24px', color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>
                                                {t.points !== '0' ? `+${t.points} P` : '-'}
                                            </td>
                                            <td style={{ padding: '18px 24px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {t.approvalNo}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '24px 0 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                style={{ background: 'transparent', border: 'none', color: page === 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: page === i + 1 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: page === i + 1 ? 'black' : 'white',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                style={{ background: 'transparent', border: 'none', color: page >= totalPages ? 'rgba(255,255,255,0.2)' : 'white', cursor: page >= totalPages ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                ) : viewMode === 'calendar' ? (
                    <CalendarView
                        transactions={filteredTransactions}
                        holidays={holidays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        formatCurrency={formatCurrency}
                        onDayClick={(date: string) => {
                            setStartDate(date);
                            setEndDate(date);
                            setDateRangeType('custom');
                            setSearchMerchant('');
                            setViewMode('table');
                        }}
                    />
                ) : (
                    <ChartView
                        data={chartData}
                        holidays={holidays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        formatCurrency={formatCurrency}
                        onBarClick={(date: string) => {
                            setStartDate(date);
                            setEndDate(date);
                            setDateRangeType('custom');
                            setSearchMerchant(''); // Clear merchant search if clicking specific day chart bar? 
                            // Actually, maybe keep merchant search if they are looking for specific trends.
                            // But usually, clicking a bar means "show me everything on this day".
                            // I'll keep it consistent with calendar: clear merchant, set date, switch to table.
                            setSearchMerchant('');
                            setViewMode('table');
                        }}
                    />
                )}
            </div>
        </div>
    );
};

const ChartView = ({ data, holidays, currentMonth, setCurrentMonth, formatCurrency, onBarClick }: { data: any[], holidays: any[], currentMonth: Date, setCurrentMonth: any, formatCurrency: any, onBarClick: (date: string) => void }) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    if (data.length === 0) {
        return (
            <div className="glass-card" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={prevMonth}
                        style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={20} />
                    </motion.button>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={nextMonth}
                        style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}
                    >
                        <ChevronRight size={20} />
                    </motion.button>
                </div>
                <BarChart2 size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
                <p style={{ fontSize: '1.2rem' }}>No data available for chart.</p>
            </div>
        );
    }

    const maxTotal = Math.max(...data.map(d => d.total));
    const paddingLeft = 100;
    const paddingRight = 40;
    const paddingBottom = 40;
    const height = 400;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ padding: '40px', borderRadius: '32px', overflow: 'hidden' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Daily Spending Trend</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Daily transaction totals for the selected month</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={prevMonth}
                            style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}
                        >
                            <ChevronLeft size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={nextMonth}
                            style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}
                        >
                            <ChevronRight size={18} />
                        </motion.button>
                    </div>
                </div>
            </div>

            <div style={{
                width: '100%',
                height: `${height}px`,
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '4px',
                padding: `0 ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`
            }}>
                {/* Unit label at the top left */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    bottom: paddingBottom + (1 * (height * 0.7)) + 15,
                    width: paddingLeft - 15,
                    textAlign: 'right',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700
                }}>
                    (단위: 원)
                </div>

                {/* Horizontal guide lines & Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                    <React.Fragment key={ratio}>
                        <div style={{
                            position: 'absolute',
                            left: paddingLeft,
                            right: paddingRight,
                            bottom: paddingBottom + (ratio * (height * 0.7)),
                            borderTop: '1px solid rgba(255,255,255,0.03)',
                            zIndex: 0
                        }} />
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            bottom: paddingBottom + (ratio * (height * 0.7)) - 7,
                            width: paddingLeft - 15,
                            textAlign: 'right',
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                        }}>
                            {formatCurrency(Math.round(maxTotal * ratio))}
                        </div>
                    </React.Fragment>
                ))}

                {data.map((item, index) => {
                    const barHeight = maxTotal > 0 ? (item.total / maxTotal) * (height * 0.7) : 0;
                    const isMax = item.total === maxTotal && maxTotal > 0;

                    // Check if this date is a holiday (consistent logic with CalendarView)
                    const isHoliday = holidays.some((h: any) => {
                        if (h.recurring) {
                            const hMonthDay = h.holidayDate.substring(5);
                            const currentMonthDay = item.date.substring(5);
                            return hMonthDay === currentMonthDay;
                        }
                        return h.holidayDate === item.date;
                    });

                    // Check if this date is a Sunday
                    const isSunday = new Date(item.date).getDay() === 0;
                    const isRedDay = isHoliday || isSunday;

                    return (
                        <motion.div
                            key={item.date}
                            initial="initial"
                            whileHover="hoverGroup"
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}
                        >
                            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                {/* Tooltip label (Balloon style) */}
                                <motion.div
                                    variants={{
                                        initial: { opacity: 0, scale: 0.5, y: 10 },
                                        hoverGroup: { opacity: 1, scale: 1, y: 0 }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        bottom: 'calc(100% + 15px)',
                                        background: isMax ? '#ef4444' : 'rgba(255,255,255,0.95)',
                                        color: isMax ? 'white' : 'black',
                                        padding: '8px 14px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                        whiteSpace: 'nowrap',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '0.65rem', color: isMax ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginBottom: '2px' }}>{item.date}</div>
                                    <div>{formatCurrency(item.total)}원</div>
                                    {isHoliday && (
                                        <div style={{ fontSize: '0.6rem', marginTop: '2px' }}>
                                            {holidays.find((h: any) => {
                                                if (h.recurring) {
                                                    return h.holidayDate.substring(5) === item.date.substring(5);
                                                }
                                                return h.holidayDate === item.date;
                                            })?.name}
                                        </div>
                                    )}
                                    {/* Balloon tail */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '0',
                                        height: '0',
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderTop: `6px solid ${isMax ? '#ef4444' : 'rgba(255,255,255,0.95)'}`
                                    }} />
                                </motion.div>

                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: Math.max(barHeight, 4) }} // Show at least 4px even for 0 total
                                    transition={{ duration: 0.8, delay: index * 0.02, ease: [0.34, 1.56, 0.64, 1] }}
                                    onClick={() => item.total > 0 && onBarClick(item.date)}
                                    style={{
                                        width: '100%',
                                        maxWidth: '24px',
                                        background: isMax
                                            ? 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)'
                                            : item.total > 0
                                                ? 'linear-gradient(180deg, var(--primary) 0%, rgba(99, 102, 241, 0.4) 100%)'
                                                : 'rgba(255,255,255,0.05)',
                                        borderRadius: '4px 4px 2px 2px',
                                        cursor: item.total > 0 ? 'pointer' : 'default',
                                        boxShadow: isMax ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none',
                                        opacity: item.total === 0 ? 0.3 : 1
                                    }}
                                    whileHover={item.total > 0 ? {
                                        filter: 'brightness(1.3)',
                                        scaleX: 1.2,
                                        boxShadow: isMax ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(99, 102, 241, 0.4)'
                                    } : {}}
                                />
                            </div>

                            <div style={{
                                fontSize: '0.6rem',
                                color: isRedDay ? '#ef4444' : 'var(--text-muted)',
                                fontWeight: isRedDay ? 800 : 600,
                                height: '14px',
                                marginTop: '4px'
                            }}>
                                {item.day}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
                    Spending Amount
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
                    Highest Spending / Holiday
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }} />
                    No Transactions
                </div>
            </div>
        </motion.div>
    );
};

const CalendarView = ({ transactions, holidays, currentMonth, setCurrentMonth, formatCurrency, onDayClick }: any) => {
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const { dailyTotals, maxTotal } = useMemo(() => {
        const totals: Record<string, number> = {};
        let max = 0;
        transactions.forEach((t: Transaction) => {
            const dateStr = t.date; // Format is YYYY-MM-DD
            const amount = Number(String(t.amountKrw).replace(/,/g, '') || 0);
            if (t.status !== '승인취소') {
                totals[dateStr] = (totals[dateStr] || 0) + amount;
                if (totals[dateStr] > max) max = totals[dateStr];
            }
        });
        return { dailyTotals: totals, maxTotal: max };
    }, [transactions]);

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
        <div className="glass-card" style={{ padding: '30px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Calendar size={24} color="var(--primary)" />
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={prevMonth}
                        style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={nextMonth}
                        style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}
                    >
                        <ChevronRight size={20} />
                    </motion.button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                {weekDays.map(day => (
                    <div key={day} style={{ padding: '15px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        {day}
                    </div>
                ))}

                {Array.from({ length: 42 }).map((_, i) => {
                    const dayNum = i - firstDay + 1;
                    const isValid = dayNum > 0 && dayNum <= days;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const total = dailyTotals[dateStr];

                    return (
                        <motion.div
                            key={i}
                            style={{
                                height: '120px',
                                padding: '12px',
                                cursor: isValid ? 'pointer' : 'default',
                                background: isValid ? 'rgba(255,255,255,0.01)' : 'transparent',
                                border: '1px solid rgba(255,255,255,0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                                zIndex: 1
                            }}
                            onClick={() => isValid && onDayClick(dateStr)}
                            whileHover={isValid ? { background: 'rgba(255,255,255,0.05)', scale: 1.02, zIndex: 10 } : {}}
                        >
                            {isValid && (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: (
                                                i % 7 === 0 ||
                                                holidays.some((h: any) => {
                                                    if (h.recurring) {
                                                        const hMonthDay = h.holidayDate.substring(5);
                                                        const currentMonthDay = dateStr.substring(5);
                                                        return hMonthDay === currentMonthDay;
                                                    }
                                                    return h.holidayDate === dateStr;
                                                })
                                            ) ? '#ef4444' : i % 7 === 6 ? '#3b82f6' : 'white'
                                        }}>
                                            {dayNum}
                                        </div>
                                        {holidays.find((h: any) => {
                                            if (h.recurring) {
                                                const hMonthDay = h.holidayDate.substring(5);
                                                const currentMonthDay = dateStr.substring(5);
                                                return hMonthDay === currentMonthDay;
                                            }
                                            return h.holidayDate === dateStr;
                                        }) && (
                                                <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 600, textAlign: 'right', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {holidays.find((h: any) => {
                                                        if (h.recurring) {
                                                            const hMonthDay = h.holidayDate.substring(5);
                                                            const currentMonthDay = dateStr.substring(5);
                                                            return hMonthDay === currentMonthDay;
                                                        }
                                                        return h.holidayDate === dateStr;
                                                    }).name}
                                                </div>
                                            )}
                                    </div>
                                    {total > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{
                                                background: total === maxTotal && maxTotal > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                border: total === maxTotal && maxTotal > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(99, 102, 241, 0.2)',
                                                padding: '6px 8px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: total === maxTotal && maxTotal > 0 ? 800 : 700,
                                                color: total === maxTotal && maxTotal > 0 ? '#ef4444' : '#818cf8',
                                                textAlign: 'right',
                                                boxShadow: total === maxTotal && maxTotal > 0 ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                                            }}
                                        >
                                            {formatCurrency(total)} 원
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const TransactionsPage = () => {
    return (
        <Suspense fallback={<div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>}>
            <TransactionsContent />
        </Suspense>
    );
};

export default TransactionsPage;
