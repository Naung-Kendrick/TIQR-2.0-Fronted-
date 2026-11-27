/**
 * Myanmar–English Name Dictionary & Transliteration System
 * Structured, Configurable Transliteration Rules Engine
 */

import { RulePreferenceConfig } from './types';

export const DEFAULT_RULE_CONFIG: RulePreferenceConfig = {
  htVersusT: 'Ht',
  phVersusP: 'Ph',
  khVersusK: 'Kh',
  vowelAYVersusE: 'ay',
  vowelEEVersusI: 'i',
  vowelOOVersusU: 'u',
  finalAINGVersusINE: 'aing',
  useStrictChRule: true,
  useStrictShRule: true,
  useStrictUnRule: true,
  useStrictUtRule: true,
  religiousNameSingleWord: true,
  allowAlternativeSuggestions: true
};

// 1. Myanmar 32 Consonant Basic Mappings
export interface ConsonantMapping {
  char: string;
  charName: string;
  defaultEnglish: string;
  alternatives: string[];
  notes?: string;
}

export const MYANMAR_CONSONANTS: Record<string, ConsonantMapping> = {
  'က': { char: 'က', charName: 'ကကြီး', defaultEnglish: 'K', alternatives: [] },
  'ခ': { char: 'ခ', charName: 'ခကွေး', defaultEnglish: 'Kh', alternatives: ['K'], notes: 'May use K e.g. Ma Kin = မခင်' },
  'ဂ': { char: 'ဂ', charName: 'ဂငယ်', defaultEnglish: 'G', alternatives: [] },
  'ဃ': { char: 'ဃ', charName: 'ဃကြီး', defaultEnglish: 'G', alternatives: [] },
  'င': { char: 'င', charName: 'င', defaultEnglish: 'Ng', alternatives: [] },
  'စ': { char: 'စ', charName: 'စလုံး', defaultEnglish: 'S', alternatives: [] },
  'ဆ': { char: 'ဆ', charName: 'ဆလိမ်', defaultEnglish: 'S', alternatives: [] },
  'ဇ': { char: 'ဇ', charName: 'ဇကွဲ', defaultEnglish: 'Z', alternatives: [] },
  'ဈ': { char: 'ဈ', charName: 'ဈမျှဉ်း', defaultEnglish: 'Z', alternatives: [] },
  'ဉ': { char: 'ဉ', charName: 'ဉကုလား', defaultEnglish: 'Ny', alternatives: [] },
  'ည': { char: 'ည', charName: 'ညကြီး', defaultEnglish: 'Ny', alternatives: [] },
  'ဋ': { char: 'ဋ', charName: 'ဋသန်လျင်းချိတ်', defaultEnglish: 'T', alternatives: [] },
  'ဌ': { char: 'ဌ', charName: 'ဌဝမ်းဘဲ', defaultEnglish: 'Ht', alternatives: ['T'] },
  'ဍ': { char: 'ဍ', charName: 'ဍရင်ကောက်', defaultEnglish: 'D', alternatives: [] },
  'ဎ': { char: 'ဎ', charName: 'ဎရေမှုတ်', defaultEnglish: 'D', alternatives: [] },
  'ဏ': { char: 'ဏ', charName: 'ဏကြီး', defaultEnglish: 'N', alternatives: [] },
  'တ': { char: 'တ', charName: 'တဝမ်းပူ', defaultEnglish: 'T', alternatives: [] },
  'ထ': { char: 'ထ', charName: 'ထဆင်ထူး', defaultEnglish: 'Ht', alternatives: ['T'], notes: 'May use T e.g. Mg Tin = မောင်ထင်' },
  'ဒ': { char: 'ဒ', charName: 'ဒထွေး', defaultEnglish: 'D', alternatives: [] },
  'ဓ': { char: 'ဓ', charName: 'ဓအောက်ခြိုက်', defaultEnglish: 'D', alternatives: [] },
  'န': { char: 'န', charName: 'နငယ်', defaultEnglish: 'N', alternatives: [] },
  'ပ': { char: 'ပ', charName: 'ပစောက်', defaultEnglish: 'P', alternatives: [] },
  'ဖ': { char: 'ဖ', charName: 'ဖဦးထုပ်', defaultEnglish: 'Ph', alternatives: ['P'], notes: 'May use P e.g. U Pe = ဦးဖေ' },
  'ဗ': { char: 'ဗ', charName: 'ဗထက်ခြိုက်', defaultEnglish: 'B', alternatives: [] },
  'ဘ': { char: 'ဘ', charName: 'ဘကုန်း', defaultEnglish: 'B', alternatives: [] },
  'မ': { char: 'မ', charName: 'မ', defaultEnglish: 'M', alternatives: [] },
  'ယ': { char: 'ယ', charName: 'ယပက်လက်', defaultEnglish: 'Y', alternatives: [] },
  'ရ': { char: 'ရ', charName: 'ရကောက်', defaultEnglish: 'Y', alternatives: ['R'], notes: 'Primary Y (ယ-sound); R is an acceptable alternative spelling' },
  'လ': { char: 'လ', charName: 'လငယ်', defaultEnglish: 'L', alternatives: [] },
  'ဝ': { char: 'ဝ', charName: 'ဝလုံး', defaultEnglish: 'W', alternatives: [] },
  'သ': { char: 'သ', charName: 'သ', defaultEnglish: 'Th', alternatives: ['S'], notes: 'Official standard Th, occasionally S' },
  'ဟ': { char: 'ဟ', charName: 'ဟ', defaultEnglish: 'H', alternatives: [] },
  'ဠ': { char: 'ဠ', charName: 'ဠကြီး', defaultEnglish: 'L', alternatives: [] },
  'အ': { char: 'အ', charName: 'အ', defaultEnglish: 'A', alternatives: [] }
};

// 2. Titles and Prefixes
export interface TitlePrefixRule {
  myanmar: string;
  english: string;
  alternatives?: string[];
  type: 'TITLE' | 'RELIGIOUS' | 'ROLE' | 'ETHNIC';
  isMonasticOrReligious?: boolean;
  isRoleOrOccupation?: boolean;
  description: string;
}

// 2. Titles and Prefixes (Sorted Longest-First to guarantee specific compound prefixes are matched before single characters)
export const TITLE_PREFIX_RULES: TitlePrefixRule[] = [
  // Multi-character / Multi-syllable Titles & Roles
  { myanmar: 'ဆရာတော်', english: 'Sayadaw', type: 'RELIGIOUS', isMonasticOrReligious: true, description: 'Abbot / Venerable Master' },
  { myanmar: 'ဘုန်းကြီး', english: 'Phongyi', type: 'RELIGIOUS', isMonasticOrReligious: true, description: 'Monk' },
  { myanmar: 'သီလရှင်', english: 'Thilashin', type: 'RELIGIOUS', isMonasticOrReligious: true, description: 'Nun' },
  { myanmar: 'ဆရာကြီး', english: 'Sayagyi', type: 'ROLE', isRoleOrOccupation: true, description: 'Senior master / director' },
  { myanmar: 'ဗိုလ်ချုပ်', english: 'Bogyoke', type: 'ROLE', isRoleOrOccupation: true, description: 'General' },
  { myanmar: 'ရဲဘော်', english: 'Yebaw', type: 'ROLE', isRoleOrOccupation: true, description: 'Comrade' },
  { myanmar: 'ဆရာမ', english: 'Sayama', type: 'ROLE', isRoleOrOccupation: true, description: 'Female teacher / madam' },
  { myanmar: 'ဆလိုင်း', english: 'Salai', type: 'ETHNIC', description: 'Chin male ethnic title' },
  { myanmar: 'အရှင်', english: 'Ashin', type: 'RELIGIOUS', isMonasticOrReligious: true, description: 'Monk / Venerable' },
  { myanmar: 'ကိုရင်', english: 'Koyin', type: 'RELIGIOUS', isMonasticOrReligious: true, description: 'Novice Monk' },
  { myanmar: 'တာမိုင်း', english: 'Tar Mai', type: 'ETHNIC', description: "Ta'ang elder male prefix" },
  { myanmar: 'ယာလွေး', english: 'Yar Lway', alternatives: ['Yar Lwe'], type: 'ETHNIC', description: "Ta'ang elder female prefix" },
  { myanmar: 'လဖိုင်', english: 'Laphai', alternatives: ['Lahpai'], type: 'ETHNIC', description: 'Kachin clan prefix' },
  { myanmar: 'ဆရာ', english: 'Saya', type: 'ROLE', isRoleOrOccupation: true, description: 'Teacher / master' },
  
  // Ethnic Honorifics & Formal Titles
  { myanmar: 'မိုင်း', english: 'Mai', type: 'ETHNIC', description: "Ta'ang male title / prefix" },
  { myanmar: 'မိုင်', english: 'Mai', type: 'ETHNIC', description: "Ta'ang male title / prefix" },
  { myanmar: 'စိုင်း', english: 'Sai', type: 'ETHNIC', description: 'Shan male title' },
  { myanmar: 'မောင်', english: 'Maung', alternatives: ['Mg'], type: 'TITLE', description: 'Younger male / formal prefix' },
  { myanmar: 'နန်း', english: 'Nang', alternatives: ['Nan'], type: 'ETHNIC', description: 'Shan female title' },
  { myanmar: 'ခွန်', english: 'Khun', type: 'ETHNIC', description: 'Pa-O / Shan male title' },
  { myanmar: 'လွေး', english: 'Lway', alternatives: ['Lwe'], type: 'ETHNIC', description: "Ta'ang female title" },
  { myanmar: 'မင်း', english: 'Min', type: 'TITLE', description: 'Title / Mon prefix' },
  { myanmar: 'နိုင်', english: 'Nai', alternatives: ['Naing'], type: 'ETHNIC', description: 'Mon title / prefix' },
  { myanmar: 'စော', english: 'Saw', type: 'ETHNIC', description: 'Karen / Shan male title' },
  { myanmar: 'နော်', english: 'Naw', type: 'ETHNIC', description: 'Karen female title' },
  { myanmar: 'မန်း', english: 'Mahn', type: 'ETHNIC', description: 'Karen male title' },
  { myanmar: 'နမ့်', english: 'Nant', type: 'ETHNIC', description: 'Ethnic prefix' },
  { myanmar: 'ရှင်', english: 'Shin', type: 'RELIGIOUS', isMonasticOrReligious: true, description: 'Novice / Monastic title' },
  { myanmar: 'ဒေါ်', english: 'Daw', type: 'TITLE', description: 'Ms. / Adult Female' },
  { myanmar: 'တာ', english: 'Tar', alternatives: ['Ta'], type: 'ETHNIC', description: "Ta'ang elder male" },
  { myanmar: 'တား', english: 'Tar', alternatives: ['Ta'], type: 'ETHNIC', description: "Ta'ang male title/prefix" },
  { myanmar: 'ခူး', english: 'Khu', alternatives: ['Khue'], type: 'ETHNIC', description: 'Kayah male title / prefix' },
  { myanmar: 'ခူ', english: 'Khu', type: 'ETHNIC', description: 'Kayah male title / prefix' },
  { myanmar: 'ယာ', english: 'Yar', type: 'ETHNIC', description: "Ta'ang elder female" },
  { myanmar: 'ဦး', english: 'U', type: 'TITLE', description: 'Mr. / Adult Male' },
  { myanmar: 'ကို', english: 'Ko', type: 'TITLE', description: 'Young adult male / Brother' },
  { myanmar: 'မ', english: 'Ma', type: 'TITLE', description: 'Younger female / formal female' }
];

// 3. Known Established Pronunciation / Irregular Name Mappings
export const IRREGULAR_ESTABLISHED_NAMES: Record<string, { english: string; alternatives: string[]; category: 'GEOGRAPHIC' | 'PERSONAL'; notes: string }> = {
  'ညောင်လေးပင်': { english: 'Nyaunglebin', alternatives: ['Nyaung Le Pin'], category: 'GEOGRAPHIC', notes: 'Established town pronunciation (Nyaung-le-bin)' },
  'မန္တလေး': { english: 'Mandalay', alternatives: ['Mandale'], category: 'GEOGRAPHIC', notes: 'Established city pronunciation (Mandalay)' },
  'ရေကျော်': { english: 'Yegyaw', alternatives: ['Ye Gyaw'], category: 'GEOGRAPHIC', notes: 'Established area pronunciation (Ye-gyaw)' },
  'ကြားတောရလမ်း': { english: 'Gyatawya Street', alternatives: ['Kyar Taw Ya Road'], category: 'GEOGRAPHIC', notes: 'Voiced Gya pronunciation' },
  'ရန်ကုန်': { english: 'Yangon', alternatives: ['Rangoon'], category: 'GEOGRAPHIC', notes: 'Capital name convention' }
};

// 4. Known Ethnic & Contextual Name Patterns
export interface KnownNamePattern {
  prefixMyanmar: string;
  bodyMyanmar: string;
  recommendedEnglish: string;
  alternativeEnglish: string[];
  description: string;
}

export const KNOWN_NAME_PATTERNS: KnownNamePattern[] = [
  {
    prefixMyanmar: 'မိုင်း',
    bodyMyanmar: 'အောင်သိန်း',
    recommendedEnglish: 'Mai Naing Aung Thein',
    alternativeEnglish: ['Mai Aung Thein'],
    description: "Ta'ang established personal name pattern (မိုင်းအောင်သိန်း -> Mai Naing Aung Thein)"
  },
  {
    prefixMyanmar: 'မိုင်',
    bodyMyanmar: 'အောင်သိန်း',
    recommendedEnglish: 'Mai Naing Aung Thein',
    alternativeEnglish: ['Mai Aung Thein'],
    description: "Ta'ang established personal name pattern (မိုင်အောင်သိန်း -> Mai Naing Aung Thein)"
  }
];

// -------------------------------------------------------------
// TIER 2: Longest-Match Multi-Syllable Compounds (COMPOUND_WORDS)
// Must match as a single unit before single syllable splitting
// -------------------------------------------------------------
export interface CompoundWordEntry {
  recommendedEnglish: string;
  alternatives: string[];
  rule?: string;
}

export const COMPOUND_WORDS: Record<string, CompoundWordEntry> = {
  'အိန္ဒြာ': { recommendedEnglish: 'Eindra', alternatives: ['Indra'], rule: 'ပါဠိဆင့် compound: အိန္ဒြာ -> Eindra' },
  'ဣန္ဒြာ': { recommendedEnglish: 'Eindra', alternatives: ['Indra'], rule: 'ပါဠိဆင့် compound: ဣန္ဒြာ -> Eindra' },
  'အိန္ဒြေ': { recommendedEnglish: 'Eindray', alternatives: ['Indray'], rule: 'ပါဠိဆင့် compound: အိန္ဒြေ -> Eindray' },
  'စန္ဒာ': { recommendedEnglish: 'Sandar', alternatives: ['Sanda'], rule: 'ပါဠိဆင့် compound: စန္ဒာ -> Sandar' },
  'စန္ဒီ': { recommendedEnglish: 'Sandi', alternatives: ['Sandee'], rule: 'ပါဠိဆင့် compound: စန္ဒီ -> Sandi' },
  'သန္တာ': { recommendedEnglish: 'Thandar', alternatives: ['Thanda'], rule: 'ပါဠိဆင့် compound: သန္တာ -> Thandar' },
  'နန္ဒာ': { recommendedEnglish: 'Nandar', alternatives: ['Nanda'], rule: 'ပါဠိဆင့် compound: နန္ဒာ -> Nandar' },
  'နန္ဒ': { recommendedEnglish: 'Nanda', alternatives: ['Nandar'], rule: 'ပါဠိဆင့် compound: နန္ဒ -> Nanda' },
  'ရတနာ': { recommendedEnglish: 'Yadanar', alternatives: ['Ratanar', 'Yadana'], rule: 'သတ်မှတ် compound: ရတနာ -> Yadanar' },
  'သီရိ': { recommendedEnglish: 'Thiri', alternatives: ['Siri'], rule: 'သတ်မှတ် compound: သီရိ -> Thiri' },
  'သူရ': { recommendedEnglish: 'Thura', alternatives: [], rule: 'သတ်မှတ် compound: သူရ -> Thura' },
  'သုတ': { recommendedEnglish: 'Thuta', alternatives: [], rule: 'သတ်မှတ် compound: သုတ -> Thuta' },
  'ဝဏ္ဏ': { recommendedEnglish: 'Wunna', alternatives: [], rule: 'ပါဠိဆင့် compound: ဝဏ္ဏ -> Wunna' },
  'မေတ္တာ': { recommendedEnglish: 'Metta', alternatives: [], rule: 'ပါဠိဆင့် compound: မေတ္တာ -> Metta' },
  'သိင်္ဂီ': { recommendedEnglish: 'Theingi', alternatives: ['Thingi'], rule: 'ကင်းစီး compound: သိင်္ဂီ -> Theingi' },
  'မင်္ဂလာ': { recommendedEnglish: 'Mingalar', alternatives: ['Mingala'], rule: 'ကင်းစီး compound: မင်္ဂလာ -> Mingalar' },
  'အင်္ဂါ': { recommendedEnglish: 'Inga', alternatives: ['Anga'], rule: 'ကင်းစီး compound: အင်္ဂါ -> Inga' },
  'ဥက္ကာ': { recommendedEnglish: 'Okkar', alternatives: ['Oakkar', 'Okka'], rule: 'ပါဠိဆင့် compound: ဥက္ကာ -> Okkar' },
  'ကဉ္စနာ': { recommendedEnglish: 'Kincana', alternatives: ['Kaincana'], rule: 'ပါဠိဆင့် compound: ကဉ္စနာ -> Kincana' },
  'ဇာနည်': { recommendedEnglish: 'Zarni', alternatives: [], rule: 'သတ်မှတ် compound: ဇာနည် -> Zarni' },
  'ဧရာ': { recommendedEnglish: 'Ayeyar', alternatives: ['Aye Yar'], rule: 'သတ်မှတ် compound: ဧရာ -> Ayeyar' },
  'သစ္စာ': { recommendedEnglish: 'Thitsar', alternatives: ['Thitsa'], rule: 'ပါဠိဆင့် compound: သစ္စာ -> Thitsar' },
  'ပညာ': { recommendedEnglish: 'Pyinnyar', alternatives: ['Pannya'], rule: 'သတ်မှတ် compound: ပညာ -> Pyinnyar' },
  'စကြာ': { recommendedEnglish: 'Sakya', alternatives: [], rule: 'သတ်မှတ် compound: စကြာ -> Sakya' },
  'သုန္ဒရ': { recommendedEnglish: 'Thundara', alternatives: ['Thundar'], rule: 'ပါဠိဆင့် compound: သုန္ဒရ -> Thundara' },
  'မန္တလေး': { recommendedEnglish: 'Mandalay', alternatives: ['Mandale'], rule: 'ပါဠိဆင့် compound: မန္တလေး -> Mandalay' },
  'စိန္တာ': { recommendedEnglish: 'Seinta', alternatives: ['Seinda'], rule: 'ပါဠိဆင့် compound: စိန္တာ -> Seinta' },
  'ကမ္ဘာ': { recommendedEnglish: 'Kaba', alternatives: ['Gaba'], rule: 'ပါဠိဆင့် compound: ကမ္ဘာ -> Kaba' },
  'ဩဘာ': { recommendedEnglish: 'Awbar', alternatives: ['Aw Bar'], rule: 'သတ်မှတ် compound: ဩဘာ -> Awbar' },
  'တာမိုင်း': { recommendedEnglish: 'Tar Mai', alternatives: ['Ta Mai'], rule: "Ta'ang compound: တာမိုင်း -> Tar Mai" },
  'ယာလွေး': { recommendedEnglish: 'Yar Lway', alternatives: ['Yar Lwe'], rule: "Ta'ang compound: ယာလွေး -> Yar Lway" },
  'လဖိုင်': { recommendedEnglish: 'Laphai', alternatives: ['Lahpai'], rule: 'Kachin clan compound: လဖိုင် -> Laphai' },
  'ခေါန်ဂျာ': { recommendedEnglish: 'Khawn Jar', alternatives: ['Khawn Ja', 'Kawn Jar'], rule: 'Kachin compound: ခေါန်ဂျာ -> Khawn Jar' }
};

// Aliased for backwards compatibility
export const PALI_CONJUNCT_RULES: Record<
  string,
  { recommendedEnglish: string; alternatives: string[]; rule: string }
> = Object.fromEntries(
  Object.entries(COMPOUND_WORDS).map(([k, v]) => [
    k,
    { recommendedEnglish: v.recommendedEnglish, alternatives: v.alternatives, rule: v.rule || k }
  ])
);

// -------------------------------------------------------------
// TIER 3: Direct Single-Syllable Lookup Dictionary (SYLLABLE_MAP)
// -------------------------------------------------------------
export interface SyllableMapEntry {
  p: string; // Primary recommended English spelling
  a: string[]; // Alternative spellings
  rule?: string;
}

export const SYLLABLE_MAP: Record<string, SyllableMapEntry> = {
  // --- A / E / I / O / U ---
  'အောင်': { p: 'Aung', a: ['Awng'] },
  'အေး': { p: 'Aye', a: ['Ei'] },
  'အိ': { p: 'Ei', a: ['E'] },
  'အိမ်': { p: 'Eain', a: ['Ein'] },
  'အံ့': { p: 'Ant', a: ['Ahnt'] },
  'ဦး': { p: 'U', a: ['Oo'] },
  'အုန်း': { p: 'Ohn', a: ['Oke'] },
  'အုပ်': { p: 'Oke', a: ['Oak'] },

  // --- K / Kh / G / Ng ---
  'ကျော်': { p: 'Kyaw', a: [] },
  'ကြည်': { p: 'Kyi', a: ['Gyi', 'Kyee'] },
  'ကြီး': { p: 'Gyi', a: ['Kyi'] },
  'ကြွယ်': { p: 'Kywe', a: ['Kywai'] },
  'ကြယ်': { p: 'Kyal', a: ['Kye'] },
  'ကို': { p: 'Ko', a: [] },
  'ကောင်း': { p: 'Kaung', a: [] },
  'ကံ': { p: 'Kan', a: [] },
  'ခင်': { p: 'Khin', a: ['Kin'] },
  'ခိုင်': { p: 'Khaing', a: ['Khine'] },
  'ခန့်': { p: 'Khant', a: [] },
  'ချစ်': { p: 'Chit', a: [] },
  'ချို': { p: 'Cho', a: ['Choe'] },
  'ချမ်း': { p: 'Chan', a: [] },
  'ချော': { p: 'Chaw', a: [] },
  'ခြူး': { p: 'Chu', a: ['Chuu'] },
  'ခမ်း': { p: 'Kham', a: ['Khan'] },
  'ခူး': { p: 'Khu', a: ['Khue'] },
  'ခူ': { p: 'Khu', a: [] },
  'ခေါန်': { p: 'Khawn', a: ['Kawn'] },
  'ဂျာ': { p: 'Jar', a: ['Ja', 'Gyar'] },
  'ဂျား': { p: 'Jar', a: ['Ja'] },
  'ဂျူး': { p: 'Ju', a: ['Jue', 'Gyuu'] },
  'ဂျွန်': { p: 'John', a: ['Jun', 'Gyon'] },
  'ဂျေ': { p: 'J', a: ['Jay'] },
  'ဂျီ': { p: 'Ji', a: ['Gyi'] },
  'ငြိမ်း': { p: 'Nyein', a: [] },
  'ငွေ': { p: 'Ngwe', a: [] },

  // --- S / Hs / Z / Ny ---
  'စိုး': { p: 'Soe', a: ['So'] },
  'စံ': { p: 'San', a: [] },
  'စန်း': { p: 'San', a: [] },
  'စိန်': { p: 'Sein', a: [] },
  'စု': { p: 'Su', a: [] },
  'စည်': { p: 'Si', a: ['Sithu'] },
  'စွမ်း': { p: 'Swan', a: ['Swun'] },
  'ဆိုင်း': { p: 'Seng', a: ['Hsaing', 'Saing'] },
  'ဆန်း': { p: 'San', a: ['Hsan'] },
  'ဆု': { p: 'Hsu', a: ['Su'] },
  'ဆွေ': { p: 'Swe', a: ['Hsway'] },
  'ဇော်': { p: 'Zaw', a: [] },
  'ဇင်': { p: 'Zin', a: [] },
  'ဇာ': { p: 'Zar', a: ['Za'] },
  'ဇွန်': { p: 'Zun', a: ['June'] },
  'ဉာဏ်': { p: 'Nyan', a: [] },
  'ညီ': { p: 'Nyi', a: [] },
  'ညွန့်': { p: 'Nyunt', a: [] },
  'ညို': { p: 'Nyo', a: [] },
  'စင်': { p: 'Sin', a: ['Zin'] },

  // --- T / Ht / D / N ---
  'တာ': { p: 'Tar', a: ['Ta'] },
  'တား': { p: 'Tar', a: ['Ta'] },
  'တင်': { p: 'Tin', a: [] },
  'တင့်': { p: 'Tint', a: [] },
  'တိုး': { p: 'Toe', a: [] },
  'တောက်': { p: 'Tauk', a: [] },
  'ထွန်း': { p: 'Htun', a: ['Tun'] },
  'ထက်': { p: 'Htet', a: [] },
  'ထူး': { p: 'Htoo', a: ['Htu'] },
  'ထွေး': { p: 'Htwe', a: ['Htway'] },
  'ထိုက်': { p: 'Htaik', a: ['Htike'] },
  'ထိန်': { p: 'Htein', a: [] },
  'ထင်': { p: 'Htin', a: ['Tin'] },
  'ထွတ်': { p: 'Htut', a: [] },
  'ဒီ': { p: 'Di', a: ['Dee'] },
  'ဒွေး': { p: 'Dwe', a: ['Dway'] },
  'နွယ်': { p: 'Nwe', a: ['Nway'] },
  'နွဲ့': { p: 'Nwe', a: ['Nwet'] },
  'နီ': { p: 'Ni', a: ['Nee'] },
  'နု': { p: 'Nu', a: [] },
  'နိုင်': { p: 'Naing', a: ['Nine'] },
  'နှင်း': { p: 'Hnin', a: [] },
  'နန်း': { p: 'Nang', a: ['Nan'] },
  'နောင်': { p: 'Naung', a: [] },

  // --- P / Ph / B / M ---
  'ပိုင်': { p: 'Paing', a: ['Pine'] },
  'ပု': { p: 'Pu', a: [] },
  'ပို': { p: 'Po', a: [] },
  'ပိုး': { p: 'Poe', a: [] },
  'ပွင့်': { p: 'Pwint', a: [] },
  'ပြည့်': { p: 'Pyae', a: ['Pyay'] },
  'ဖြိုး': { p: 'Phyo', a: ['Phyoe'] },
  'ဖြူ': { p: 'Phyu', a: [] },
  'ဖူး': { p: 'Phoo', a: ['Phu'] },
  'ဖေ': { p: 'Phe', a: ['Pe'] },
  'ဗိုလ်': { p: 'Bo', a: [] },
  'ဘ': { p: 'Ba', a: [] },
  'ဘုန်း': { p: 'Phone', a: ['Bhone'] },
  'မင်း': { p: 'Min', a: [] },
  'မောင်': { p: 'Maung', a: ['Mg'] },
  'မေ': { p: 'May', a: ['Me'] },
  'မိုး': { p: 'Moe', a: ['Mo'] },
  'မြ': { p: 'Mya', a: [] },
  'မြင့်': { p: 'Myint', a: ['Myin'] },
  'မြတ်': { p: 'Myat', a: [] },
  'မျိုး': { p: 'Myoe', a: ['Myo'] },
  'မျိူး': { p: 'Myoe', a: ['Myo'] },
  'မျို': { p: 'Myo', a: ['Myoe'] },
  'မွန်': { p: 'Mon', a: [] },
  'မူ': { p: 'Mu', a: [] },
  'မာ': { p: 'Mar', a: ['Ma'] },

  // --- Y / R / L / W / Th / H ---
  'ရဲ': { p: 'Ye', a: ['Yai'] },
  'ရဲ့': { p: 'Yai', a: ['Ye'] },
  'ရင့်': { p: 'Yint', a: ['Rint'] },
  'ရင်': { p: 'Yin', a: ['Rin'] },
  'ရန်': { p: 'Yan', a: ['Ran'] },
  'ရာ': { p: 'Ya', a: ['Ra'] },
  'ရီ': { p: 'Yee', a: ['Yi'] },
  'ရည်': { p: 'Yee', a: ['Yi'] },
  'ရွှေ': { p: 'Shwe', a: [] },
  'ရှင်း': { p: 'Shin', a: [] },
  'ရှင်': { p: 'Shin', a: [] },
  'ရှမ်း': { p: 'Shan', a: [] },
  'ရှိ': { p: 'Shi', a: ['Shee'] },
  'လွင်': { p: 'Lwin', a: [] },
  'လင်း': { p: 'Lin', a: ['Linn'] },
  'လတ်': { p: 'Lat', a: ['Latt'] },
  'လိတ်': { p: 'Leik', a: ['Late'] },
  'လွတ်': { p: 'Lut', a: [] },
  'လှ': { p: 'Hla', a: [] },
  'လှိုင်': { p: 'Hlaing', a: ['Hline'] },
  'လဲ့': { p: 'Le', a: ['Lae', 'Lelt'] },
  'လေး': { p: 'Lay', a: [] },
  'လွေး': { p: 'Lway', a: ['Lwe'] },
  'ဝင်း': { p: 'Win', a: ['Winn'] },
  'ဝေ': { p: 'Wai', a: ['Wei', 'Way'] },
  'ဝင့်': { p: 'Wint', a: [] },
  'သန်း': { p: 'Than', a: [] },
  'သိန်း': { p: 'Thein', a: ['Thane', 'Sein'] },
  'သင်း': { p: 'Thin', a: [] },
  'သက်': { p: 'Thet', a: [] },
  'သူ': { p: 'Thu', a: [] },
  'သွင်': { p: 'Thwin', a: [] },
  'သွယ်': { p: 'Thwe', a: ['Thwai'] },
  'သော်': { p: 'Thaw', a: [] },
  'သောင်း': { p: 'Thaung', a: [] },
  'သဇင်': { p: 'Thazin', a: [] },
  'သဲ': { p: 'The', a: ['Thae', 'Thai'] },
  'သိမ့်': { p: 'Theint', a: [] },
  'ဟိန်း': { p: 'Hein', a: [] },
  'ဟန်': { p: 'Han', a: [] },
  'ဟာ': { p: 'Har', a: [] }
};

// Merged explicit rules dictionary for backwards compatibility
export const EXPLICIT_SYLLABLE_RULES: Record<
  string,
  { recommendedEnglish: string; alternatives: string[]; rule: string }
> = {
  ...PALI_CONJUNCT_RULES,
  ...Object.fromEntries(
    Object.entries(SYLLABLE_MAP).map(([k, v]) => [
      k,
      {
        recommendedEnglish: v.p,
        alternatives: v.a,
        rule: v.rule || `သတ်မှတ် syllable dictionary: ${k} -> ${v.p}`
      }
    ])
  )
};
