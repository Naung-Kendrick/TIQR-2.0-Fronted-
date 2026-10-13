import React from 'react';
import { X, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DateRuleConfig } from '../../lib/dataChecker/types';

interface DateAmbiguityModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambiguousCount: number;
  currentResolution: 'PROMPT' | 'FORCE_DD_MM' | 'FORCE_MM_DD';
  onConfirmResolution: (resolution: 'FORCE_DD_MM' | 'FORCE_MM_DD') => void;
}

export const DateAmbiguityModal: React.FC<DateAmbiguityModalProps> = ({
  isOpen,
  onClose,
  ambiguousCount,
  onConfirmResolution
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider">
              Confirm Ambiguous Date Interpretation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] text-[#737373] hover:text-[#1A1A1A] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-[#1A1A1A]">
          <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <Calendar size={16} className="shrink-0 mt-0.5 text-amber-700" />
            <div className="space-y-1">
              <p className="font-bold uppercase tracking-tight">
                {ambiguousCount} ambiguous date value{ambiguousCount > 1 ? 's' : ''} detected
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Dates like <span className="font-mono font-bold">03/04/2000</span> can represent either{' '}
                <strong>3 April 2000 (DD/MM/YYYY)</strong> or <strong>4 March 2000 (MM/DD/YYYY)</strong>.
                Per verification policy, the system does not guess silently without confirmation.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#737373] leading-relaxed">
            Please choose the intended calendar format for this file to resolve the warnings and finalize validation:
          </p>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onConfirmResolution('FORCE_DD_MM')}
              className="p-3.5 bg-white border-2 border-black hover:bg-black hover:text-white transition-all text-left flex items-start justify-between group active:scale-98"
            >
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest block text-emerald-700 group-hover:text-emerald-300">
                  RECOMMENDED (MYANMAR STANDARD)
                </span>
                <span className="text-xs font-bold uppercase tracking-wider block mt-0.5">
                  DD/MM/YYYY (Day First)
                </span>
                <span className="text-[10px] text-[#737373] group-hover:text-white/80 block mt-0.5 font-mono">
                  03/04/2000 → 3rd of April 2000
                </span>
              </div>
              <CheckCircle2 size={16} className="shrink-0 mt-1" />
            </button>

            <button
              type="button"
              onClick={() => onConfirmResolution('FORCE_MM_DD')}
              className="p-3.5 bg-white border border-[#E5E7EB] hover:border-black hover:bg-[#FAFAFA] transition-all text-left flex items-start justify-between group active:scale-98"
            >
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest block text-[#737373]">
                  US CONVENTION
                </span>
                <span className="text-xs font-bold uppercase tracking-wider block mt-0.5">
                  MM/DD/YYYY (Month First)
                </span>
                <span className="text-[10px] text-[#737373] block mt-0.5 font-mono">
                  03/04/2000 → 4th of March 2000
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFAFA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E5E7EB] bg-white text-[#737373] hover:text-black text-[10px] font-bold uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
