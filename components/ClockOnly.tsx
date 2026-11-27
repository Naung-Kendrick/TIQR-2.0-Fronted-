import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ClockOnlyProps {
  compact?: boolean;
}

/**
 * Shared live digital clock with second progress ring for TIQR dashboards.
 */
export function ClockOnly({ compact = false }: ClockOnlyProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hours = time.getHours();
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = time.getSeconds();
  const ss = String(seconds).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');
  const date = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const progressPercent = ((seconds + 1) / 60) * 100;
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-md border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
        <span className="text-[11px] font-black text-[#1A1A1A] tabular-nums font-mono leading-none">
          {displayHours}:{minutes}
        </span>
        <span className="text-[9px] font-bold text-blue-600 leading-none">{ampm}</span>
        <span className="text-[8px] font-mono text-[#737373] tabular-nums">:{ss}</span>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2.5 px-2.5 py-1 bg-white/80 hover:bg-white backdrop-blur-md border border-[#E5E7EB] hover:border-blue-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] transition-all duration-300 shrink-0">
      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
        <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r={radius}
            className="stroke-[#E5E7EB]"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            className="stroke-blue-600 transition-[stroke-dashoffset] duration-300 ease-linear"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock size={13} className="text-[#1A1A1A] group-hover:text-blue-600 transition-colors" />
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-1">
          <span className="text-[15px] font-black tracking-tight text-[#1A1A1A] font-mono tabular-nums leading-none">
            {displayHours}:{minutes}
          </span>
          <span className="text-[10px] font-black text-blue-600 tracking-wider leading-none">
            {ampm}
          </span>
          <span className="inline-flex items-center px-1 py-0.2 rounded bg-blue-50 text-[9px] font-mono font-bold text-blue-700 tabular-nums border border-blue-100/60 leading-none ml-0.5">
            :{ss}
          </span>
        </div>
        <div className="flex items-center mt-1">
          <span className="text-[9px] font-bold text-[#737373] tracking-widest uppercase leading-none">
            {date}
          </span>
        </div>
      </div>
    </div>
  );
}
