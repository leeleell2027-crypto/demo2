"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Lock, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

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
    const { user } = useAuth();
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
            <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
                <Shield size={64} color="var(--primary)" style={{ marginBottom: '20px' }} />
                <h2>Access Denied</h2>
                <p>Only Super Administrators can access this page.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', color: 'white' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                        <Shield size={20} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Administration</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Management</h1>
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
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
                    }}
                >
                    <Plus size={18} />
                    Add Administrator
                </button>
            </div>

            {/* List Table */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>ID</th>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Name</th>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Role</th>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Email</th>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Created At</th>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
                            ) : members.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>No administrators found.</td></tr>
                            ) : members.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-row">
                                    <td style={{ padding: '16px', fontWeight: 600 }}>{m.id}</td>
                                    <td style={{ padding: '16px' }}>{m.name}</td>
                                    <td style={{ padding: '16px' }}>
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
                                    <td style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>{m.email}</td>
                                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>{formatDate(m.createdAt)}</td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleOpenModal(m)}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'white' }}
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '24px 0 0' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        style={{ background: 'transparent', border: 'none', color: page === 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        {Array.from({ length: Math.max(1, Math.ceil(total / pageSize)) }).map((_, i) => (
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
                        disabled={page >= Math.ceil(total / pageSize)}
                        onClick={() => setPage(p => p + 1)}
                        style={{ background: 'transparent', border: 'none', color: page >= Math.ceil(total / pageSize) ? 'rgba(255,255,255,0.2)' : 'white', cursor: page >= Math.ceil(total / pageSize) ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>
                            {editingMember ? 'Edit Administrator' : 'Add New Administrator'}
                        </h2>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>ID</label>
                                <input
                                    required
                                    disabled={!!editingMember}
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    placeholder="Enter unique ID"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Username</label>
                                    <input
                                        required
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                    Password {editingMember && '(Leave empty to keep current)'}
                                </label>
                                <input
                                    required={!editingMember}
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                                >
                                    {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: '#111' }}>{r.label}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                style={{ marginTop: '12px', padding: '14px', borderRadius: '12px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Save size={18} />
                                {editingMember ? 'Update Administrator' : 'Save Administrator'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .hover-row:hover {
                    background: rgba(255,255,255,0.03);
                }
            `}</style>
        </div>
    );
}
