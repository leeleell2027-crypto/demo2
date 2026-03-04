"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export default function CalendarPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/transactions')
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

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
        transactions.forEach((t) => {
            const dateStr = t.date;
            const amount = Number(String(t.amountKrw).replace(/,/g, '') || 0);
            if (t.status !== '승인취소') {
                totals[dateStr] = (totals[dateStr] || 0) + amount;
            }
        });
        return totals;
    }, [transactions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ko-KR').format(Math.floor(value));
    };

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '100px' }}>
                <div style={{ color: 'var(--text-muted)' }}>로딩 중...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px 24px', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Calendar size={32} color="var(--primary)" />
                        Spend Calendar
                    </h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={prevMonth}
                            style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                        >
                            <ChevronLeft size={24} />
                        </motion.button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, minWidth: '180px', textAlign: 'center' }}>
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={nextMonth}
                            style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                        >
                            <ChevronRight size={24} />
                        </motion.button>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                        {weekDays.map(day => (
                            <div key={day} style={{ padding: '15px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
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
                                    whileHover={isValid ? { background: 'rgba(255,255,255,0.05)', scale: 1.02 } : {}}
                                    onClick={() => {
                                        if (isValid) {
                                            router.push(`/transactions?date=${dateStr}`);
                                        }
                                    }}
                                    style={{
                                        height: '140px',
                                        padding: '12px',
                                        background: isValid ? 'rgba(30, 41, 59, 0.4)' : 'transparent',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        cursor: isValid ? 'pointer' : 'default'
                                    }}
                                >
                                    {isValid && (
                                        <>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: i % 7 === 0 ? '#ef4444' : i % 7 === 6 ? '#3b82f6' : 'white' }}>
                                                {dayNum}
                                            </div>
                                            {total > 0 && (
                                                <div style={{
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                    padding: '4px 8px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 800,
                                                    color: '#818cf8',
                                                    textAlign: 'right'
                                                }}>
                                                    {formatCurrency(total)}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
