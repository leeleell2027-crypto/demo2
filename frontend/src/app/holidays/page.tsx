"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Save, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

interface Holiday {
    id: number;
    holidayDate: string;
    name: string;
    recurring: boolean;
}

export default function HolidayManagementPage() {
    const { user } = useAuth();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [formData, setFormData] = useState<Partial<Holiday>>({
        holidayDate: '',
        name: '',
        recurring: false
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const fetchHolidays = useCallback(async (page: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/holidays/paged?page=${page}&size=${pageSize}`);
            const data = await response.json();
            setHolidays(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Failed to fetch holidays', error);
        } finally {
            setIsLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchHolidays(currentPage);
    }, [fetchHolidays, currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleOpenModal = (holiday?: Holiday) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setFormData({
                id: holiday.id,
                holidayDate: holiday.holidayDate,
                name: holiday.name,
                recurring: holiday.recurring
            });
        } else {
            setEditingHoliday(null);
            setFormData({
                holidayDate: '',
                name: '',
                recurring: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingHoliday ? 'PUT' : 'POST';

        try {
            const response = await fetch('/api/holidays', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchHolidays(currentPage);
            } else {
                alert('Failed to save holiday.');
            }
        } catch (error) {
            console.error('Save failed', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;

        try {
            await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
            fetchHolidays(currentPage);
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
                <Shield size={64} color="var(--primary)" style={{ marginBottom: '20px' }} />
                <h2>Access Denied</h2>
                <p>Only Super Administrators can access this page.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                        <Calendar size={20} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System administration</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Holiday Management</h1>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        background: 'white',
                        color: 'black',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} />
                    Add Holiday
                </button>
            </div>

            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Date</th>
                            <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Type</th>
                            <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Holiday Name</th>
                            <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : holidays.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center' }}>No holidays found.</td></tr>
                        ) : holidays.map(h => (
                            <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '16px', fontWeight: 600 }}>{h.holidayDate}</td>
                                <td style={{ padding: '16px' }}>
                                    {h.recurring ? (
                                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600 }}>매년 반복</span>
                                    ) : (
                                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 600 }}>단일 일자</span>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>{h.name}</td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleOpenModal(h)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'white' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(h.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '24px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '24px' }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        style={{ background: 'transparent', border: 'none', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: currentPage === 1 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: currentPage === i + 1 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: currentPage === i + 1 ? 'black' : 'white',
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
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        style={{ background: 'transparent', border: 'none', color: currentPage >= totalPages ? 'rgba(255,255,255,0.2)' : 'white', cursor: currentPage >= totalPages ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Date</label>
                                <input type="date" required value={formData.holidayDate} onChange={e => setFormData({ ...formData, holidayDate: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Holiday Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter holiday name" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, recurring: !formData.recurring })}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '6px',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: formData.recurring ? 'var(--primary)' : 'transparent',
                                    borderColor: formData.recurring ? 'var(--primary)' : 'rgba(255,255,255,0.2)'
                                }}>
                                    {formData.recurring && <Plus size={14} color="white" />}
                                </div>
                                <span style={{ fontSize: '0.9rem', color: formData.recurring ? 'white' : 'var(--text-muted)' }}>매년 반복 여부</span>
                            </div>
                            <button type="submit" style={{ marginTop: '12px', padding: '14px', borderRadius: '12px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={18} />
                                {editingHoliday ? 'Update' : 'Save'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
