/**
 * Myanmar–English Name Dictionary & Transliteration System
 * Core Types & Data Definitions
 * Designed for Immigration Department (လဝက / IDTL)
 */

export type NameCategory = 'PERSONAL' | 'RELIGIOUS' | 'TITLE_PREFIX' | 'GEOGRAPHIC_COMPOUND' | 'ETHNIC_TAANG';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED';

export interface SyllableBreakdown {
  rawMyanmar: string;
  normalizedMyanmar: string;
  recommendedEnglish: string;
  alternativeEnglish: string[];
  initialConsonant?: string;
  medialCombination?: string;
  vowelPattern?: string;
  finalConsonant?: string;
  ruleApplied: string;
  isUncertain: boolean;
  uncertaintyReason?: string;
  confidence: number; // 0 - 100
}

export interface TransliterationResult {
  inputMyanmar: string;
  normalizedMyanmar: string;
  recommendedEnglish: string;
  alternativeEnglish: string[];
  detectedPrefix?: {
    myanmar: string;
    english: string;
    type: 'TITLE' | 'RELIGIOUS' | 'ROLE' | 'ETHNIC';
  };
  detectedPrefixes?: Array<{
    myanmar: string;
    english: string;
    type: 'TITLE' | 'RELIGIOUS' | 'ROLE' | 'ETHNIC';
  }>;
  syllables: SyllableBreakdown[];
  overallConfidence: number; // 0 - 100
  isExactDictionaryMatch: boolean;
  matchedDictionaryEntry?: DictionaryEntry;
  nameType: 'ORDINARY' | 'RELIGIOUS' | 'ROLE_TITLED' | 'GEOGRAPHIC';
  explanation: string;
  warnings: string[];
}

export interface ReverseLookupResult {
  inputEnglish: string;
  exactMatches: DictionaryEntry[];
  probableMatches: Array<{
    myanmarName: string;
    englishSpelling: string;
    confidence: number;
    matchReason: string;
    isVerified: boolean;
  }>;
}

export interface DictionaryEntry {
  id: string;
  myanmarName: string;
  normalizedMyanmar: string;
  englishSpelling: string;
  alternativeSpellings: string[];
  prefix?: string;
  category: NameCategory;
  syllableBreakdown: string[]; // e.g. ["မောင်", "သောင်း", "လွင်"]
  transliterationRulesUsed: string[];
  referenceSource?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VERIFY' | 'RULE_CHANGE' | 'BATCH_IMPORT';
  entryId?: string;
  entryName?: string;
  performedBy: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
}

export interface RulePreferenceConfig {
  htVersusT: 'Ht' | 'T'; // Default spelling for ထ (Ht vs T)
  phVersusP: 'Ph' | 'P'; // Default spelling for ဖ (Ph vs P)
  khVersusK: 'Kh' | 'K'; // Default spelling for ခ (Kh vs K)
  vowelAYVersusE: 'ay' | 'e' | 'aye'; // Default for သဝေထိုး (e.g. အေ)
  vowelEEVersusI: 'i' | 'ee'; // Default for လုံးကြီးတင်ဆံခတ်
  vowelOOVersusU: 'u' | 'oo'; // Default for ချောင်းငင်
  finalAINGVersusINE: 'aing' | 'ine'; // Default for -ိုင်
  useStrictChRule: boolean; // ချ, ခြ -> Ch (strictly enforced)
  useStrictShRule: boolean; // ရှ, ယှ -> Sh (strictly enforced)
  useStrictUnRule: boolean; // ဝဆွဲ + နသတ် -> un (e.g. Tun, not Twan)
  useStrictUtRule: boolean; // ဝဆွဲ + တသတ် -> ut (e.g. Htut, not Twat)
  religiousNameSingleWord: boolean; // Join religious names into one capitalized word (e.g. Ashin Thumana)
  allowAlternativeSuggestions: boolean;
}

export interface BatchNameRecord {
  id: string;
  originalMyanmar: string;
  originalEnglish?: string;
  convertedEnglish: string;
  alternativeSpellings: string[];
  confidence: number;
  status: 'EXACT_MATCH' | 'RULE_CONVERTED' | 'NEEDS_REVIEW' | 'FLAGGED';
  notes?: string;
  isVerifiedByUser?: boolean;
}
