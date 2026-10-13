import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Settings2,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  LogOut,
  QrCode,
  FileText,
  Loader2,
  Calendar,
  X,
  ChevronDown,
  Clock
} from 'lucide-react';
import { CheckerSummaryCards } from './CheckerSummaryCards';
import { CheckerDataTable } from './CheckerDataTable';
import { CheckerConfigModal } from './CheckerConfigModal';
import { DateAmbiguityModal } from './DateAmbiguityModal';
import { RowDetailModal } from './RowDetailModal';
import {
  ValidatedRow,
  ValidationSummaryStats,
  CheckerConfig
} from '../../lib/dataChecker/types';
import {
  DEFAULT_CHECKER_CONFIG,
  parseFileToData,
  validateDataset,
  autoDetectColumns
} from '../../lib/dataChecker/validator';
import {
  exportValidationExcel,
  exportErrorsOnlyExcel,
  exportValidationCsv
} from '../../lib/dataChecker/exporter';
import { UserRole } from '../../types';

const DEFAULT_LOGO_URL = '/iLovePDF2-bg-removed.png';

// Simple clock-only widget (no weather)
function ClockOnly({ compact = false }: { compact?: boolean }) {
  const [time, setTime] = React.useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hhmm = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const ss = String(time.getSeconds()).padStart(2, '0');
  const date = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E7EB]">
        <Clock size={11} className="text-[#737373] shrink-0" />
        <span className="text-[11px] font-black text-[#1A1A1A] tabular-nums leading-none">{hhmm}</span>
        <span className="text-[8px] font-bold text-[#737373]/60 tabular-nums">:{ss}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-[#E5E7EB]">
      <div className="w-8 h-8 bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center relative">
        <Clock size={14} className="text-[#1A1A1A]" />
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(rgba(26,26,26,0.15) ${(time.getSeconds() / 60) * 360}deg, transparent 0deg)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
          }}
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm font-black text-[#1A1A1A] tabular-nums leading-none">{hhmm}</span>
          <span className="text-[8px] font-bold text-[#737373] tabular-nums">:{ss}</span>
        </div>
        <span className="text-[9px] font-bold text-[#737373] uppercase tracking-wider leading-none mt-0.5">{date}</span>
      </div>
    </div>
  );
}

export default function DataCheckerDashboard() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('auth_role');
  const roleNum = userRole ? parseInt(userRole, 10) : UserRole.USER;
  const isAdmin = roleNum === UserRole.ROOT_ADMIN || roleNum === UserRole.ADMIN;

  // State
  const [config, setConfig] = useState<CheckerConfig>(DEFAULT_CHECKER_CONFIG);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
  const [sourceFilename, setSourceFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({
    message: '',
    type: ''
  });

  // Filter & Inspection State
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [selectedRow, setSelectedRow] = useState<ValidatedRow | null>(null);

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAmbiguityModalOpen, setIsAmbiguityModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const showStatus = useCallback((message: string, type: 'success' | 'error') => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 4000);
  }, []);

  // Validation output memoized against rawRows and config
  const { validatedRows, summary } = useMemo(() => {
    if (rawRows.length === 0) {
      return {
        validatedRows: [],
        summary: {
          totalRecords: 0,
          validRecords: 0,
          recordsWithErrors: 0,
          recordsWithWarnings: 0,
          totalIdErrors: 0,
          totalGenderMismatches: 0,
          totalMissingValues: 0,
          totalUnrecognizedPrefixes: 0,
          totalDobErrors: 0,
          dobInvalidCalendar: 0,
          dobFutureDates: 0,
          dobAmbiguousFormats: 0,
          dobMissingValues: 0,
          totalDoiErrors: 0,
          doiInvalidCalendar: 0,
          doiFutureDates: 0,
          doiBeforeDob: 0,
          doiAmbiguousFormats: 0,
          doiMissingValues: 0,
          totalDuplicates: 0
        }
      };
    }
    const result = validateDataset(rawRows, config);
    return { validatedRows: result.rows, summary: result.summary };
  }, [rawRows, config]);

  // File Upload Handlers
  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setSourceFilename(file.name);
    try {
      const { headers, rawRows: rows } = await parseFileToData(file);

      if (rows.length === 0) {
        showStatus('File is empty or contains no valid data rows.', 'error');
        setIsProcessing(false);
        return;
      }

      const detectedMapping = autoDetectColumns(headers);
      setConfig(prev => ({
        ...prev,
        columnMapping: detectedMapping
      }));

      setAvailableHeaders(headers);
      setRawRows(rows);
      setActiveFilter('ALL');
      setIsProcessing(false);
      showStatus(`Imported ${rows.length} records successfully. Validation completed.`, 'success');
    } catch (err) {
      console.error(err);
      showStatus('Failed to read spreadsheet file. Please verify format.', 'error');
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleClearData = () => {
    setRawRows([]);
    setAvailableHeaders([]);
    setSourceFilename('');
    setActiveFilter('ALL');
    showStatus('Data cleared successfully.', 'success');
  };

  // Resolve Ambiguous Dates
  const handleConfirmAmbiguity = (resolution: 'FORCE_DD_MM' | 'FORCE_MM_DD') => {
    setConfig(prev => ({
      ...prev,
      dateRules: {
        ...prev.dateRules,
        ambiguousResolution: resolution
      }
    }));
    setIsAmbiguityModalOpen(false);
    showStatus(
      `Ambiguous dates confirmed as ${resolution === 'FORCE_DD_MM' ? 'DD/MM/YYYY (Day First)' : 'MM/DD/YYYY (Month First)'}.`,
      'success'
    );
  };

  // Close export menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalAmbiguous = summary.dobAmbiguousFormats + summary.doiAmbiguousFormats;

  return (
    <div className="min-h-screen text-[#1A1A1A] font-sans selection:bg-black/10 relative tps-page-enter bg-transparent pb-12">
      {/* TLG Seal Watermark Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(/tlg-seal.png)`,
          backgroundPosition: 'center center',
          backgroundSize: '55vh',
          backgroundRepeat: 'no-repeat',
          opacity: 0.08,
          filter: 'contrast(1.1) saturate(1.2)'
        }}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept=".xlsx,.xls,.csv"
      />

      <div className="max-w-[1600px] mx-auto px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 relative z-10 space-y-4 sm:space-y-5">
        {/* Top Header */}
        <header className="pb-3 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={DEFAULT_LOGO_URL}
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain shrink-0"
                alt="IDTL Logo"
              />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-[#1A1A1A] tracking-tight uppercase leading-tight">
                  တီုင်စေတ်မေန်းတိုအီး <span className="text-[#737373] hidden sm:inline">[DATA CHECKER]</span>
                  <span className="text-[#737373] sm:hidden">[CHECKER]</span>
                  <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-white text-[#1A1A1A] text-[7px] sm:text-[8px] font-black border border-[#E5E7EB] uppercase tracking-wider align-middle">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1E3A8A]"></span>
                    </span>
                    V 3.0.0
                  </span>
                </h1>
                <p className="text-[#737373] text-[8px] font-bold hidden sm:flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                  <ShieldCheck size={10} className="text-[#737373] shrink-0" />
                  powered By
                  <span style={{ color: '#1E3A8A' }}>Mai Naung Naung &amp; Mai Nay Lin</span>
                </p>
              </div>
            </div>

            <div className="sm:hidden shrink-0">
              <ClockOnly compact />
            </div>
          </div>

          {/* Center Clock */}
          <div className="hidden sm:block">
            <ClockOnly />
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* TIQR Creator Link */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] text-[9px] sm:text-[10px] font-black hover:bg-black hover:text-white transition-all active:scale-97 uppercase tracking-wider"
              title="Return to TIQR Creator"
            >
              <QrCode size={12} />
              <span className="hidden sm:inline">TIQR CREATOR</span>
              <span className="sm:hidden">TIQR</span>
            </button>

            {/* Active Checker Tab Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black text-white border border-[#1E3A8A] ring-1 ring-[#1E3A8A]/50 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(30,58,138,0.35)]">
              <FileSpreadsheet size={12} className="text-blue-300" />
              <span>DATA CHECKER</span>
            </div>

            {/* Admin Link if authorized */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] text-[9px] sm:text-[10px] font-black hover:bg-black hover:text-white transition-all active:scale-97 uppercase tracking-wider"
              >
                <ShieldCheck size={12} />
                <span className="hidden sm:inline">ADMIN</span>
                <span className="sm:hidden">ADM</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_login_time');
                navigate('/');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E7EB] text-[#737373] text-[9px] sm:text-[10px] font-black hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-97 uppercase tracking-wider"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        </header>

        {/* Status Toast Banner */}
        {status.message && (
          <div
            className={`p-3 border flex items-center justify-between text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 ${status.type === 'success'
              ? 'bg-[#FAFAFA] text-[#1A1A1A] border-[#E5E7EB]'
              : 'bg-red-50 text-red-700 border-red-200'
              }`}
          >
            <div className="flex items-center gap-2">
              {status.type === 'success' ? (
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertOctagon size={14} className="text-red-600 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
            <button
              onClick={() => setStatus({ message: '', type: '' })}
              className="p-1 hover:opacity-60"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Ambiguous Dates Warning Banner (Admin Only) */}
        {isAdmin && totalAmbiguous > 0 && config.dateRules.ambiguousResolution === 'PROMPT' && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <div>
                <span className="font-black uppercase tracking-wider">
                  Attention: {totalAmbiguous} Ambiguous Date Value{totalAmbiguous > 1 ? 's' : ''} Detected
                </span>
                <p className="text-[10px] text-amber-800 mt-0.5">
                  Dates such as "03/04/2000" can represent either 3 April or March 4. Confirm format to resolve warnings.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAmbiguityModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 text-white font-bold uppercase text-[10px] tracking-wider hover:bg-amber-700 transition-all active:scale-97 shrink-0"
            >
              Resolve Ambiguous Dates
            </button>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="p-3 sm:p-4 bg-white/70 backdrop-blur-sm border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
          {/* Left Actions: Upload & Demo Load */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-black/80 transition-all active:scale-97 flex items-center gap-1.5 shadow-sm"
            >
              {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Upload Excel / CSV
            </button>

            {rawRows.length > 0 && (
              <button
                onClick={handleClearData}
                className="px-2.5 py-2 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-[#737373] border border-[#E5E7EB] text-[10px] font-black uppercase tracking-wider transition-all active:scale-97 flex items-center gap-1"
                title="Clear current file"
              >
                <RotateCcw size={11} />
                Clear
              </button>
            )}
          </div>

          {/* Right Actions: Settings & Export Dropdown (Only Admin Can Use) */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              {/* Rule Settings */}
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3 py-2 bg-white hover:bg-[#F3F4F6] text-[#1A1A1A] border border-[#E5E7EB] text-[10px] font-black uppercase tracking-wider transition-all active:scale-97 flex items-center gap-1.5"
                title="Admin Only: Configure verification rules"
              >
                <Settings2 size={12} />
                <span>Rule Settings</span>
              </button>

              {/* Export Dropdown */}
              {rawRows.length > 0 && (
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-3 py-2 bg-white hover:bg-black hover:text-white text-[#1A1A1A] border border-[#E5E7EB] text-[10px] font-black uppercase tracking-wider transition-all active:scale-97 flex items-center gap-1.5"
                  >
                    <Download size={12} />
                    <span>Export Reports</span>
                    <ChevronDown size={11} className={showExportMenu ? 'rotate-180 transition-transform' : ''} />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#E5E7EB] shadow-2xl z-50 py-1 text-xs divide-y divide-[#E5E7EB]">
                      <div className="p-2 bg-[#FAFAFA] text-[9px] font-black uppercase tracking-widest text-[#737373]">
                        Export Excel (.xlsx)
                      </div>
                      <button
                        onClick={() => {
                          exportValidationExcel(validatedRows, summary, sourceFilename);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#F3F4F6] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <FileSpreadsheet size={13} className="text-emerald-700" />
                        Full Report (Summary + All Tabs)
                      </button>
                      <button
                        onClick={() => {
                          exportErrorsOnlyExcel(validatedRows);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <AlertOctagon size={13} className="text-red-600" />
                        Errors Only (.xlsx)
                      </button>

                      <div className="p-2 bg-[#FAFAFA] text-[9px] font-black uppercase tracking-widest text-[#737373]">
                        Export CSV (.csv)
                      </div>
                      <button
                        onClick={() => {
                          exportValidationCsv(validatedRows, false);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#F3F4F6] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <FileText size={13} className="text-[#737373]" />
                        Full Report (.csv)
                      </button>
                      <button
                        onClick={() => {
                          exportValidationCsv(validatedRows, true);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <AlertOctagon size={13} className="text-red-600" />
                        Errors Only (.csv)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty State / Drag and Drop Upload Area */}
        {rawRows.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed p-8 sm:p-14 flex flex-col items-center justify-center text-center transition-all bg-white/40 backdrop-blur-sm shadow-sm ${isDragging ? 'border-black bg-white/80' : 'border-[#E5E7EB] hover:border-black/40'
              }`}
          >
            <div className="w-16 h-16 bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center mb-4 text-[#737373]">
              <Upload size={28} />
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] uppercase tracking-tight mb-6">
              Upload Identity Spreadsheet To Verify
            </h2>

            <div className="flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all active:scale-97 shadow-sm"
              >
                Browse Files
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-10 max-w-4xl w-full text-left">
              <div className="p-3 border border-[#E5E7EB] bg-white/60">
                <span className="text-[9px] font-mono font-black uppercase text-rose-700 block mb-1">
                  RULE 1: 19-DIGIT ID
                </span>
                <p className="text-[10px] text-[#737373]">
                  Enforces exactly 19 digits. Flags &lt;19, &gt;19, non-numeric characters, and preserves leading zeros.
                </p>
              </div>

              <div className="p-3 border border-[#E5E7EB] bg-white/60">
                <span className="text-[9px] font-mono font-black uppercase text-indigo-700 block mb-1">
                  RULE 2: PREFIX GENDER
                </span>
                <p className="text-[10px] text-[#737373]">
                  Validates Mg, KO, Tar, U, Mai, Sai (M) & Daw, Ma, Lway, Yar, Nang (F) using word boundary matching.
                </p>
              </div>

              <div className="p-3 border border-[#E5E7EB] bg-white/60">
                <span className="text-[9px] font-mono font-black uppercase text-orange-700 block mb-1">
                  RULE 3: CALENDAR DOB
                </span>
                <p className="text-[10px] text-[#737373]">
                  Gregorian leap years (29/02/2024 vs 2025), impossible days (30/02, 31/04), and future dates.
                </p>
              </div>

              <div className="p-3 border border-[#E5E7EB] bg-white/60">
                <span className="text-[9px] font-mono font-black uppercase text-purple-700 block mb-1">
                  RULE 4: DATE OF ISSUE
                </span>
                <p className="text-[10px] text-[#737373]">
                  Rejects future dates against live system clock and checks DOI is not earlier than DOB.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            {/* File info bar */}
            <div className="px-4 py-2.5 bg-white/50 border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-[#737373]" />
                <span className="font-mono font-bold text-[#1A1A1A]">{sourceFilename}</span>
                <span className="text-[9px] text-[#737373] uppercase font-mono px-1.5 py-0.2 bg-[#FAFAFA] border border-[#E5E7EB]">
                  {rawRows.length} RECORDS
                </span>
              </div>

              <div className="text-[10px] text-[#737373] font-mono flex items-center gap-3">
                <span>ID: {config.columnMapping.idColumn}</span>
                <span>Name: {config.columnMapping.nameColumn}</span>
                <span>Gender: {config.columnMapping.genderColumn}</span>
              </div>
            </div>

            {/* Summary Statistics KPI Cards */}
            <CheckerSummaryCards
              summary={summary}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
            />

            {/* Data Table */}
            <CheckerDataTable
              rows={validatedRows}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              onInspectRow={setSelectedRow}
            />
          </div>
        )}
      </div>

      {/* Row Inspection Modal */}
      <RowDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />

      {/* Configuration Modal (Admins Only) */}
      {isAdmin && (
        <CheckerConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          config={config}
          onSaveConfig={newCfg => {
            setConfig(newCfg);
            showStatus('Verification rules and mappings updated successfully.', 'success');
          }}
          availableHeaders={availableHeaders}
        />
      )}

      {/* Ambiguous Dates Resolution Modal */}
      <DateAmbiguityModal
        isOpen={isAmbiguityModalOpen}
        onClose={() => setIsAmbiguityModalOpen(false)}
        ambiguousCount={totalAmbiguous}
        currentResolution={config.dateRules.ambiguousResolution}
        onConfirmResolution={handleConfirmAmbiguity}
      />
    </div>
  );
}
