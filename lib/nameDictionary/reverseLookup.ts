/**
 * Myanmar–English Name Dictionary & Transliteration System
 * Reverse English to Myanmar Lookup Engine
 */

import { DictionaryEntry, ReverseLookupResult } from './types';
import { TITLE_PREFIX_RULES, SYLLABLE_MAP, COMPOUND_WORDS } from './rules';

// Reverse phonetic mapping table for common English romanized name syllables to Myanmar candidates
const ENGLISH_TO_MYANMAR_SYLLABLES: Record<string, string[]> = {
  // Common vowels & diphthongs
  'aye': ['အေး'],
  'ay': ['အေး', 'အေ'],
  'e': ['အေ', 'အေး'],
  'u': ['ဦး', 'ဥ', 'ဦ'],
  'oo': ['ဦး', 'ဦ'],
  'a': ['အာ', 'အ'],

  // Syllables with K/Kh
  'ka': ['ကာ', 'က'],
  'kha': ['ခါ', 'ခ'],
  'khu': ['ခူး', 'ခူ'],
  'khue': ['ခူး'],
  'khawn': ['ခေါန်'],
  'kawn': ['ခေါန်', 'ကောင်'],
  'kyi': ['ကြည်', 'ကျည်', 'ကြီ', 'ကျီ'],
  'kyee': ['ကြည်', 'ကြည်း'],
  'kya': ['ကျ', 'ကျာ', 'ကြား'],
  'kyaw': ['ကျော်', 'ကျော'],
  'kyaung': ['ကျောင်း', 'ကောင်'],
  'kin': ['ခင်', 'ကင်'],
  'khin': ['ခင်'],
  'ko': ['ကို', 'ကိုး'],
  'koe': ['ကို', 'ကိုး'],
  'kaung': ['ကောင်း', 'ကောင်'],
  'kaik': ['ကိုက်', 'ကြိုက်'],
  'kaing': ['ကိုင်', 'ကိုင်း'],
  'kine': ['ကိုင်', 'ကိုင်း'],
  'khe': ['ခေ'],
  'khant': ['ခန့်'],
  'kham': ['ခမ်း'],

  // Syllables with J / Gy
  'jar': ['ဂျာ', 'ဂျား'],
  'ja': ['ဂျာ', 'ဂျား'],
  'gyar': ['ဂျာ'],
  'ju': ['ဂျူး'],
  'jue': ['ဂျူး'],
  'gyuu': ['ဂျူး'],
  'john': ['ဂျွန်'],
  'jun': ['ဂျွန်'],
  'gyon': ['ဂျွန်'],
  'j': ['ဂျေ'],
  'jay': ['ဂျေ'],
  'ji': ['ဂျီ'],
  'gyi': ['ကြီး', 'ကြည်', 'ဂျီ'],

  // Syllables with T/Ht
  'tin': ['တင်', 'ထင်'],
  'htin': ['ထင်'],
  'tun': ['ထွန်း', 'တွန်း'],
  'htun': ['ထွန်း'],
  'htut': ['ထွတ်'],
  'tut': ['တွတ်'],
  'than': ['သန်း', 'သန့်', 'သန်'],
  'thaung': ['သောင်း', 'သောင်'],
  'thu': ['သု', 'သူ'],
  'thaw': ['သော'],
  'thi': ['သီ'],
  'thein': ['သိန်း', 'သိမ်'],
  'tint': ['တင့်'],
  'ta': ['တာ', 'တား', 'တ'],
  'tar': ['တာ', 'တား'],

  // Syllables with M
  'ma': ['မ', 'မာ'],
  'maung': ['မောင်'],
  'mg': ['မောင်'],
  'mya': ['မြ', 'မျ'],
  'myint': ['မြင့်', 'မြတ်'],
  'myat': ['မြတ်'],
  'min': ['မင်း'],
  'moe': ['မိုး'],
  'mo': ['မိုး'],
  'myoe': ['မျိုး', 'မျိူး', 'မျို'],
  'myo': ['မျို', 'မျိုး', 'မျိူး'],
  'maw': ['မော်'],
  'me': ['မေ'],
  'may': ['မေ'],
  'mai': ['မိုင်း', 'မိုင်', 'မယ်'],

  // Syllables with N/Ny
  'naing': ['နိုင်', 'နိုင့်'],
  'nine': ['နိုင်'],
  'nyan': ['ဉာဏ်', 'ညဏ်'],
  'nyaung': ['ညောင်'],
  'ni': ['နီ'],
  'nwe': ['နွယ်'],
  'nwea': ['နွယ်'],
  'nang': ['နန်း'],
  'nan': ['နန်း', 'နန်'],

  // Syllables with P/Ph
  'pe': ['ဖေ', 'ပေ'],
  'phe': ['ဖေ'],
  'phyo': ['ဖြိုး', 'ဖျိုး'],
  'pyo': ['ပျိုး', 'ပြိုး'],
  'phone': ['ဘုန်း', 'ဖုန်း'],
  'pa': ['ပါ', 'ပ'],
  'pha': ['ဖာ', 'ဖ'],
  'phyu': ['ဖြူ'],
  'pye': ['ပြေ'],

  // Syllables with W/L/Y/S/Z/Sh/Ch
  'win': ['ဝင်း'],
  'wai': ['ဝေ'],
  'wa': ['ဝါ', 'ဝ'],
  'lin': ['လင်း', 'လင်'],
  'lwin': ['လွင်'],
  'lway': ['လွေး'],
  'lwe': ['လွေး'],
  'hlaing': ['လှိုင်'],
  'hline': ['လှိုင်'],
  'hla': ['လှ'],
  'lu': ['လူ', 'လု'],
  'lut': ['လွတ်'],
  'laphai': ['လဖိုင်'],
  'lahpai': ['လဖိုင်'],
  'lahtaw': ['လထော်'],
  'ye': ['ရဲ', 'ရေ'],
  'yee': ['ရီ', 'ရည်'],
  'yi': ['ရီ', 'ရည်'],
  'yin': ['ယဉ်', 'ရင်'],
  'yan': ['ရန်', 'ယံ'],
  'yar': ['ယာ'],
  'so': ['စိုး', 'ဆိုး'],
  'soe': ['စိုး', 'ဆိုး'],
  'sein': ['စိန်'],
  'san': ['စန်း', 'ဆန်း', 'စံ'],
  'seng': ['ဆိုင်း'],
  'hsaing': ['ဆိုင်း'],
  'saing': ['ဆိုင်း'],
  'swe': ['ဆွေ'],
  'su': ['စု', 'ဆု'],
  'sai': ['စိုင်း'],
  'zaw': ['ဇော်'],
  'zin': ['ဇင်'],
  'zeya': ['ဇေယျာ'],
  'cho': ['ချို'],
  'chit': ['ချစ်'],
  'chan': ['ချမ်း'],
  'shin': ['ရှင်း', 'ရှင်'],
  'shwe': ['ရွှေ'],
  'shan': ['ရှမ်း']
};

/**
 * Helper to match an individual English token against SYLLABLE_MAP, TITLE_PREFIX_RULES,
 * COMPOUND_WORDS, and ENGLISH_TO_MYANMAR_SYLLABLES.
 */
function getCandidatesForToken(token: string): string[] {
  const tokenLower = token.toLowerCase();
  const primaryList: string[] = [];
  const secondaryList: string[] = [];

  const addPrimary = (item: string) => {
    if (!primaryList.includes(item)) primaryList.push(item);
  };
  const addSecondary = (item: string) => {
    if (!primaryList.includes(item) && !secondaryList.includes(item)) secondaryList.push(item);
  };

  // 1. Check SYLLABLE_MAP (checking both primary 'p' and alternatives 'a')
  for (const [myan, entry] of Object.entries(SYLLABLE_MAP)) {
    if (entry.p.toLowerCase() === tokenLower) {
      addPrimary(myan);
    } else if (entry.a.some(alt => alt.toLowerCase() === tokenLower)) {
      addSecondary(myan);
    }
  }

  // 2. Check TITLE_PREFIX_RULES
  for (const rule of TITLE_PREFIX_RULES) {
    if (rule.english.toLowerCase() === tokenLower) {
      addPrimary(rule.myanmar);
    } else if (rule.alternatives?.some(alt => alt.toLowerCase() === tokenLower)) {
      addSecondary(rule.myanmar);
    }
  }

  // 3. Check COMPOUND_WORDS single token match
  for (const [myan, comp] of Object.entries(COMPOUND_WORDS)) {
    if (comp.recommendedEnglish.toLowerCase() === tokenLower) {
      addPrimary(myan);
    } else if (comp.alternatives.some(alt => alt.toLowerCase() === tokenLower)) {
      addSecondary(myan);
    }
  }

  // 4. Check phonetic dictionary table
  const mapped = ENGLISH_TO_MYANMAR_SYLLABLES[tokenLower];
  if (mapped && mapped.length > 0) {
    for (let i = 0; i < mapped.length; i++) {
      if (primaryList.length === 0 && i === 0) {
        addPrimary(mapped[i]);
      } else {
        addSecondary(mapped[i]);
      }
    }
  }

  const combined = [...primaryList, ...secondaryList];
  return combined.length > 0 ? combined : [token];
}

/**
 * Generates smart ranked combinations of candidate syllables per word.
 * Prioritizes all-top picks, then single token variations from left to right,
 * then multi-token variations.
 */
function generateSmartCombinations(candidatesPerWord: string[][], limit = 8): string[][] {
  if (candidatesPerWord.length === 0) return [];
  const combinations: string[][] = [];
  const seen = new Set<string>();

  const addCombo = (indices: number[]) => {
    const combo = indices.map((cIdx, wIdx) => candidatesPerWord[wIdx][cIdx]);
    const key = combo.join('');
    if (!seen.has(key)) {
      seen.add(key);
      combinations.push(combo);
    }
  };

  // 1. Top pick (all index 0)
  addCombo(candidatesPerWord.map(() => 0));

  // 2. Single-token variations from left to right
  for (let wIdx = 0; wIdx < candidatesPerWord.length; wIdx++) {
    for (let cIdx = 1; cIdx < candidatesPerWord[wIdx].length; cIdx++) {
      const indices = candidatesPerWord.map(() => 0);
      indices[wIdx] = cIdx;
      addCombo(indices);
      if (combinations.length >= limit) return combinations;
    }
  }

  // 3. Multi-token variations (standard Cartesian traversal for remaining)
  const standardCartesian = generateCartesianCombinations(candidatesPerWord, limit * 2);
  for (const combo of standardCartesian) {
    const key = combo.join('');
    if (!seen.has(key)) {
      seen.add(key);
      combinations.push(combo);
      if (combinations.length >= limit) break;
    }
  }

  return combinations;
}

function generateCartesianCombinations(arrays: string[][], limit: number): string[][] {
  let result: string[][] = [[]];
  for (const arr of arrays) {
    const next: string[][] = [];
    for (const res of result) {
      for (const item of arr) {
        next.push([...res, item]);
        if (next.length >= limit) break;
      }
      if (next.length >= limit) break;
    }
    result = next;
  }
  return result;
}

/**
 * Searches the dictionary and phonetic engine by English name.
 */
export function reverseLookupEnglishName(
  query: string,
  dictionary: DictionaryEntry[]
): ReverseLookupResult {
  // Normalize query, including possible Cyrillic 'х' (U+0445) homoglyphs e.g. 'хkawn' -> 'khawn'
  const clean = query.trim().replace(/\u0445k/gi, 'kh').replace(/\u0445/gi, 'kh');
  const lowerQuery = clean.toLowerCase();

  const result: ReverseLookupResult = {
    inputEnglish: clean,
    exactMatches: [],
    probableMatches: []
  };

  if (!clean) return result;

  // 1. Search Exact Matches in Dictionary
  const exact = dictionary.filter(
    d => d.englishSpelling.toLowerCase() === lowerQuery ||
         (d.alternativeSpellings || []).some(alt => alt.toLowerCase() === lowerQuery)
  );
  result.exactMatches = exact;

  // 1.5. Check COMPOUND_WORDS for whole-name or compound match
  for (const [myan, comp] of Object.entries(COMPOUND_WORDS)) {
    if (
      comp.recommendedEnglish.toLowerCase() === lowerQuery ||
      comp.alternatives.some(alt => alt.toLowerCase() === lowerQuery)
    ) {
      if (!result.exactMatches.some(e => e.myanmarName === myan) &&
          !result.probableMatches.some(p => p.myanmarName === myan)) {
        result.probableMatches.push({
          myanmarName: myan,
          englishSpelling: clean,
          confidence: 96,
          matchReason: comp.rule || `Compound Dictionary Match: ${myan} (${comp.recommendedEnglish})`,
          isVerified: true
        });
      }
    }
  }

  // 2. Search Partial Matches in Dictionary
  const partial = dictionary.filter(
    d => !exact.some(e => e.id === d.id) &&
         (d.englishSpelling.toLowerCase().includes(lowerQuery) ||
          lowerQuery.includes(d.englishSpelling.toLowerCase()))
  );

  for (const p of partial) {
    if (!result.probableMatches.some(pm => pm.myanmarName === p.myanmarName)) {
      result.probableMatches.push({
        myanmarName: p.myanmarName,
        englishSpelling: p.englishSpelling,
        confidence: 88,
        matchReason: 'အဘိဓာန်အတွင်း စာလုံးတူညီမှု (Partial Dictionary Match)',
        isVerified: p.isVerified
      });
    }
  }

  // 3. Smart Bidirectional (EN -> MM) Syllable Lookup
  // Split words by whitespace: e.g. "Khu Jar" -> ["Khu", "Jar"]
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const candidateOptionsPerWord: string[][] = words.map(w => getCandidatesForToken(w));

    if (candidateOptionsPerWord.length > 0) {
      const combos = generateSmartCombinations(candidateOptionsPerWord, 8);
      combos.forEach((combo, idx) => {
        const fullBurmese = combo.join('');
        if (!result.exactMatches.some(e => e.myanmarName === fullBurmese) &&
            !result.probableMatches.some(p => p.myanmarName === fullBurmese)) {
          result.probableMatches.push({
            myanmarName: fullBurmese,
            englishSpelling: clean,
            confidence: idx === 0 ? 92 : Math.max(75, 88 - idx * 3),
            matchReason: idx === 0
              ? 'အကြံပြု မြန်မာစာလုံးပေါင်း (Recommended Myanmar Syllable Mapping)'
              : 'အခြား ဖြစ်နိုင်ခြေရှိသော စာလုံးပေါင်း (Alternative Syllable Option)',
            isVerified: false
          });
        }
      });
    }
  }

  return result;
}
