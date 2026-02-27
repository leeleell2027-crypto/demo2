"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, Home, X, Upload, Calendar, Tag, FileText } from 'lucide-react';
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

const GalleryPage = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(false);

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
        fetchBoards(currentPage);
    }, [currentPage]);

    const fetchBoards = async (page: number) => {
        try {
            const res = await fetch(`/api/boards?page=${page}&size=16`);
            if (res.ok) {
                const data = await res.json();
                setBoards(data.boards);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
            }
        } catch (error) {
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
        if (!title || !eventDate || !selectedFile) {
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
        formData.append('image', selectedFile);

        try {
            const res = await fetch('/api/boards', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                if (currentPage === 0) {
                    fetchBoards(0);
                } else {
                    setCurrentPage(0); // 첫 페이지로 이동하여 새 글 확인
                }
            } else {
                const errorText = await res.text();
                alert('업로드 실패: ' + errorText);
            }
        } catch (error) {
            console.error('Upload error', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
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
    };

    // 16개 그리드를 채우기 위한 로직
    const gridItems = [...boards];
    while (gridItems.length < 16) {
        gridItems.push({ id: -1, title: '', eventDate: '', content: '', category1: '', category2: '', category3: '', imageUrl: '', createdAt: '' });
    }
    const displayItems = gridItems.slice(0, 16);

    return (
        <main style={{ minHeight: '100vh', width: '100vw', padding: '40px 20px', background: '#0f172a', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link href="/">
                            <motion.div whileHover={{ scale: 1.1 }} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>
                                <Home size={24} />
                            </motion.div>
                        </Link>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Image Gallery</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Showcasing {totalCount} premium moments</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowModal(true)}
                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
                    >
                        <Plus size={20} /> Upload Image
                    </motion.button>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {displayItems.map((item, index) => (
                        <motion.div
                            key={item.id !== -1 ? item.id : `empty-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={item.id !== -1 ? { scale: 1.02, y: -5 } : {}}
                            onClick={() => item.id !== -1 && setSelectedBoard(item)}
                            className="glass-card"
                            style={{
                                height: '340px',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                opacity: item.id === -1 ? 0.4 : 1,
                                border: item.id === -1 ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--glass-border)',
                                cursor: item.id === -1 ? 'default' : 'pointer'
                            }}
                        >
                            {item.id !== -1 ? (
                                <>
                                    <div style={{ height: '200px', width: '100%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                                        <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {item.category1 && <span className="badge">{item.category1}</span>}
                                            {item.category2 && <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)' }}>{item.category2}</span>}
                                        </div>
                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <span>{item.eventDate}</span>
                                            <span>ID: {item.id}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
                                    <ImageIcon size={48} />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(p => p - 1)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: currentPage === 0 ? 'rgba(255,255,255,0.2)' : 'white',
                                border: '1px solid var(--glass-border)',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                cursor: currentPage === 0 ? 'default' : 'pointer'
                            }}
                        >
                            Previous
                        </motion.button>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => setCurrentPage(i)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: currentPage === i ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        border: currentPage === i ? 'none' : '1px solid var(--glass-border)',
                                        boxShadow: currentPage === i ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                                    }}
                                >
                                    {i + 1}
                                </motion.button>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage(p => p + 1)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: currentPage === totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'white',
                                border: '1px solid var(--glass-border)',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                cursor: currentPage === totalPages - 1 ? 'default' : 'pointer'
                            }}
                        >
                            Next
                        </motion.button>
                    </div>
                )}
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
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Create New Post</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
                                        {loading ? 'Publishing...' : <><Upload size={20} /> Create Post</>}
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
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Registered: {new Date(selectedBoard.createdAt).toLocaleDateString()}
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
            `}</style>
        </main >
    );
};

export default GalleryPage;
