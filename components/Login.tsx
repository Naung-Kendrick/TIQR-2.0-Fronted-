import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, User, Eye, EyeOff } from 'lucide-react';
import { LoadingModal } from './LoadingModal';
import { makeApiUrl } from '../api/config';
import { BackgroundPaths } from './ui/background-paths';

const DEFAULT_LOGO_URL = "/iLovePDF2-bg-removed.png";

export function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
    const [iconClickCount, setIconClickCount] = useState(0);
    const [showAdminBypass, setShowAdminBypass] = useState(false);
    const iconClickTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        if (!localStorage.getItem('device_id')) {
            const newId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_id', newId);
        }
        // Check maintenance mode
        const checkMaintenance = () => {
            setMaintenanceMode(localStorage.getItem('maintenance_mode') === 'true');
        };
        checkMaintenance();
        window.addEventListener('storage', checkMaintenance);
        return () => window.removeEventListener('storage', checkMaintenance);
    }, []);

    // Secret bypass: click wrench icon 5 times within 3s
    const handleIconClick = () => {
        if (iconClickTimer.current) clearTimeout(iconClickTimer.current);
        setIconClickCount(prev => {
            const next = prev + 1;
            if (next >= 5) {
                setShowAdminBypass(true);
                return 0;
            }
            iconClickTimer.current = setTimeout(() => setIconClickCount(0), 3000);
            return next;
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        setIsLoading(true);
        setLoginStatus('loading');
        try {
            const response = await fetch(makeApiUrl('/api/users/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: username, // Mapping 'username' field to 'email' as expected by backend
                    password,
                }),
            });

            const data = await response.json();

            if (data.success && data.accessToken) {
                // Store token with a timestamp to manage 4-day persistence
                localStorage.setItem('auth_token', data.accessToken);
                localStorage.setItem('auth_login_time', Date.now().toString());
                localStorage.setItem('auth_role', data.user.role.toString());
                localStorage.setItem('user_name', data.user.name);

                // Hold loader for 4 seconds then navigate to dashboard
                setLoginStatus('success');
                setTimeout(() => {
                    setIsLoading(false);
                    setLoginStatus('idle');
                    navigate('/dashboard');
                }, 4000);
            } else {
                setError(data.message || 'Invalid credentials.');
                setIsLoading(false);
                setLoginStatus('error');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please check your connection or try again later.');
            setIsLoading(false);
            setLoginStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-transparent">

            {/* ── MAINTENANCE MODE SCREEN ── */}
            {maintenanceMode ? (
                <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] relative overflow-hidden">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-black z-10" />

                    {/* Dot-grid background — drifts slowly */}
                    <div
                        className="mtn-dot-grid"
                        style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                            opacity: 0.6
                        }}
                    />

                    {/* Scan line sweeping top→bottom */}
                    <div
                        className="mtn-scan-line pointer-events-none absolute left-0 right-0 z-20"
                        style={{
                            top: 0,
                            height: '120px',
                            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.035), transparent)'
                        }}
                    />

                    <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">
                        {/* Label — stagger 1 */}
                        <p className="mtn-item-1 text-[#737373] text-[9px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                            <ShieldCheck size={10} className="text-[#1A1A1A]" />
                            Ta'ang Land Immigration Department
                        </p>

                        {/* Icon box — stagger 2 + breathe — click 5× for admin bypass */}
                        <div
                            className="mtn-item-2 mtn-icon-breathe w-16 h-16 mb-8 bg-white border border-[#E5E7EB] flex items-center justify-center cursor-default select-none"
                            onClick={handleIconClick}
                            title=""
                        >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                        </div>

                        {/* Tiny click-count hint dots — visible only after first click */}
                        {iconClickCount > 0 && (
                            <div className="absolute flex gap-1 mb-1" style={{ top: 'calc(50% - 80px)' }}>
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`w-1 h-1 rounded-full transition-all duration-200 ${
                                            i < iconClickCount ? 'bg-black' : 'bg-[#E5E7EB]'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Title — stagger 3 */}
                        <h1 className="mtn-item-3 text-[#1A1A1A] text-5xl font-black uppercase tracking-tight leading-none mb-5">
                            System Under<br />Maintenance
                        </h1>

                        {/* Divider bar — expands outward */}
                        <div className="mtn-bar h-[2px] bg-black mb-8" />

                        {/* Status badge — stagger 4 */}
                        <div className="mtn-item-4 flex items-center gap-2.5 px-5 py-2.5 bg-white border border-[#E5E7EB]">
                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                            <span className="text-[#1A1A1A] text-[9px] font-black uppercase tracking-[0.3em]">
                                Downtime In Progress
                            </span>
                        </div>

                        {/* Footer — stagger 5 */}
                        <p className="mtn-item-5 text-[#737373] text-[9px] font-bold uppercase tracking-[0.3em] mt-14 opacity-40">
                            TIQR V 3.0.0 &nbsp;·&nbsp; Secure Gateway Portal
                        </p>
                    </div>

                    {/* ── ADMIN BYPASS OVERLAY ── */}
                    {showAdminBypass && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm"
                            onClick={(e) => { if (e.target === e.currentTarget) setShowAdminBypass(false); }}
                        >
                            <div className="w-full max-w-sm mx-4 mb-8 bg-white border border-[#E5E7EB] shadow-2xl relative tps-page-enter">
                                {/* Accent */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-black" />
                                <div className="px-7 py-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <p className="text-[#737373] text-[8px] font-black uppercase tracking-[0.3em]">Admin Access</p>
                                            <h2 className="text-[#1A1A1A] text-sm font-black uppercase tracking-tight">Override Login</h2>
                                        </div>
                                        <button
                                            onClick={() => setShowAdminBypass(false)}
                                            className="text-[#737373] hover:text-[#1A1A1A] transition-colors text-lg leading-none"
                                        >✕</button>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-3">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors">
                                                <User size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2.5 border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium text-sm placeholder:text-[#737373] focus:border-black transition-all"
                                                style={{ background: '#FAFAFA' }}
                                                placeholder="Username"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors">
                                                <Lock size={14} />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-8 pr-9 py-2.5 border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium text-sm placeholder:text-[#737373] focus:border-black transition-all"
                                                style={{ background: '#FAFAFA' }}
                                                placeholder="Password"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737373] hover:text-[#1A1A1A] transition-colors">
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>

                                        {error && (
                                            <div className="p-2.5 bg-[#FFF1F2] border border-[#FFE4E6] text-[#BE123C] text-[10px] font-bold text-center uppercase tracking-wider flex justify-center items-center gap-2">
                                                <ShieldCheck size={11} /> {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 font-black tracking-widest text-[10px] uppercase transition-all hover:bg-black/80 mt-1 disabled:opacity-50"
                                        >
                                            {isLoading ? 'Verifying...' : 'Verify Identity'}
                                            {!isLoading && <ArrowRight size={13} />}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            ) : (
                <>

            <div className="w-full lg:w-[360px] flex items-center justify-center bg-[#FAFAFA]/75 backdrop-blur-md h-screen overflow-hidden border-r border-[#E5E7EB]">
                <div className="w-full px-6 py-6 relative z-10 tps-page-enter">
                    <div className="bg-white border border-[#E5E7EB] shadow-2xl px-8 py-7 relative">

                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-black" />

                        {/* Header & Logo */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center mb-4">
                                <img src={DEFAULT_LOGO_URL} className="w-20 h-20 object-contain" alt="Logo" />
                            </div>

                            <h1 className="text-lg font-bold text-[#1A1A1A] tracking-wide mb-0.5 font-mm">
                                ရံပ်ရို; အီနံင်ဒါ (TIQR)
                            </h1>
                            <p className="text-[#737373] text-[10px] font-bold flex justify-center items-center gap-1.5 uppercase tracking-widest">
                                <ShieldCheck size={11} className="text-[#1A1A1A]" /> Secure Gateway Portal
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#737373] uppercase tracking-[0.18em]">System Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors z-10">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium placeholder:text-[#737373] focus:border-black transition-all duration-150 font-mono text-sm"
                                        style={{ background: '#FAFAFA', WebkitTextFillColor: '#1A1A1A' }}
                                        placeholder="Enter your Username"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#737373] uppercase tracking-[0.18em]">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors z-10">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-9 pr-10 py-3 border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium placeholder:text-[#737373] focus:border-black transition-all duration-150 font-mono text-sm"
                                        style={{ background: '#FAFAFA', WebkitTextFillColor: '#1A1A1A' }}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737373] hover:text-[#1A1A1A] transition-colors z-10"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-[#FFF1F2] border border-[#FFE4E6] text-[#BE123C] text-[10px] font-bold text-center uppercase tracking-wider flex justify-center items-center gap-2">
                                    <ShieldCheck size={12} /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full group flex items-center justify-center gap-2 bg-black text-white py-3 font-bold tracking-widest text-[11px] uppercase transition-all duration-150 hover:bg-black/80 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Identity'}
                                {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-150" />}
                            </button>
                        </form>

                        {/* Links & Footer inside the card */}
                        <div className="mt-5 text-center space-y-4">
                            <div className="h-px w-full bg-[#E5E7EB]" />

                            <p className="text-[#737373] text-xs font-medium">
                                New Here?{' '}
                                <Link to="/register" className="text-[#1A1A1A] font-bold hover:underline underline-offset-2 transition-colors">
                                    Request Access
                                </Link>
                            </p>

                            <div className="space-y-1 pt-1">
                                <p className="text-[#737373] text-[9px] font-bold uppercase tracking-[0.2em]">
                                    Ta'ang Land Img QR Code Creator
                                </p>
                                <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.25em]">
                                    VERSION 3.0.0
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel — Animated Floating Paths */}
            <div className="hidden md:flex lg:flex-1 relative overflow-hidden bg-white border-l border-[#E5E7EB]">
                <BackgroundPaths title="TA'ANG LAND IMMIGRATION DEPARTMENT" />
            </div>

            {/* Server Waking Loading Animation Modal */}
            <LoadingModal isVisible={isLoading} status={loginStatus} />
        </>
        )}

        </div>
    );
}
