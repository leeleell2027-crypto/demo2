"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Save, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Pagination from '@/components/Pagination';

interface Holiday {
    id: number;
    holidayDate: string;
    name: string;
    recurring: boolean;
}

export default function HolidayManagementPage() {
    const { user } = useAuthStore();
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
        <div className="page-container" style={{ color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
                        <Calendar size={20} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System administration</span>
                    </div>
                    <h1 className="header-title" style={{ fontSize: '2.5rem' }}>Holiday Management</h1>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                    style={{ color: 'white' }}
                >
                    <Plus size={18} />
                    Add Holiday
                </button>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Holiday Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="data-table-empty-row">Loading...</td></tr>
                        ) : holidays.length === 0 ? (
                            <tr><td colSpan={4} className="data-table-empty-row">No holidays found.</td></tr>
                        ) : (
                            holidays.map(h => (
                                <tr key={h.id} className="data-table-row">
                                    <td className="data-table-td-bold">{h.holidayDate}</td>
                                    <td>
                                        {h.recurring ? (
                                            <span className="badge badge-success">매년 반복</span>
                                        ) : (
                                            <span className="badge badge-info">단일 일자</span>
                                        )}
                                    </td>
                                    <td>{h.name}</td>
                                    <td>
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
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalElements}
                    onPageChange={handlePageChange}
                    style={{ padding: '24px 0 40px', marginTop: '12px' }}
                />
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h2 className="header-title" style={{ fontSize: '1.5rem', marginBottom: '24px' }}>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date</label>
                                <input type="date" required value={formData.holidayDate} onChange={e => setFormData({ ...formData, holidayDate: e.target.value })} className="input-control" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Holiday Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter holiday name" className="input-control" />
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
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '14px', width: '100%', color: 'white' }}>
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
