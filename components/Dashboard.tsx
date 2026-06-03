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
    ChevronDown,
    Clock,
    Video
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { QRCodeCard, QRCodeCardHandle } from './QRCodeCard';
import { WeatherClock } from './WeatherClock';
import { DataRow, StatusState, OnlineUser } from '../types';
import { makeApiUrl } from '../api/config';
import { ShaderAnimation } from './ui/shader-animation';
import { io } from 'socket.io-client';
import { WebcamModal } from './WebcamModal';

const DEFAULT_LOGO_URL = "/iLovePDF2-bg-removed.png";


const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
};

export default function Dashboard() {
    const userRole = localStorage.getItem('auth_role') || 'admin';

    const [data, setData] = useState<DataRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    
    // Socket & Webcam states
    const socketRef = useRef<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const [webcamTarget, setWebcamTarget] = useState<any>(null);
    
    // Outbound streaming states (when we stream to someone else)
    const [outboundStream, setOutboundStream] = useState<MediaStream | null>(null);
    const outboundStreamRef = useRef<MediaStream | null>(null);
    const outboundPeerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const [inboundRequest, setInboundRequest] = useState<{ requesterId: string; requesterName: string } | null>(null);
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
    const prevOnlineIdsRef = useRef<Set<string>>(new Set());
    const isFirstFetchRef = useRef(true);
    const [joinNotifications, setJoinNotifications] = useState<{ id: string; name: string }[]>([]);

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

    const playJoinSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const master = ctx.createGain();
            master.gain.setValueAtTime(0.0, ctx.currentTime);
            master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
            master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
            master.connect(ctx.destination);

            // Reverb via convolver simulation (delay feedback loop)
            const delay = ctx.createDelay(0.4);
            delay.delayTime.value = 0.18;
            const feedback = ctx.createGain();
            feedback.gain.value = 0.35;
            const delayFilter = ctx.createBiquadFilter();
            delayFilter.type = 'lowpass';
            delayFilter.frequency.value = 3200;
            delay.connect(delayFilter);
            delayFilter.connect(feedback);
            feedback.connect(delay);
            delay.connect(master);

            // Rising futuristic arpeggio — sawtooth + detune for sci-fi feel
            const notes = [
                { freq: 440, time: 0,    dur: 0.25 },   // A4
                { freq: 554, time: 0.10, dur: 0.25 },   // C#5
                { freq: 659, time: 0.20, dur: 0.30 },   // E5
                { freq: 880, time: 0.32, dur: 0.55 },   // A5 — hold
            ];

            notes.forEach(({ freq, time, dur }) => {
                // Main tone — square wave for digital/synth feel
                const osc1 = ctx.createOscillator();
                osc1.type = 'square';
                osc1.frequency.setValueAtTime(freq, ctx.currentTime + time);
                osc1.frequency.exponentialRampToValueAtTime(freq * 1.004, ctx.currentTime + time + dur);

                // Sub layer — sine an octave down, softer
                const osc2 = ctx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(freq / 2, ctx.currentTime + time);

                const noteGain = ctx.createGain();
                noteGain.gain.setValueAtTime(0.0, ctx.currentTime + time);
                noteGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + time + 0.015);
                noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur + 0.18);

                // High-pass to keep it crisp
                const hpf = ctx.createBiquadFilter();
                hpf.type = 'highpass';
                hpf.frequency.value = 180;

                osc1.connect(hpf);
                osc2.connect(hpf);
                hpf.connect(noteGain);
                noteGain.connect(master);
                noteGain.connect(delay); // send to reverb tail

                osc1.start(ctx.currentTime + time);
                osc1.stop(ctx.currentTime + time + dur + 0.2);
                osc2.start(ctx.currentTime + time);
                osc2.stop(ctx.currentTime + time + dur + 0.2);
            });

            // Futuristic sweep — rising pitch noise burst at start
            const sweepOsc = ctx.createOscillator();
            sweepOsc.type = 'sawtooth';
            sweepOsc.frequency.setValueAtTime(200, ctx.currentTime);
            sweepOsc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
            const sweepGain = ctx.createGain();
            sweepGain.gain.setValueAtTime(0.08, ctx.currentTime);
            sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            sweepOsc.connect(sweepGain);
            sweepGain.connect(master);
            sweepOsc.start(ctx.currentTime);
            sweepOsc.stop(ctx.currentTime + 0.12);

            setTimeout(() => ctx.close(), 3000);
        } catch { }
    }, []);

    // Heartbeat & online users polling
    const fetchOnlineUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            const res = await fetch(makeApiUrl('/api/users/online'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const freshUsers: OnlineUser[] = data.onlineUsers;
                setOnlineUsers(freshUsers);

                if (isFirstFetchRef.current) {
                    // Seed known IDs silently on first load
                    prevOnlineIdsRef.current = new Set(freshUsers.map(u => u._id));
                    isFirstFetchRef.current = false;
                } else {
                    // Detect newly joined users
                    const newJoiners = freshUsers.filter(u => !prevOnlineIdsRef.current.has(u._id));
                    if (newJoiners.length > 0) {
                        playJoinSound();
                        setJoinNotifications(prev => [
                            ...prev,
                            ...newJoiners.map(u => ({ id: u._id, name: u.name }))
                        ]);
                        newJoiners.forEach(u => {
                            setTimeout(() => {
                                setJoinNotifications(prev => prev.filter(n => n.id !== u._id));
                            }, 5000);
                        });
                    }
                    prevOnlineIdsRef.current = new Set(freshUsers.map(u => u._id));
                }
            }
        } catch { }
    }, [playJoinSound]);

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

    // Extract user ID from token helper
    const getUserIdFromToken = (token: string | null): string | null => {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || null;
        } catch {
            return null;
        }
    };

    // Socket.io initialization & WebRTC listeners
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const userId = getUserIdFromToken(token);
        setCurrentUserId(userId);

        if (!userId) return;

        console.log("Dashboard: Initializing socket connection for user:", userId);
        const socket = io();
        socketRef.current = socket;

        // Register immediately (Socket.io queues this until connected)
        socket.emit("register", userId);

        socket.on("connect", () => {
            console.log("Dashboard: Connected to socket. Registering user...");
            socket.emit("register", userId);
        });

        // Listen for inbound requests to share our webcam
        socket.on("webcam-request", ({ requesterId, requesterName }: { requesterId: string; requesterName: string }) => {
            console.log("Dashboard: Inbound webcam request received from:", requesterName);
            setInboundRequest({ requesterId, requesterName });
        });

        socket.on("webcam-answer", async ({ answer }: { answer: any }) => {
            console.log("Dashboard: Inbound SDP answer received");
            if (outboundPeerConnectionRef.current) {
                await outboundPeerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on("ice-candidate", async ({ candidate }: { candidate: any }) => {
            try {
                if (outboundPeerConnectionRef.current && outboundPeerConnectionRef.current.remoteDescription) {
                    await outboundPeerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (e) {
                console.error("Dashboard: Error adding ICE candidate", e);
            }
        });

        socket.on("webcam-close", () => {
            console.log("Dashboard: Inbound stream close notification received");
            if (outboundPeerConnectionRef.current) {
                outboundPeerConnectionRef.current.close();
                outboundPeerConnectionRef.current = null;
            }
            if (outboundStreamRef.current) {
                outboundStreamRef.current.getTracks().forEach(track => track.stop());
                outboundStreamRef.current = null;
            }
            setOutboundStream(null);
        });

        return () => {
            console.log("Dashboard: Disconnecting socket");
            if (socket) {
                socket.disconnect();
            }
            if (outboundPeerConnectionRef.current) {
                outboundPeerConnectionRef.current.close();
                outboundPeerConnectionRef.current = null;
            }
            if (outboundStreamRef.current) {
                outboundStreamRef.current.getTracks().forEach(track => track.stop());
                outboundStreamRef.current = null;
            }
        };
    }, []);

    const handleAcceptWebcamRequest = async () => {
        if (!inboundRequest || !socketRef.current) return;
        const requesterId = inboundRequest.requesterId;
        setInboundRequest(null);
        
        try {
            console.log("Dashboard: Accessing camera for outbound stream to:", requesterId);
            const localMedia = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });
            
            setOutboundStream(localMedia);
            outboundStreamRef.current = localMedia;
            
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            outboundPeerConnectionRef.current = pc;
            
            localMedia.getTracks().forEach(track => {
                pc.addTrack(track, localMedia);
            });
            
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit("ice-candidate", {
                        targetUserId: requesterId,
                        candidate: event.candidate
                    });
                }
            };
            
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            socketRef.current.emit("webcam-offer", {
                targetUserId: requesterId,
                offer: offer
            });
            
        } catch (err) {
            console.error("Dashboard: Failed to capture/share webcam:", err);
            socketRef.current.emit("webcam-error", {
                targetUserId: requesterId,
                message: "Target user's camera is unavailable or blocked."
            });
        }
    };

    const handleStopOutboundStream = () => {
        if (outboundPeerConnectionRef.current) {
            outboundPeerConnectionRef.current.close();
            outboundPeerConnectionRef.current = null;
        }
        if (outboundStreamRef.current) {
            outboundStreamRef.current.getTracks().forEach(track => track.stop());
            outboundStreamRef.current = null;
        }
        setOutboundStream(null);
        socketRef.current?.emit("webcam-close", { targetUserId: "all" });
    };

    const handleOpenWebcam = (user: any) => {
        setWebcamTarget(user);
        setIsWebcamOpen(true);
    };

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
        <div className="h-screen overflow-hidden text-[#1A1A1A] font-sans selection:bg-black/10 relative tps-page-enter bg-transparent">

            {/* Join Notifications */}
            <div className="fixed top-3 right-3 z-[999] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-24px)]">
                {joinNotifications.map(n => (
                    <div
                        key={n.id}
                        className="flex items-center gap-2.5 bg-white border border-[#E5E7EB] px-3 py-2.5 animate-in slide-in-from-right-4 fade-in duration-300 shadow-2xl"
                    >
                        <div className="w-7 h-7 bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#1A1A1A] text-[9px] font-black uppercase shrink-0">
                            {n.name.substring(0, 2)}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-wider">{n.name}</p>
                            <p className="text-[9px] text-[#737373] flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                                Just came online
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <input
                key={resetKey}
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx,.xls,.csv"
            />

            <div className="h-full overflow-y-auto custom-scrollbar max-w-[1600px] mx-auto px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 relative z-10">
                {/* Header */}
                <header className="mb-4 pb-3 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Row 1: Logo + Title + Clock */}
                    <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 min-w-0">
                            <img src={logo} className="w-9 h-9 sm:w-12 sm:h-12 object-contain shrink-0" alt="Logo" />
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-bold text-[#1A1A1A] tracking-tight uppercase leading-tight">
                                    တီုင်စေတ်မေန်းတိုအီး <span className="text-[#737373] hidden sm:inline">[TIQR CREATOR]</span><span className="text-[#737373] sm:hidden">[TIQR]</span>
                                    <span className="ml-1 px-1 py-0.5 bg-[#FAFAFA] text-[#737373] text-[7px] font-black border border-[#E5E7EB] uppercase tracking-tighter align-middle">V 2.0.0</span>
                                </h1>
                                <p className="text-[#737373] text-[8px] font-bold hidden sm:flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                                    <ShieldCheck size={9} className="text-[#737373] shrink-0" /> powered By <span className="text-[#1A1A1A] opacity-80">Mai Naung Naung & Mai Nay Lin</span>
                                </p>
                            </div>
                        </div>
                        {/* Compact clock — mobile only */}
                        <div className="sm:hidden shrink-0">
                            <WeatherClock compact />
                        </div>
                    </div>

                    {/* Center: Full Clock — desktop only */}
                    <div className="hidden sm:block">
                        <WeatherClock />
                    </div>

                    {/* Row 2 on mobile / right side on desktop: action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {/* Who's Online */}
                        <div className="relative" ref={onlineDropdownRef}>
                            <button
                                onClick={() => setShowOnlineDropdown(!showOnlineDropdown)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#1A1A1A] transition-all active:scale-97"
                            >
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <Users size={11} className="text-[#1A1A1A]" />
                                <span className="text-[9px] sm:text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">
                                    {onlineUsers.length} <span className="hidden sm:inline">ONLINE</span>
                                </span>
                                <ChevronDown size={9} className={`text-[#737373] transition-transform duration-200 ${showOnlineDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showOnlineDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-white border border-[#E5E7EB] shadow-2xl z-50 overflow-hidden"
                                    style={{ animation: 'fadeInDown 0.2s ease-out' }}
                                >
                                    <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA]">
                                        <h3 className="text-[10px] font-black text-[#737373] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            Who's Online Now
                                        </h3>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {onlineUsers.length === 0 ? (
                                            <div className="px-4 py-8 text-center">
                                                <Users size={24} className="mx-auto text-[#737373]/30 mb-2" />
                                                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">No one is online</p>
                                            </div>
                                        ) : (
                                            onlineUsers.map((user) => (
                                                <div key={user._id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#F3F4F6] transition-colors border-b border-[#E5E7EB] last:border-b-0">
                                                    <div className="w-8 h-8 bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#1A1A1A] text-[9px] font-black uppercase flex-shrink-0">
                                                        {user.name.substring(0, 2)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-tight truncate">{user.name}</p>
                                                        <p className="text-[10px] text-[#737373] font-medium flex items-center gap-1 mt-0.5">
                                                            <MapPin size={9} />
                                                            {user.township || 'Unknown'}
                                                            <span className="mx-1 opacity-50">•</span>
                                                            <Clock size={9} />
                                                            {formatTimeAgo(user.lastSeen)}
                                                        </p>
                                                    </div>
                                                    {/* Webcam streaming trigger button */}
                                                    {user._id !== currentUserId && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenWebcam(user);
                                                            }}
                                                            className="p-1 text-[#737373] hover:text-black hover:bg-[#E5E7EB] border border-transparent hover:border-[#E5E7EB] transition-colors shrink-0 mr-1"
                                                            title="Watch live Webcam feed"
                                                        >
                                                            <Video size={12} className="text-[#1A1A1A]" />
                                                        </button>
                                                    )}
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {status.message && (
                            <div className={`px-2.5 py-1.5 flex items-center gap-1.5 border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 max-w-[160px] sm:max-w-none truncate ${status.type === 'success' ? 'bg-[#FAFAFA] text-[#1A1A1A] border-[#E5E7EB]' : 'bg-[#FFF1F2] text-[#FF6B6B] border-red-500/30'
                                }`}>
                                {status.type === 'success' ? <CheckCircle2 size={12} className="text-green-600 shrink-0" /> : <AlertCircle size={12} className="text-red-400 shrink-0" />}
                                <span className="truncate">{status.message}</span>
                            </div>
                        )}
                        {(parseInt(userRole) === 1 || parseInt(userRole) === 2) && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] text-[9px] sm:text-[10px] font-black hover:bg-black hover:text-white transition-all active:scale-97 uppercase tracking-widest"
                            >
                                <ShieldCheck size={12} /> <span className="hidden sm:inline">ADMIN</span><span className="sm:hidden">ADM</span>
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#737373] text-[9px] sm:text-[10px] font-black hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-97 uppercase tracking-widest"
                        >
                            <LogOut size={12} /> <span className="hidden sm:inline">LOGOUT</span>
                        </button>
                    </div>
                </header>

                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 animate-in fade-in duration-700">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-xl bg-white/40 backdrop-blur-sm border-2 border-[#E5E7EB] border-dashed p-6 sm:p-8 flex flex-col items-center justify-center hover:border-black/40 hover:bg-white/60 transition-all duration-200 group active:scale-97 shadow-2xl"
                        >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FAFAFA] text-[#737373] flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-black group-hover:text-white transition-all duration-200 border border-[#E5E7EB]">
                                {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] mb-1.5 uppercase tracking-tight text-center">Import Excel Database</h2>
                            <p className="text-[#737373] text-[10px] sm:text-xs font-medium mb-4 sm:mb-6 text-center max-w-xs uppercase tracking-wide">ဘိူန်းဟံပ်လိူည် Excel (.xlsx) ကာည်း CSV (.csv)</p>
                            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FAFAFA] text-[9px] sm:text-[10px] font-bold uppercase text-[#737373] tracking-wider border border-[#E5E7EB]">
                                    <FileSpreadsheet size={13} className="text-[#737373]" /> .XLSX Excel
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FAFAFA] text-[9px] sm:text-[10px] font-bold uppercase text-[#737373] tracking-wider border border-[#E5E7EB]">
                                    <FileSpreadsheet size={13} className="text-[#737373]" /> .CSV Data
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
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
                            <div className="bg-white/60 backdrop-blur-sm border border-[#E5E7EB] p-3 flex flex-col sm:flex-row items-center gap-3 sticky top-4 z-30 shadow-sm">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]/50" size={16} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH RECORDS (ဒီတီပ်ဟြီုက်)"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] focus:border-black outline-none text-[#1A1A1A] text-xs font-mono uppercase tracking-wider transition-all placeholder:text-[#737373]/40"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {/* Select Mode Toggle */}
                                    <button
                                        onClick={toggleSelectionMode}
                                        className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black transition-all active:scale-97 whitespace-nowrap uppercase tracking-widest border ${selectionMode
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-[#737373] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                                            }`}
                                    >
                                        {selectionMode ? <CheckSquare size={14} /> : <Square size={14} />}
                                        {selectionMode ? 'SELECTING' : 'SELECT'}
                                    </button>

                                    {/* Export All button */}
                                    <button
                                        onClick={handleExportAll}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-[10px] font-black hover:bg-black/85 transition-all active:scale-97 whitespace-nowrap uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        EXPORT ALL
                                    </button>
                                    <button
                                        onClick={clearData}
                                        className="p-2.5 text-[#737373] hover:text-red-600 hover:bg-red-50 transition-all border border-[#E5E7EB]"
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
                                <div className="bg-white/80 backdrop-blur-sm border border-[#E5E7EB] p-4 animate-in fade-in duration-200 shadow-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            Generating QR codes...
                                        </span>
                                        <span className="text-[11px] font-black text-[#1A1A1A]">{downloadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-[#FAFAFA] h-1.5 overflow-hidden border border-[#E5E7EB]">
                                        <div
                                            className="bg-black h-1.5 transition-all duration-300 ease-out"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Grid Content with Skeleton Loading */}
                            {isProcessing ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="bg-white border border-[#E5E7EB] p-6 relative overflow-hidden h-[300px]">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 bg-[#FAFAFA] border border-[#E5E7EB] animate-pulse"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-[#FAFAFA] w-1/3 animate-pulse"></div>
                                                    <div className="h-5 bg-[#FAFAFA] w-2/3 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-center mb-6">
                                                <div className="w-32 h-32 bg-[#FAFAFA] border border-[#E5E7EB] animate-pulse"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-3 bg-[#FAFAFA] w-full animate-pulse"></div>
                                                <div className="h-3 bg-[#FAFAFA] w-4/5 animate-pulse"></div>
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
                        <div className="bg-white/90 backdrop-blur-md border border-[#E5E7EB] p-3 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${selectedCount > 0
                                    ? 'bg-black text-white'
                                    : 'bg-[#FAFAFA] text-[#737373] border border-[#E5E7EB]'
                                    }`}>
                                    <PackageCheck size={14} />
                                    {selectedCount} SELECTED
                                </div>
                                <span className="text-[10px] text-[#737373] font-medium uppercase tracking-wider">
                                    of {filteredData.length} records
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAll}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F3F4F6] text-[#1A1A1A] text-[10px] font-black transition-all border border-[#E5E7EB] active:scale-97 uppercase tracking-widest"
                                >
                                    <CheckSquare size={12} /> SELECT ALL
                                </button>
                                <button
                                    onClick={deselectAll}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F3F4F6] text-[#737373] text-[10px] font-black transition-all border border-[#E5E7EB] active:scale-97 uppercase tracking-widest"
                                >
                                    <X size={12} /> CLEAR
                                </button>
                                <button
                                    onClick={handleBulkDownload}
                                    disabled={selectedCount === 0 || isDownloading}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[10px] font-black hover:bg-black/85 transition-all active:scale-97 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
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
                                    className="p-2 text-[#737373] hover:text-red-500 transition-all"
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
                    from { transform: translateY(-6px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            {/* Webcam Stream Modal */}
            <WebcamModal
                isOpen={isWebcamOpen}
                onClose={() => setIsWebcamOpen(false)}
                targetUser={webcamTarget}
                socket={socketRef.current}
                currentUserId={currentUserId}
            />

            {/* Inbound webcam stream request banner */}
            {inboundRequest && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[999] w-[350px] bg-black/90 border border-cyan-500/30 p-4 shadow-2xl flex flex-col gap-3 font-mono text-white animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping mt-1" />
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">INBOUND CCTV REQUEST</h4>
                            <p className="text-[9px] text-[#A3A3A3] mt-1 leading-relaxed">
                                USER <span className="text-white font-bold">{inboundRequest.requesterName}</span> IS REQUESTING A SECURE WEBCAM STREAM OF YOUR LOCATION.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 text-[9px] font-black uppercase mt-1">
                        <button 
                            onClick={handleAcceptWebcamRequest}
                            className="flex-1 py-1.5 bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
                        >
                            ALLOW STREAM
                        </button>
                        <button 
                            onClick={() => {
                                socketRef.current?.emit("webcam-error", { targetUserId: inboundRequest.requesterId, message: "User rejected feed access." });
                                setInboundRequest(null);
                            }}
                            className="px-3 py-1.5 border border-[#E5E7EB]/10 hover:bg-white/5 transition-all text-[#737373] hover:text-white"
                        >
                            DENY
                        </button>
                    </div>
                </div>
            )}

            {/* Outbound active streaming notification */}
            {outboundStream && (
                <div className="fixed bottom-4 left-4 z-[999] bg-red-600 border border-red-500/30 p-2.5 px-4 shadow-2xl flex items-center gap-3 font-mono text-white text-[9px] uppercase tracking-wider animate-pulse font-bold">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span>ACTIVE OUTBOUND CAMERA FEED (STREAMING)</span>
                    <button 
                        onClick={handleStopOutboundStream}
                        className="ml-2 px-1.5 py-0.5 bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-colors font-bold"
                    >
                        STOP
                    </button>
                </div>
            )}
        </div>
    );
}
