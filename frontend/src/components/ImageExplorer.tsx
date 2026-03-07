"use client";

import React, { useState } from 'react';
import { FolderOpen, Search, Maximize2, X, Loader2, AlertCircle, ChevronDown, FolderSearch, ChevronRight, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/image-explorer.css';

const API_BASE = '/api/images';

interface ImageFile {
    name: string;
    path: string;
    size: number;
}

interface FolderItem {
    name: string;
    path: string;
}

interface TreeItem extends FolderItem {
    children?: TreeItem[];
    isExpanded?: boolean;
    isLoading?: boolean;
}

export default function ImageExplorer() {
    const [path, setPath] = useState('');
    const [images, setImages] = useState<ImageFile[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [siblings, setSiblings] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
    const [showSiblingModal, setShowSiblingModal] = useState(false);

    // Sidebar tree state
    const [treeData, setTreeData] = useState<TreeItem[]>([]);

    const fetchImages = async (targetPath?: string) => {
        const pathRequest = targetPath !== undefined ? targetPath : path;
        if (!pathRequest.trim()) return;
        setLoading(true);
        setError('');
        setShowSiblingModal(false);
        try {
            const resp = await fetch(`${API_BASE}?path=${encodeURIComponent(pathRequest)}`);
            const data = await resp.json();
            if (resp.ok) {
                setImages(data.images || []);
                setFolders(data.folders || []);
                setSiblings(data.siblings || []);
                setPath(pathRequest);

                // Update tree roots if empty
                if (treeData.length === 0) {
                    const root = pathRequest.split(/[\\/]/)[0];
                    if (root.includes(':')) {
                        setTreeData([{ name: root, path: root + '\\', children: [], isExpanded: true }]);
                    }
                }

                if (data.images.length === 0 && data.folders.length === 0) setError('이 폴더가 비어있습니다.');
            } else {
                setError(data.error || '폴더를 찾을 수 없습니다.');
            }
        } catch (err) {
            setError('서버 연결 실패');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubfolders = async (targetPath: string): Promise<FolderItem[]> => {
        try {
            const resp = await fetch(`${API_BASE}?path=${encodeURIComponent(targetPath)}`);
            const data = await resp.json();
            return data.folders || [];
        } catch (err) {
            return [];
        }
    };

    const handleToggleExpand = async (item: TreeItem) => {
        if (item.isExpanded) {
            updateTreeItem(item.path, { isExpanded: false });
            return;
        }

        updateTreeItem(item.path, { isLoading: true, isExpanded: true });
        const subfolders = await fetchSubfolders(item.path);
        updateTreeItem(item.path, {
            isLoading: false,
            children: subfolders.map(f => ({ ...f, children: [] }))
        });
    };

    const updateTreeItem = (targetPath: string, updates: Partial<TreeItem>) => {
        const recursiveUpdate = (items: TreeItem[]): TreeItem[] => {
            return items.map(item => {
                if (item.path === targetPath) {
                    return { ...item, ...updates };
                }
                if (item.children) {
                    return { ...item, children: recursiveUpdate(item.children) };
                }
                return item;
            });
        };
        setTreeData((prev: TreeItem[]) => recursiveUpdate(prev));
    };

    const handleSelectFolder = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE}/select`);
            const data = await resp.json();
            if (data.path) {
                setPath(data.path);
                fetchImages(data.path);
            }
        } catch (err) {
            setError('폴더 선택기 실행 실패');
        } finally {
            setLoading(false);
        }
    };

    const navigateUp = () => {
        if (!path) return;
        const lastSlash = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'));
        const parentPath = path.substring(0, lastSlash);
        if (parentPath && parentPath !== path) {
            fetchImages(parentPath);
        } else if (lastSlash === 2 && path.length > 3) { // root case for Windows C:\
            fetchImages(path.substring(0, 3));
        }
    };

    // Helper to split path into segments for breadcrumbs
    const pathSegments = path.split(/[\\/]/).filter((s: string) => s !== '');
    const breadcrumbs = pathSegments.reduce((acc: { name: string, fullPath: string }[], segment: string, idx: number) => {
        const isWindows = path.includes('\\');
        const sep = isWindows ? '\\' : '/';
        let fullPath = '';
        if (idx === 0 && segment.includes(':')) {
            fullPath = segment + sep;
        } else {
            const prevPath = acc.length > 0 ? acc[acc.length - 1].fullPath : '';
            const base = prevPath === '' && !isWindows ? '/' : prevPath;
            fullPath = base + (base.endsWith(sep) ? '' : sep) + segment;
        }
        acc.push({ name: segment, fullPath });
        return acc;
    }, []);

    const renderTree = (items: TreeItem[], level = 0) => {
        return items.map(item => (
            <div key={item.path} className="tree-node-wrapper">
                <div
                    className={`tree-node ${path === item.path ? 'active' : ''}`}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                >
                    <button
                        className={`expand-toggle ${item.isExpanded ? 'expanded' : ''}`}
                        onClick={() => handleToggleExpand(item)}
                    >
                        <ChevronRight size={14} />
                    </button>
                    <div className="tree-node-content" onClick={() => fetchImages(item.path)}>
                        {level === 0 ? <HardDrive size={16} /> : <FolderOpen size={16} />}
                        <span className="node-name">{item.name}</span>
                    </div>
                </div>
                {item.isExpanded && item.children && (
                    <div className="tree-children">
                        {item.children.length > 0 ? (
                            renderTree(item.children, level + 1)
                        ) : item.isLoading ? (
                            <div className="tree-loading" style={{ paddingLeft: `${(level + 1) * 16 + 32}px` }}>
                                <Loader2 size={12} className="spin" />
                            </div>
                        ) : (
                            <div className="tree-empty" style={{ paddingLeft: `${(level + 1) * 16 + 32}px` }}>
                                (빈 폴더)
                            </div>
                        )}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="explorer-layout">
            <aside className="explorer-sidebar">
                <div className="sidebar-header">
                    <FolderSearch size={18} />
                    <span>폴더 트리</span>
                </div>
                <div className="sidebar-scrollable">
                    {treeData.length > 0 ? (
                        renderTree(treeData)
                    ) : (
                        <div className="sidebar-empty">
                            <p>탐색을 시작하려면 폴더를 선택하거나 경로를 입력하세요.</p>
                        </div>
                    )}
                </div>
            </aside>

            <main className="explorer-main">
                <div className="image-explorer-wrapper">
                    <div className="explorer-header">
                        <div className="path-bar">
                            <button className="browse-btn" onClick={handleSelectFolder} title="폴더 선택">
                                <FolderOpen size={18} />
                            </button>
                            <div className="path-input-container">
                                <input
                                    className="path-input"
                                    type="text"
                                    placeholder="예: C:\Users\Public\Pictures"
                                    value={path}
                                    onChange={(e) => setPath(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchImages()}
                                />
                                <button className="explore-btn" onClick={() => fetchImages()} disabled={loading}>
                                    {loading ? <Loader2 className="loading-spinner" size={18} /> : <Search size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="navigation-section">
                        <div className="breadcrumb-bar">
                            <button className="up-btn-mini" onClick={navigateUp} disabled={!path || loading} title="상위 폴더">
                                <Maximize2 size={12} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <div className="crumbs">
                                {breadcrumbs.map((crumb, idx) => (
                                    <React.Fragment key={crumb.fullPath}>
                                        <button className="crumb-item" onClick={() => fetchImages(crumb.fullPath)}>
                                            {crumb.name}
                                        </button>
                                        {idx < breadcrumbs.length - 1 && <span className="crumb-sep">/</span>}
                                        {idx === breadcrumbs.length - 1 && siblings.length > 0 && (
                                            <button
                                                className="sibling-modal-trigger"
                                                onClick={() => setShowSiblingModal(true)}
                                                title="같은 위치의 다른 폴더 보기"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: '#ff4d4d', margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="gallery-grid">
                        <AnimatePresence>
                            {/* Folders first */}
                            {folders.map((folder, idx) => (
                                <motion.div
                                    key={folder.path}
                                    className="img-card folder-card"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => fetchImages(folder.path)}
                                >
                                    <div className="folder-icon-wrapper">
                                        <FolderOpen size={40} strokeWidth={1.5} />
                                    </div>
                                    <div className="img-overlay">
                                        <span className="img-name">{folder.name}</span>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Then Images */}
                            {images.map((img, idx) => (
                                <motion.div
                                    key={img.path}
                                    className="img-card"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (folders.length + idx) * 0.05 }}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img src={`${API_BASE}/view?path=${encodeURIComponent(img.path)}`} alt={img.name} loading="lazy" />
                                    <div className="img-overlay">
                                        <span className="img-name">{img.name}</span>
                                        <Maximize2 size={14} style={{ marginTop: '4px' }} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div
                                className="lightbox"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedImage(null)}
                            >
                                <motion.div
                                    className="lightbox-content"
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button className="close-btn" onClick={() => setSelectedImage(null)}>
                                        <X size={24} />
                                    </button>
                                    <img src={`${API_BASE}/view?path=${encodeURIComponent(selectedImage.path)}`} alt={selectedImage.name} />
                                    <div style={{ textAlign: 'center', marginTop: '1rem', color: 'white' }}>
                                        <p style={{ fontWeight: 600 }}>{selectedImage.name}</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{selectedImage.path}</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 형제 폴더 선택 모달 */}
                    <AnimatePresence>
                        {showSiblingModal && (
                            <motion.div
                                className="modal-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowSiblingModal(false)}
                            >
                                <motion.div
                                    className="sibling-modal"
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="modal-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FolderSearch size={18} className="icon-accent" />
                                            <h3>같은 위치의 다른 폴더 선택</h3>
                                        </div>
                                        <button className="modal-close-btn" onClick={() => setShowSiblingModal(false)}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="sibling-grid">
                                            {siblings.map((sib) => (
                                                <button
                                                    key={sib.path}
                                                    className="sibling-modal-item"
                                                    onClick={() => fetchImages(sib.path)}
                                                >
                                                    <FolderOpen size={16} />
                                                    <span>{sib.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
