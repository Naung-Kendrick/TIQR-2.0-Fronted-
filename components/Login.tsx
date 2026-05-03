import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, User } from 'lucide-react';
import { SuccessModal } from './SuccessModal';
import { makeApiUrl } from '../api/config';

const DEFAULT_LOGO_URL = "/iLovePDF2-bg-removed.png";

const LaserBackground = () => {
    const lasers = Array.from({ length: 15 }).map((_, i) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 2 + Math.random() * 4;
        const isCyan = Math.random() > 0.5;
        const length = 50 + Math.random() * 150;

        return (
            <div
                key={i}
                className={`absolute h-[2px] rounded-full animate-laser ${isCyan ? 'text-cyan-400' : 'text-emerald-400'} opacity-60`}
                style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    width: `${length}px`,
                    background: 'linear-gradient(90deg, transparent, currentColor, white)',
                    boxShadow: '0 0 10px currentColor, 0 0 20px currentColor',
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                }}
            />
        );
    });

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {lasers}
        </div>
    );
};

export function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    React.useEffect(() => {
        if (!localStorage.getItem('device_id')) {
            const newId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_id', newId);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

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

                // Show success animation
                setShowSuccess(true);

                // Wait for 2 seconds then navigate
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                setError(data.message || 'Invalid credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please check your connection or try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Star Wars Laser Background */}
            <LaserBackground />

            {/* Immersive Animated Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-300/30 rounded-full blur-[120px] mix-blend-multiply animate-pulse duration-10000 pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-300/30 rounded-full blur-[100px] mix-blend-multiply pointer-events-none" />

            {/* Grain overlay for texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

            {/* Centralized Glass Card */}
            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-[2.5rem] p-8 md:p-10 lg:p-12 relative overflow-hidden">

                    {/* Subtle inner top highlight */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                    {/* Header & Logo */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-1 rounded-3xl bg-gradient-to-b from-white to-transparent shadow-xl mb-6 float-animation relative">
                            {/* Animated glowing backdrop */}
                            <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full animate-pulse" style={{ animationDuration: '3s' }} />

                            <div className="bg-white p-4 rounded-[1.25rem] border border-slate-100 relative z-10 [perspective:1000px]">
                                <img src={DEFAULT_LOGO_URL} className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.2)] animate-spin-y" alt="Logo" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-mm font-bold text-slate-900 tracking-wide mb-2">
                            ရံပ်ရို; အီနံင်ဒါ (TIQR)
                        </h1>
                        <p className="text-slate-500 text-sm font-medium flex justify-center items-center gap-1.5">
                            <ShieldCheck size={16} className="text-emerald-500" /> Secure Gateway Portal
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-2">System Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-2xl outline-none text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-sm"
                                    placeholder="Enter your credential ID"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-2">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-2xl outline-none text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold text-center uppercase tracking-wider animate-in fade-in slide-in-from-top-2 flex justify-center items-center gap-2 shadow-sm">
                                <ShieldCheck size={14} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full relative group overflow-hidden bg-slate-900 text-emerald-400 py-3.5 rounded-2xl font-bold tracking-wide transition-all duration-300 mt-8 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_25px_rgba(15,23,42,0.2)] hover:bg-slate-800"
                        >
                            <span className="relative flex items-center justify-center gap-2">
                                Authenticate Session
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </form>

                    {/* Links & Footer inside the card */}
                    <div className="mt-8 text-center space-y-6">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                        <p className="text-slate-500 text-sm font-medium">
                            New Here?{' '}
                            <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors underline hover:underline-offset-2">
                                Request Access
                            </Link>
                        </p>

                        <div className="space-y-1 pt-2">
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                                Ta'ang Land Img QR Code Creator
                            </p>
                            <p className="text-emerald-600/60 text-[9px] font-black uppercase tracking-[0.3em]">
                                VERSION V 2.0.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Animation Modal */}
            <SuccessModal isVisible={showSuccess} />
        </div>
    );
}
