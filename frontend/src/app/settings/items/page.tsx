"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, 
    ChevronDown, 
    Plus, 
    Trash2, 
    Edit2, 
    Check, 
    X,
    ListChecks,
    MoreVertical,
    FolderPlus,
    FilePlus,
    Save
} from 'lucide-react';

interface CategoryItem {
    id: number;
    parentId: number | null;
    name: string;
    isChecked: boolean;
    sortOrder: number;
    children: CategoryItem[];
}

const ItemManagementPage = () => {
    const queryClient = useQueryClient();
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [isAddingRoot, setIsAddingRoot] = useState(false);
    const [newRootName, setNewRootName] = useState('');
    const [addingToParentId, setAddingToParentId] = useState<number | null>(null);
    const [newSubName, setNewSubName] = useState('');

    const { data: treeData = [], isLoading } = useQuery<CategoryItem[]>({
        queryKey: ['category-items-tree'],
        queryFn: async () => {
            const res = await fetch('/api/category-items/tree');
            if (!res.ok) throw new Error('Failed to fetch tree');
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newItem: Partial<CategoryItem>) => {
            const res = await fetch('/api/category-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });
            if (!res.ok) throw new Error('Failed to create item');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-items-tree'] });
            setIsAddingRoot(false);
            setNewRootName('');
            setAddingToParentId(null);
            setNewSubName('');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (item: CategoryItem) => {
            const res = await fetch(`/api/category-items/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!res.ok) throw new Error('Failed to update item');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-items-tree'] });
            setEditingId(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/category-items/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete item');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-items-tree'] });
        }
    });

    const checkMutation = useMutation({
        mutationFn: async ({ id, isChecked }: { id: number; isChecked: boolean }) => {
            const res = await fetch(`/api/category-items/${id}/checked`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isChecked })
            });
            if (!res.ok) throw new Error('Failed to update check status');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-items-tree'] });
        }
    });

    const toggleExpand = (id: number) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const handleEditStart = (item: CategoryItem) => {
        setEditingId(item.id);
        setEditName(item.name);
    };

    const handleEditSave = (item: CategoryItem) => {
        updateMutation.mutate({ ...item, name: editName });
    };

    const handleAddRoot = () => {
        if (!newRootName.trim()) return;
        createMutation.mutate({ name: newRootName, parentId: null, sortOrder: treeData.length + 1 });
    };

    const handleAddSubItem = (parentId: number, sortOrder: number) => {
        if (!newSubName.trim()) return;
        createMutation.mutate({ name: newSubName, parentId, sortOrder });
        setAddingToParentId(null);
        setNewSubName('');
    };

    const renderItem = (item: CategoryItem, depth: number) => {
        const isExpanded = expandedIds.has(item.id);
        const isEditing = editingId === item.id;
        const isAddingSub = addingToParentId === item.id;

        return (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                    className="glass-panel"
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '12px 16px', 
                        marginBottom: '8px', 
                        marginLeft: `${depth * 32}px`,
                        gap: '12px',
                        background: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: isEditing ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.2s'
                    }}
                >
                    <div 
                        onClick={() => toggleExpand(item.id)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: item.children.length > 0 ? 1 : 0 }}
                    >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>

                    <div 
                        onClick={() => checkMutation.mutate({ id: item.id, isChecked: !item.isChecked })}
                        className={`checkbox-custom flex-shrink-0 ${item.isChecked ? 'checked' : ''}`}
                        style={{ cursor: 'pointer' }}
                    >
                        {item.isChecked && <Check size={12} />}
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEditing ? (
                            <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="input-control"
                                style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleEditSave(item)}
                            />
                        ) : (
                            <span 
                                style={{ 
                                    fontSize: '1rem', 
                                    fontWeight: 500,
                                    color: item.isChecked ? 'white' : 'var(--text-muted)'
                                }}
                            >
                                {item.name}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {isEditing ? (
                            <button onClick={() => handleEditSave(item)} className="btn btn-ghost" style={{ padding: '4px', color: 'var(--primary)' }}>
                                <Save size={18} />
                            </button>
                        ) : (
                            <button onClick={() => handleEditStart(item)} className="btn btn-ghost" style={{ padding: '4px', opacity: 0.6 }}>
                                <Edit2 size={18} />
                            </button>
                        )}
                        
                        {depth < 1 && ( // Only allow sub-items for 1st depth
                            <button onClick={() => setAddingToParentId(item.id)} className="btn btn-ghost" style={{ padding: '4px', opacity: 0.6 }}>
                                <FilePlus size={18} />
                            </button>
                        )}

                        <button 
                            onClick={() => window.confirm('정말 삭제하시겠습니까?') && deleteMutation.mutate(item.id)} 
                            className="btn btn-ghost" 
                            style={{ padding: '4px', opacity: 0.6, color: '#ef4444' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {(isExpanded || isAddingSub) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            {item.children.map(child => renderItem(child, depth + 1))}
                            
                            {isAddingSub && (
                                <div style={{ marginLeft: `${(depth + 1) * 32}px`, marginBottom: '8px' }}>
                                    <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                                        <Plus size={18} style={{ opacity: 0.5 }} />
                                        <input 
                                            type="text"
                                            placeholder="하위 항목 이름 입력..."
                                            value={newSubName}
                                            onChange={(e) => setNewSubName(e.target.value)}
                                            className="input-control"
                                            style={{ flex: 1, padding: '6px 12px', fontSize: '0.9rem' }}
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubItem(item.id, item.children.length + 1)}
                                        />
                                        <button onClick={() => handleAddSubItem(item.id, item.children.length + 1)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>추가</button>
                                        <button onClick={() => setAddingToParentId(null)} className="btn btn-ghost" style={{ padding: '4px' }}><X size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="page-container-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="header-title">Item Management</h1>
                    <p className="header-subtitle">시스템 전체 항목을 계층형으로 관리하고 구성하세요.</p>
                </div>
                <button 
                    onClick={() => setIsAddingRoot(true)} 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FolderPlus size={20} />
                    대분류 추가
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence>
                    {isAddingRoot && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass-panel"
                            style={{ padding: '16px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}
                        >
                            <FolderPlus size={24} style={{ color: 'var(--primary)' }} />
                            <input 
                                type="text"
                                placeholder="새로운 대분류 이름을 입력하세요..."
                                value={newRootName}
                                onChange={(e) => setNewRootName(e.target.value)}
                                className="input-control"
                                style={{ flex: 1 }}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRoot()}
                            />
                            <button onClick={handleAddRoot} className="btn btn-primary">등록하기</button>
                            <button onClick={() => setIsAddingRoot(false)} className="btn btn-ghost"><X size={20} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isLoading ? (
                    <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        데이터를 불러오는 중입니다...
                    </div>
                ) : treeData.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <ListChecks size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>등록된 항목이 없습니다. 대분류를 추가하여 시작하세요.</p>
                    </div>
                ) : (
                    treeData.map(item => renderItem(item, 0))
                )}
            </div>

            <style jsx>{`
                .checkbox-custom {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .checkbox-custom.checked {
                    background: var(--primary);
                    border-color: var(--primary);
                    box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
                }
            `}</style>
        </div>
    );
};

export default ItemManagementPage;
