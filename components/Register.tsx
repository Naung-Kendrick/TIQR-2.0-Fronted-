import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import { SuccessModal } from './SuccessModal';
import { makeApiUrl } from '../api/config';

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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-transparent">

            {/* Centralized Card */}
            <div className="w-full max-w-md relative z-10 tps-page-enter my-8">
                <div className="bg-white border border-[#E5E7EB] shadow-2xl p-8 md:p-10 relative">

                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#000000]" />

                    {/* Header & Logo */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center mb-6">
                            <div className="bg-[#F3F4F6] p-5 border border-[#E5E7EB]">
                                <img src={DEFAULT_LOGO_URL} className="w-14 h-14 md:w-16 md:h-16 object-contain" alt="Logo" />
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-[#1A1A1A] tracking-wide mb-1 font-mm">
                            တီုင်စေတ်မေန်းတိုအီး (TIQR)
                        </h1>
                        <p className="text-[#737373] text-xs font-medium flex justify-center items-center gap-1.5 uppercase tracking-widest">
                            <ShieldCheck size={13} className="text-[#1A1A1A]" /> Identity Registration
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-[0.18em]">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors">
                                    <UserIcon size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-[#FAFAFA] border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium placeholder:text-[#737373] focus:bg-white focus:border-[#000000] transition-all duration-150 text-sm"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-[0.18em]">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-[#FAFAFA] border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium placeholder:text-[#737373] focus:bg-white focus:border-[#000000] transition-all duration-150 font-mono text-sm"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-[0.18em]">Contact Phone</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors">
                                    <Phone size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-[#FAFAFA] border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium placeholder:text-[#737373] focus:bg-white focus:border-[#000000] transition-all duration-150 font-mono text-sm"
                                    placeholder="+95 9..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-[0.18em]">Select Township</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors">
                                    <MapPin size={16} />
                                </div>
                                <select
                                    value={township}
                                    onChange={(e) => setTownship(e.target.value)}
                                    className="w-full pl-9 pr-8 py-3 bg-[#FAFAFA] border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium focus:bg-white focus:border-[#000000] transition-all duration-150 appearance-none cursor-pointer text-sm"
                                    required
                                >
                                    <option value="" disabled>Choose your township</option>
                                    {townships.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#737373]">
                                    <ArrowRight size={13} className="rotate-90" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-[0.18em]">Access Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] group-focus-within:text-[#1A1A1A] transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-[#FAFAFA] border border-[#E5E7EB] outline-none text-[#1A1A1A] font-medium placeholder:text-[#737373] focus:bg-white focus:border-[#000000] transition-all duration-150 font-mono text-sm"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-[#FFF1F2] border border-[#FFE4E6] text-[#BE123C] text-[10px] font-bold text-center uppercase tracking-wider flex justify-center items-center gap-2 mt-2">
                                <ShieldCheck size={12} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full group flex items-center justify-center gap-2 bg-[#000000] text-white py-3.5 font-bold tracking-widest text-[11px] uppercase transition-all duration-150 hover:bg-[#1A1A1A] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Registering...' : 'Complete Registration'}
                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                        </button>
                    </form>

                    {/* Links & Footer inside the card */}
                    <div className="mt-8 text-center space-y-5">
                        <div className="h-px w-full bg-[#E5E7EB]" />

                        <p className="text-[#737373] text-xs font-medium">
                            Already have access?{' '}
                            <Link to="/" className="text-[#1A1A1A] font-bold hover:underline underline-offset-2 transition-colors">
                                Sign In Instead
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

            {/* Success Animation Modal */}
            <SuccessModal isVisible={showSuccess} />
        </div>
    );
}
