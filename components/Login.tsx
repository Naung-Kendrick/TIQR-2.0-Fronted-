import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, User, Eye, EyeOff } from 'lucide-react';
import { SuccessModal } from './SuccessModal';
import { makeApiUrl } from '../api/config';
import { BackgroundPaths } from '@/components/ui/background-paths';

const DEFAULT_LOGO_URL = "/iLovePDF2-bg-removed.png";

export function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen flex relative overflow-hidden bg-transparent">

            {/* Left Panel — Login Form */}
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
                                className="w-full group flex items-center justify-center gap-2 bg-black text-white py-3 font-bold tracking-widest text-[11px] uppercase transition-all duration-150 hover:bg-black/80 mt-4"
                            >
                                Authenticate Session
                                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-150" />
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
                                <p className="text-[#1A1A1A] text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
                                    VERSION V 2.0.0
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

            {/* Success Animation Modal */}
            <SuccessModal isVisible={showSuccess} />
        </div>
    );
}
