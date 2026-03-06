"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Pagination from '@/components/Pagination';
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
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [page, setPage] = useState(0);
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const noticeIdParam = searchParams.get('id');

    // List Query
    const { data: listData, isLoading: listLoading } = useQuery({
        queryKey: ['notices', page, searchTerm],
        queryKeyHashFn: (key) => JSON.stringify(key),
        queryFn: async () => {
            const res = await fetch(`/api/notices?page=${page}&size=10&searchTitle=${searchTerm}`);
            return res.json();
        }
    });

    // Detail Query
    const { data: detailData, isLoading: detailLoading } = useQuery({
        queryKey: ['notice', selectedId],
        queryFn: async () => {
            if (!selectedId) return null;
            const res = await fetch(`/api/notices/${selectedId}`);
            return res.json();
        },
        enabled: !!selectedId
    });

    const notices = listData?.notices || [];
    const totalPages = listData?.totalPages || 0;
    const selectedNotice = detailData || null;
    const loading = listLoading || detailLoading;

    useEffect(() => {
        if (noticeIdParam) {
            handleDetail(parseInt(noticeIdParam));
        } else {
            setView('list');
            setSelectedId(null);
        }
    }, [noticeIdParam]);

    const handleDetail = (id: number) => {
        setSelectedId(id);
        setView('detail');
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
                queryClient.invalidateQueries({ queryKey: ['notices'] });
                if (isEdit || isReply) {
                    queryClient.invalidateQueries({ queryKey: ['notice', selectedId] });
                }
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
                queryClient.invalidateQueries({ queryKey: ['notices'] });
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
                queryClient.invalidateQueries({ queryKey: ['notice', selectedNotice.id] });
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
                queryClient.invalidateQueries({ queryKey: ['notice', selectedNotice!.id] });
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

    const isToday = (dateString: string) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const now = new Date();
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="header-title">Notice Board</h1>
                    <p className="header-subtitle">시스템 공지사항 및 안내를 확인하세요.</p>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => { resetForm(); setView('form'); }}
                        className="btn btn-primary"
                    >
                        <Plus size={20} />
                        공지 작성
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                    {/* Search & Stats */}
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="text"
                                placeholder="공지사항 제목으로 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-control"
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    {/* List Table */}
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>번호</th>
                                    <th>제목</th>
                                    <th>공지기간</th>
                                    <th>작성자</th>
                                    <th>작성일</th>
                                    <th>첨부</th>
                                    <th>댓글</th>
                                    <th>조회</th>
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
                                ) : notices.map((notice: Notice) => (
                                    <tr
                                        key={notice.id}
                                        onClick={() => handleDetail(notice.id)}
                                        style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td>{notice.id}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {notice.depth > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: `${notice.depth * 20}px`, color: 'var(--primary)' }}>
                                                        <CornerDownRight size={14} />
                                                    </div>
                                                )}
                                                <span style={{ fontWeight: 500 }}>{notice.title}</span>
                                                {isToday(notice.createdAt) && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 800,
                                                        marginLeft: '4px',
                                                        lineHeight: 1
                                                    }}>N</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {notice.noticeStartDate ? `${notice.noticeStartDate} ~ ${notice.noticeEndDate || ''}` : '-'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="avatar-round avatar-primary">{(notice.memberName || notice.memberId || 'U')[0].toUpperCase()}</div>
                                                <span>{notice.memberName || notice.memberId || '알수없음'}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatDate(notice.createdAt)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                                {notice.attachments && notice.attachments.map((att: Attachment) => (
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

                        {/* Pagination Controls */}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalCount={listData?.totalCount || 0}
                            onPageChange={setPage}
                            zeroIndexed={true}
                            style={{ borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)', padding: '24px 0 24px' }}
                        />
                    </div>
                </motion.div>
            ) : view === 'detail' && selectedNotice ? (
                <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                >
                    <button
                        onClick={() => {
                            setView('list');
                            queryClient.invalidateQueries({ queryKey: ['notices'] });
                            router.push('/notice');
                            window.scrollTo(0, 0);
                        }}
                        className="btn btn-ghost"
                        style={{ gap: '8px', padding: 0 }}
                    >
                        <ArrowLeft size={18} /> 목록으로 돌아가기
                    </button>

                    <div className="glass-panel" style={{ padding: '40px' }}>
                        <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <span className="badge badge-notice">NOTICE</span>
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
                                    {selectedNotice.attachments.map((att: Attachment) => (
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
                            <button onClick={() => { setIsReply(true); setIsEdit(false); setView('form'); setFormTitle(`RE: ${selectedNotice.title}`); }} className="btn btn-secondary">답글 쓰기</button>
                            {user?.username === selectedNotice.memberId && (
                                <>
                                    <button onClick={handleEditNotice} className="btn btn-outline-primary">수정</button>
                                    <button onClick={() => handleDeleteNotice(selectedNotice.id)} className="btn btn-danger">삭제</button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="glass-panel" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20} /> 댓글 ({selectedNotice.comments?.length || 0})</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                            {selectedNotice.comments?.map((comment: Comment) => (
                                <div key={comment.id} style={{ display: 'flex', gap: '16px', marginLeft: (comment.depth || 0) * 32 + 'px' }}>
                                    <div className="avatar-round">
                                        {comment.parentId && <CornerDownRight size={12} style={{ marginRight: '4px', opacity: 0.5 }} />}
                                        {(comment.memberName || comment.memberId || 'U')[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comment.memberName || comment.memberId || '알수없음'}</span>
                                                <button onClick={() => setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id)} className="btn btn-ghost" style={{ color: 'var(--primary)' }}>답글</button>
                                                {user?.username === comment.memberId && (
                                                    <button onClick={() => handleDeleteComment(comment.id)} className="btn btn-ghost" style={{ color: '#ff4444' }}>삭제</button>
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
                                                    className="textarea-control"
                                                    style={{ flex: 1, minHeight: '60px' }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <button onClick={handleAddComment} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>등록</button>
                                                    <button onClick={() => setReplyToCommentId(null)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>취소</button>
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
                                className="textarea-control"
                                style={{ minHeight: '100px' }}
                            />
                            <button
                                onClick={handleAddComment}
                                className="btn btn-primary"
                                style={{ position: 'absolute', right: '12px', bottom: '12px' }}
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
                    className="glass-panel"
                    style={{ padding: '40px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{isEdit ? '공지사항 수정' : isReply ? '답글 작성' : '공지사항 작성'}</h2>
                        <button onClick={() => { setView('list'); router.push('/notice'); window.scrollTo(0, 0); }} className="btn btn-ghost" style={{ opacity: 1 }}><X size={24} /></button>
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
                                    className="input-control"
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
                                        className="input-control"
                                        style={{ paddingLeft: '40px' }}
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
                                        className="input-control"
                                        style={{ paddingLeft: '40px' }}
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
                                    className="textarea-control"
                                    style={{ minHeight: '300px' }}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>첨부파일</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="dropzone"
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
                            <button type="button" onClick={() => { setView('list'); router.push('/notice'); window.scrollTo(0, 0); }} className="btn btn-secondary" style={{ padding: '14px 30px' }}>취소</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '14px 40px' }}>저장하기</button>
                        </div>
                    </form>
                </motion.div>
            )}
        </div>
    );
};

const WrappedNoticePage = () => (
    <Suspense fallback={<div className="page-container"><div className="glass-panel" style={{ padding: '100px', textAlign: 'center' }}>Loading...</div></div>}>
        <NoticePage />
    </Suspense>
);

export default WrappedNoticePage;
