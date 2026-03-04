"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Search, ArrowLeft, Download, Filter, Calendar, MapPin, ReceiptText } from 'lucide-react';
import Link from 'next/link';

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


const TransactionsPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch('/api/transactions');
                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }
                const data = await response.json();

                // If the data is empty and we want some initial data for demonstration, 
                // we'll keep it empty and let the user seed it or we can add a seed endpoint later.
                // For now, let's just use the data from the API.
                setTransactions(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching transactions:', err);
                setError('Failed to load transaction data. Please make sure the backend is running.');
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(t =>
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.date.includes(searchTerm) ||
        t.approvalNo.includes(searchTerm)
    );

    const stats = useMemo(() => {
        if (filteredTransactions.length === 0) {
            return { total: 0, avgMonthly: 0, max: 0, points: 0 };
        }

        const total = filteredTransactions.reduce((sum, t) => sum + Number(String(t.amountKrw).replace(/,/g, '') || 0), 0);
        const points = filteredTransactions.reduce((sum, t) => sum + Number(String(t.points).replace(/,/g, '') || 0), 0);
        const max = filteredTransactions.reduce((maxVal, t) => {
            const amt = Number(String(t.amountKrw).replace(/,/g, '') || 0);
            return amt > maxVal ? amt : maxVal;
        }, 0);

        const months = new Set(filteredTransactions.map(t => t.date.substring(0, 7)));
        const avgMonthly = months.size > 0 ? total / months.size : 0;

        return { total, avgMonthly, max, points };
    }, [filteredTransactions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'decimal' }).format(Math.floor(value));
    };

    return (
        <main style={{ minHeight: '100vh', width: '100vw', background: '#0f172a', color: 'white', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link href="/gallery">
                            <motion.div whileHover={{ scale: 1.1 }} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--glass-border)' }}>
                                <ArrowLeft size={24} />
                            </motion.div>
                        </Link>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                                <CreditCard size={20} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Card Statement</span>
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Transaction History</h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search merchant, date, or approval no..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    padding: '12px 16px 12px 44px',
                                    borderRadius: '12px',
                                    color: 'white',
                                    width: '320px',
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
                        <motion.button whileHover={{ scale: 1.05 }} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
                            <Download size={18} /> Export
                        </motion.button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {[
                        { label: 'Total Spending', value: `${formatCurrency(stats.total)} 원`, icon: <ReceiptText size={20} />, color: '#6366f1' },
                        { label: 'Avg Monthly', value: `${formatCurrency(stats.avgMonthly)} 원`, icon: <Calendar size={20} />, color: '#10b981' },
                        { label: 'Max Transaction', value: `${formatCurrency(stats.max)} 원`, icon: <MapPin size={20} />, color: '#f59e0b' },
                        { label: 'Total Points', value: `${formatCurrency(stats.points)} P`, icon: <CreditCard size={20} />, color: '#ec4899' },
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

                {/* Transactions Table */}
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
                </div>
            </div>
        </main>
    );
};

export default TransactionsPage;
