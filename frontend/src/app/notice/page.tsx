"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    FileText,
    Paperclip,
    MessageSquare,
    Eye,
    Clock,
    User,
    CornerDownRight,
    ArrowLeft,
    Send,
    Trash2,
    Download,
    X,
    Calendar,
    Hash
} from 'lucide-react';

interface Notice {
    id: number;
    title: string;
    memberId: string;
    content: string;
    ipAddress: string;
    createdAt: string;
    updatedAt: string;
    noticeStartDate: string;
    noticeEndDate: string;
    ref: number;
    step: number;
    depth: number;
    viewCount: number;
    memberName: string;
    commentCount: number;
    attachmentCount: number;
    attachments?: Attachment[];
    comments?: Comment[];
}

interface Attachment {
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    contentType: string;
}

interface Comment {
    id: number;
    noticeId: number;
    parentId?: number;
    memberId: string;
    memberName: string;
    content: string;
    createdAt: string;
    depth?: number;
}

const NoticePage = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
    const [notices, setNotices] = useState<Notice[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isReply, setIsReply] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    // Form states
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Comment state
    const [commentText, setCommentText] = useState('');
    const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);

    useEffect(() => {
        fetchNotices();
    }, [page, searchTerm]);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/notices?page=${page}&size=10&searchTitle=${searchTerm}`);
            const data = await res.json();
            setNotices(data.notices);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Fetch notices failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDetail = async (id: number) => {
        try {
            const res = await fetch(`/api/notices/${id}`);
            const data = await res.json();
            setSelectedNotice(data);
            setView('detail');
        } catch (error) {
            console.error("Fetch notice detail failed:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        const noticeData = {
            title: formTitle,
            content: formContent,
            memberId: user?.username || 'user',
            noticeStartDate: formStartDate || null,
            noticeEndDate: formEndDate || null
        };

        formData.append('notice', new Blob([JSON.stringify(noticeData)], { type: 'application/json' }));
        selectedFiles.forEach(file => formData.append('files', file));

        try {
            let url = '/api/notices';
            if (isEdit && selectedNotice) {
                url = `/api/notices/${selectedNotice.id}`;
            } else if (isReply && selectedNotice) {
                url = `/api/notices/${selectedNotice.id}/replies`;
            }

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                body: formData
            });

            if (res.ok) {
                alert(isEdit ? "공지사항이 수정되었습니다." : isReply ? "답글이 등록되었습니다." : "공지사항이 등록되었습니다.");
                setView('list');
                fetchNotices();
                resetForm();
            }
        } catch (error) {
            console.error("Submit failed:", error);
        }
    };

    const handleDeleteNotice = async (id: number) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("삭제되었습니다.");
                setView('list');
                fetchNotices();
            } else {
                const err = await res.text();
                alert(err || "삭제 권한이 없습니다.");
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleEditNotice = () => {
        if (!selectedNotice) return;
        setFormTitle(selectedNotice.title);
        setFormContent(selectedNotice.content);
        setFormStartDate(selectedNotice.noticeStartDate || '');
        setFormEndDate(selectedNotice.noticeEndDate || '');
        setIsEdit(true);
        setIsReply(false);
        setView('form');
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedNotice) return;
        try {
            const res = await fetch(`/api/notices/${selectedNotice.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: commentText,
                    memberId: user?.username || 'user',
                    parentId: replyToCommentId
                })
            });
            if (res.ok) {
                setCommentText('');
                setReplyToCommentId(null);
                handleDetail(selectedNotice.id); // 새로고침
            }
        } catch (error) {
            console.error("Add comment failed:", error);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`/api/notices/comments/${commentId}`, { method: 'DELETE' });
            if (res.ok) {
                handleDetail(selectedNotice!.id);
            } else {
                alert("삭제 권한이 없습니다.");
            }
        } catch (error) {
            console.error("Delete comment failed:", error);
        }
    };

    const resetForm = () => {
        setFormTitle('');
        setFormContent('');
        setFormStartDate('');
        setFormEndDate('');
        setSelectedFiles([]);
        setIsReply(false);
        setIsEdit(false);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Notice Board
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>시스템 공지사항 및 안내를 확인하세요.</p>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => { resetForm(); setView('form'); }}
                        className="glass-button"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '14px', background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }}
                    >
                        <Plus size={20} />
                        공지 작성
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        {/* Search & Stats */}
                        <div className="glass-card" style={{ padding: '16px', borderRadius: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="공지사항 제목으로 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* List Table */}
                        <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <tr>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>번호</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>제목</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>공지기간</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>작성자</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>작성일</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>첨부</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>댓글</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>조회</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>로딩 중...</td>
                                        </tr>
                                    ) : notices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>게시글이 없습니다.</td>
                                        </tr>
                                    ) : notices.map((notice) => (
                                        <tr
                                            key={notice.id}
                                            onClick={() => handleDetail(notice.id)}
                                            style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{notice.id}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {notice.depth > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: `${notice.depth * 20}px`, color: 'var(--primary)' }}>
                                                            <CornerDownRight size={14} />
                                                        </div>
                                                    )}
                                                    <span style={{ fontWeight: 500 }}>{notice.title}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {notice.noticeStartDate ? `${notice.noticeStartDate} ~ ${notice.noticeEndDate || ''}` : '-'}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{(notice.memberName || notice.memberId || 'U')[0].toUpperCase()}</div>
                                                    <span>{notice.memberName || notice.memberId || '알수없음'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatDate(notice.createdAt)}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                                    {notice.attachments && notice.attachments.map(att => (
                                                        <a
                                                            key={att.id}
                                                            href={att.filePath}
                                                            download={att.fileName}
                                                            title={att.fileName}
                                                            style={{ color: 'var(--primary)', opacity: 0.8, transition: 'transform 0.2s' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        >
                                                            <Paperclip size={16} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (notice.commentCount || 0) > 0 ? '#fff' : 'var(--text-muted)', fontWeight: (notice.commentCount || 0) > 0 ? 600 : 400 }}>
                                                    <MessageSquare size={14} style={{ opacity: (notice.commentCount || 0) > 0 ? 1 : 0.5 }} />
                                                    <span style={{ fontSize: '0.9rem' }}>{notice.commentCount || 0}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{notice.viewCount || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid var(--glass-border)' }}>
                                <button disabled={page === 0} onClick={() => setPage(page - 1)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: page === 0 ? '#444' : 'white' }}><ChevronLeft size={18} /></button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} onClick={() => setPage(i)} style={{ padding: '8px 12px', borderRadius: '8px', background: page === i ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: 'white' }}>{i + 1}</button>
                                ))}
                                <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: page >= totalPages - 1 ? '#444' : 'white' }}><ChevronRight size={18} /></button>
                            </div>
                        </div>
                    </motion.div>
                ) : view === 'detail' && selectedNotice ? (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                    >
                        <button onClick={() => { setView('list'); fetchNotices(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><ArrowLeft size={18} /> 목록으로 돌아가기</button>

                        <div className="glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
                            <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>NOTICE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {selectedNotice.memberName || selectedNotice.memberId || '알수없음'}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {formatDate(selectedNotice.createdAt)}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {selectedNotice.viewCount || 0}</span>
                                    </div>
                                </div>
                                <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '20px' }}>{selectedNotice.title}</h2>
                                {selectedNotice.noticeStartDate && (
                                    <p style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
                                        공지 기간: {selectedNotice.noticeStartDate} ~ {selectedNotice.noticeEndDate || ''}
                                    </p>
                                )}
                            </div>

                            <div style={{ fontSize: '1.1rem', lineHeight: '1.8', minHeight: '300px', whiteSpace: 'pre-wrap' }}>
                                {selectedNotice.content}
                            </div>

                            {/* Attachments */}
                            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                                <div style={{ marginTop: '40px', padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Paperclip size={16} /> 첨부파일 ({selectedNotice.attachments.length})</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                        {selectedNotice.attachments.map(att => (
                                            <a
                                                key={att.id}
                                                href={att.filePath}
                                                download={att.fileName}
                                                className="glass-card"
                                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '12px', textDecoration: 'none', color: 'white', fontSize: '0.85rem' }}
                                            >
                                                <FileText size={16} />
                                                <span>{att.fileName}</span>
                                                <Download size={14} style={{ color: 'var(--text-muted)' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detail Buttons */}
                            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => { setIsReply(true); setIsEdit(false); setView('form'); setFormTitle(`RE: ${selectedNotice.title}`); }} className="glass-button" style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>답글 쓰기</button>
                                {user?.username === selectedNotice.memberId && (
                                    <>
                                        <button onClick={handleEditNotice} className="glass-button" style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }}>수정</button>
                                        <button onClick={() => handleDeleteNotice(selectedNotice.id)} className="glass-button" style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,22,255,0.05)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)', cursor: 'pointer' }}>삭제</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="glass-card" style={{ padding: '32px', borderRadius: '32px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20} /> 댓글 ({selectedNotice.comments?.length || 0})</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                                {selectedNotice.comments?.map(comment => (
                                    <div key={comment.id} style={{ display: 'flex', gap: '16px', marginLeft: (comment.depth || 0) * 32 + 'px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                            {comment.parentId && <CornerDownRight size={12} style={{ marginRight: '4px', opacity: 0.5 }} />}
                                            {(comment.memberName || comment.memberId || 'U')[0].toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comment.memberName || comment.memberId || '알수없음'}</span>
                                                    <button onClick={() => setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', padding: '2px 4px', opacity: 0.8 }}>답글</button>
                                                    {user?.username === comment.memberId && (
                                                        <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '0.75rem', cursor: 'pointer', padding: '2px 4px', opacity: 0.7 }}>삭제</button>
                                                    )}
                                                </div>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(comment.createdAt)}</span>
                                            </div>
                                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.5' }}>{comment.content}</p>

                                            {replyToCommentId === comment.id && (
                                                <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                                                    <textarea
                                                        placeholder="답글을 입력하세요..."
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        autoFocus
                                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', minHeight: '60px', resize: 'none', fontSize: '0.9rem' }}
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <button onClick={handleAddComment} style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>등록</button>
                                                        <button onClick={() => setReplyToCommentId(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>취소</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ position: 'relative' }}>
                                <textarea
                                    placeholder="댓글을 입력하세요..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', minHeight: '100px', resize: 'none' }}
                                />
                                <button
                                    onClick={handleAddComment}
                                    style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '8px 16px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Send size={16} /> 등록
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card"
                        style={{ padding: '40px', borderRadius: '32px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{isEdit ? '공지사항 수정' : isReply ? '답글 작성' : '공지사항 작성'}</h2>
                            <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>제목</label>
                                    <input
                                        type="text"
                                        required
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="공지사항 제목을 입력하세요."
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>공지 시작일</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                        <input
                                            type="date"
                                            value={formStartDate}
                                            onChange={(e) => setFormStartDate(e.target.value)}
                                            style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>공지 종료일</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                        <input
                                            type="date"
                                            value={formEndDate}
                                            onChange={(e) => setFormEndDate(e.target.value)}
                                            style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>내용</label>
                                    <textarea
                                        required
                                        value={formContent}
                                        onChange={(e) => setFormContent(e.target.value)}
                                        placeholder="내용을 상세히 입력해 주세요."
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', minHeight: '300px', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>첨부파일</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ padding: '30px', border: '2px dashed var(--glass-border)', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            ref={fileInputRef}
                                            onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                                        />
                                        <Paperclip size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                                        <p style={{ fontWeight: 500 }}>파일을 드래그하거나 클릭하여 업로드</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>여러 개의 파일을 선택할 수 있습니다.</p>
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                                    <FileText size={14} />
                                                    <span>{file.name}</span>
                                                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button type="button" onClick={() => setView('list')} className="glass-button" style={{ padding: '14px 30px', borderRadius: '14px', background: 'none', color: 'white', border: '1px solid var(--glass-border)', fontWeight: 600, cursor: 'pointer' }}>취소</button>
                                <button type="submit" className="glass-button" style={{ padding: '14px 40px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }}>저장하기</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    border: 1px solid var(--glass-border);
                }
                .glass-button:hover {
                    filter: brightness(1.2);
                    transform: translateY(-1px);
                }
                .glass-button:active {
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
};

export default NoticePage;
