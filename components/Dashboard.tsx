import React, { useState, useRef, useMemo, useCallback, createRef, useEffect } from 'react';
import {
    Upload,
    Trash2,
    Search,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    FileSpreadsheet,
    Download,
    Loader2,
    LogOut,
    CheckSquare,
    Square,
    X,
    PackageCheck,
    Users,
    MapPin,
    ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { QRCodeCard, QRCodeCardHandle } from './QRCodeCard';
import { WeatherClock } from './WeatherClock';
import { DataRow, StatusState, OnlineUser } from '../types';
import { makeApiUrl } from '../api/config';

const DEFAULT_LOGO_URL = "/iLovePDF2-bg-removed.png";

export default function Dashboard() {
    const userRole = localStorage.getItem('auth_role') || 'admin';

    const [data, setData] = useState<DataRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [selectedQRColumns, setSelectedQRColumns] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [logo, setLogo] = useState(DEFAULT_LOGO_URL);
    const [status, setStatus] = useState<StatusState>({ message: '', type: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const navigate = useNavigate();

    // Online users state
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [showOnlineDropdown, setShowOnlineDropdown] = useState(false);
    const onlineDropdownRef = useRef<HTMLDivElement>(null);

    // Selection state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create refs map for QR cards
    const cardRefs = useRef<Map<string | number, React.RefObject<QRCodeCardHandle | null>>>(new Map());

    const getCardRef = (id: string | number) => {
        if (!cardRefs.current.has(id)) {
            cardRefs.current.set(id, createRef<QRCodeCardHandle>());
        }
        return cardRefs.current.get(id)!;
    };

    // Heartbeat & online users polling
    const fetchOnlineUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            const res = await fetch(makeApiUrl('/api/users/online'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setOnlineUsers(data.onlineUsers);
        } catch { }
    }, []);

    const sendHeartbeat = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            await fetch(makeApiUrl('/api/users/heartbeat'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch { }
    }, []);

    useEffect(() => {
        // Send heartbeat immediately, then every 2 minutes
        sendHeartbeat();
        const heartbeatInterval = setInterval(sendHeartbeat, 2 * 60 * 1000);

        // Fetch online users immediately, then every 30 seconds
        fetchOnlineUsers();
        const onlineInterval = setInterval(fetchOnlineUsers, 30 * 1000);

        return () => {
            clearInterval(heartbeatInterval);
            clearInterval(onlineInterval);
        };
    }, [sendHeartbeat, fetchOnlineUsers]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (onlineDropdownRef.current && !onlineDropdownRef.current.contains(e.target as Node)) {
                setShowOnlineDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_login_time');
        navigate('/');
    };

    const showStatus = useCallback((message: string, type: 'success' | 'error') => {
        setStatus({ message, type });
        setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (rawRows.length > 0) {
                const headersFound = rawRows[0]
                    .map(h => String(h || '').trim())
                    .filter(Boolean);

                const rows: DataRow[] = rawRows.slice(1).map((row, index) => {
                    const obj: DataRow = { id: index };
                    headersFound.forEach((h, i) => {
                        const val = row[i];
                        obj[h] = val !== undefined && val !== null ? String(val).trim() : '';
                    });
                    return obj;
                });

                setHeaders(headersFound);
                // Simulate processing for Skeleton Loader demonstration
                setTimeout(() => {
                    setData(rows);
                    setSelectedColumns(headersFound);
                    setSelectedQRColumns(headersFound);
                    setIsProcessing(false);
                    showStatus('Identity records connected. Database Active.', 'success');
                }, 1500);
            } else {
                showStatus('File contains no readable data.', 'error');
                setIsProcessing(false);
            }
        } catch (err) {
            showStatus('Failed to parse file.', 'error');
            setIsProcessing(false);
        }
    };

    const clearData = () => {
        setData([]);
        setHeaders([]);
        setSelectedColumns([]);
        setSelectedQRColumns([]);
        setSearchTerm('');
        setResetKey(prev => prev + 1);
        setSelectionMode(false);
        setSelectedIds(new Set());
        cardRefs.current.clear();
        showStatus('System reset successfully.', 'success');
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const s = searchTerm.toLowerCase();
        const headersToCheck = headers.length > 0 ? headers : Object.keys(data[0] || {});
        return data.filter(row =>
            headersToCheck.some(key => String(row[key] || '').toLowerCase().includes(s))
        );
    }, [data, searchTerm, headers]);

    // Selection handlers
    const toggleSelectionMode = () => {
        if (selectionMode) {
            // Exiting selection mode
            setSelectionMode(false);
            setSelectedIds(new Set());
        } else {
            setSelectionMode(true);
        }
    };

    const toggleSelect = useCallback((id: string | number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = () => {
        const allIds = new Set(filteredData.map(row => row.id));
        setSelectedIds(allIds);
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleBulkDownload = async () => {
        const selectedRows = filteredData.filter(row => selectedIds.has(row.id));
        if (selectedRows.length === 0) {
            showStatus('No records selected for download.', 'error');
            return;
        }

        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            for (let i = 0; i < selectedRows.length; i++) {
                const row = selectedRows[i];
                const ref = cardRefs.current.get(row.id);
                if (ref?.current) {
                    const blob = await ref.current.downloadQR();
                    if (blob) {
                        downloadBlob(blob, ref.current.getFileName());
                        // Small delay between downloads to prevent browser throttling
                        if (i < selectedRows.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    }
                }
                setDownloadProgress(Math.round(((i + 1) / selectedRows.length) * 100));
            }
            showStatus(`${selectedRows.length} QR code${selectedRows.length > 1 ? 's' : ''} downloaded!`, 'success');
        } catch (err) {
            console.error('Bulk download error:', err);
            showStatus('Download failed. Please try again.', 'error');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    const handleExportAll = async () => {
        if (filteredData.length === 0) return;

        // Select all first, then download
        const allIds = new Set(filteredData.map(row => row.id));
        setSelectedIds(allIds);
        setSelectionMode(true);

        // Small delay to let refs render
        setTimeout(async () => {
            setIsDownloading(true);
            setDownloadProgress(0);

            try {
                for (let i = 0; i < filteredData.length; i++) {
                    const row = filteredData[i];
                    const ref = cardRefs.current.get(row.id);
                    if (ref?.current) {
                        const blob = await ref.current.downloadQR();
                        if (blob) {
                            downloadBlob(blob, ref.current.getFileName());
                            // Small delay between downloads
                            if (i < filteredData.length - 1) {
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }
                        }
                    }
                    setDownloadProgress(Math.round(((i + 1) / filteredData.length) * 100));
                }
                showStatus(`All ${filteredData.length} QR codes downloaded!`, 'success');
            } catch (err) {
                console.error('Export all error:', err);
                showStatus('Export failed. Please try again.', 'error');
            } finally {
                setIsDownloading(false);
                setDownloadProgress(0);
            }
        }, 300);
    };

    const selectedCount = selectedIds.size;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 relative">
            {/* Fixed Version 2.0 Background Watermark */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                <div className="text-[15vw] font-black text-slate-900/[0.03] select-none whitespace-nowrap -rotate-12 tracking-tighter">
                    VERSION 2.0
                </div>
            </div>

            <input
                key={resetKey}
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx,.xls,.csv"
            />

            <div className="max-w-[1600px] mx-auto p-6 md:p-8 lg:p-12 relative z-10">
                {/* Header - Authoritative Look */}
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-gradient-to-b from-white to-transparent shadow-lg relative">
                            {/* Animated glowing backdrop */}
                            <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full animate-pulse" style={{ animationDuration: '3s' }} />

                            <div className="bg-white p-3 rounded-[1rem] border border-slate-100 relative z-10 [perspective:1000px]">
                                <img src={logo} className="w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.2)] animate-spin-y" alt="Logo" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                                တီုင်စေတ်မေန်းတိုအီး  <span className="text-slate-500">[TIQR CREATOR]</span>
                                <span className="ml-2 px-1.5 py-0.5 bg-slate-900/5 text-slate-400 text-[8px] font-black rounded border border-slate-200 uppercase tracking-tighter">V 2.0.0</span>
                            </h1>
                            <p className="text-slate-500 text-xs font-bold flex items-center gap-2 mt-1 uppercase tracking-wider">
                                <ShieldCheck size={12} className="text-emerald-600" /> powered By Mai San Hlu & Mai Nay Lin
                            </p>
                        </div>
                    </div>

                    {/* Center: Weather & Clock */}
                    <WeatherClock />

                    <div className="min-h-[40px] flex items-center gap-3">
                        {/* Who's Online */}
                        <div className="relative" ref={onlineDropdownRef}>
                            <button
                                onClick={() => setShowOnlineDropdown(!showOnlineDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/20 transition-all active:scale-95"
                            >
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <Users size={12} className="text-emerald-700" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                    {onlineUsers.length} ONLINE
                                </span>
                                <ChevronDown size={10} className={`text-emerald-600 transition-transform duration-200 ${showOnlineDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showOnlineDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
                                    style={{ animation: 'fadeInDown 0.2s ease-out' }}
                                >
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            Who's Online Now
                                        </h3>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {onlineUsers.length === 0 ? (
                                            <div className="px-4 py-8 text-center">
                                                <Users size={24} className="mx-auto text-slate-200 mb-2" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No one is online</p>
                                            </div>
                                        ) : (
                                            onlineUsers.map((user) => (
                                                <div key={user._id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0">
                                                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[9px] font-black uppercase flex-shrink-0">
                                                        {user.name.substring(0, 2)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                                            <MapPin size={9} />
                                                            {user.township || 'Unknown'}
                                                        </p>
                                                    </div>
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {status.message && (
                            <div className={`px-4 py-2.5 rounded-lg flex items-center gap-2 border text-[11px] font-bold uppercase tracking-wider shadow-sm animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}>
                                {status.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-700" /> : <AlertCircle size={14} className="text-rose-700" />}
                                <span>{status.message}</span>
                            </div>
                        )}
                        {(parseInt(userRole) === 1 || parseInt(userRole) === 2) && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="ml-2 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                            >
                                <ShieldCheck size={14} /> ADMIN MGMT
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="ml-2 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                        >
                            <LogOut size={14} /> LOGOUT
                        </button>
                    </div>
                </header>

                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-700">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-xl bg-white border-2 border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 group shadow-sm hover:shadow-lg active:scale-95"
                        >
                            <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200">
                                {isProcessing ? <Loader2 size={32} className="animate-spin text-slate-600" /> : <Upload size={32} />}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Import Excel Database</h2>
                            <p className="text-slate-500 text-xs font-medium mb-8 text-center max-w-xs uppercase tracking-wide">ဘိူန်းဟံပ်လိူည် Excel (.xlsx) ကာည်း CSV (.csv)</p>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                                    <FileSpreadsheet size={14} className="text-slate-800" /> .XLSX Excel
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                                    <FileSpreadsheet size={14} className="text-slate-800" /> .CSV Data
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-8 h-fit">
                            <Sidebar
                                headers={headers}
                                selectedColumns={selectedColumns}
                                setSelectedColumns={setSelectedColumns}
                                selectedQRColumns={selectedQRColumns}
                                setSelectedQRColumns={setSelectedQRColumns}
                                logo={logo}
                                setLogo={setLogo}
                                onClear={clearData}
                                defaultLogo={DEFAULT_LOGO_URL}
                            />
                        </aside>

                        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
                            {/* Toolbar */}
                            <div className="bg-white/90 border border-slate-200 p-3 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-3 sticky top-4 z-30 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH RECORDS (ဒီတီပ်ဟြီုက်)"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl outline-none text-slate-900 text-xs font-unicodes uppercase tracking-wider transition-all placeholder:text-slate-400"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {/* Select Mode Toggle */}
                                    <button
                                        onClick={toggleSelectionMode}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all shadow-sm active:scale-95 whitespace-nowrap uppercase tracking-widest border ${selectionMode
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                    >
                                        {selectionMode ? <CheckSquare size={14} /> : <Square size={14} />}
                                        {selectionMode ? 'SELECTING' : 'SELECT'}
                                    </button>

                                    {/* Export All button */}
                                    <button
                                        onClick={handleExportAll}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 whitespace-nowrap uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        EXPORT ALL
                                    </button>
                                    <button
                                        onClick={clearData}
                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
                                        title="Reset System"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Selection bar spacer when fixed bar is visible */}
                            {selectionMode && <div className="h-2" />}

                            {/* Download Progress Bar */}
                            {isDownloading && (
                                <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            Generating QR codes...
                                        </span>
                                        <span className="text-[11px] font-black text-emerald-600">{downloadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Grid Content with Skeleton Loading */}
                            {isProcessing ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden h-[300px]">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                                                    <div className="h-5 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-center mb-6">
                                                <div className="w-32 h-32 bg-slate-100 rounded-xl animate-pulse"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
                                                <div className="h-3 bg-slate-100 rounded w-4/5 animate-pulse"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${selectionMode ? 'pb-28' : 'pb-20'}`}>
                                    {filteredData.map((row) => (
                                        <QRCodeCard
                                            key={row.id}
                                            ref={getCardRef(row.id)}
                                            row={row}
                                            selectedColumns={selectedColumns}
                                            selectedQRColumns={selectedQRColumns}
                                            logo={logo}
                                            isSelected={selectedIds.has(row.id)}
                                            selectionMode={selectionMode}
                                            onToggleSelect={toggleSelect}
                                        />
                                    ))}
                                </div>
                            )}
                        </main>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Selection Bar */}
            {selectionMode && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none"
                    style={{ animation: 'slideUp 0.3s ease-out' }}
                >
                    <div className="max-w-[1200px] mx-auto pointer-events-auto">
                        <div className="bg-white/95 backdrop-blur-xl border border-emerald-200 p-3 px-5 rounded-2xl shadow-2xl shadow-emerald-900/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${selectedCount > 0
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                    <PackageCheck size={14} />
                                    {selectedCount} SELECTED
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    of {filteredData.length} records
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAll}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all border border-emerald-200 hover:border-emerald-500 active:scale-95 uppercase tracking-widest"
                                >
                                    <CheckSquare size={12} /> SELECT ALL
                                </button>
                                <button
                                    onClick={deselectAll}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-500 rounded-lg text-[10px] font-black hover:bg-slate-100 transition-all border border-slate-200 active:scale-95 uppercase tracking-widest"
                                >
                                    <X size={12} /> CLEAR
                                </button>
                                <button
                                    onClick={handleBulkDownload}
                                    disabled={selectedCount === 0 || isDownloading}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 active:scale-95 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" /> {downloadProgress}%
                                        </>
                                    ) : (
                                        <>
                                            <Download size={12} /> DOWNLOAD SELECTED
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={toggleSelectionMode}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Exit selection mode"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inline keyframes for animations */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeInDown {
                    from { transform: translateY(-8px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
