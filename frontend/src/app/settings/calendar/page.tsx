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
    const [holidays, setHolidays] = useState<any[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        Promise.all([
            fetch('/api/transactions').then(res => res.json()),
            fetch('/api/holidays/all').then(res => res.json())
        ])
            .then(([transactionData, holidayData]) => {
                setTransactions(transactionData);
                setHolidays(holidayData);
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
        <div className="page-container-full">
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                            <Calendar size={20} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</span>
                        </div>
                        <h1 className="header-title" style={{ fontSize: '2.5rem', margin: 0 }}>Spend Calendar</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={prevMonth}
                            className="btn btn-secondary"
                            style={{ padding: '10px' }}
                        >
                            <ChevronLeft size={20} />
                        </motion.button>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, minWidth: '180px', textAlign: 'center', color: 'var(--primary)' }}>
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={nextMonth}
                            className="btn btn-secondary"
                            style={{ padding: '10px' }}
                        >
                            <ChevronRight size={20} />
                        </motion.button>
                    </div>
                </div>

                <div className="data-table-container" style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--glass-border)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        {weekDays.map(day => (
                            <div key={day} style={{ padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', fontSize: '0.75rem', fontWeight: 800, color: day === 'SUN' ? '#ef4444' : day === 'SAT' ? '#3b82f6' : 'var(--text-muted)', letterSpacing: '0.05em' }}>
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
                                    whileHover={isValid ? { background: 'rgba(99, 102, 241, 0.04)', scale: 1.02 } : {}}
                                    onClick={() => {
                                        if (isValid) {
                                            router.push(`/transactions?date=${dateStr}`);
                                        }
                                    }}
                                    style={{
                                        height: '140px',
                                        padding: '16px',
                                        background: isValid ? '#ffffff' : '#fafafa',
                                        border: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        cursor: isValid ? 'pointer' : 'default',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    {isValid && (
                                        <>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start'
                                            }}>
                                                <div style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: (
                                                        i % 7 === 0 ||
                                                        holidays.some(h => {
                                                            if (h.recurring) {
                                                                // 매년 반복인 경우 월-일만 체크
                                                                const hMonthDay = h.holidayDate.substring(5); // "MM-DD"
                                                                const currentMonthDay = dateStr.substring(5);
                                                                return hMonthDay === currentMonthDay;
                                                            }
                                                            return h.holidayDate === dateStr;
                                                        })
                                                    ) ? '#ef4444' : i % 7 === 6 ? '#3b82f6' : 'var(--text-main)'
                                                }}>
                                                    {dayNum}
                                                </div>
                                                {holidays.find(h => {
                                                    if (h.recurring) {
                                                        const hMonthDay = h.holidayDate.substring(5);
                                                        const currentMonthDay = dateStr.substring(5);
                                                        return hMonthDay === currentMonthDay;
                                                    }
                                                    return h.holidayDate === dateStr;
                                                }) && (
                                                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, textAlign: 'right', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {holidays.find(h => {
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
                                                <div style={{
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                    padding: '6px 10px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.85rem',
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
