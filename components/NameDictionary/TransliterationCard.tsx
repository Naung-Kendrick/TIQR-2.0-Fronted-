import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';
import { TransliterationResult, RulePreferenceConfig, DictionaryEntry } from '../../lib/nameDictionary/types';

interface TransliterationCardProps {
  inputName: string;
  setInputName: (val: string) => void;
  result: TransliterationResult;
  onSelectAlternative: (alt: string) => void;
  onOpenAddModal?: (prefillMyanmar: string, prefillEnglish: string) => void;
  config: RulePreferenceConfig;
}

export const TransliterationCard: React.FC<TransliterationCardProps> = ({
  inputName,
  setInputName,
  result,
  onSelectAlternative,
  onOpenAddModal
}) => {
  const [copiedRecommended, setCopiedRecommended] = useState(false);
  const [copiedAlt, setCopiedAlt] = useState<string | null>(null);
  const [selectedSyllableIdx, setSelectedSyllableIdx] = useState<number | null>(null);

  const handleCopyRecommended = () => {
    if (!result.recommendedEnglish) return;
    navigator.clipboard.writeText(result.recommendedEnglish);
    setCopiedRecommended(true);
    setTimeout(() => setCopiedRecommended(false), 1500);
  };

  const handleCopyAlternative = (alt: string) => {
    navigator.clipboard.writeText(alt);
    setCopiedAlt(alt);
    onSelectAlternative?.(alt);
    setTimeout(() => {
      setCopiedAlt((curr) => (curr === alt ? null : curr));
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <div className="bg-white/70 backdrop-blur-sm border border-[#E5E7EB] p-4 sm:p-5 shadow-sm space-y-2.5">
        <label className="text-[10px] sm:text-[11px] font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] animate-pulse" />
          မြန်မာအမည် ရိုက်ထည့်ပါ
          <span className="text-[#737373] font-mono text-[9px] font-bold hidden sm:inline">[INPUT MYANMAR NAME]</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="မြန်မာအမည် ရိုက်ထည့်ပါ (ဥပမာ - မအေး၊ ဦးအေးမောင်၊ အောင်မြင့်မြတ်)..."
            className="w-full px-3.5 py-2.5 text-sm sm:text-base font-medium text-[#1A1A1A] bg-white border border-[#E5E7EB] focus:outline-none focus:border-black transition-all font-sans placeholder:text-[#737373]/50"
          />
          {inputName && (
            <button
              type="button"
              onClick={() => setInputName('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#737373] hover:text-[#1A1A1A] transition-colors"
              title="စာလုံးများ ဖျက်ရန်"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Conversion Output Card */}
      {inputName.trim() && (
        <div className="bg-white/80 backdrop-blur-sm border border-[#E5E7EB] shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Card Header */}
          <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#1E3A8A]" />
              <span className="text-[10px] sm:text-xs font-black text-[#1A1A1A] uppercase tracking-wider">
                အင်္ဂလိပ်စာလုံးပေါင်း ရလဒ်
              </span>
              <span className="text-[#737373] font-mono text-[9px] font-bold hidden sm:inline">
                [TRANSLITERATION RESULT]
              </span>
            </div>
          </div>

          {/* Card Body: Recommended Spelling */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-[#FAFAFA] border border-[#E5E7EB]">
              <div>
                <p className="text-[10px] sm:text-[11px] font-black text-[#737373] uppercase tracking-wider">
                  အကြံပြု အင်္ဂလိပ်အမည် <span className="font-mono text-[9px] font-bold text-[#737373]">[PRIMARY RECOMMENDED NAME]</span>
                </p>
                <div className="text-xl sm:text-2xl font-black font-mono text-[#1A1A1A] tracking-tight mt-0.5 flex items-baseline gap-2.5">
                  <span>{result.recommendedEnglish || '-'}</span>
                  {result.detectedPrefix && (
                    <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-900 font-mono font-bold border border-blue-200 align-middle uppercase tracking-wider">
                      {result.detectedPrefix.english}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyRecommended}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all active:scale-97 shadow-2xs cursor-pointer ${
                    copiedRecommended
                      ? 'bg-emerald-600 text-white border border-emerald-700'
                      : 'bg-black text-white hover:bg-black/80 border border-black'
                  }`}
                  title="အကြံပြု အင်္ဂလိပ်အမည်ကို ကူးယူရန်"
                >
                  {copiedRecommended ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedRecommended ? 'ကူးယူပြီးပါပြီ' : 'ကူးယူရန်'}</span>
                </button>
              </div>
            </div>

            {/* Alternative Spellings — directly under primary name */}
            <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={12} className="text-[#1E3A8A]" />
                  အခြား စာလုံးပေါင်းများ <span className="text-[#737373] font-mono text-[9px] font-bold">[ALTERNATIVE SPELLINGS]</span>:
                </span>
              </div>

              {result.alternativeEnglish.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {result.alternativeEnglish.map((alt) => {
                    const isCopied = copiedAlt === alt;
                    return (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => handleCopyAlternative(alt)}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer border bg-white hover:bg-[#F3F4F6] border-[#E5E7EB] hover:border-black text-[#1A1A1A] active:scale-97 shadow-2xs"
                        title={`${alt} ကို တိုက်ရိုက် ကူးယူရန် နှိပ်ပါ`}
                      >
                        <span className="text-xs font-mono font-bold tracking-tight">{alt}</span>
                        {isCopied ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-mono font-bold shadow-2xs animate-in fade-in">
                            <Check size={10} />
                            <span>ကူးယူပြီးပါပြီ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black group-hover:bg-neutral-800 text-white text-[9px] font-mono font-bold shadow-2xs transition-colors uppercase tracking-wider">
                            <Copy size={9} />
                            <span>ကူးယူရန်</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-[#737373] font-mono italic">- မရှိပါ -</p>
              )}
            </div>

            {/* Syllable Breakdown Section */}
            <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <p className="text-[10px] sm:text-[11px] font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} className="text-[#1E3A8A]" />
                  စာလုံးတစ်လုံးချင်း ခွဲပြချက် <span className="text-[#737373] font-mono text-[9px] font-bold">[NAME BREAKDOWN]</span>
                </p>
                <span className="text-[9px] text-[#737373] font-mono font-bold bg-[#FAFAFA] px-2 py-0.5 border border-[#E5E7EB] uppercase tracking-wider">
                  {result.syllables.length} SYLLABLES ({result.syllables.length} လုံး)
                </span>
              </div>

              {/* Syllable Boundaries Sequence Ribbon */}
              <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-[#FAFAFA] border border-[#E5E7EB]">
                <span className="text-[9px] font-black text-[#737373] uppercase tracking-wider mr-1">
                  စာလုံးခွဲထားပုံ:
                </span>
                {result.syllables.map((syl, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      type="button"
                      onClick={() => setSelectedSyllableIdx(selectedSyllableIdx === idx ? null : idx)}
                      className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold transition-all ${
                        selectedSyllableIdx === idx
                          ? 'bg-[#1E3A8A] text-white shadow-2xs'
                          : 'bg-white border border-[#E5E7EB] text-[#1A1A1A] hover:border-black'
                      }`}
                      title={`ကြည့်ရှုရန် နှိပ်ပါ: ${syl.rawMyanmar}`}
                    >
                      <span className="text-xs">{syl.rawMyanmar}</span>
                      <span className="text-[10px] font-mono opacity-80 font-bold">({syl.recommendedEnglish})</span>
                    </button>
                    {idx < result.syllables.length - 1 && (
                      <span className="text-[#737373]/40 font-black text-xs px-0.5">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Syllable Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {result.syllables.map((syl, index) => {
                  const isSelected = selectedSyllableIdx === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedSyllableIdx(isSelected ? null : index)}
                      className={`p-3 border text-left transition-all relative ${
                        isSelected
                          ? 'bg-blue-50/80 border-[#1E3A8A] ring-1 ring-[#1E3A8A] shadow-2xs'
                          : syl.isUncertain
                          ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                          : 'bg-white border-[#E5E7EB] hover:border-black hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1A1A1A]">{syl.rawMyanmar}</span>
                        <ArrowRight size={11} className="text-[#737373]" />
                        <span className="text-sm font-black font-mono text-[#1E3A8A]">
                          {syl.recommendedEnglish}
                        </span>
                      </div>

                      {/* Simple Component Badges */}
                      <div className="flex flex-wrap gap-1 mt-2 text-[9px] font-mono">
                        {syl.initialConsonant && (
                          <span className="px-1.5 py-0.5 bg-[#FAFAFA] text-[#1A1A1A] border border-[#E5E7EB]">
                            ဗျည်း: <strong className="font-bold">{syl.initialConsonant}</strong>
                          </span>
                        )}
                        {syl.medialCombination && (
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200">
                            ဗျည်းတွဲ: <strong className="font-bold">{syl.medialCombination}</strong>
                          </span>
                        )}
                        {(syl.vowelPattern || syl.finalConsonant) && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                            သရ/အသတ်: <strong className="font-bold">{syl.vowelPattern || syl.finalConsonant}</strong>
                          </span>
                        )}
                      </div>

                      <div className="text-[9px] text-[#737373] mt-2 font-medium truncate">
                        {syl.ruleApplied}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Syllable Detail Inspector */}
              {selectedSyllableIdx !== null && result.syllables[selectedSyllableIdx] && (
                <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] text-xs text-[#1A1A1A] space-y-2.5 animate-in fade-in">
                  <div className="font-black uppercase tracking-wider text-[#1A1A1A] flex items-center justify-between border-b border-[#E5E7EB] pb-2 text-[10px] sm:text-xs">
                    <span>
                      စာလုံးအသေးစိတ်: <span className="font-bold text-black">{result.syllables[selectedSyllableIdx].rawMyanmar}</span> → <span className="font-mono text-[#1E3A8A] font-bold">{result.syllables[selectedSyllableIdx].recommendedEnglish}</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-white text-[#1A1A1A] border border-[#E5E7EB] font-bold">
                      {result.syllables[selectedSyllableIdx].confidence}% CONFIDENCE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 text-[10px]">
                    <div className="p-2.5 bg-white border border-[#E5E7EB]">
                      <span className="text-[9px] text-[#737373] block font-black uppercase tracking-wider">၁။ မူလဗျည်း</span>
                      <span className="font-bold font-mono text-gray-900 text-xs mt-0.5 block">
                        {result.syllables[selectedSyllableIdx].initialConsonant || '-'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white border border-[#E5E7EB]">
                      <span className="text-[9px] text-[#737373] block font-black uppercase tracking-wider">၂။ ဗျည်းတွဲ</span>
                      <span className="font-bold font-mono text-gray-900 text-xs mt-0.5 block">
                        {result.syllables[selectedSyllableIdx].medialCombination || 'မရှိ'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white border border-[#E5E7EB]">
                      <span className="text-[9px] text-[#737373] block font-black uppercase tracking-wider">၃။ သရနှင့် အသတ်</span>
                      <span className="font-bold font-mono text-gray-900 text-xs mt-0.5 block">
                        {result.syllables[selectedSyllableIdx].vowelPattern || result.syllables[selectedSyllableIdx].finalConsonant || 'သရ အ (a)'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#737373]">
                    <strong className="text-[#1A1A1A] font-bold uppercase tracking-wider">အသုံးပြုထားသော စည်းမျဉ်း:</strong>{' '}
                    <span className="text-[#1A1A1A] font-medium">{result.syllables[selectedSyllableIdx].ruleApplied}</span>
                  </p>

                  {result.syllables[selectedSyllableIdx].alternativeEnglish.length > 0 && (
                    <div className="text-[10px] text-[#737373] flex items-center gap-1.5 pt-2 border-t border-[#E5E7EB]">
                      <strong className="text-[#1A1A1A] font-bold uppercase tracking-wider">ဤစာလုံးအတွက် အခြားရွေးချယ်စရာများ:</strong>
                      {result.syllables[selectedSyllableIdx].alternativeEnglish.map((alt) => (
                        <span key={alt} className="px-2 py-0.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] font-mono text-[9px] font-bold">
                          {alt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linguistic Explanation */}
            <div className="p-3 sm:p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] text-[11px] text-[#737373] space-y-1">
              <p className="font-black text-[#1A1A1A] uppercase tracking-wider text-[10px]">
                ရှင်းလင်းချက် <span className="font-mono text-[9px] font-bold">[LINGUISTIC EXPLANATION]</span>:
              </p>
              <p className="text-[#1A1A1A]">{result.explanation}</p>
              {result.warnings.map((w, idx) => (
                <p key={idx} className="text-amber-700 font-medium">
                  • {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
