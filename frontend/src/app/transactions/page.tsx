"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Search, ArrowLeft, Download, Filter, Calendar, MapPin, ReceiptText, ChevronLeft, ChevronRight, LayoutGrid, Table } from 'lucide-react';
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


const TransactionsContent = () => {
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchDate, setSearchDate] = useState('');
    const [searchMerchant, setSearchMerchant] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [holidays, setHolidays] = useState<any[]>([]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [pageSize] = useState(10);

    useEffect(() => {
        if (dateParam) {
            setSearchDate(dateParam);
        }
    }, [dateParam]);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                if (viewMode === 'calendar') {
                    const [transactionRes, holidayRes] = await Promise.all([
                        fetch('/api/transactions'),
                        fetch('/api/holidays/all')
                    ]);

                    if (!transactionRes.ok || !holidayRes.ok) {
                        throw new Error('Failed to fetch data');
                    }

                    const transactionData = await transactionRes.json();
                    const holidayData = await holidayRes.json();

                    setTransactions(transactionData);
                    setHolidays(holidayData);
                    setTotal(transactionData.length);
                    setTotalPages(1);
                } else {
                    const response = await fetch(`/api/transactions/paged?page=${page}&size=${pageSize}&searchDate=${encodeURIComponent(searchDate)}&searchMerchant=${encodeURIComponent(searchMerchant)}`);
                    if (!response.ok) throw new Error('Failed to fetch paginated transactions');
                    const data = await response.json();
                    setTransactions(data.transactions);
                    setTotal(data.total);
                    setTotalPages(data.totalPages);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching transactions:', err);
                setError('Failed to load transaction data. Please make sure the backend is running.');
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [page, pageSize, viewMode, searchDate, searchMerchant]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const dateMatch = !searchDate || (t.date || '').includes(searchDate);
            const merchantMatch = !searchMerchant || (t.merchant || '').toLowerCase().includes(searchMerchant.toLowerCase());
            const matchesSearch = dateMatch && merchantMatch;

            if (viewMode === 'calendar') {
                const transDate = new Date(t.date);
                const isSameMonth = transDate.getFullYear() === currentMonth.getFullYear() &&
                    transDate.getMonth() === currentMonth.getMonth();
                return matchesSearch && isSameMonth;
            }

            return matchesSearch;
        });
    }, [transactions, searchDate, searchMerchant, viewMode, currentMonth]);

    const stats = useMemo(() => {
        if (filteredTransactions.length === 0) {
            return { total: 0, avgMonthly: 0, dailyAvg: 0, max: 0, points: 0 };
        }

        const total = filteredTransactions.reduce((sum, t) => sum + Number(String(t.amountKrw).replace(/,/g, '') || 0), 0);
        const points = filteredTransactions.reduce((sum, t) => sum + Number(String(t.points).replace(/,/g, '') || 0), 0);
        const max = filteredTransactions.reduce((maxVal, t) => {
            const amt = Number(String(t.amountKrw).replace(/,/g, '') || 0);
            return amt > maxVal ? amt : maxVal;
        }, 0);

        const months = new Set(filteredTransactions.map(t => t.date.substring(0, 7)));
        const avgMonthly = months.size > 0 ? total / months.size : 0;

        const daysInSelectedMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const dailyAvg = total / daysInSelectedMonth;

        return { total, avgMonthly, dailyAvg, max, points };
    }, [filteredTransactions, currentMonth, viewMode]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'decimal' }).format(Math.floor(value));
    };

    return (
        <div style={{ padding: '40px 24px', color: 'white' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                                <CreditCard size={20} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Card Statement</span>
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Transaction History</h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Table size={18} /> Table
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('calendar');
                                setSearchDate('');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            <LayoutGrid size={18} /> Calendar
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {viewMode === 'table' && (
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Date (YYYY-MM-DD)"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        padding: '12px 16px 12px 44px',
                                        borderRadius: '12px',
                                        color: 'white',
                                        width: '200px',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                                />
                            </div>
                        )}
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search merchant..."
                                value={searchMerchant}
                                onChange={(e) => setSearchMerchant(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    padding: '12px 16px 12px 44px',
                                    borderRadius: '12px',
                                    color: 'white',
                                    width: '280px',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            />
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                            <Filter size={18} /> Filter
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
                            onClick={() => window.location.reload()}
                        >
                            <Download size={18} /> Export
                        </motion.button>
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
                        <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Merchant (이용하신곳)</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount (KRW)</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Method</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Points</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approval No</th>
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
                ) : (
                    <CalendarView
                        transactions={filteredTransactions}
                        holidays={holidays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        formatCurrency={formatCurrency}
                        onDayClick={(date: string) => {
                            setSearchDate(date);
                            setSearchMerchant('');
                            setViewMode('table');
                        }}
                    />
                )}
            </div>
        </div>
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

    const dailyTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        transactions.forEach((t: Transaction) => {
            const dateStr = t.date; // Format is YYYY-MM-DD
            const amount = Number(String(t.amountKrw).replace(/,/g, '') || 0);
            if (t.status !== '승인취소') {
                totals[dateStr] = (totals[dateStr] || 0) + amount;
            }
        });
        return totals;
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
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                                padding: '6px 8px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: '#818cf8',
                                                textAlign: 'right'
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
