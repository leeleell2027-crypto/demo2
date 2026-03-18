"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Lock, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Save, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Pagination from '@/components/Pagination';

interface Member {
    id: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
}

const ROLES = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: '#10b981' },
    { value: 'MIDDLE_ADMIN', label: 'Middle Admin', color: '#f59e0b' },
    { value: 'GENERAL_ADMIN', label: 'General Admin', color: '#6366f1' }
];

export default function AdminManagementPage() {
    const { user } = useAuthStore();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize] = useState(10);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [formData, setFormData] = useState<Partial<Member>>({
        id: '',
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'GENERAL_ADMIN'
    });

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/members/paged?page=${page}&size=${pageSize}`);
            const data = await response.json();
            setMembers(data.members);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleOpenModal = (member?: Member) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                id: member.id,
                name: member.name,
                email: member.email,
                username: member.username,
                password: '', // Don't show hashed password
                role: member.role
            });
        } else {
            setEditingMember(null);
            setFormData({
                id: '',
                name: '',
                email: '',
                username: '',
                password: '',
                role: 'GENERAL_ADMIN'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingMember ? 'PUT' : 'POST';

        try {
            const response = await fetch('/api/members', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchMembers();
            } else {
                alert('Failed to save member information.');
            }
        } catch (error) {
            console.error('Save failed', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this administrator?')) return;

        try {
            await fetch(`/api/members/${id}`, { method: 'DELETE' });
            fetchMembers();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Shield size={64} color="var(--primary)" style={{ marginBottom: '20px' }} />
                <h2>Access Denied</h2>
                <p>Only Super Administrators can access this page.</p>
            </div>
        );
    }

    return (
        <div className="page-container-full">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                            <User size={20} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Administration</span>
                        </div>
                        <h1 className="header-title" style={{ fontSize: '2.5rem', margin: 0 }}>Admin Management</h1>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Add Administrator
                </button>
            </div>

            {/* List Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>No administrators found.</td></tr>
                        ) : members.map(m => (
                            <tr key={m.id}>
                                <td style={{ fontWeight: 600 }}>{m.id}</td>
                                <td>{m.name}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: ROLES.find(r => r.value === m.role)?.color + '20',
                                        color: ROLES.find(r => r.value === m.role)?.color
                                    }}>
                                        {ROLES.find(r => r.value === m.role)?.label}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                                <td style={{ fontSize: '0.85rem' }}>{formatDate(m.createdAt)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleOpenModal(m)}
                                            className="btn btn-secondary"
                                            style={{ padding: '8px', borderRadius: '8px' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls - Moved inside glass-panel */}
                <Pagination
                    currentPage={page}
                    totalPages={Math.max(1, Math.ceil(total / pageSize))}
                    totalCount={total}
                    onPageChange={setPage}
                    style={{ padding: '24px 0 24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.01)' }}
                />
            </div>
            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h2 className="header-title" style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
                            {editingMember ? 'Edit Administrator' : 'Add New Administrator'}
                        </h2>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID</label>
                                <input
                                    required
                                    disabled={!!editingMember}
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    placeholder="Enter unique ID"
                                    className="input-control"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input-control"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Username</label>
                                    <input
                                        required
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="input-control"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="input-control"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    Password {editingMember && '(Leave empty to keep current)'}
                                </label>
                                <input
                                    required={!editingMember}
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="input-control"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="input-control"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ marginTop: '12px', padding: '14px', width: '100%' }}
                            >
                                <Save size={18} />
                                {editingMember ? 'Update Administrator' : 'Save Administrator'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
