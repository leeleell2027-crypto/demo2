"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, Home, X, Upload, Calendar, Tag, FileText, ReceiptText, ChevronLeft, ChevronRight, Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

interface Board {
    id: number;
    title: string;
    eventDate: string;
    content: string;
    category1: string;
    category2: string;
    category3: string;
    imageUrl: string;
    createdAt: string;
}

const apiCache: { [key: string]: { promise?: Promise<any>, data?: any, timestamp?: number } } = {};

const fetchWithCache = async (url: string, signal?: AbortSignal) => {
    const now = Date.now();
    const cached = apiCache[url];

    if (cached?.data && (now - (cached.timestamp || 0) < 5000)) {
        return cached.data;
    }

    if (cached?.promise) {
        return cached.promise;
    }

    const promise = (async () => {
        try {
            const response = await fetch(url, { signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            apiCache[url] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            delete apiCache[url];
            throw error;
        }
    })();

    apiCache[url] = { promise };
    return promise;
};

const GalleryPage = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState<'gallery' | 'table'>('gallery');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateRangeType, setDateRangeType] = useState('all'); // all, today, week, month, custom
    const [searchCategory1, setSearchCategory1] = useState('');
    const [searchCategory2, setSearchCategory2] = useState('');
    const [searchCategory3, setSearchCategory3] = useState('');

    const abortControllerRef = useRef<AbortController | null>(null);
    const lastInitiatedParams = useRef("");

    // Edit state
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [content, setContent] = useState('');
    const [category1, setCategory1] = useState('');
    const [category2, setCategory2] = useState('');
    const [category3, setCategory3] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchBoards(currentPage, debouncedSearchTerm, startDate, endDate, searchCategory1, searchCategory2, searchCategory3);
    }, [currentPage, debouncedSearchTerm, startDate, endDate, searchCategory1, searchCategory2, searchCategory3]);

    const handleDateRangeChange = (type: string) => {
        setDateRangeType(type);
        if (type === 'all') {
            setStartDate('');
            setEndDate('');
            return;
        }
        const today = new Date();
        let start = new Date();

        if (type === 'today') {
            // No change to start
        } else if (type === 'week') {
            start.setDate(today.getDate() - 7);
        } else if (type === 'month') {
            start.setDate(1);
        }

        const formatDate = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        if (type !== 'custom') {
            setStartDate(formatDate(start));
            setEndDate(formatDate(today));
        }
    };

    const fetchBoards = async (
        page: number,
        search: string = '',
        start: string = '',
        end: string = '',
        c1: string = '',
        c2: string = '',
        c3: string = ''
    ) => {
        const params = `page=${page}&size=16&searchTitle=${encodeURIComponent(search)}&startDate=${start}&endDate=${end}&category1=${encodeURIComponent(c1)}&category2=${encodeURIComponent(c2)}&category3=${encodeURIComponent(c3)}`;

        if (lastInitiatedParams.current === params) return;
        lastInitiatedParams.current = params;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const url = `/api/boards?${params}`;
            const data = await fetchWithCache(url, abortControllerRef.current.signal);

            setBoards(data.boards);
            setTotalPages(data.totalPages);
            setTotalCount(data.totalCount);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Failed to fetch boards', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !eventDate || (!selectedFile && !isEditMode)) {
            alert('제목, 날짜, 이미지는 필수 항목입니다.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('eventDate', eventDate);
        formData.append('content', content);
        formData.append('category1', category1);
        formData.append('category2', category2);
        formData.append('category3', category3);
        if (selectedFile) {
            formData.append('image', selectedFile);
        }
        if (isEditMode && previewUrl) {
            formData.append('imageUrl', previewUrl);
        }

        try {
            const url = isEditMode ? `/api/boards/${editId}` : '/api/boards';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchBoards(currentPage);
            } else {
                const errorText = await res.text();
                alert('요청 실패: ' + errorText);
            }
        } catch (error) {
            console.error('Request error', error);
            alert('요청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (board: Board) => {
        setIsEditMode(true);
        setEditId(board.id);
        setTitle(board.title);
        setEventDate(board.eventDate);
        setContent(board.content);
        setCategory1(board.category1);
        setCategory2(board.category2);
        setCategory3(board.category3);
        setPreviewUrl(board.imageUrl);
        setSelectedFile(null);
        setShowModal(true);
        setSelectedBoard(null); // Close detail view if open
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/boards/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchBoards(currentPage);
                setSelectedBoard(null);
            } else {
                alert('삭제 실패');
            }
        } catch (error) {
            console.error('Delete error', error);
            alert('삭제 중 오류 발생');
        }
    };

    const resetForm = () => {
        setTitle('');
        setEventDate('');
        setContent('');
        setCategory1('');
        setCategory2('');
        setCategory3('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsEditMode(false);
        setEditId(null);
    };

    // 16개 그리드를 채우기 위한 로직
    const gridItems = [...boards];
    while (gridItems.length < 16) {
        gridItems.push({ id: -1, title: '', eventDate: '', content: '', category1: '', category2: '', category3: '', imageUrl: '', createdAt: '' });
    }
    const displayItems = gridItems.slice(0, 16);

    return (
        <div style={{ padding: '40px 24px', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                {/* Header Section */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Asset Gallery</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Showcasing {totalCount} premium moments</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', border: '1px solid var(--glass-border)' }}>
                                <button onClick={() => setActiveView('gallery')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'gallery' ? 'var(--primary)' : 'transparent', color: activeView === 'gallery' ? 'black' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, transition: '0.2s' }}>
                                    <ImageIcon size={16} /> Gallery
                                </button>
                                <button onClick={() => setActiveView('table')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'table' ? 'var(--primary)' : 'transparent', color: activeView === 'table' ? 'black' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, transition: '0.2s' }}>
                                    <ReceiptText size={16} /> Table
                                </button>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowModal(true)}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
                            >
                                <Plus size={20} /> Upload
                            </motion.button>
                        </div>
                    </div>

                    {/* Filter Section (Row 2) */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)' }}>
                        {/* Title Search */}
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Search Title</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        padding: '10px 12px 10px 36px',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        {/* Date Filters */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Date Range</label>
                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '8px' }}>
                                {['all', 'today', 'week', 'month'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleDateRangeChange(type)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: dateRangeType === type ? 'var(--primary)' : 'transparent',
                                            color: dateRangeType === type ? 'black' : 'white',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {type === 'all' ? '전체' : type === 'today' ? '당일' : type === 'week' ? '주간' : '월간'}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setDateRangeType('custom'); }}
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 12px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                                />
                                <span style={{ color: 'var(--text-muted)' }}>~</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setDateRangeType('custom'); }}
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 12px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Categories */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Cat 1</label>
                                <input
                                    type="text"
                                    placeholder="Category 1"
                                    value={searchCategory1}
                                    onChange={(e) => setSearchCategory1(e.target.value)}
                                    style={{ width: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Cat 2</label>
                                <input
                                    type="text"
                                    placeholder="Category 2"
                                    value={searchCategory2}
                                    onChange={(e) => setSearchCategory2(e.target.value)}
                                    style={{ width: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Cat 3</label>
                                <input
                                    type="text"
                                    placeholder="Category 3"
                                    value={searchCategory3}
                                    onChange={(e) => setSearchCategory3(e.target.value)}
                                    style={{ width: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conditional Rendering of Views */}
                <AnimatePresence mode="wait">
                    {activeView === 'gallery' ? (
                        <motion.div
                            key="gallery"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* 4x4 Grid View */}
                            <div id="gallery-section" style={{ marginBottom: '60px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <ImageIcon size={20} style={{ color: 'var(--primary)' }} />
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Featured Gallery</h2>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '24px',
                                    perspective: '1000px'
                                }}>
                                    {displayItems.map((item, index) => (
                                        <motion.div
                                            key={item.id !== -1 ? item.id : `empty-${index}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{
                                                scale: 1.05,
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                                                zIndex: 1
                                            }}
                                            onClick={() => item.id !== -1 && setSelectedBoard(item)}
                                            style={{
                                                aspectRatio: '1/1',
                                                borderRadius: '20px',
                                                overflow: 'hidden',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid var(--glass-border)',
                                                cursor: item.id !== -1 ? 'pointer' : 'default',
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {item.id !== -1 ? (
                                                <>
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'filter 0.3s ease' }}
                                                        className="grid-image"
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        whileHover={{ opacity: 1 }}
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'flex-end',
                                                            padding: '20px',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{item.title}</p>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            {item.category1 && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>#{item.category1}</span>}
                                                            {item.category2 && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>#{item.category2}</span>}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            ) : (
                                                <ImageIcon size={32} style={{ opacity: 0.1 }} />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Table Layout */}
                            <div id="table-section" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <ReceiptText size={20} style={{ color: 'var(--primary)' }} />
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Management List</h2>
                            </div>

                            <div className="glass-card" style={{ overflow: 'hidden', padding: 0, borderRadius: '20px', border: '1px solid var(--glass-border)', marginBottom: '40px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <tr>
                                            <th style={{ padding: '20px 24px' }}>ID</th>
                                            <th style={{ padding: '20px 24px' }}>Thumbnail</th>
                                            <th style={{ padding: '20px 24px' }}>Title</th>
                                            <th style={{ padding: '20px 24px' }}>Event Date</th>
                                            <th style={{ padding: '20px 24px' }}>Categories</th>
                                            <th style={{ padding: '20px 24px' }}>Created At</th>
                                            <th style={{ padding: '20px 24px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {boards.map((item, index) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                                onClick={() => setSelectedBoard(item)}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                                            >
                                                <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>#{item.id}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                                        <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{item.title}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                                        <Calendar size={14} style={{ color: 'var(--primary)' }} />
                                                        {item.eventDate}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        {item.category1 && <span className="badge-sm">{item.category1}</span>}
                                                        {item.category2 && <span className="badge-sm" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>{item.category2}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                                                        >
                                                            <Pencil size={14} />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, background: 'rgba(239, 68, 68, 0.2)' }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {boards.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                    <p>No boards found. Upload your first image!</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '24px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '40px' }}>
                    <button
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(p => p - 1)}
                        style={{ background: 'transparent', border: 'none', color: currentPage === 0 ? 'rgba(255,255,255,0.2)' : 'white', cursor: currentPage === 0 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: currentPage === i ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: currentPage === i ? 'black' : 'white',
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
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ background: 'transparent', border: 'none', color: currentPage >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Upload Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="glass-card"
                                style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '40px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{isEditMode ? 'Edit Post' : 'Create New Post'}</h2>
                                    <button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <X size={28} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                    {/* Left Side: Image Upload */}
                                    <div>
                                        <div
                                            onClick={() => document.getElementById('fileInput')?.click()}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1/1',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '2px dashed var(--glass-border)',
                                                borderRadius: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}
                                        >
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <>
                                                    <Upload size={40} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                                                    <span style={{ fontWeight: 600 }}>Click to upload image</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, WEBP, GIF</span>
                                                </>
                                            )}
                                            <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        </div>
                                        <div style={{ marginTop: '20px' }}>
                                            <label className="label">Content (내용)</label>
                                            <textarea
                                                className="glass-input"
                                                style={{ height: '120px', resize: 'none' }}
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="Tell us about this moment..."
                                            />
                                        </div>
                                    </div>

                                    {/* Right Side: metadata */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label className="label"><FileText size={14} style={{ marginRight: '6px' }} /> Title (제목)</label>
                                            <input type="text" className="glass-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" />
                                        </div>
                                        <div>
                                            <label className="label"><Calendar size={14} style={{ marginRight: '6px' }} /> Event Date (날짜)</label>
                                            <input type="date" className="glass-input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label className="label"><Tag size={14} style={{ marginRight: '6px' }} /> Category 1</label>
                                                <input type="text" className="glass-input" value={category1} onChange={(e) => setCategory1(e.target.value)} placeholder="e.g. Travel" />
                                            </div>
                                            <div>
                                                <label className="label"><Tag size={14} style={{ marginRight: '6px' }} /> Category 2</label>
                                                <input type="text" className="glass-input" value={category2} onChange={(e) => setCategory2(e.target.value)} placeholder="e.g. Nature" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label"><Tag size={14} style={{ marginRight: '6px' }} /> Category 3</label>
                                            <input type="text" className="glass-input" value={category3} onChange={(e) => setCategory3(e.target.value)} placeholder="e.g. 2026" />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            style={{ marginTop: 'auto', background: 'var(--primary)', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                        >
                                            {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : <>{isEditMode ? <Pencil size={20} /> : <Upload size={20} />} {isEditMode ? 'Update Post' : 'Create Post'}</>}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Detail View Modal */}
                <AnimatePresence>
                    {selectedBoard && (
                        <div
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
                            onClick={() => setSelectedBoard(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="glass-card"
                                onClick={(e) => e.stopPropagation()}
                                style={{ maxWidth: '1000px', width: '100%', overflow: 'hidden', padding: 0, borderRadius: '24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}
                            >
                                <div style={{ position: 'relative', height: '600px', background: '#000' }}>
                                    <img src={selectedBoard.imageUrl} alt={selectedBoard.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    <button
                                        onClick={() => setSelectedBoard(null)}
                                        style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            {selectedBoard.category1 && <span className="badge">{selectedBoard.category1}</span>}
                                            {selectedBoard.category2 && <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)' }}>{selectedBoard.category2}</span>}
                                            {selectedBoard.category3 && <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{selectedBoard.category3}</span>}
                                        </div>
                                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.1 }}>{selectedBoard.title}</h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {selectedBoard.eventDate}</div>
                                            <span>•</span>
                                            <div>Post ID: {selectedBoard.id}</div>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '1.1rem' }}>
                                        {selectedBoard.content || "No detailed description provided."}
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleEdit(selectedBoard)}
                                                style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Pencil size={16} /> Edit
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.2)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleDelete(selectedBoard.id)}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Trash2 size={16} /> Delete
                                            </motion.button>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedBoard(null)}
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Close
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <style jsx>{`
                .label {
                    display: flex;
                    align-items: center;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-bottom: 8px;
                }
                .badge {
                    background: rgba(99, 102, 241, 0.1);
                    color: var(--primary);
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                }
                .badge-sm {
                    background: rgba(99, 102, 241, 0.1);
                    color: var(--primary);
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                }
                .grid-image {
                    filter: brightness(0.9) contrast(1.1);
                }
                :global(.grid-image:hover) {
                    filter: brightness(1.1) contrast(1.1);
                }
                @media (max-width: 1024px) {
                    div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 640px) {
                    div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
                        grid-template-columns: repeat(1, 1fr) !important;
                    }
                }
            `}</style>
            </div>
        </div>
    );
};

export default GalleryPage;
