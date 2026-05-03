import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import { SuccessModal } from './SuccessModal';
import { makeApiUrl } from '../api/config';

const DEFAULT_LOGO_URL = "/logo.png";

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

export function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [township, setTownship] = useState('');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const townships = ["Namhsan Team", "Namkham Team", "Manton Team", "Namtu Team", "Namkham Border Team", "Mongwee Team", "Mongbow Team", "MongNgaw Team", "Kutkai Team"];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!name || !email || !password || !township) {
            setError('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(makeApiUrl('/api/users/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    phone,
                    township
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Show success animation
                setShowSuccess(true);

                // Wait for 2 seconds then navigate to login
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Connection failed. Please try again.');
        } finally {
            setIsSubmitting(false);
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
            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-1000 my-8">
                <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">

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
                            (
                            တီုင်စေတ်မေန်းတိုအီး TIQR)
                        </h1>
                        <p className="text-slate-500 text-sm font-medium flex justify-center items-center gap-1.5">
                            <ShieldCheck size={16} className="text-emerald-500" /> Identity Registration
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-2">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <UserIcon size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200/60 rounded-2xl outline-none text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-sm"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-2">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200/60 rounded-2xl outline-none text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-sm"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-2">Contact Phone</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200/60 rounded-2xl outline-none text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-sm"
                                    placeholder="+95 9..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-2">Select Township</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <MapPin size={18} />
                                </div>
                                <select
                                    value={township}
                                    onChange={(e) => setTownship(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200/60 rounded-2xl outline-none text-slate-900 font-medium focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-sm appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Choose your township</option>
                                    {townships.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ArrowRight size={14} className="rotate-90" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-2">Access Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200/60 rounded-2xl outline-none text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold text-center uppercase tracking-wider animate-in fade-in slide-in-from-top-2 flex justify-center items-center gap-2 shadow-sm mt-4">
                                <ShieldCheck size={14} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full relative group overflow-hidden bg-slate-900 text-emerald-400 py-3.5 rounded-2xl font-bold tracking-wide transition-all duration-300 mt-8 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_25px_rgba(15,23,42,0.2)] hover:bg-slate-800 disabled:opacity-50"
                        >
                            <span className="relative flex items-center justify-center gap-2">
                                {isSubmitting ? 'Registering...' : 'Complete Registration'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </form>

                    {/* Links & Footer inside the card */}
                    <div className="mt-8 text-center space-y-6">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                        <p className="text-slate-500 text-sm font-medium">
                            Already have access?{' '}
                            <Link to="/" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors underline hover:underline-offset-2">
                                Sign In Instead
                            </Link>
                        </p>

                        <div className="space-y-1 pt-2">
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                                Ta'ang Land Img QR Code Creator
                            </p>
                            <p className="text-emerald-600/60 text-[9px] font-black uppercase tracking-[0.3em]">
                                VERSION V 2.0.0
                            </p>
                            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wider mt-2 opacity-60">
                                Powered By Mai San Hlu & Mai Nay Lin
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
