import React, { useState, useEffect, useMemo } from 'react';
import {
  BookA,
  Languages,
  ShieldCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ClockOnly } from '../ClockOnly';
import { NavActions } from '../NavActions';

import {
  DictionaryEntry,
  RulePreferenceConfig,
  TransliterationResult
} from '../../lib/nameDictionary/types';
import {
  loadDictionary,
  loadRuleConfig,
  saveRuleConfig,
  upsertDictionaryEntry,
  setEntryVerification,
  deleteDictionaryEntry
} from '../../lib/nameDictionary/dictionaryStorage';
import { transliterateMyanmarName } from '../../lib/nameDictionary/transliterationEngine';

import { TransliterationCard } from './TransliterationCard';
import { DictionaryAdminModal } from './DictionaryAdminModal';
import { UserRole } from '../../types';

const DEFAULT_LOGO_URL = '/iLovePDF2-bg-removed.png';

export default function NameDictionaryDashboard() {
  // Transliteration State
  const [inputMyanmar, setInputMyanmar] = useState('မအေး');
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [ruleConfig, setRuleConfig] = useState<RulePreferenceConfig>(loadRuleConfig());

  // Modals & Admin
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<DictionaryEntry | null>(null);
  const [prefillMyanmar, setPrefillMyanmar] = useState('');
  const [prefillEnglish, setPrefillEnglish] = useState('');

  // Status Toast
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showStatus = (message: string, type: 'success' | 'error' = 'success') => {
    setStatus({ message, type });
    setTimeout(() => setStatus(null), 3000);
  };

  // Auth & Roles
  const userRole = localStorage.getItem('auth_role');
  const userName = localStorage.getItem('user_name') || localStorage.getItem('auth_name') || 'Staff';
  const isAdmin = userRole && (parseInt(userRole) === UserRole.ROOT_ADMIN || parseInt(userRole) === UserRole.ADMIN);

  // Initialize Dictionary
  useEffect(() => {
    const loaded = loadDictionary();
    setDictionary(loaded);
  }, []);

  // Compute Active Transliteration
  const translitResult: TransliterationResult = useMemo(() => {
    return transliterateMyanmarName(inputMyanmar, dictionary, ruleConfig);
  }, [inputMyanmar, dictionary, ruleConfig]);

  const handleSelectAlternative = (alt: string) => {
    showStatus(`အခြားစာလုံးပေါင်း "${alt}" အား ကူးယူပြီးပါပြီ`, 'success');
  };

  const handleOpenAddModal = (pMy: string = '', pEn: string = '') => {
    setEntryToEdit(null);
    setPrefillMyanmar(pMy);
    setPrefillEnglish(pEn);
    setAdminModalOpen(true);
  };

  const handleOpenEditModal = (entry: DictionaryEntry) => {
    setEntryToEdit(entry);
    setPrefillMyanmar('');
    setPrefillEnglish('');
    setAdminModalOpen(true);
  };

  const handleSaveEntry = (entryData: Partial<DictionaryEntry> & { myanmarName: string; englishSpelling: string }) => {
    const res = upsertDictionaryEntry(entryData, userName);
    if (res.success) {
      setDictionary(loadDictionary());
      showStatus(`"${entryData.myanmarName}" အား အဘိဓာန်သို့ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ`, 'success');
    } else {
      showStatus(res.error || 'သိမ်းဆည်းရာတွင် အမှားဖြစ်ပေါ်ပါသည်', 'error');
    }
  };

  const handleToggleVerification = (entryId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const ok = setEntryVerification(entryId, nextStatus, userName);
    if (ok) {
      setDictionary(loadDictionary());
      showStatus(
        nextStatus ? 'စံသတ်မှတ်ချက်ဖြင့် အတည်ပြုပြီးပါပြီ' : 'အတည်ပြုချက်ကို ဖယ်ရှားပြီးပါပြီ',
        'success'
      );
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!confirm('ဤအဘိဓာန်မှတ်တမ်းကို အမှန်တကယ် ဖျက်ပစ်လိုပါသလား?')) return;
    const ok = deleteDictionaryEntry(entryId, userName);
    if (ok) {
      setDictionary(loadDictionary());
      showStatus('အဘိဓာန်မှတ်တမ်း ဖျက်ပစ်ပြီးပါပြီ', 'success');
    }
  };

  const handleSaveConfig = (newConfig: RulePreferenceConfig) => {
    saveRuleConfig(newConfig);
    setRuleConfig(newConfig);
    showStatus('စည်းမျဉ်း သတ်မှတ်ချက်များကို မွမ်းမံပြီးပါပြီ', 'success');
  };

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

      <div className="max-w-[1600px] mx-auto px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 relative z-10 space-y-4 sm:space-y-5">
        {/* Top Header */}
        <header className="pb-3 border-b border-[#E5E7EB] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src={DEFAULT_LOGO_URL}
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0"
                alt="IDTL Logo"
              />
              <div className="shrink-0">
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <h1 className="text-xs sm:text-sm font-bold text-[#1A1A1A] tracking-tight uppercase leading-tight whitespace-nowrap">
                    တီုင်စေတ်မေန်းတိုအီး <span className="text-[#737373] hidden sm:inline">[NAME DICTIONARY]</span>
                    <span className="text-[#737373] sm:hidden">[NAMES]</span>
                  </h1>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white text-[#1A1A1A] text-[7px] sm:text-[8px] font-black border border-[#E5E7EB] uppercase tracking-wider shrink-0 whitespace-nowrap">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1E3A8A]"></span>
                    </span>
                    V 3.0.0
                  </span>
                </div>
                <p className="text-[#737373] text-[8px] font-bold hidden sm:flex items-center gap-1.5 mt-0.5 uppercase tracking-wider whitespace-nowrap">
                  <ShieldCheck size={10} className="text-[#737373] shrink-0" />
                  powered By
                  <span style={{ color: '#1E3A8A' }}>Mai Naung Naung &amp; Mai Nay Lin</span>
                </p>
              </div>
            </div>

            <div className="xl:hidden shrink-0">
              <ClockOnly compact />
            </div>
          </div>

          {/* Center Clock */}
          <div className="hidden xl:block 2xl:hidden shrink-0">
            <ClockOnly compact />
          </div>
          <div className="hidden 2xl:block shrink-0">
            <ClockOnly />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1.5 flex-wrap xl:flex-nowrap justify-start xl:justify-end">
            {/* Status Notification */}
            {status && (
              <div
                className={`px-2.5 py-1.5 flex items-center gap-1.5 border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 max-w-[200px] truncate ${
                  status.type === 'success'
                    ? 'bg-[#FAFAFA] text-[#1A1A1A] border-[#E5E7EB]'
                    : 'bg-[#FFF1F2] text-[#FF6B6B] border-red-500/30'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                ) : (
                  <AlertCircle size={12} className="text-red-400 shrink-0" />
                )}
                <span className="truncate">{status.message}</span>
              </div>
            )}

            <NavActions />
          </div>
        </header>

        {/* Clean Sub-header / Actions Toolbar */}
        <div className="p-3 sm:p-3.5 bg-white/70 backdrop-blur-sm border border-[#E5E7EB] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#1A1A1A]">
            <Languages size={14} className="text-[#1E3A8A]" />
            <span>မြန်မာ–အင်္ဂလိပ် အမည်ဖလှယ်ခြင်း</span>
            <span className="text-[#737373] font-mono text-[9px] font-bold hidden sm:inline">[MYANMAR-ENGLISH TRANSLITERATION]</span>
          </div>
        </div>

        {/* Transliteration Workspace */}
        <div className="pt-0.5">
          <TransliterationCard
            inputName={inputMyanmar}
            setInputName={setInputMyanmar}
            result={translitResult}
            onSelectAlternative={handleSelectAlternative}
            onOpenAddModal={handleOpenAddModal}
            config={ruleConfig}
          />
        </div>
      </div>

      {/* Admin / Edit Modal */}
      <DictionaryAdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        entryToEdit={entryToEdit}
        prefillMyanmar={prefillMyanmar}
        prefillEnglish={prefillEnglish}
        onSaveEntry={handleSaveEntry}
        config={ruleConfig}
        onSaveConfig={handleSaveConfig}
        dictionary={dictionary}
      />
    </div>
  );
}
