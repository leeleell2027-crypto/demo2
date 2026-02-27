"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Home, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface Schedule {
    id: number;
    title: string;
    description: string;
    scheduleDate: string;
}

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const res = await fetch('/api/schedules');
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error('Failed to fetch schedules', error);
        }
    };

    const handleAddSchedule = async () => {
        if (!newTitle.trim() || !selectedDate) return;

        setLoading(true);
        try {
            const res = await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    scheduleDate: selectedDate
                })
            });

            if (res.ok) {
                setNewTitle('');
                setShowModal(false);
                fetchSchedules();
            }
        } catch (error) {
            console.error('Failed to add schedule', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async (id: number) => {
        try {
            const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchSchedules();
            }
        } catch (error) {
            console.error('Failed to delete schedule', error);
        }
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const offset = firstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < offset; i++) {
        days.push(<div key={`empty-${i}`} style={{ height: '60px' }}></div>);
    }

    for (let d = 1; d <= daysInMonth(year, month); d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = today.toISOString().split('T')[0] === dateStr;
        const daySchedules = schedules.filter(s => s.scheduleDate === dateStr);

        days.push(
            <motion.div
                key={d}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                onClick={() => {
                    setSelectedDate(dateStr);
                    setShowModal(true);
                }}
                style={{
                    height: '70px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    border: isToday ? '1px solid var(--primary)' : '1px solid transparent',
                    background: isToday ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                }}
            >
                <span style={{ fontSize: '1rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                    {d}
                </span>
                <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {daySchedules.map((_, i) => (
                        <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                    ))}
                </div>
            </motion.div>
        );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', padding: '20px', background: '#0f172a' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '32px', maxWidth: '600px', width: '100%' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <Link href="/">
                        <motion.div whileHover={{ scale: 1.1 }} style={{ padding: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <Home size={24} />
                        </motion.div>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
                        <CalendarIcon size={24} />
                        <span style={{ fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>Schedule Planner</span>
                    </div>
                    <div style={{ width: '40px' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <button onClick={prevMonth} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                        <ChevronLeft size={28} />
                    </button>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{monthNames[month]} {year}</h2>
                    <button onClick={nextMonth} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                        <ChevronRight size={28} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '16px' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                    ))}
                </div>

                <motion.div
                    key={`${year}-${month}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '32px' }}
                >
                    {days}
                </motion.div>

                {/* Selected Date Schedules */}
                <AnimatePresence>
                    {selectedDate && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Schedules for {selectedDate}</h3>
                                <button
                                    onClick={() => setShowModal(true)}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {schedules.filter(s => s.scheduleDate === selectedDate).length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No schedules for this day.</p>
                                ) : (
                                    schedules.filter(s => s.scheduleDate === selectedDate).map(s => (
                                        <div key={s.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                                            <span style={{ fontSize: '0.95rem' }}>{s.title}</span>
                                            <button onClick={() => handleDeleteSchedule(s.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Add Schedule Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ padding: '32px', maxWidth: '400px', width: '100%', position: 'relative' }}
                        >
                            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Add Schedule</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>Date: {selectedDate}</p>
                            <input
                                autoFocus
                                type="text"
                                placeholder="What's the plan?"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSchedule()}
                                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px', color: 'white', marginBottom: '24px', outline: 'none' }}
                            />
                            <button
                                onClick={handleAddSchedule}
                                disabled={loading || !newTitle.trim()}
                                style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Saving...' : 'Save Schedule'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default CalendarPage;
