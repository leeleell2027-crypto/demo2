"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, ArrowLeft, RefreshCw, Table, BarChart2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface TradeHistory {
    id: number;
    executedAt: string;
    coin: string;
    market: string;
    side: string;
    quantity: string;
    price: string;
    totalAmount: string;
    fee: string;
    settlementAmount: string;
    orderedAt: string;
}

export default function TradeHistoryPage() {
    const [tradeHistories, setTradeHistories] = useState<TradeHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const [page, setPage] = useState(1);
    const [size, setSize] = useState(20);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [coin, setCoin] = useState('');
    const [side, setSide] = useState('전체');
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [availableCoins, setAvailableCoins] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'table' | 'chart' | 'btc'>('table');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [chartDate, setChartDate] = useState(new Date().toISOString().split('T')[0]);
    const [chartMetric, setChartMetric] = useState<'amount' | 'quantity'>('amount');

    const fetchHistories = async (currentPage = page) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: currentPage.toString(),
                size: size.toString(),
            });
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);
            if (coin) query.append('coin', coin);
            if (side !== '전체') query.append('side', side);

            const res = await fetch(`/api/trade-history?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTradeHistories(data.content || []);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || 0);
            }
        } catch (error) {
            console.error('Error fetching trade histories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistories(page);
    }, [page, size]);

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                const res = await fetch('/api/trade-history/coins');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableCoins(data || []);
                }
            } catch (error) {
                console.error('Error fetching coins:', error);
            }
        };
        fetchCoins();
    }, []);

    // Fetch stats data directly from the backend API when in chart mode
    const [chartData, setChartData] = useState<{ name: string, value: number, color: string }[]>([]);
    const [btcHistories, setBtcHistories] = useState<{ date: string, price: string }[]>([]);

    const fetchStats = async () => {
        if (viewMode !== 'chart') return;
        try {
            const query = new URLSearchParams();
            if (chartDate) query.append('endDate', chartDate);
            if (coin) query.append('coin', coin);
            if (side !== '전체') query.append('side', side);
            query.append('includeBtc', (chartMetric === 'quantity').toString());

            const res = await fetch(`/api/trade-history/stats?${query.toString()}`);
            if (res.ok) {
                const data: { coinName: string, totalValue: number, totalQuantity: number }[] = await res.json();

                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#f43f5e'];
                let colorIndex = 0;

                const formattedData = data.map((item) => ({
                    name: item.coinName,
                    value: chartMetric === 'amount' ? item.totalValue : item.totalQuantity,
                    color: colors[colorIndex++ % colors.length]
                }));
                setChartData(formattedData);
            }
        } catch (error) {
            console.error('Error fetching stats for chart:', error);
        }
    };

    const fetchBtcHistories = async () => {
        try {
            const res = await fetch('/api/trade-history/btc-market');
            if (res.ok) {
                const data = await res.json();
                setBtcHistories(data || []);
            }
        } catch (error) {
            console.error('Error fetching BTC market history:', error);
        }
    };

    useEffect(() => {
        if (viewMode === 'chart') {
            fetchStats();
        } else if (viewMode === 'btc') {
            fetchBtcHistories();
        }
    }, [viewMode, chartDate, chartMetric]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'decimal' }).format(Math.floor(value));
    };

    const formatNumericString = (val: string | undefined | number) => {
        if (val === undefined || val === null || val === '') return '0';
        if (typeof val === 'number') return formatCurrency(val);
        const num = parseFloat(String(val).replace(/,/g, ''));
        if (isNaN(num)) return val;
        return formatCurrency(num);
    };

    const formatQuantity = (val: string | undefined | number) => {
        if (val === undefined || val === null || val === '') return '0';
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
        if (isNaN(num)) return val;
        return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 8 }).format(num);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/trade-history/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message || '업로드 성공');
                setFile(null);
                setPage(1);
                fetchHistories(1);

                // Refresh coins after upload
                const coinsRes = await fetch('/api/trade-history/coins');
                if (coinsRes.ok) {
                    const coinsData = await coinsRes.json();
                    setAvailableCoins(coinsData || []);
                }
            } else {
                alert(data.message || '업로드 실패');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('정말로 모든 거래 내역을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch('/api/trade-history/all', {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('삭제되었습니다.');
                setPage(1);
                fetchHistories(1);
            } else {
                alert('삭제 실패');
            }
        } catch (error) {
            console.error('Error deleting histories:', error);
        }
    };

    return (
        <div className="page-container" style={{ color: 'white', minHeight: '100vh', padding: '40px 20px', position: 'relative' }}>
            {/* Uploading Overlay */}
            {uploading && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
                    <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>파일 업로드 중...</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>데이터가 많을 경우 시간이 소요될 수 있습니다.</div>
                </div>
            )}

            <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link href="/" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'color 0.2s' }}>
                            <ArrowLeft size={20} />
                            <span>Back to Home</span>
                        </Link>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '4px' }}>
                                <Table size={20} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Crypto</span>
                            </div>
                            <h1 className="header-title" style={{ fontSize: '2.5rem', margin: 0 }}>Trade History</h1>
                        </div>
                    </div>

                    <div className="glass-panel view-mode-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '14px' }}>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`btn ${viewMode === 'table' ? 'btn-primary' : ''}`}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'table' ? 'black' : 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Table size={18} /> Table
                        </button>
                        <button
                            onClick={() => setViewMode('chart')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: viewMode === 'chart' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'chart' ? 'black' : 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            <BarChart2 size={18} /> 통계 (Chart)
                        </button>
                        <button
                            onClick={() => setViewMode('btc')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: viewMode === 'btc' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'btc' ? 'black' : 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            <RefreshCw size={18} /> BTC 내역
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Controls */}
                    <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="btn"
                                style={{ background: 'rgba(255,255,255,0.1)', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px' }}
                            >
                                {file ? file.name : '파일 선택 (CSV/Excel)'}
                            </label>

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="btn btn-primary"
                                style={{ color: 'black', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                {uploading ? <RefreshCw className="spin" size={18} /> : <Upload size={18} />}
                                업로드
                            </button>
                        </div>

                        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }}></div>

                        <button
                            onClick={handleDeleteAll}
                            className="btn"
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', gap: '8px', alignItems: 'center' }}
                        >
                            <Trash2 size={18} />
                            전체 삭제
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {viewMode !== 'btc' && (
                    <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', borderRadius: '16px', flexWrap: 'wrap' }}>
                        {viewMode === 'table' ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>체결기간</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input-control"
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}
                                />
                                <span style={{ color: 'var(--text-muted)' }}>~</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input-control"
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>기준일자 (이전 누적합산)</label>
                                <input
                                    type="date"
                                    value={chartDate}
                                    onChange={(e) => setChartDate(e.target.value)}
                                    className="input-control"
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>코인</label>
                            <select
                                value={coin}
                                onChange={(e) => { setCoin(e.target.value); setPage(1); }}
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px', minWidth: '120px' }}>
                                <option value="" style={{ color: 'black' }}>전체</option>
                                {availableCoins.map((c) => (
                                    <option key={c} value={c} style={{ color: 'black' }}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>종류</label>
                            <select
                                value={side}
                                onChange={(e) => { setSide(e.target.value); }}
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
                                <option value="전체" style={{ color: 'black' }}>전체</option>
                                <option value="매수" style={{ color: 'black' }}>매수</option>
                                <option value="매도" style={{ color: 'black' }}>매도</option>
                            </select>
                        </div>

                        {viewMode === 'table' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>목록 수</label>
                                <select
                                    value={size}
                                    onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
                                    <option value={20} style={{ color: 'black' }}>20개씩</option>
                                    <option value={50} style={{ color: 'black' }}>50개씩</option>
                                    <option value={100} style={{ color: 'black' }}>100개씩</option>
                                </select>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (viewMode === 'table') {
                                    setPage(1);
                                    fetchHistories(1);
                                } else {
                                    fetchStats();
                                }
                            }}
                            className="btn btn-primary"
                            style={{ color: 'black', padding: '8px 24px', marginLeft: 'auto', fontWeight: 'bold' }}
                        >
                            조회
                        </button>
                    </div>
                )}

                {/* Content Section */}
                {viewMode === 'table' ? (
                    <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: '16px' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>체결시간</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>마켓/코인</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>종류</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>수량/단가</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>정산금액/수수료</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>거래금액</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                로딩 중...
                                            </td>
                                        </tr>
                                    ) : tradeHistories.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                등록된 거래 내역이 없습니다. CSV 또는 Excel 파일을 업로드해주세요.
                                            </td>
                                        </tr>
                                    ) : (
                                        tradeHistories.map((t, i) => (
                                            <motion.tr
                                                key={t.id || i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.01 }}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                            >
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: '500' }}>{t.executedAt}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>주문: {t.orderedAt}</div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{t.coin}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#a78bfa' }}>{t.market}</div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        backgroundColor: t.side === '매수' || t.side?.toLowerCase().includes('buy') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        color: t.side === '매수' || t.side?.toLowerCase().includes('buy') ? '#10b981' : '#ef4444'
                                                    }}>
                                                        {t.side}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '500' }}>{formatQuantity(t.quantity)}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@ {formatNumericString(t.price)}</div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '500' }}>{formatNumericString(t.settlementAmount)}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#f59e0b' }}>수수료: {formatNumericString(t.fee)}</div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#312e81', fontSize: '1.0rem', opacity: 0.5 }}>
                                                    {formatNumericString(t.totalAmount)}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                                {!loading && tradeHistories.length > 0 && (
                                    <tfoot style={{ background: 'rgba(255,255,255,0.03)', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                        <tr style={{ borderBottom: 'none' }}>
                                            <td colSpan={4} style={{ padding: '20px 16px', fontWeight: 'bold', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>페이지 합계 (Page Totals)</td>
                                            <td style={{ padding: '20px 16px', textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>{formatNumericString(tradeHistories.reduce((sum, t) => sum + (parseFloat(String(t.settlementAmount).replace(/,/g, '')) || 0), 0))}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '4px' }}>수수료: {formatNumericString(tradeHistories.reduce((sum, t) => sum + (parseFloat(String(t.fee).replace(/,/g, '')) || 0), 0))}</div>
                                            </td>
                                            <td style={{ padding: '20px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.5 }}>
                                                {formatNumericString(tradeHistories.reduce((sum, t) => sum + (parseFloat(String(t.totalAmount).replace(/,/g, '')) || 0), 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalCount={totalElements}
                            onPageChange={setPage}
                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', padding: '24px 0 24px' }}
                        />
                    </div>
                ) : viewMode === 'chart' ? (
                    <ChartView
                        data={chartData}
                        chartDate={chartDate}
                        chartMetric={chartMetric}
                        setChartMetric={setChartMetric}
                        formatCurrency={formatCurrency}
                        formatQuantity={formatQuantity}
                    />
                ) : (
                    <BtcTableView
                        data={btcHistories}
                        formatCurrency={formatCurrency}
                        onRefresh={fetchBtcHistories}
                    />
                )}
            </div>
        </div>
    );
}

const ChartView = ({ data, chartDate, chartMetric, setChartMetric, formatCurrency, formatQuantity }: { data: any[], chartDate: string, chartMetric: string, setChartMetric: (m: 'amount' | 'quantity') => void, formatCurrency: any, formatQuantity: any }) => {
    const [sortBy, setSortBy] = useState<'name' | 'value'>('value');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const filteredData = useMemo(() => {
        return data.filter(item => Math.abs(item.value) >= 0.0001);
    }, [data]);

    const [selectedCoins, setSelectedCoins] = useState<Set<string>>(new Set(filteredData.map(d => d.name)));

    useEffect(() => {
        setSelectedCoins(new Set(filteredData.map(d => d.name)));
    }, [filteredData]);

    const toggleCoin = (name: string) => {
        const newSet = new Set(selectedCoins);
        if (newSet.has(name)) {
            newSet.delete(name);
        } else {
            newSet.add(name);
        }
        setSelectedCoins(newSet);
    };

    const sortedFullData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            if (sortBy === 'name') {
                return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else {
                return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
            }
        });
    }, [filteredData, sortBy, sortOrder]);

    const filteredForChart = useMemo(() => {
        return sortedFullData.filter(item => selectedCoins.has(item.name));
    }, [sortedFullData, selectedCoins]);

    let cumulativePercent = 0;
    const totalValue = filteredForChart.reduce((sum, item) => sum + item.value, 0);

    const handleSort = (key: 'name' | 'value') => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('desc');
        }
    };

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    if (data.length === 0) {
        return (
            <div className="glass-card" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                    <BarChart2 size={64} style={{ opacity: 0.1 }} />
                </div>
                <p style={{ fontSize: '1.2rem' }}>해당 날짜({chartDate})까지의 데이터가 없습니다.</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{
                padding: '40px',
                borderRadius: '32px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '40px',
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div style={{ flex: '1 1 400px', maxWidth: '450px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                            코인별 누적 합산
                        </h3>
                        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>기준일: {chartDate} 이전 데이터</p>
                    </div>

                    <div className="glass-panel" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setChartMetric('amount'); }}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: chartMetric === 'amount' ? 'var(--primary)' : 'transparent',
                                color: chartMetric === 'amount' ? 'black' : 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                fontSize: '0.85rem'
                            }}
                        >
                            금액
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setChartMetric('quantity'); }}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: chartMetric === 'quantity' ? 'var(--primary)' : 'transparent',
                                color: chartMetric === 'quantity' ? 'black' : 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                fontSize: '0.85rem'
                            }}
                        >
                            코인갯수
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
                        <button
                            onClick={() => handleSort('name')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
                        >
                            코인
                            {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </button>
                        <button
                            onClick={() => handleSort('value')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
                        >
                            {chartMetric === 'amount' ? '금액' : '수량'}
                            {sortBy === 'value' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </button>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                        {sortedFullData.map((item) => (
                            <div key={item.name}
                                onClick={() => toggleCoin(item.name)}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px', borderRadius: '8px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedCoins.has(item.name)}
                                        onChange={() => { }}
                                        style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                                    />
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }} />
                                    <span style={{ fontWeight: 600, color: selectedCoins.has(item.name) ? 'white' : 'var(--text-muted)' }}>{item.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {totalValue > 0 && selectedCoins.has(item.name) ? ((item.value / totalValue) * 100).toFixed(1) : '0.0'}%
                                    </span>
                                    <span style={{ fontWeight: 700, color: selectedCoins.has(item.name) ? 'white' : 'var(--text-muted)' }}>
                                        {chartMetric === 'quantity' ? formatQuantity(item.value) : formatCurrency(item.value)}{chartMetric === 'quantity' ? '개' : '원'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>총합계 (Total)</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{chartMetric === 'quantity' ? formatQuantity(totalValue) : formatCurrency(totalValue)}{chartMetric === 'quantity' ? '개' : '원'}</span>
                    </div>
                </div>
            </div>

            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', maxWidth: '300px', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
                    {filteredForChart.map((slice) => {
                        const percent = slice.value / (totalValue || 1);
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += percent;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                        // if the slice is 100%, draw a circle
                        if (percent === 1) {
                            return <circle key={slice.name} r="1" cx="0" cy="0" fill={slice.color} />
                        }

                        const largeArcFlag = percent > 0.5 ? 1 : 0;
                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `L 0 0`,
                        ].join(' ');

                        return (
                            <path
                                key={slice.name}
                                d={pathData}
                                fill={slice.color}
                                style={{ stroke: '#0f172a', strokeWidth: 0.02, transition: 'all 0.3s' }}
                            />
                        );
                    })}
                </svg>
            </div>
        </motion.div>
    );
};

const BtcTableView = ({ data, formatCurrency, onRefresh }: { data: any[], formatCurrency: any, onRefresh: () => void }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setEditPrice(item.price);
    };

    const handleSave = async (id: number) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/trade-history/btc-market/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: editPrice })
            });
            if (res.ok) {
                setEditingId(null);
                onRefresh();
            }
        } catch (error) {
            console.error('Error updating BTC price:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditPrice('');
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/trade-history/btc-market/sync', {
                method: 'POST'
            });
            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Error syncing BTC prices:', error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ borderRadius: '24px', overflow: 'hidden' }}
        >
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>BTC Market History (Date & Price)</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                        Total {data.length} records • Click price to edit
                    </p>
                </div>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn btn-primary"
                    style={{
                        color: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontSize: '0.9rem'
                    }}
                >
                    <RefreshCw size={18} className={syncing ? 'spin' : ''} />
                    {syncing ? '동기화 중...' : 'Upbit 시세 동기화'}
                </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="trade-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '2px solid rgba(255,255,255,0.05)' }}>일자 (Date)</th>
                            <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '2px solid rgba(255,255,255,0.05)' }}>가격 (Price)</th>
                            <th style={{ padding: '16px', width: '120px', borderBottom: '2px solid rgba(255,255,255,0.05)' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No BTC market data found.</td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px', fontWeight: 500 }}>{item.date}</td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        {editingId === item.id ? (
                                            <input
                                                type="text"
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                autoFocus
                                                style={{
                                                    background: 'rgba(255,255,255,0.1)',
                                                    color: 'var(--primary)',
                                                    border: '1px solid var(--primary)',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    textAlign: 'right',
                                                    width: '180px',
                                                    fontWeight: 700,
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        ) : (
                                            <div
                                                onClick={() => handleEdit(item)}
                                                style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', display: 'inline-block' }}
                                                title="클릭하여 수정"
                                            >
                                                {formatCurrency(parseFloat(item.price.replace(/,/g, '')))} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>KRW</span>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        {editingId === item.id ? (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleSave(item.id)}
                                                    disabled={saving}
                                                    style={{ background: 'var(--primary)', color: 'black', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    {saving ? '...' : '저장'}
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
