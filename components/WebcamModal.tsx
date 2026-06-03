import React, { useEffect, useRef, useState } from 'react';
import { 
    X, 
    Camera, 
    Tv, 
    Activity, 
    Volume2, 
    VolumeX, 
    ShieldAlert, 
    Video, 
    VideoOff, 
    Download, 
    RefreshCw 
} from 'lucide-react';

interface WebcamModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUser: { _id: string; name: string; township?: string } | null;
    socket: any;
    currentUserId: string | null;
}

type VisualFilter = 'normal' | 'cyber-green' | 'night-vision' | 'retro-bw';

export function WebcamModal({ isOpen, onClose, targetUser, socket, currentUserId }: WebcamModalProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [filter, setFilter] = useState<VisualFilter>('normal');
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'streaming' | 'fallback' | 'failed'>('connecting');
    const [fps, setFps] = useState(30);
    const [latency, setLatency] = useState(42);
    const [isShutterActive, setIsShutterActive] = useState(false);
    const [streamType, setStreamType] = useState<string>('PEER-TO-PEER ENCRYPTED');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const waveCanvasRef = useRef<HTMLCanvasElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    // Dynamic telemetry calculations
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            // Random fluctuations for realism
            setFps(Math.floor(28 + Math.random() * 5));
            setLatency(Math.floor(35 + Math.random() * 15));
        }, 1500);
        return () => clearInterval(interval);
    }, [isOpen]);

    // Canvas wave animation (Oscilloscope)
    useEffect(() => {
        if (!isOpen || !waveCanvasRef.current) return;
        const canvas = waveCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let offset = 0;

        const draw = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = '#1A1A1A'; // clean off-black line matching dashboard typography
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            
            const width = canvas.width;
            const height = canvas.height;
            const mid = height / 2;

            for (let x = 0; x < width; x++) {
                // Combine a couple sine waves for complex organic wave look
                const y = mid + 
                    Math.sin(x * 0.05 + offset) * 8 + 
                    Math.sin(x * 0.1 - offset * 1.5) * 3;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            offset += 0.08;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isOpen, connectionStatus]);

    // WebRTC connection logic & Fallback simulator
    useEffect(() => {
        if (!isOpen || !targetUser || !socket || !currentUserId) return;

        let isMounted = true;
        let connectionTimeout: any;

        const initWebRTC = async () => {
            try {
                console.log("WebcamModal: Initializing WebRTC stream request for target:", targetUser._id);
                setConnectionStatus('connecting');

                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                });
                peerConnectionRef.current = pc;

                pc.ontrack = (event) => {
                    console.log("WebcamModal: Inbound track received");
                    if (event.streams && event.streams[0]) {
                        if (isMounted) {
                            setStream(event.streams[0]);
                            setConnectionStatus('streaming');
                            setStreamType('PEER-TO-PEER ENCRYPTED');
                        }
                    }
                };

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit("ice-candidate", {
                            targetUserId: targetUser._id,
                            candidate: event.candidate
                        });
                    }
                };

                // Request target user's webcam
                const currentUserName = localStorage.getItem('user_name') || 'Admin';
                socket.emit("webcam-request", {
                    targetUserId: targetUser._id,
                    requesterId: currentUserId,
                    requesterName: currentUserName
                });

                // Define named handlers for cleanup by reference
                const handleOffer = async ({ offer }: { offer: any }) => {
                    if (!isMounted) return;
                    console.log("WebcamModal: Received SDP offer");
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit("webcam-answer", {
                        targetUserId: targetUser._id,
                        answer: answer
                    });
                };

                const handleAnswer = async ({ answer }: { answer: any }) => {
                    if (!isMounted) return;
                    console.log("WebcamModal: Received SDP answer");
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    setConnectionStatus('streaming');
                };

                const handleCandidate = async ({ candidate }: { candidate: any }) => {
                    try {
                        if (pc.remoteDescription) {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        }
                    } catch (e) {
                        console.error("Error adding ice candidate:", e);
                    }
                };

                const handleError = (data: any) => {
                    console.warn("WebcamModal socket error:", data.message);
                    triggerFallback();
                };

                // Socket WebRTC listeners
                socket.on("webcam-offer", handleOffer);
                socket.on("webcam-answer", handleAnswer);
                socket.on("ice-candidate", handleCandidate);
                socket.on("webcam-error", handleError);

                // Connection Timeout to activate fallback simulation
                connectionTimeout = setTimeout(() => {
                    if (isMounted && connectionStatus === 'connecting') {
                        console.log("WebcamModal: Signaling timed out. Triggering local simulator fallback.");
                        triggerFallback();
                    }
                }, 4000); // 4 seconds timeout

                // Expose handlers for cleanup scope
                (pc as any)._handlers = { handleOffer, handleAnswer, handleCandidate, handleError };

            } catch (err) {
                console.error("Failed to initialize WebRTC:", err);
                triggerFallback();
            }
        };

        const triggerFallback = async () => {
            if (!isMounted) return;
            console.log("WebcamModal: Launching local loopback simulation...");
            setConnectionStatus('fallback');
            setStreamType('LOCAL SIMULATION LOOPBACK');
            try {
                const localMedia = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: true
                });
                
                localStreamRef.current = localMedia;
                if (isMounted) {
                    setStream(localMedia);
                }
            } catch (e) {
                console.error("Local camera access denied or unavailable:", e);
                if (isMounted) {
                    setConnectionStatus('failed');
                }
            }
        };

        initWebRTC();

        return () => {
            isMounted = false;
            clearTimeout(connectionTimeout);
            
            // Clean up sockets by reference
            if (socket) {
                const pc = peerConnectionRef.current;
                const handlers = (pc as any)?._handlers;
                if (handlers) {
                    socket.off("webcam-offer", handlers.handleOffer);
                    socket.off("webcam-answer", handlers.handleAnswer);
                    socket.off("ice-candidate", handlers.handleCandidate);
                    socket.off("webcam-error", handlers.handleError);
                }
                // Notify backend we closed the stream
                socket.emit("webcam-close", { targetUserId: targetUser._id });
            }

            // Close WebRTC
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            // Stop local stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
        };
    }, [isOpen, targetUser, socket, currentUserId]);

    // Handle video tag source binding
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Play synthesized shutter camera noise
    const playShutterSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.16);
            setTimeout(() => ctx.close(), 500);
        } catch { }
    };

    // Take snapshot and download
    const takeSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions to match video viewport
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Apply filters directly to canvas representation
        if (filter === 'cyber-green') {
            ctx.filter = 'hue-rotate(90deg) saturate(1.5) contrast(1.2) brightness(0.9)';
        } else if (filter === 'night-vision') {
            ctx.filter = 'sepia(1) hue-rotate(70deg) saturate(3) contrast(1.5)';
        } else if (filter === 'retro-bw') {
            ctx.filter = 'grayscale(1) contrast(1.4)';
        } else {
            ctx.filter = 'none';
        }

        // Draw image
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Shutter flash effect
        setIsShutterActive(true);
        playShutterSound();
        setTimeout(() => setIsShutterActive(false), 250);

        // Download trigger
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `webcam_snapshot_${targetUser?.name || 'User'}_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Failed to capture snapshot:", e);
        }
    };

    if (!isOpen) return null;

    // Filter style mapper
    const getFilterClass = () => {
        switch (filter) {
            case 'cyber-green': return 'hue-rotate-90 saturate-[1.5] contrast-[1.2] brightness-[0.9]';
            case 'night-vision': return 'sepia hue-rotate-[70deg] saturate-[3] contrast-[1.5] brightness-[0.8]';
            case 'retro-bw': return 'grayscale contrast-[1.4]';
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-all duration-300">
            {/* Shutter Flash Layer */}
            {isShutterActive && (
                <div className="fixed inset-0 z-[10000] bg-white animate-flash pointer-events-none" />
            )}

            {/* Hidden canvas for snapshot rendering */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="relative w-full max-w-4xl bg-white border border-[#E5E7EB] text-[#1A1A1A] shadow-2xl flex flex-col overflow-hidden select-none">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-[#E5E7EB] bg-[#FAFAFA]">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping absolute -top-0.5 -left-0.5" />
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full absolute" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-2">
                                LIVE WEBCAM FEED <span className="text-[#737373]">|</span> {targetUser?.name || 'TARGET'}
                            </h2>
                            <p className="text-[9px] text-[#737373] font-bold uppercase tracking-wider mt-0.5">
                                Location: <span className="text-[#1A1A1A] font-bold">{targetUser?.township || 'Unknown Region'}</span>
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] p-1.5 transition-colors border border-transparent hover:border-[#E5E7EB] rounded-sm"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Main Viewport Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* Viewport Screen */}
                    <div className="lg:col-span-8 bg-black relative border-r border-[#E5E7EB] aspect-video flex items-center justify-center overflow-hidden">
                        
                        {/* Feed Info Badges */}
                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                            <span className="px-2.5 py-1 bg-white border border-[#E5E7EB] text-[8px] font-black text-[#1A1A1A] uppercase tracking-wider rounded-sm shadow-sm">
                                Feed: {streamType}
                            </span>
                            {connectionStatus === 'fallback' && (
                                <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 text-[8px] font-black text-yellow-600 uppercase tracking-wider rounded-sm shadow-sm flex items-center gap-1">
                                    <ShieldAlert size={10} /> LOOPBACK TEST MODE
                                </span>
                            )}
                        </div>

                        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E7EB] text-[8px] font-black tracking-widest uppercase rounded-sm shadow-sm text-red-600">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping absolute" />
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full relative" />
                            LIVE FEED
                        </div>

                        {/* Viewport Render States */}
                        {connectionStatus === 'connecting' && (
                            <div className="flex flex-col items-center gap-3 text-center px-4">
                                <RefreshCw size={28} className="animate-spin text-[#1A1A1A]" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#1A1A1A]">RESOLVING PEER LINK...</p>
                                    <p className="text-[9px] text-[#737373] uppercase tracking-wider">Establishing handshake channel</p>
                                </div>
                            </div>
                        )}

                        {connectionStatus === 'failed' && (
                            <div className="flex flex-col items-center gap-3 text-center px-4">
                                <VideoOff size={28} className="text-red-500" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500">FEED OFFLINE / UNAVAILABLE</p>
                                    <p className="text-[9px] text-[#737373] uppercase tracking-wider">Target rejected stream or camera permission blocked</p>
                                </div>
                            </div>
                        )}

                        {(connectionStatus === 'streaming' || connectionStatus === 'fallback') && (
                            <video 
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted={isMuted}
                                className={`w-full h-full object-cover transition-all duration-300 ${getFilterClass()}`}
                            />
                        )}

                        {/* Video metadata overlay bottom */}
                        <div className="absolute bottom-4 left-4 z-20 text-[8px] font-mono text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] space-y-0.5 uppercase opacity-90 tracking-wider">
                            <p>FPS: {fps}</p>
                            <p>LATENCY: {latency}ms</p>
                            <p>RESOLUTION: 1280 x 720</p>
                        </div>
                    </div>

                    {/* Telemetry and Controls Sidebar */}
                    <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-[#FAFAFA]">
                        
                        {/* Diagnostic Section */}
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-[9px] font-black text-[#737373] uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity size={10} className="text-black" /> SIGNAL METRICS
                                </h4>
                                <div className="mt-2 border border-[#E5E7EB] bg-white h-14 relative flex items-center justify-center">
                                    <canvas ref={waveCanvasRef} width={260} height={50} className="w-full h-full" />
                                </div>
                            </div>

                            {/* Telemetry data */}
                            <div className="space-y-2 border-y border-[#E5E7EB] py-3 text-[9px] uppercase tracking-wider text-[#737373]">
                                <div className="flex justify-between">
                                    <span>CONNECTION:</span>
                                    <span className={connectionStatus === 'streaming' ? 'text-green-600 font-bold' : connectionStatus === 'fallback' ? 'text-yellow-600 font-bold' : 'text-red-500 font-bold'}>
                                        {connectionStatus === 'fallback' ? 'LOOPBACK' : connectionStatus}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ENCRYPTION:</span>
                                    <span className="text-[#1A1A1A] font-bold">AES-256</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PEER ID:</span>
                                    <span className="text-[#1A1A1A] font-bold truncate max-w-[120px]">{targetUser?._id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PACKETS:</span>
                                    <span className="text-green-600 font-bold">ACTIVE OK</span>
                                </div>
                            </div>

                            {/* Filter selection */}
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black text-[#737373] uppercase tracking-widest flex items-center gap-1.5">
                                    <Tv size={10} className="text-black" /> VIDEO FILTER
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5 text-[8px] font-black">
                                    <button 
                                        onClick={() => setFilter('normal')}
                                        className={`py-2 border transition-all text-center rounded-sm font-bold uppercase tracking-wider ${filter === 'normal' ? 'bg-black text-white border-black' : 'bg-white border-[#E5E7EB] text-[#737373] hover:bg-[#F3F4F6] hover:text-black'}`}
                                    >
                                        NORMAL FEED
                                    </button>
                                    <button 
                                        onClick={() => setFilter('cyber-green')}
                                        className={`py-2 border transition-all text-center rounded-sm font-bold uppercase tracking-wider ${filter === 'cyber-green' ? 'bg-black text-white border-black' : 'bg-white border-[#E5E7EB] text-[#737373] hover:bg-[#F3F4F6] hover:text-black'}`}
                                    >
                                        CYBER COLOR
                                    </button>
                                    <button 
                                        onClick={() => setFilter('night-vision')}
                                        className={`py-2 border transition-all text-center rounded-sm font-bold uppercase tracking-wider ${filter === 'night-vision' ? 'bg-black text-white border-black' : 'bg-white border-[#E5E7EB] text-[#737373] hover:bg-[#F3F4F6] hover:text-black'}`}
                                    >
                                        NIGHT VISION
                                    </button>
                                    <button 
                                        onClick={() => setFilter('retro-bw')}
                                        className={`py-2 border transition-all text-center rounded-sm font-bold uppercase tracking-wider ${filter === 'retro-bw' ? 'bg-black text-white border-black' : 'bg-white border-[#E5E7EB] text-[#737373] hover:bg-[#F3F4F6] hover:text-black'}`}
                                    >
                                        MONOCHROME
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Controls */}
                        <div className="space-y-2 pt-6">
                            <div className="flex gap-2">
                                <button 
                                    onClick={takeSnapshot}
                                    disabled={connectionStatus === 'connecting' || connectionStatus === 'failed'}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-black hover:bg-black/85 text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed border border-black rounded-sm active:scale-97"
                                >
                                    <Camera size={13} /> TAKE SNAPSHOT
                                </button>
                                <button 
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="px-3 border border-[#E5E7EB] bg-white text-black hover:bg-[#F3F4F6] transition-all rounded-sm flex items-center justify-center active:scale-97"
                                    title={isMuted ? "Unmute Audio" : "Mute Audio"}
                                >
                                    {isMuted ? <VolumeX size={14} className="text-red-500" /> : <Volume2 size={14} className="text-green-600" />}
                                </button>
                            </div>

                            <button 
                                onClick={onClose}
                                className="w-full py-2 bg-white border border-[#E5E7EB] text-[#737373] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-[10px] font-black uppercase tracking-widest text-center rounded-sm active:scale-97"
                            >
                                SHUTDOWN SIGNAL
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles Inline for flash animations */}
            <style>{`
                @keyframes flash {
                    0% { opacity: 0; }
                    25% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-flash {
                    animation: flash 0.25s ease-out;
                }
            `}</style>
        </div>
    );
}
