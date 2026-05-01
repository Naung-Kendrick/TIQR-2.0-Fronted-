import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import { SuccessModal } from './SuccessModal';

const DEFAULT_LOGO_URL = "/iLovePDF2-bg-removed.png";

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

    const townships = ["Namhsan", "Namkham", "Manton", "Namtu", "Border", "Mongwee"];

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
            const response = await fetch('/api/users/register', {
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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="inline-block bg-slate-900 p-3 rounded-[1.5rem] border-2 border-emerald-500 shadow-xl mb-4 float-animation">
                        <img src={DEFAULT_LOGO_URL} className="w-16 h-16" alt="Logo" />
                    </div>
                    <h1 className="text-xl font-padauk font-medium text-slate-900 tracking-tight mb-2">
                        တီုင်စေတ်မေန်းတိုအီး (TIQR)
                    </h1>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" /> New Identity Registration
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-[1.2rem] outline-none text-slate-900 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                placeholder="ENTER YOUR NAME"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-[1.2rem] outline-none text-slate-900 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                placeholder="EMAIL@EXAMPLE.COM"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Contact Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-[1.2rem] outline-none text-slate-900 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                placeholder="+95 9..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Select Township</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={township}
                                onChange={(e) => setTownship(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-[1.2rem] outline-none text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm appearance-none cursor-pointer"
                                required
                            >
                                <option value="" disabled>CHOOSE YOUR TOWNSHIP</option>
                                {townships.map(t => (
                                    <option key={t} value={t}>{t.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ArrowRight size={14} className="rotate-90" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Access Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-[1.2rem] outline-none text-slate-900 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold text-center uppercase tracking-wide animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 text-emerald-400 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/20 mt-4 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Registering...' : 'Complete Registration'}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        Already have access? <Link to="/" className="text-emerald-600 hover:text-emerald-500 transition-colors">Sign In Instead</Link>
                    </p>
                </div>

                <div className="mt-8 text-center space-y-2 opacity-60">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                        TA'ANG LAND IMG TIQR BY TITS TEAM
                    </p>
                </div>
            </div>

            {/* Success Animation Modal */}
            <SuccessModal isVisible={showSuccess} />
        </div>
    );
}
