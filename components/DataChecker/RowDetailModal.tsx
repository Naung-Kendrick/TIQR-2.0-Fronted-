import React from 'react';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  CalendarClock,
  User,
  Fingerprint,
  Info,
  Wrench
} from 'lucide-react';
import { ValidatedRow } from '../../lib/dataChecker/types';

interface RowDetailModalProps {
  row: ValidatedRow | null;
  onClose: () => void;
}

export const RowDetailModal: React.FC<RowDetailModalProps> = ({ row, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!row) return null;

  const handleCopyId = () => {
    if (!row.rawId) return;
    navigator.clipboard.writeText(row.rawId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allIssues = [...row.errors, ...row.warnings];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-black bg-black text-white px-2 py-0.5 uppercase tracking-wider">
              Row #{row.rowNumber}
            </span>
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                row.status === 'PASS'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : row.status === 'FAIL'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {row.status}
            </span>
            <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-tight">
              Record Inspection
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] text-[#737373] hover:text-[#1A1A1A] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* Main Key Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ta'ang Land ID No. */}
            <div className={`p-3 border ${row.hasIdError ? 'border-red-300 bg-red-50/30' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black uppercase text-[#737373] tracking-widest flex items-center gap-1.5">
                  <Fingerprint size={12} /> Ta'ang Land ID No.
                </span>
                <span className="text-[9px] font-mono text-[#737373]">
                  {row.rawId.length} / 19 digits
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-black text-[#1A1A1A] tracking-wider break-all">
                  {row.rawId || '<EMPTY>'}
                </span>
                {row.rawId && (
                  <button
                    onClick={handleCopyId}
                    title="Copy ID"
                    className="p-1.5 hover:bg-white border border-transparent hover:border-[#E5E7EB] transition-colors text-[#737373]"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            {/* Name & Prefix */}
            <div className={`p-3 border ${row.hasGenderMismatch ? 'border-red-300 bg-red-50/30' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black uppercase text-[#737373] tracking-widest flex items-center gap-1.5">
                  <User size={12} /> Name & Prefix
                </span>
                {row.matchedPrefix && (
                  <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.2">
                    Prefix: {row.matchedPrefix}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[#1A1A1A]">
                {row.rawName || '<EMPTY>'}
              </div>
            </div>

            {/* Gender Evaluation */}
            <div className={`p-3 border ${row.hasGenderMismatch ? 'border-red-300 bg-red-50/30' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
              <div className="text-[9px] font-black uppercase text-[#737373] tracking-widest mb-1.5">
                Gender Verification
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[9px] text-[#737373] uppercase block">Actual</span>
                  <span className="text-sm font-black text-[#1A1A1A] font-mono">
                    {row.rawGender || '<EMPTY>'}
                  </span>
                </div>
                <div className="h-6 w-px bg-[#E5E7EB]" />
                <div>
                  <span className="text-[9px] text-[#737373] uppercase block">Expected</span>
                  <span className="text-sm font-black text-blue-600 font-mono">
                    {row.expectedGender ? `${row.expectedGender} (${row.expectedGender === 'M' ? 'Male' : 'Female'})` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates (DOB & DOI) */}
            <div className={`p-3 border ${(row.hasDobError || row.hasDoiError) ? 'border-red-300 bg-red-50/30' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
              <div className="text-[9px] font-black uppercase text-[#737373] tracking-widest mb-1.5 flex items-center gap-1.5">
                <Calendar size={12} /> Dates Record
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] text-[#737373] uppercase block">Date of Birth</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">
                    {String(row.rawDob ?? '') || '<EMPTY>'}
                  </span>
                  {row.dobResult?.formattedDisplay && row.dobResult.formattedDisplay !== String(row.rawDob) && (
                    <span className="block text-[8px] text-[#737373] font-mono">
                      Parsed: {row.dobResult.formattedDisplay}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] text-[#737373] uppercase block">Date of Issue</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">
                    {String(row.rawDoi ?? '') || '<EMPTY>'}
                  </span>
                  {row.doiResult?.formattedDisplay && row.doiResult.formattedDisplay !== String(row.rawDoi) && (
                    <span className="block text-[8px] text-[#737373] font-mono">
                      Parsed: {row.doiResult.formattedDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Issues / Audit List */}
          <div>
            <div className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Info size={13} className="text-[#737373]" />
              Validation Findings ({allIssues.length})
            </div>

            {allIssues.length === 0 ? (
              <div className="p-4 border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900 uppercase">All Rules Satisfied</p>
                  <p className="text-[10px] text-emerald-700">This record passes 19-digit ID, prefix gender consistency, calendar DOB, and live issue date rules.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {allIssues.map((issue, idx) => {
                  const isError = issue.severity === 'ERROR';
                  return (
                    <div
                      key={idx}
                      className={`p-3 border text-xs ${
                        isError
                          ? 'border-red-200 bg-red-50/60 text-red-900'
                          : 'border-amber-200 bg-amber-50/60 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {isError ? (
                            <AlertOctagon size={13} className="text-red-600 shrink-0" />
                          ) : (
                            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                          )}
                          <span className="font-mono text-[9px] font-black tracking-wider uppercase px-1.5 py-0.2 bg-white border border-current">
                            {issue.code}
                          </span>
                          <span className="font-bold uppercase text-[9px] opacity-80">
                            [{issue.field}]
                          </span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider">
                          {issue.severity}
                        </span>
                      </div>

                      <p className="font-medium text-[11px] leading-relaxed mb-1.5">
                        {issue.message}
                      </p>

                      {issue.suggestedCorrection && (
                        <div className="flex items-start gap-1 text-[10px] bg-white/80 p-1.5 border border-current/20">
                          <Wrench size={10} className="shrink-0 mt-0.5 opacity-70" />
                          <span>
                            <strong className="uppercase font-bold">Suggested Correction:</strong>{' '}
                            {issue.suggestedCorrection}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full Raw Data Record */}
          <div>
            <div className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2">
              Original Spreadsheet Row Data
            </div>
            <div className="border border-[#E5E7EB] bg-[#FAFAFA] divide-y divide-[#E5E7EB] text-[10px]">
              {Object.entries(row.originalData).map(([key, val]) => (
                <div key={key} className="grid grid-cols-3 p-2 hover:bg-white transition-colors">
                  <span className="font-bold text-[#737373] uppercase tracking-tight">{key}</span>
                  <span className="col-span-2 font-mono text-[#1A1A1A] break-all">{String(val ?? '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFAFA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black/80 transition-all active:scale-97"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
