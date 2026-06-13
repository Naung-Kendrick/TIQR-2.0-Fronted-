import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingModalProps {
    isVisible: boolean;
    status: 'idle' | 'loading' | 'success' | 'error';
}

export function LoadingModal({ isVisible, status }: LoadingModalProps) {
    const [isColdStarting, setIsColdStarting] = useState(false);
    const [progress, setProgress] = useState(0);

    // 1. Handle loading phase progress updates
    useEffect(() => {
        if (!isVisible) {
            setProgress(0);
            setIsColdStarting(false);
            return;
        }

        if (status === 'loading') {
            const timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) return 95;
                    // Increase by 2% per second. Reaches 90% in 45s.
                    const next = prev + 2;
                    if (next >= 6) { // Show cold start warning after 3 seconds
                        setIsColdStarting(true);
                    }
                    return next;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isVisible, status]);

    // 2. Handle success phase sweep to 100% over the 4-second hold
    useEffect(() => {
        if (isVisible && status === 'success') {
            const startProgress = progress;
            const gap = 100 - startProgress;
            let secondsElapsed = 0;

            const timer = setInterval(() => {
                secondsElapsed += 1;
                setProgress(() => {
                    const next = startProgress + (gap * (secondsElapsed / 4));
                    return Math.min(100, Math.round(next));
                });

                if (secondsElapsed >= 4) {
                    clearInterval(timer);
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isVisible, status]);

    // 3. Determine color based on progress percentage
    const getProgressColor = (val: number) => {
        if (val <= 50) return '#10B981'; // Green
        if (val <= 75) return '#F59E0B'; // Orange
        return '#EF4444'; // Red
    };

    const currentColor = getProgressColor(progress);
    const strokeDasharray = 264;
    const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 100;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans tracking-tight">
                    {/* Dark Grid Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/90 backdrop-blur-xl"
                    >
                        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] bg-[size:40px_40px]" />
                    </motion.div>

                    {/* Simple Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative z-10 w-full max-w-sm px-6"
                    >
                        <div className="bg-white border border-[#E5E7EB] shadow-2xl p-8 text-center relative">
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-black" />

                            {/* Rotating Ring with Centered Red Seconds */}
                            <div className="flex justify-center mb-6">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg
                                        className="absolute w-full h-full -rotate-90"
                                        viewBox="0 0 100 100"
                                    >
                                        {/* Background ring */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke="#F3F4F6"
                                            strokeWidth="6"
                                        />
                                        {/* Animated dynamic foreground ring */}
                                        <motion.circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke={currentColor}
                                            strokeWidth="6"
                                            strokeDasharray={strokeDasharray}
                                            animate={{ strokeDashoffset }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    
                                    {/* Centered red timing text */}
                                    <span 
                                        className="font-mono font-bold text-sm z-10 transition-colors duration-300"
                                        style={{ color: currentColor }}
                                    >
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                            </div>

                            {/* Title & Status */}
                            <h3 className="text-[#1A1A1A] font-black text-xs uppercase tracking-[0.2em] mb-2">
                                Authenticating Session
                            </h3>
                            <p className="text-[#737373] text-[10px] font-bold uppercase tracking-widest">
                                {status === 'success' ? 'Clearing Session Handshake...' : 'Connecting to Secure Gateway...'}
                            </p>

                            {/* Simple explanatory note if sleeping */}
                            <AnimatePresence>
                                {isColdStarting && status === 'loading' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="mt-6 pt-5 border-t border-[#E5E7EB]"
                                    >
                                        <p className="text-[#737373] text-[10px] font-medium leading-relaxed">
                                            The backend server is waking up from standby. 
                                            This may take up to 50 seconds. Please do not close this page.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
