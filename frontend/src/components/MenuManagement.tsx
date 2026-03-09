"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    ChevronRight,
    ChevronDown,
    Layout,
    Link as LinkIcon,
    Type,
    Shield,
    Hash,
    LucideIcon
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuData {
    id: number;
    parentId: number | null;
    name: string;
    url: string | null;
    icon: string;
    sortOrder: number;
    isActive: boolean;
    role: string;
    children?: MenuData[];
}

const getIcon = (iconName: string, size = 18) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return <IconComponent size={size} />;
};

export default function MenuManagement() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<MenuData>>({
        name: '',
        url: '',
        icon: 'Circle',
        sortOrder: 0,
        isActive: true,
        role: 'SUPER_ADMIN,MIDDLE_ADMIN,GENERAL_ADMIN',
        parentId: null
    });

    const { data: menus = [], isLoading } = useQuery<MenuData[]>({
        queryKey: ['menus-all'],
        queryFn: async () => {
            const res = await fetch('/api/menus');
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: Partial<MenuData>) => {
            const res = await fetch('/api/menus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus-all'] });
            queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
            setIsCreating(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: MenuData) => {
            const res = await fetch(`/api/menus/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus-all'] });
            queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
            setEditingId(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus-all'] });
            queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            url: '',
            icon: 'Circle',
            sortOrder: 0,
            isActive: true,
            role: 'SUPER_ADMIN,MIDDLE_ADMIN,GENERAL_ADMIN',
            parentId: null
        });
    };

    const handleEdit = (menu: MenuData) => {
        setEditingId(menu.id);
        setFormData(menu);
        setIsCreating(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ ...formData, id: editingId } as MenuData);
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;

    const rootMenus = menus.filter(m => m.parentId === null);
    const getChildren = (parentId: number) => menus.filter(m => m.parentId === parentId);

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>Menu Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configure system navigation and access roles.</p>
                </div>
                {!isCreating && !editingId && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }}
                    >
                        <Plus size={20} />
                        Add New Menu
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', alignItems: 'start' }}>
                {/* Menu List */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {rootMenus.map(menu => (
                            <div key={menu.id} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
                                            {getIcon(menu.icon)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{menu.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{menu.role}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(menu)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                        <button onClick={() => deleteMutation.mutate(menu.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div style={{ padding: '8px 16px 16px 48px' }}>
                                    {getChildren(menu.id).map(child => (
                                        <div key={child.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 0',
                                            borderBottom: '1px solid rgba(255,255,255,0.03)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {getIcon(child.icon, 16)}
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{child.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{child.url}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleEdit(child)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                <button onClick={() => deleteMutation.mutate(child.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setIsCreating(true);
                                            setFormData({ ...formData, parentId: menu.id });
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Plus size={14} /> Add Submenu
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <AnimatePresence>
                    {(isCreating || editingId) && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass-panel"
                            style={{ padding: '24px', position: 'sticky', top: '32px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingId ? 'Edit Menu' : 'New Menu'}</h2>
                                <button onClick={() => { setEditingId(null); setIsCreating(false); resetForm(); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Menu Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input-control"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>URL</label>
                                    <input
                                        type="text"
                                        value={formData.url || ''}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                        className="input-control"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Icon Name</label>
                                        <input
                                            type="text"
                                            value={formData.icon}
                                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            className="input-control"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Sort Order</label>
                                        <input
                                            type="number"
                                            value={formData.sortOrder}
                                            onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                                            className="input-control"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Parent Menu</label>
                                    <select
                                        value={formData.parentId || ''}
                                        onChange={e => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
                                        className="input-control"
                                    >
                                        <option value="">None (Root)</option>
                                        {rootMenus.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Allowed Roles (CSV)</label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="input-control"
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                                    <div style={{
                                        width: '40px',
                                        height: '20px',
                                        background: formData.isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        borderRadius: '20px',
                                        position: 'relative',
                                        transition: 'background 0.2s'
                                    }}>
                                        <motion.div
                                            animate={{ x: formData.isActive ? 22 : 2 }}
                                            style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px' }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.9rem' }}>Menu Active</span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    <Save size={20} />
                                    {editingId ? 'Update Menu' : 'Create Menu'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
