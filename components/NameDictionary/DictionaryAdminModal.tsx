import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Save,
  Sliders,
  FileSpreadsheet,
  Upload,
  History,
  CheckCircle2
} from 'lucide-react';
import {
  DictionaryEntry,
  RulePreferenceConfig,
  NameCategory,
  AuditLogEntry
} from '../../lib/nameDictionary/types';
import {
  checkDictionaryConflicts,
  loadAuditLogs,
  importDictionaryFromFile
} from '../../lib/nameDictionary/dictionaryStorage';

interface DictionaryAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: DictionaryEntry | null;
  prefillMyanmar?: string;
  prefillEnglish?: string;
  onSaveEntry: (entry: Partial<DictionaryEntry> & { myanmarName: string; englishSpelling: string }) => void;
  config: RulePreferenceConfig;
  onSaveConfig: (newConfig: RulePreferenceConfig) => void;
  dictionary: DictionaryEntry[];
}

export const DictionaryAdminModal: React.FC<DictionaryAdminModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  prefillMyanmar,
  prefillEnglish,
  onSaveEntry,
  config,
  onSaveConfig,
  dictionary
}) => {
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'RULES' | 'AUDIT'>('ENTRY');

  // Entry Form State
  const [myanmarName, setMyanmarName] = useState('');
  const [englishSpelling, setEnglishSpelling] = useState('');
  const [altSpellings, setAltSpellings] = useState('');
  const [prefix, setPrefix] = useState('');
  const [category, setCategory] = useState<NameCategory>('PERSONAL');
  const [isVerified, setIsVerified] = useState(true);
  const [referenceSource, setReferenceSource] = useState('Immigration Reference');
  const [notes, setNotes] = useState('');

  // Rules State
  const [ruleConfig, setRuleConfig] = useState<RulePreferenceConfig>(config);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (entryToEdit) {
      setMyanmarName(entryToEdit.myanmarName);
      setEnglishSpelling(entryToEdit.englishSpelling);
      setAltSpellings((entryToEdit.alternativeSpellings || []).join(', '));
      setPrefix(entryToEdit.prefix || '');
      setCategory(entryToEdit.category);
      setIsVerified(entryToEdit.isVerified);
      setReferenceSource(entryToEdit.referenceSource || 'Immigration Reference');
      setNotes(entryToEdit.notes || '');
    } else {
      setMyanmarName(prefillMyanmar || '');
      setEnglishSpelling(prefillEnglish || '');
      setAltSpellings('');
      setPrefix('');
      setCategory('PERSONAL');
      setIsVerified(true);
      setReferenceSource('Staff Entry');
      setNotes('');
    }
  }, [entryToEdit, prefillMyanmar, prefillEnglish, isOpen]);

  useEffect(() => {
    setRuleConfig(config);
  }, [config]);

  useEffect(() => {
    if (activeTab === 'AUDIT') {
      setAuditLogs(loadAuditLogs());
    }
  }, [activeTab]);

  // Conflict Checking
  const conflict = React.useMemo(() => {
    if (!myanmarName.trim() || !englishSpelling.trim()) return null;
    return checkDictionaryConflicts(
      myanmarName,
      englishSpelling,
      entryToEdit ? entryToEdit.id : undefined,
      dictionary
    );
  }, [myanmarName, englishSpelling, entryToEdit, dictionary]);

  if (!isOpen) return null;

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myanmarName.trim() || !englishSpelling.trim()) {
      alert('မြန်မာအမည်နှင့် အင်္ဂလိပ်စာလုံးပေါင်း မဖြစ်မနေ ဖြည့်သွင်းပါ');
      return;
    }

    const alts = altSpellings
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    onSaveEntry({
      id: entryToEdit?.id,
      myanmarName: myanmarName.trim(),
      englishSpelling: englishSpelling.trim(),
      alternativeSpellings: alts,
      prefix: prefix.trim() || undefined,
      category,
      isVerified,
      referenceSource: referenceSource.trim() || undefined,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(ruleConfig);
    alert('စည်းမျဉ်း သတ်မှတ်ချက်များကို သိမ်းဆည်းပြီးပါပြီ');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportStatus('ဖိုင်ကို ဖတ်ရှုနေပါသည်...');
      const res = await importDictionaryFromFile(file);
      setImportStatus(
        `အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ: အသစ်ထည့်သွင်း ${res.added} ခု၊ မွမ်းမံ ${res.updated} ခု၊ ပဋိပက္ခ ${res.conflicts} ခု`
      );
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
      setImportStatus('ဖိုင်တင်သွင်းရာတွင် ချို့ယွင်းချက် ဖြစ်ပေါ်ပါသည်');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-700" />
            <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider">
              အဘိဓာန်နှင့် စည်းမျဉ်း စီမံခန့်ခွဲမှု (Dictionary & Rules Administration)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] text-[#737373] hover:text-[#1A1A1A] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ENTRY')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'ENTRY'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            {entryToEdit ? 'အမည် ပြင်ဆင်ရန် (Edit Entry)' : 'အမည် အသစ်ထည့်ရန် (Add Entry)'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RULES')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'RULES'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            <Sliders size={13} />
            <span>စည်းမျဉ်း သတ်မှတ်ချက် (Rule Config)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'AUDIT'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            <History size={13} />
            <span>ပြောင်းလဲမှု မှတ်တမ်း (Audit Log)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-[#1A1A1A] space-y-4">
          {/* TAB 1: ADD / EDIT ENTRY FORM */}
          {activeTab === 'ENTRY' && (
            <form onSubmit={handleSubmitEntry} className="space-y-4">
              {conflict?.hasSpellingConflict && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">ပဋိပက္ခ သတိပေးချက်: </span>
                    {conflict.message}
                  </div>
                </div>
              )}

              {conflict?.hasDuplicateExact && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-bold">ထပ်နေသော မှတ်တမ်း: </span>
                    {conflict.message}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                    မြန်မာအမည် *
                  </label>
                  <input
                    type="text"
                    required
                    value={myanmarName}
                    onChange={(e) => setMyanmarName(e.target.value)}
                    placeholder="ဥပမာ - မအေး"
                    className="w-full px-3 py-2 border border-[#E5E7EB] focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                    စံ အင်္ဂလိပ်စာလုံးပေါင်း *
                  </label>
                  <input
                    type="text"
                    required
                    value={englishSpelling}
                    onChange={(e) => setEnglishSpelling(e.target.value)}
                    placeholder="ဥပမာ - Ma Aye"
                    className="w-full px-3 py-2 border border-[#E5E7EB] focus:outline-none focus:border-blue-600 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                    အခြားစာလုံးပေါင်းများ (ပုဒ်ဖြတ်ပုဒ်ရပ်ဖြင့် ခွဲရန်)
                  </label>
                  <input
                    type="text"
                    value={altSpellings}
                    onChange={(e) => setAltSpellings(e.target.value)}
                    placeholder="ဥပမာ - Ma Ay; Ma E"
                    className="w-full px-3 py-2 border border-[#E5E7EB] focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                    ရှေ့ဆက်ဘွဲ့/ဂုဏ်ပုဒ် (Prefix)
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="ဥပမာ - Ma, Daw, U, Ashin, Mai"
                    className="w-full px-3 py-2 border border-[#E5E7EB] focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                    အမျိုးအစား (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NameCategory)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] bg-white focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="PERSONAL">လူပုဂ္ဂိုလ် အမည် (Personal Name)</option>
                    <option value="RELIGIOUS">ဘုန်းကြီး/သီလရှင် ဘွဲ့ (Religious/Monastic)</option>
                    <option value="ROLE">ရာထူး/အလုပ်အကိုင် ဘွဲ့ (Role/Title)</option>
                    <option value="ETHNIC_TAANG">တအာင်း/ရှမ်း ဘွဲ့ (Ta'ang/Shan Ethnic)</option>
                    <option value="GEOGRAPHIC_COMPOUND">ဒေသ/အထွေထွေ (Geographic/Compound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                    ရည်ညွှန်းကိုးကား (Reference Source)
                  </label>
                  <input
                    type="text"
                    value={referenceSource}
                    onChange={(e) => setReferenceSource(e.target.value)}
                    placeholder="ဥပမာ - စံသတ်မှတ်ချက် နမူနာ၊ လဝက မှတ်တမ်း"
                    className="w-full px-3 py-2 border border-[#E5E7EB] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  မှတ်ချက် (Notes)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="နောက်ဆက်တွဲ ရှင်းလင်းချက် သို့မဟုတ် မှတ်ချက်..."
                  className="w-full px-3 py-2 border border-[#E5E7EB] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isVerifiedCheck"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isVerifiedCheck" className="font-bold text-[#1A1A1A]">
                  စံသတ်မှတ်ချက်ဖြင့် အတည်ပြုပြီး (Mark as Verified Standard)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-neutral-50 text-[#1A1A1A] font-bold uppercase tracking-wider"
                >
                  ပယ်ဖျက်ရန်
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider transition-all active:scale-97 shadow-sm"
                >
                  <Save size={14} />
                  <span>သိမ်းဆည်းရန် (Save Entry)</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: RULES CONFIGURATION */}
          {activeTab === 'RULES' && (
            <form onSubmit={handleSaveRules} className="space-y-4">
              <p className="text-[11px] text-[#737373]">
                အောက်ပါ စည်းမျဉ်းများကို သတ်မှတ်ခြင်းဖြင့် Transliteration Engine ၏ မူလအကြံပြုချက်များကို စိတ်ကြိုက်ပြောင်းလဲနိုင်ပါသည်
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border border-[#E5E7EB] space-y-1.5">
                  <label className="font-bold block">ထ စာလုံးပေါင်း သတ်မှတ်ချက်</label>
                  <select
                    value={ruleConfig.htVersusT}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, htVersusT: e.target.value as any })}
                    className="w-full p-2 border border-[#E5E7EB] bg-white font-mono"
                  >
                    <option value="Ht">Ht (ဥပမာ - ထွန်း = Htun, ထင် = Htin)</option>
                    <option value="T">T (ဥပမာ - ထွန်း = Tun, ထင် = Tin)</option>
                  </select>
                </div>

                <div className="p-3 border border-[#E5E7EB] space-y-1.5">
                  <label className="font-bold block">ဖ စာလုံးပေါင်း သတ်မှတ်ချက်</label>
                  <select
                    value={ruleConfig.phVersusP}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, phVersusP: e.target.value as any })}
                    className="w-full p-2 border border-[#E5E7EB] bg-white font-mono"
                  >
                    <option value="Ph">Ph (ဥပမာ - ဦးဖေ = U Phe)</option>
                    <option value="P">P (ဥပမာ - ဦးဖေ = U Pe)</option>
                  </select>
                </div>

                <div className="p-3 border border-[#E5E7EB] space-y-1.5">
                  <label className="font-bold block">ခ စာလုံးပေါင်း သတ်မှတ်ချက်</label>
                  <select
                    value={ruleConfig.khVersusK}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, khVersusK: e.target.value as any })}
                    className="w-full p-2 border border-[#E5E7EB] bg-white font-mono"
                  >
                    <option value="Kh">Kh (ဥပမာ - မခင် = Ma Khin)</option>
                    <option value="K">K (ဥပမာ - မခင် = Ma Kin)</option>
                  </select>
                </div>

                <div className="p-3 border border-[#E5E7EB] space-y-1.5">
                  <label className="font-bold block">သဝေထိုး (ေ) သတ်မှတ်ချက်</label>
                  <select
                    value={ruleConfig.vowelAYVersusE}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, vowelAYVersusE: e.target.value as any })}
                    className="w-full p-2 border border-[#E5E7EB] bg-white font-mono"
                  >
                    <option value="ay">ay (ဥပမာ - အေး = Aye / Ay)</option>
                    <option value="e">e (ဥပမာ - ကေ = Ke)</option>
                    <option value="aye">aye (ဥပမာ - အေး = Aye)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="relJoinCheck"
                    checked={ruleConfig.religiousNameSingleWord}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, religiousNameSingleWord: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="relJoinCheck" className="font-medium text-[#1A1A1A]">
                    ဘုန်းကြီး/သီလရှင် ဘွဲ့များကို စာလုံးကြီးတစ်ခုတည်းဖြင့် တဆက်တည်း ပေါင်းစပ်ရေးသားရန် (Ashin Thumana, Shin Thawbana)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="strictChCheck"
                    checked={ruleConfig.useStrictChRule}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, useStrictChRule: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="strictChCheck" className="font-medium text-[#1A1A1A]">
                    ချ, ခြ ကို Ch ဖြင့် မဖြစ်မနေ အသုံးပြုရန် (Khy မဟုတ်)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="strictShCheck"
                    checked={ruleConfig.useStrictShRule}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, useStrictShRule: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="strictShCheck" className="font-medium text-[#1A1A1A]">
                    ရှ, ယှ ကို Sh ဖြင့် မဖြစ်မနေ အသုံးပြုရန် (Hy/Hr မဟုတ်)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider transition-all active:scale-97 shadow-sm"
                >
                  <Save size={14} />
                  <span>စည်းမျဉ်း သတ်မှတ်ချက် သိမ်းဆည်းရန်</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUDIT LOG VIEWER & EXCEL IMPORT */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#FAFAFA] border border-[#E5E7EB]">
                <div>
                  <span className="font-bold text-[#1A1A1A]">Excel မှ အဘိဓာန် တင်သွင်းရန်</span>
                  <p className="text-[10px] text-[#737373]">
                    မြန်မာအမည်နှင့် အင်္ဂလိပ်စာလုံးပေါင်း ပါဝင်သော Excel/CSV ဖိုင်ကို အဘိဓာန်သို့ တိုက်ရိုက် ထည့်သွင်းပါ
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#1A1A1A] font-bold uppercase tracking-wider cursor-pointer">
                    <Upload size={13} className="text-blue-600" />
                    <span>ဖိုင်ရွေးရန်</span>
                    <input type="file" onChange={handleImportFile} accept=".xlsx,.xls,.csv" className="hidden" />
                  </label>
                </div>
              </div>

              {importStatus && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 font-bold">
                  {importStatus}
                </div>
              )}

              <div className="space-y-2">
                <p className="font-bold text-[#1A1A1A] uppercase tracking-wider">
                  မကြာသေးမီက ပြုလုပ်ခဲ့သော ပြောင်းလဲမှု မှတ်တမ်းများ (Recent Audit Logs)
                </p>

                <div className="max-h-60 overflow-y-auto border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
                  {auditLogs.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 italic">မှတ်တမ်း မရှိသေးပါ</div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 text-[11px] bg-white space-y-0.5">
                        <div className="flex items-center justify-between text-[#737373]">
                          <span className="font-bold text-black font-mono uppercase">
                            [{log.action}] {log.entryName || log.entryId || '-'}
                          </span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-600">{log.reason || 'No description'}</p>
                        <p className="text-[10px] text-gray-500 font-mono">ဆောင်ရွက်သူ: {log.performedBy}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
