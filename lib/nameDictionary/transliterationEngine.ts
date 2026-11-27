/**
 * Myanmar–English Name Dictionary & Transliteration Engine
 * Core Rule-Based Transliteration & Normalization Engine
 */

import {
  SyllableBreakdown,
  TransliterationResult,
  RulePreferenceConfig,
  DictionaryEntry
} from './types';
import {
  DEFAULT_RULE_CONFIG,
  MYANMAR_CONSONANTS,
  TITLE_PREFIX_RULES,
  IRREGULAR_ESTABLISHED_NAMES,
  KNOWN_NAME_PATTERNS,
  PALI_CONJUNCT_RULES,
  EXPLICIT_SYLLABLE_RULES,
  COMPOUND_WORDS,
  SYLLABLE_MAP
} from './rules';

// Unicode constants for Myanmar script
const MY_VIRAMA = '\u1039';  // ္ (stacking marker)
const MY_ASAT = '\u103A';    // ် (killer)
const MY_YAPIN = '\u103B';   // ျ (medial ya)
const MY_YAYIT = '\u103C';   // ြ (medial ra)
const MY_WASWE = '\u103D';   // ွ (medial wa)
const MY_HATO = '\u103E';    // ှ (medial ha)
const MY_THAWEI = '\u1031';  // ေ (vowel e)
const MY_YAYCHA = '\u102C';  // ာ (vowel aa)
const MY_MAUKCHA = '\u102B'; // ါ (vowel tall aa)
const MY_LONDIN = '\u102D';  // ိ (vowel i)
const MY_SANKHAT = '\u102E'; // ီ (vowel ii)
const MY_CHAUNG = '\u102F';  // ု (vowel u)
const MY_HNACHAUNG = '\u1030';// ူ (vowel uu)
const MY_NAUKPYIT = '\u1032';// ဲ (vowel ai)
const MY_ANUSVARA = '\u1036';// ံ (small dot above)
const MY_AUKMYIT = '\u1037'; // ့ (dot below tone)
const MY_VISARGA = '\u1038'; // း (two dots tone)

/**
 * Normalizes Myanmar text to standard Unicode ordering and removes non-standard noise.
 */
export function normalizeMyanmarText(text: string): string {
  if (!text) return '';
  let str = text.trim();

  // Strip zero-width spaces, zero-width non-joiners, zero-width joiners, BOM
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Normalize Unicode decomposed or visual ordering sequences
  str = str.normalize('NFC');

  // Fix common Aukmyit (့ \u1037) typed before Asat (် \u103A) -> standard canonical Asat then Aukmyit
  str = str.replace(/\u1037\u103A/g, '\u103A\u1037');

  // Fix typo of လုံးကြီးတင်နှစ်ချောင်းငင် (ိ \u102D + ူ \u1030) or visual order -> standard လုံးကြီးတင်တစ်ချောင်းငင် (ိ \u102D + ု \u102F)
  str = str.replace(/\u102D\u1030/g, '\u102D\u102F')
           .replace(/\u1030\u102D/g, '\u102D\u102F')
           .replace(/\u102F\u102D/g, '\u102D\u102F');

  // Normalize non-standard representations of independent vowel 'U' / 'UU' (ဦး)
  str = str.replace(/\u1025\u102E\u1038/g, 'ဦး')
           .replace(/\u1025\u1038/g, 'ဦး')
           .replace(/\u1026\u1038/g, 'ဦး');

  return str;
}

/**
 * Splits Myanmar text into logical syllables.
 * Takes into account asat, stacked consonants (virama), tone marks, independent vowels, and special symbols.
 */
export function segmentMyanmarSyllables(text: string): string[] {
  const normalized = normalizeMyanmarText(text);
  if (!normalized) return [];

  const syllables: string[] = [];
  const chars = Array.from(normalized);
  let current = '';

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const prevChar = i > 0 ? chars[i - 1] : '';
    const nextChar = i < chars.length - 1 ? chars[i + 1] : '';

    // Check if char is whitespace
    if (/\s/.test(char)) {
      if (current.trim()) {
        syllables.push(current.trim());
        current = '';
      }
      continue;
    }

    // Check if char is a consonant, independent vowel, or special symbol that could start a new syllable
    const isBaseCandidate =
      (char >= '\u1000' && char <= '\u1021') ||
      (char >= '\u1023' && char <= '\u102A') ||
      (char >= '\u104C' && char <= '\u104F');

    if (isBaseCandidate && current.length > 0) {
      // It is NOT a new syllable if:
      // 1. Previous character was Virama (stacking consonant) e.g. န္တ
      // 2. This consonant is an asat final closing the current syllable (e.g. က်, င်, တ်, န်, င့်, န်း)
      //    Note: There may be intervening tone marks like \u1037 (aukmyit) before asat.
      const prevWasVirama = prevChar === MY_VIRAMA;

      // A consonant is an asat final closing the current syllable (e.g. က်, င်, တ်, န်, င့်, န်း)
      // ONLY IF it is directly killed by asat (or with aukmyit tone before asat).
      // It can NEVER be an asat final if followed by medials (ျ, ြ, ွ, ှ) or vowels (ေ, ာ, ိ, ီ, ု, ူ, ဲ)!
      const isFinalWithAsat =
        nextChar === MY_ASAT ||
        (nextChar === MY_AUKMYIT && i + 2 < chars.length && chars[i + 2] === MY_ASAT);

      const isSubStacked = nextChar === MY_VIRAMA;

      if (!prevWasVirama && !isFinalWithAsat && !isSubStacked) {
        // This marks a syllable boundary!
        syllables.push(current);
        current = '';
      }
    }

    current += char;
  }

  if (current.trim()) {
    syllables.push(current.trim());
  }

  return syllables;
}

/**
 * Groups multi-syllable Pali conjuncts and established compound terms
 * before individual single-syllable transliteration.
 */
export function groupPaliConjunctSyllables(syllables: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < syllables.length) {
    let matched = false;
    for (let len = Math.min(4, syllables.length - i); len >= 2; len--) {
      const combined = syllables.slice(i, i + len).join('');
      if (
        combined in COMPOUND_WORDS ||
        combined in PALI_CONJUNCT_RULES ||
        combined in IRREGULAR_ESTABLISHED_NAMES
      ) {
        result.push(combined);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result.push(syllables[i]);
      i++;
    }
  }
  return result;
}

/**
 * Converts a single Myanmar syllable into English using strict rule priority.
 */
export function transliterateSyllable(
  syllable: string,
  config: RulePreferenceConfig = DEFAULT_RULE_CONFIG
): SyllableBreakdown {
  const norm = normalizeMyanmarText(syllable);

  // Default breakdown structure
  const breakdown: SyllableBreakdown = {
    rawMyanmar: syllable,
    normalizedMyanmar: norm,
    recommendedEnglish: '',
    alternativeEnglish: [],
    ruleApplied: 'Standard Syllable Mapping',
    isUncertain: false,
    confidence: 90
  };

  // Parse Initial Consonant & Medials
  let baseChar = '';
  let medials = '';
  let rest = '';

  for (let i = 0; i < norm.length; i++) {
    const c = norm[i];
    if (!baseChar && ((c >= '\u1000' && c <= '\u1021') || (c >= '\u1023' && c <= '\u102A'))) {
      baseChar = c;
      continue;
    }
    if (baseChar) {
      if (c === MY_YAPIN || c === MY_YAYIT || c === MY_WASWE || c === MY_HATO) {
        medials += c;
      } else {
        rest += c;
      }
    }
  }

  // Detect asat characters and find final consonant before asat
  // Note: In pure vowel combinations like ေ-ာ် (aw), asat is part of the vowel, not a consonant killer.
  const isVowelThaweiYaychaAsat =
    norm.includes(MY_THAWEI) &&
    (norm.includes(MY_YAYCHA) || norm.includes(MY_MAUKCHA)) &&
    norm.includes(MY_ASAT) &&
    !norm.includes('က') &&
    !norm.includes('င');

  const hasAsat = !isVowelThaweiYaychaAsat && (rest.includes(MY_ASAT) || norm.includes(MY_ASAT));
  let finalConsonant = '';
  if (hasAsat) {
    const asatIdx = norm.indexOf(MY_ASAT);
    for (let j = asatIdx - 1; j >= 0; j--) {
      const c = norm[j];
      if (c === MY_AUKMYIT || c === MY_VISARGA) {
        continue;
      }
      if (c >= '\u1000' && c <= '\u1021') {
        if (j > 0) {
          finalConsonant = c;
        }
      }
      break;
    }
  }

  breakdown.initialConsonant = baseChar;
  breakdown.medialCombination = medials;
  breakdown.finalConsonant = finalConsonant;

  // TIER 2: Match Multi-Syllable Compounds Dictionary (COMPOUND_WORDS)
  const cleanNorm = norm.replace(/\u103A\u1037/g, '\u1037\u103A');
  const compoundMatch = COMPOUND_WORDS[norm] || COMPOUND_WORDS[cleanNorm];
  if (compoundMatch) {
    breakdown.recommendedEnglish = compoundMatch.recommendedEnglish;
    breakdown.alternativeEnglish = [...compoundMatch.alternatives];
    breakdown.ruleApplied = compoundMatch.rule || `Tier 2 Compound: ${norm}`;
    breakdown.confidence = 100;
    return breakdown;
  }

  // TIER 3: Direct Single-Syllable Lookup Dictionary (SYLLABLE_MAP)
  const syllableMatch = SYLLABLE_MAP[norm] || SYLLABLE_MAP[cleanNorm];
  if (syllableMatch) {
    let rec = syllableMatch.p;
    let alts = [...syllableMatch.a];

    // Honor user-configured htVersusT preference for Ht words
    if (config.htVersusT === 'T' && rec.startsWith('Ht')) {
      const tVersion = rec.replace(/^Ht/, 'T');
      alts = [rec, ...alts.filter(x => x !== tVersion && x !== rec)];
      rec = tVersion;
    } else if (config.htVersusT === 'Ht' && rec.startsWith('T') && !rec.startsWith('Th') && (norm.startsWith('ထ') || cleanNorm.startsWith('ထ'))) {
      const htVersion = rec.replace(/^T/, 'Ht');
      alts = [rec, ...alts.filter(x => x !== htVersion && x !== rec)];
      rec = htVersion;
    }

    breakdown.recommendedEnglish = rec;
    breakdown.alternativeEnglish = alts;
    breakdown.ruleApplied = syllableMatch.rule || `Tier 3 Syllable: ${norm} -> ${rec}`;
    breakdown.confidence = 100;
    breakdown.vowelPattern = norm.replace(baseChar, '').replace(medials, '');
    return breakdown;
  }

  // Check explicit rules / aliases
  const explicitKey = norm in EXPLICIT_SYLLABLE_RULES
    ? norm
    : (cleanNorm in EXPLICIT_SYLLABLE_RULES ? cleanNorm : '');

  if (explicitKey && EXPLICIT_SYLLABLE_RULES[explicitKey]) {
    const matched = EXPLICIT_SYLLABLE_RULES[explicitKey];
    let rec = matched.recommendedEnglish;
    let alts = [...(matched.alternatives || [])];

    if (config.htVersusT === 'T' && rec.startsWith('Ht')) {
      const tVersion = rec.replace(/^Ht/, 'T');
      alts = [rec, ...alts.filter(x => x !== tVersion && x !== rec)];
      rec = tVersion;
    } else if (config.htVersusT === 'Ht' && rec.startsWith('T') && !rec.startsWith('Th') && explicitKey.startsWith('ထ')) {
      const htVersion = rec.replace(/^T/, 'Ht');
      alts = [rec, ...alts.filter(x => x !== htVersion && x !== rec)];
      rec = htVersion;
    }

    breakdown.recommendedEnglish = rec;
    breakdown.alternativeEnglish = alts;
    breakdown.ruleApplied = matched.rule;
    breakdown.confidence = 100;
    breakdown.vowelPattern = norm.replace(baseChar, '').replace(medials, '');
    return breakdown;
  }

  // PRIORITY 1.5: Generic Pali Stacked Syllable / Conjuncts (ပါဠိဆင့်/စာလုံးဆင့် & ကင်းစီး) Decomposition
  // Examples: အိန္ဒြာ -> အိန် + ဒြာ -> Eindra / Indra
  //           စန္ဒာ -> စန် + ဒါ -> Sandar / Sanda
  //           သိင်္ဂီ -> သိင် + ဂီ -> Theingi
  //           မေတ္တာ -> မေတ် + တာ -> Metta
  //           ဥက္ကာ -> ဥက် + ကာ -> Okkar
  if (norm.includes(MY_VIRAMA)) {
    const viramaIdx = norm.indexOf(MY_VIRAMA);
    if (viramaIdx > 0 && viramaIdx < norm.length - 1) {
      let part1Syllable = '';
      const part2Syllable = norm.slice(viramaIdx + 1);

      if (norm[viramaIdx - 1] === MY_ASAT) {
        // Kinzi (င်္ \u1004\u103A\u1039): top consonant is already killed by asat before virama
        part1Syllable = norm.slice(0, viramaIdx);
      } else {
        // Standard stacked consonant (C1 + virama + C2):
        // top consonant C1 becomes killer with asat (\u103A)
        const c1 = norm[viramaIdx - 1];
        const prefixBeforeC1 = norm.slice(0, viramaIdx - 1);
        part1Syllable = prefixBeforeC1 + c1 + MY_ASAT;
      }

      const part1Result = transliterateSyllable(part1Syllable, config);
      const part2Result = transliterateSyllable(part2Syllable, config);

      const part1En = part1Result.recommendedEnglish || '';
      const part2En = (part2Result.recommendedEnglish || '').toLowerCase();
      let combinedEn = part1En + part2En;

      if (part1Syllable === 'စန်' && (part2Syllable === 'ဒာ' || part2Syllable === 'ဒါ')) {
        combinedEn = 'Sandar';
      }

      breakdown.recommendedEnglish = combinedEn;
      const alts: string[] = [];
      const p1List = [part1En, ...part1Result.alternativeEnglish];
      const p2List = [part2En, ...part2Result.alternativeEnglish.map((x) => x.toLowerCase())];
      for (const a1 of p1List) {
        for (const a2 of p2List) {
          const comb = a1 + a2;
          if (comb && comb !== combinedEn && !alts.includes(comb)) {
            alts.push(comb);
          }
        }
      }
      if (combinedEn === 'Sandar' && !alts.includes('Sanda')) alts.unshift('Sanda');
      if (combinedEn === 'Eindra' && !alts.includes('Indra')) alts.unshift('Indra');

      breakdown.alternativeEnglish = alts;
      breakdown.ruleApplied = `ပါဠိဆင့်/ကင်းစီး: ${part1Syllable} (${part1En}) + ${part2Syllable} (${part2En}) -> ${combinedEn}`;
      breakdown.initialConsonant = norm[0];
      breakdown.medialCombination = norm.slice(1, viramaIdx - 1);
      breakdown.vowelPattern = 'ပါဠိဆင့်/ကင်းစီး';
      breakdown.confidence = 95;
      return breakdown;
    }
  }

  // PRIORITY 1.8: Standalone Independent Vowels and Special Symbols
  if (norm === 'ဣ') {
    breakdown.recommendedEnglish = 'I';
    breakdown.alternativeEnglish = ['Ei'];
    breakdown.ruleApplied = 'အမှီအခိုကင်းသော သရ: ဣ (I)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ဤ') {
    breakdown.recommendedEnglish = 'Ei';
    breakdown.alternativeEnglish = ['I', 'Ee'];
    breakdown.ruleApplied = 'အမှီအခိုကင်းသော သရ: ဤ (Ei)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ဥ') {
    breakdown.recommendedEnglish = 'U';
    breakdown.alternativeEnglish = ['Oo', 'O'];
    breakdown.ruleApplied = 'အမှီအခိုကင်းသော သရ: ဥ (U)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ဦ' || norm === 'ဦး') {
    breakdown.recommendedEnglish = 'U';
    breakdown.alternativeEnglish = ['Oo'];
    breakdown.ruleApplied = 'အမှီအခိုကင်းသော သရ: ဦ/ဦး (U)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ဧ') {
    breakdown.recommendedEnglish = 'Aye';
    breakdown.alternativeEnglish = ['Ay', 'E'];
    breakdown.ruleApplied = 'အမှီအခိုကင်းသော သရ: ဧ (Aye)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ဩ' || norm === 'ဪ') {
    breakdown.recommendedEnglish = 'Aw';
    breakdown.alternativeEnglish = ['Aww', 'O'];
    breakdown.ruleApplied = 'အမှီအခိုကင်းသော သရ: ဩ/ဪ (Aw)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === '၌') {
    breakdown.recommendedEnglish = 'Hnaik';
    breakdown.ruleApplied = 'သင်္ကေတ: ၌ (Hnaik)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === '၍') {
    breakdown.recommendedEnglish = 'Yway';
    breakdown.ruleApplied = 'သင်္ကေတ: ၍ (Yway)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === '၎') {
    breakdown.recommendedEnglish = 'Lagaung';
    breakdown.ruleApplied = 'သင်္ကေတ: ၎ (Lagaung)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === '၏') {
    breakdown.recommendedEnglish = 'Ei';
    breakdown.alternativeEnglish = ['I'];
    breakdown.ruleApplied = 'သင်္ကေတ: ၏ (Ei)';
    breakdown.confidence = 100;
    return breakdown;
  }

  // PRIORITY 2: Special fast path for single common title / particle syllables
  if (norm === 'မ') {
    breakdown.recommendedEnglish = 'Ma';
    breakdown.ruleApplied = 'အမျိုးသမီး အမည်ရှေ့တပ်: မ (Ma)';
    breakdown.vowelPattern = 'အသံ (a)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ဦး') {
    breakdown.recommendedEnglish = 'U';
    breakdown.alternativeEnglish = ['Oo'];
    breakdown.ruleApplied = 'အမျိုးသား အမည်ရှေ့တပ်: ဦး (U)';
    breakdown.vowelPattern = 'သရ ဦး (U)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ဒေါ်') {
    breakdown.recommendedEnglish = 'Daw';
    breakdown.ruleApplied = 'အမျိုးသမီး အမည်ရှေ့တပ်: ဒေါ် (Daw)';
    breakdown.vowelPattern = 'ေ-ာ် (aw)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'ကို') {
    breakdown.recommendedEnglish = 'Ko';
    breakdown.alternativeEnglish = ['Koe'];
    breakdown.ruleApplied = 'အမျိုးသား အမည်ရှေ့တပ်: ကို (Ko)';
    breakdown.vowelPattern = '-ို (o)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'မောင်') {
    breakdown.recommendedEnglish = 'Maung';
    breakdown.alternativeEnglish = ['Mg'];
    breakdown.ruleApplied = 'အမျိုးသား အမည်ရှေ့တပ်: မောင် (Maung)';
    breakdown.vowelPattern = 'ေ-ာင် (aung)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'မိုင်း' || norm === 'မိုင်') {
    breakdown.recommendedEnglish = 'Mai';
    breakdown.ruleApplied = 'တအာင်း အမည်ရှေ့တပ်: မိုင်း (Mai)';
    breakdown.vowelPattern = '-ိုင် (ai)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'တာ') {
    breakdown.recommendedEnglish = 'Tar';
    breakdown.alternativeEnglish = ['Ta'];
    breakdown.ruleApplied = 'တအာင်း အမည်ရှေ့တပ်: တာ (Tar)';
    breakdown.vowelPattern = 'ာ (ar)';
    breakdown.confidence = 95;
    return breakdown;
  }
  if (norm === 'ယာ') {
    breakdown.recommendedEnglish = 'Yar';
    breakdown.alternativeEnglish = ['Ya'];
    breakdown.ruleApplied = 'တအာင်း အမည်ရှေ့တပ်: ယာ (Yar)';
    breakdown.vowelPattern = 'ာ (ar)';
    breakdown.confidence = 95;
    return breakdown;
  }
  if (norm === 'စိုင်း') {
    breakdown.recommendedEnglish = 'Sai';
    breakdown.ruleApplied = 'ရှမ်း အမည်ရှေ့တပ်: စိုင်း (Sai)';
    breakdown.vowelPattern = '-ိုင် (ai)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'နန်း') {
    breakdown.recommendedEnglish = 'Nang';
    breakdown.alternativeEnglish = ['Nan'];
    breakdown.ruleApplied = 'ရှမ်း အမည်ရှေ့တပ်: နန်း (Nang)';
    breakdown.vowelPattern = 'န် (an/ang)';
    breakdown.confidence = 100;
    return breakdown;
  }
  if (norm === 'အေး') {
    breakdown.recommendedEnglish = 'Aye';
    breakdown.alternativeEnglish = ['Ay', 'E'];
    breakdown.ruleApplied = 'အမည်: အေး (Aye)';
    breakdown.vowelPattern = 'ေ-း (aye)';
    breakdown.confidence = 100;
    return breakdown;
  }

  // 1. Initial Consonant + Medials Romanization
  let englishOnset = '';
  let onsetRule = '';
  const onsetAlts: string[] = [];

  const hasYaPin = medials.includes(MY_YAPIN);
  const hasYaYit = medials.includes(MY_YAYIT);
  const hasWa = medials.includes(MY_WASWE);
  const hasHa = medials.includes(MY_HATO);

  // Check CRITICAL EXCEPTIONS for Initial / Medials:
  // Exception A: ချ and ခြ MUST use Ch (not Khy!)
  if ((baseChar === 'ခ' && (hasYaPin || hasYaYit)) || (baseChar === 'ဆ' && (hasYaPin || hasYaYit))) {
    if (hasWa) {
      englishOnset = 'Chw';
      onsetRule = 'Exception: ချ/ခြ + ဝဆွဲ -> Chw';
    } else {
      englishOnset = 'Ch';
      onsetRule = 'Exception: ချ/ခြ -> Ch (Khy မဟုတ်)';
    }
  }
  // Exception B: ရှ and ယှ MUST use Sh (not Hy or Hr!)
  else if ((baseChar === 'ရ' || baseChar === 'ယ') && hasHa) {
    if (hasWa) {
      englishOnset = 'Shw';
      onsetRule = 'Exception: ရွှ/ယွှ -> Shw';
    } else {
      englishOnset = 'Sh';
      onsetRule = 'Exception: ရှ/ယှ -> Sh (Hy/Hr မဟုတ်)';
    }
  }
  // Combination 4: YW Combinations (Kyw, Pyw, Myw)
  else if ((hasYaPin || hasYaYit) && hasWa) {
    if (baseChar === 'က') englishOnset = 'Kyw';
    else if (baseChar === 'ပ') englishOnset = 'Pyw';
    else if (baseChar === 'မ') englishOnset = 'Myw';
    else englishOnset = (MYANMAR_CONSONANTS[baseChar]?.defaultEnglish || '') + 'yw';
    onsetRule = 'YW Medial Combination (ယပင့်/ရရစ် + ဝဆွဲ)';
  }
  // Combination 5: HY Combinations (Hmy, Hly)
  else if (hasHa && (hasYaPin || hasYaYit)) {
    if (baseChar === 'မ') englishOnset = 'Hmy';
    else if (baseChar === 'လ') englishOnset = 'Hly';
    else englishOnset = 'H' + (MYANMAR_CONSONANTS[baseChar]?.defaultEnglish || '') + 'y';
    onsetRule = 'HY Medial Combination (ဟထိုး + ယပင့်/ရရစ်)';
  }
  // Combination 6: HW Combinations (Hnw, Hlw, Hmw, Hngw)
  else if (hasHa && hasWa) {
    if (baseChar === 'န' || baseChar === 'ဏ') englishOnset = 'Hnw';
    else if (baseChar === 'လ') englishOnset = 'Hlw';
    else if (baseChar === 'မ') englishOnset = 'Hmw';
    else if (baseChar === 'င') englishOnset = 'Hngw';
    else englishOnset = 'H' + (MYANMAR_CONSONANTS[baseChar]?.defaultEnglish || '') + 'w';
    onsetRule = 'HW Medial Combination (ဟထိုး + ဝဆွဲ)';
  }
  // Combination 3: H-prefixed Combinations (Hng, Hny, Hn, Hm, Hl, Hw)
  else if (hasHa) {
    if (baseChar === 'င') englishOnset = 'Hng';
    else if (baseChar === 'ည' || baseChar === 'ဉ') englishOnset = 'Hny';
    else if (baseChar === 'န' || baseChar === 'ဏ') englishOnset = 'Hn';
    else if (baseChar === 'မ') englishOnset = 'Hm';
    else if (baseChar === 'လ' || baseChar === 'ဠ') englishOnset = 'Hl';
    else if (baseChar === 'ဝ') englishOnset = 'Hw';
    else englishOnset = 'H' + (MYANMAR_CONSONANTS[baseChar]?.defaultEnglish || '');
    onsetRule = 'H-prefixed Medial Combination (ဟထိုး)';
  }
  // Combination 1: Y Combinations (Ky, Py, By, Gy, Phy, My)
  else if (hasYaPin || hasYaYit) {
    if (baseChar === 'က') englishOnset = 'Ky';
    else if (baseChar === 'ပ') englishOnset = 'Py';
    else if (baseChar === 'ဗ' || baseChar === 'ဘ') englishOnset = 'By';
    else if (baseChar === 'ဂ' || baseChar === 'ဃ') {
      englishOnset = 'J';
      onsetAlts.push('Gy');
    }
    else if (baseChar === 'ဖ') englishOnset = 'Phy';
    else if (baseChar === 'မ') englishOnset = 'My';
    else if (baseChar === 'ဒ' && hasYaYit) englishOnset = 'Dr';
    else if (baseChar === 'တ' && hasYaYit) englishOnset = 'Tr';
    else englishOnset = (MYANMAR_CONSONANTS[baseChar]?.defaultEnglish || '') + (hasYaYit ? 'r' : 'y');
    onsetRule = hasYaYit ? 'R Medial Combination (ရရစ်)' : 'Y Medial Combination (ယပင့်)';
  }
  // Combination 2: W Combinations (Kw, Khw, Gw, Sw, Zw, Lw, Ngw, Dw)
  else if (hasWa) {
    // Note: If followed by နသတ် or တသတ်, Wa acts as vowel "un" or "ut"! Handled in rhyme!
    if (baseChar === 'က') englishOnset = 'Kw';
    else if (baseChar === 'ခ') englishOnset = 'Khw';
    else if (baseChar === 'ဂ' || baseChar === 'ဃ') englishOnset = 'Gw';
    else if (baseChar === 'စ' || baseChar === 'ဆ') englishOnset = 'Sw';
    else if (baseChar === 'ဇ' || baseChar === 'ဈ') englishOnset = 'Zw';
    else if (baseChar === 'လ' || baseChar === 'ဠ') englishOnset = 'Lw';
    else if (baseChar === 'င') englishOnset = 'Ngw';
    else if (baseChar === 'ဒ' || baseChar === 'ဓ') englishOnset = 'Dw';
    else englishOnset = (MYANMAR_CONSONANTS[baseChar]?.defaultEnglish || '') + 'w';
    onsetRule = 'W Medial Combination (ဝဆွဲ)';
  }
  // Simple Base Consonant
  else {
    const mapping = MYANMAR_CONSONANTS[baseChar];
    if (mapping) {
      if (baseChar === 'ထ' || baseChar === 'ဌ') {
        englishOnset = config.htVersusT === 'T' ? 'T' : 'Ht';
        onsetAlts.push(config.htVersusT === 'T' ? 'Ht' : 'T');
      } else if (baseChar === 'ဖ') {
        englishOnset = config.phVersusP === 'P' ? 'P' : 'Ph';
        onsetAlts.push(config.phVersusP === 'P' ? 'Ph' : 'P');
      } else if (baseChar === 'ခ') {
        englishOnset = config.khVersusK === 'K' ? 'K' : 'Kh';
        onsetAlts.push(config.khVersusK === 'K' ? 'Kh' : 'K');
      } else if (baseChar === 'သ') {
        englishOnset = mapping.defaultEnglish; // Th
        onsetAlts.push('S');
      } else if (baseChar === 'အ') {
        englishOnset = ''; // Vowel will supply onset
      } else {
        englishOnset = mapping.defaultEnglish;
        onsetAlts.push(...mapping.alternatives);
      }
      onsetRule = `Consonant: ${mapping.charName || baseChar}`;
    } else {
      englishOnset = baseChar;
    }
  }

  // 2. Rhyme / Vowel + Asat Final Parsing
  let englishRhyme = '';
  let rhymeRule = '';
  const rhymeAlts: string[] = [];
  let detectedVowelPattern = '';

  // CRITICAL EXCEPTION C: ဝဆွဲ + နသတ် / မသတ် MUST be "un" / "unt" (e.g. ထွန်း = Htun/Tun, ညွန့် = Nyunt)
  if (hasWa && hasAsat && (finalConsonant === 'န' || finalConsonant === 'ဏ' || finalConsonant === 'မ')) {
    // If onset already had 'w', strip the trailing 'w' since 'un' replaces it!
    let baseOnly = englishOnset;
    if (baseOnly.endsWith('w')) baseOnly = baseOnly.slice(0, -1);
    if (baseChar === 'ထ') baseOnly = config.htVersusT === 'T' ? 'T' : 'Ht';
    englishOnset = baseOnly;
    englishRhyme = norm.includes(MY_AUKMYIT) ? 'unt' : 'un';
    rhymeRule = 'Exception: ဝဆွဲ + နသတ် -> un / unt';
    detectedVowelPattern = norm.includes(MY_AUKMYIT) ? 'ဝဆွဲ + န့် (unt)' : 'ဝဆွဲ + နသတ် (un)';
    rhymeAlts.push('one');
  }
  // CRITICAL EXCEPTION D: ဝဆွဲ + တသတ် / ပသတ် MUST be "ut" / "up" (e.g. ထွတ် = Htut / Kut, လွတ် = Lut)
  else if (hasWa && hasAsat && (finalConsonant === 'တ' || finalConsonant === 'ဋ' || finalConsonant === 'ပ')) {
    let baseOnly = englishOnset;
    if (baseOnly.endsWith('w')) baseOnly = baseOnly.slice(0, -1);
    if (baseChar === 'ထ') baseOnly = config.htVersusT === 'T' ? 'T' : 'Ht';
    englishOnset = baseOnly;
    englishRhyme = 'ut';
    rhymeRule = 'Exception: ဝဆွဲ + တသတ်/ပသတ် -> ut';
    detectedVowelPattern = 'ဝဆွဲ + တသတ်/ပသတ် (ut)';
    if (finalConsonant === 'ပ') rhymeAlts.push('up');
  }
  // ဝဆွဲ + ငသတ်: "win" / "wint" (e.g. လွင် = Lwin)
  else if (hasWa && hasAsat && finalConsonant === 'င') {
    let baseOnly = englishOnset;
    if (baseOnly.endsWith('w')) baseOnly = baseOnly.slice(0, -1);
    englishOnset = baseOnly;
    englishRhyme = norm.includes(MY_AUKMYIT) ? 'wint' : 'win';
    rhymeRule = 'ဝဆွဲ + ငသတ် -> win / wint';
    detectedVowelPattern = norm.includes(MY_AUKMYIT) ? 'ဝဆွဲ + င့် (wint)' : 'ဝဆွဲ + ငသတ် (win)';
  }
  // ေ-ာက် (သဝေထိုးရေးချကသတ်) -> auk (e.g. ကောက် = Kauk, ကျောက် = Kyauk)
  else if (norm.includes(MY_THAWEI) && (norm.includes(MY_YAYCHA) || norm.includes(MY_MAUKCHA)) && finalConsonant === 'က') {
    englishRhyme = 'auk';
    rhymeRule = 'ေ-ာက် -> auk';
    detectedVowelPattern = 'ေ-ာက် (auk)';
  }
  // ေ-ာင် (သဝေထိုးရေးချငသတ်) -> aung (e.g. မောင် = Maung, သောင်း = Thaung, ကျောင်း = Kyaung)
  else if (norm.includes(MY_THAWEI) && (norm.includes(MY_YAYCHA) || norm.includes(MY_MAUKCHA)) && finalConsonant === 'င') {
    englishRhyme = 'aung';
    rhymeRule = 'ေ-ာင် -> aung';
    detectedVowelPattern = 'ေ-ာင် (aung)';
    rhymeAlts.push('awng');
  }
  // -ိုက် (လုံးတင်ချောင်းငင်ကသတ်) -> aik (e.g. ကိုက် = Kaik, ကြိုက် = Kyaik)
  else if (norm.includes(MY_LONDIN) && norm.includes(MY_CHAUNG) && finalConsonant === 'က') {
    englishRhyme = 'aik';
    rhymeRule = '-ိုက် -> aik';
    detectedVowelPattern = '-ိုက် (aik)';
  }
  // -ိုင် (လုံးတင်ချောင်းငင်ငသတ်) -> aing / ine (e.g. ကိုက် = Kaing / Kine, လှိုင် = Hlaing)
  else if (norm.includes(MY_LONDIN) && norm.includes(MY_CHAUNG) && finalConsonant === 'င') {
    englishRhyme = config.finalAINGVersusINE === 'ine' ? 'ine' : 'aing';
    rhymeRule = '-ိုင် -> aing / ine';
    detectedVowelPattern = '-ိုင် (aing/ine)';
    rhymeAlts.push(config.finalAINGVersusINE === 'ine' ? 'aing' : 'ine', 'aine');
  }
  // -ိတ် / -ိပ် (လုံးတင်တသတ် / လုံးတင်ပသတ်) -> eik (e.g. ကိတ်, ကိပ်, သိပ်)
  else if (norm.includes(MY_LONDIN) && (finalConsonant === 'တ' || finalConsonant === 'ဋ' || finalConsonant === 'ပ')) {
    englishRhyme = 'eik';
    rhymeRule = '-ိတ် / -ိပ် -> eik';
    detectedVowelPattern = '-ိတ်/-ိပ် (eik)';
  }
  // -ိန် / -ိမ် (လုံးတင်နသတ် / လုံးတင်မသတ်) -> ein (e.g. ကိန်, စိန်, သိမ်)
  else if (norm.includes(MY_LONDIN) && (finalConsonant === 'န' || finalConsonant === 'ဏ' || finalConsonant === 'မ')) {
    englishRhyme = norm.includes(MY_AUKMYIT) ? 'eint' : 'ein';
    rhymeRule = '-ိန် / -ိမ် -> ein';
    detectedVowelPattern = norm.includes(MY_AUKMYIT) ? '-ိန့်/-ိုမ် (eint)' : '-ိန်/-ိမ် (ein)';
    rhymeAlts.push('ane', 'in');
  }
  // -ုတ် / -ုပ် (ချောင်းငင်တသတ် / ချောင်းငင်ပသတ်) -> ok / oke (e.g. ကုတ်, ကုပ်, အုပ်)
  else if (norm.includes(MY_CHAUNG) && (finalConsonant === 'တ' || finalConsonant === 'ဋ' || finalConsonant === 'ပ')) {
    englishRhyme = 'oke';
    rhymeRule = '-ုတ် / -ုပ် -> oke / ok';
    detectedVowelPattern = '-ုတ်/-ုပ် (oke/ok)';
    rhymeAlts.push('ok');
  }
  // -ုန် / -ုမ် (ချောင်းငင်နသတ် / ချောင်းငင်မသတ်) -> ont / one / ohn / on (e.g. ကုန်, ဘုန်း, မြုံ)
  else if (norm.includes(MY_CHAUNG) && (finalConsonant === 'န' || finalConsonant === 'ဏ' || finalConsonant === 'မ')) {
    englishRhyme = norm.includes(MY_AUKMYIT) ? 'ont' : 'one';
    rhymeRule = '-ုန် / -ုမ် -> one / ont / ohn';
    detectedVowelPattern = norm.includes(MY_AUKMYIT) ? '-ုန့်/-ုမ် (ont)' : '-ုန်/-ုမ် (one/ohn)';
    rhymeAlts.push('ohn', 'on', 'ont');
  }
  // က် (ကသတ်) -> et (e.g. ကက် = Ket, ကြက် = Kyet, ထက် = Htet, သက် = Thet)
  else if (finalConsonant === 'က') {
    englishRhyme = 'et';
    rhymeRule = 'က် -> et';
    detectedVowelPattern = 'က် (et)';
  }
  // င် (ငသတ်) -> in / int (e.g. ကင် = Kin, ခင် = Khin, မြင့် = Myint, သင်း = Thin)
  else if (finalConsonant === 'င') {
    englishRhyme = norm.includes(MY_AUKMYIT) ? 'int' : 'in';
    rhymeRule = 'င် -> in / int';
    detectedVowelPattern = norm.includes(MY_AUKMYIT) ? 'င့် (int)' : 'င် (in)';
    if (norm.includes(MY_AUKMYIT)) rhymeAlts.push('in');
  }
  // စ် (စသတ်) -> it (e.g. ကစ် = Kit, ချစ် = Chit, သစ် = Thit)
  else if (finalConsonant === 'စ') {
    englishRhyme = 'it';
    rhymeRule = 'စ် -> it';
    detectedVowelPattern = 'စ် (it)';
  }
  // ည် / ည့် / ည်း (ညသတ်) -> i / ee (e.g. ကြည် = Kyi, ရည် = Yee/Yi)
  else if (finalConsonant === 'ည' || finalConsonant === 'ဉ') {
    englishRhyme = config.vowelEEVersusI === 'ee' ? 'ee' : 'i';
    rhymeRule = 'ည် -> i / ee';
    detectedVowelPattern = 'ည် (i/ee)';
    rhymeAlts.push(config.vowelEEVersusI === 'ee' ? 'i' : 'ee');
  }
  // တ် / ပ် (တသတ် / ပသတ်) -> at / et (e.g. ကတ် = Kat / Ket, ကပ် = Kat, မြတ် = Myat)
  else if (finalConsonant === 'တ' || finalConsonant === 'ဋ' || finalConsonant === 'ပ') {
    englishRhyme = 'at';
    rhymeRule = 'တ် / ပ် -> at';
    detectedVowelPattern = 'တ်/ပ် (at)';
    rhymeAlts.push('et');
  }
  // န် / မ် (နသတ် / မသတ်) -> an / ant (e.g. ကန် = Kan, သန်း = Than, စန်း = San, ခန့် = Khant)
  else if (finalConsonant === 'န' || finalConsonant === 'ဏ' || finalConsonant === 'မ') {
    englishRhyme = norm.includes(MY_AUKMYIT) ? 'ant' : 'an';
    rhymeRule = 'န် / မ် -> an / ant';
    detectedVowelPattern = norm.includes(MY_AUKMYIT) ? 'န့်/မ့် (ant)' : 'န်/မ် (an)';
    if (norm.includes(MY_AUKMYIT)) rhymeAlts.push('an');
  }
  // ယ် (ယသတ်) -> ai / e (e.g. ကယ် = Kai / Ke, ကြယ် = Kyai, ငယ် = Nge, မယ် = Me / Mai)
  else if (finalConsonant === 'ယ') {
    englishRhyme = 'ai';
    rhymeRule = 'ယ် -> ai / e';
    detectedVowelPattern = 'ယ် (ai/e)';
    rhymeAlts.push('e', 'ay');
  }
  // Pure Vowels without Asat:
  // ေ-ာ / ေ-ာ် / -ော့ / -ော် -> aw (e.g. ကော = Kaw, ကျော် = Kyaw, ဇော် = Zaw, မော် = Maw)
  else if (norm.includes(MY_THAWEI) && (norm.includes(MY_YAYCHA) || norm.includes(MY_MAUKCHA) || norm.includes(MY_ASAT))) {
    englishRhyme = 'aw';
    rhymeRule = 'ေ-ာ / ေ-ာ် -> aw';
    detectedVowelPattern = 'ေ-ာ/ေ-ာ် (aw)';
    rhymeAlts.push('or');
  }
  // -ို / -ို့ / -ိုး (လုံးတင်ချောင်းငင်) -> o / oe / oh (e.g. ကို = Ko, စိုး = Soe, မိုး = Moe, ချို = Cho, မျိုး = Myoe)
  else if ((norm.includes(MY_LONDIN) && (norm.includes(MY_CHAUNG) || norm.includes(MY_HNACHAUNG))) || norm.includes('ို')) {
    const hasVisarga = norm.includes(MY_VISARGA);
    englishRhyme = hasVisarga ? 'oe' : 'o';
    rhymeRule = hasVisarga ? '-ိုး -> oe / o / oh' : '-ို -> o / oe / oh';
    detectedVowelPattern = hasVisarga ? '-ိုး (oe/o)' : '-ို (o/oe)';
    rhymeAlts.push(hasVisarga ? 'o' : 'oe', 'oh');
  }
  // ေ / ေ့ / ေး (သဝေထိုး) -> e / ay / aye (e.g. အေး = Aye, ကေ = Ke / Kay, ဆွေ = Swe, ရွှေ = Shwe)
  else if (norm.includes(MY_THAWEI)) {
    if (hasWa) {
      // In Burmese, wa + e is almost universally rendered as 'we' (e.g. Shwe, Swe, Kwe)
      englishRhyme = 'e';
      rhymeRule = 'ဝဆွဲ + ေ -> we';
      detectedVowelPattern = 'ဝဆွဲ + ေ (we)';
      rhymeAlts.push('ay', 'aye');
    } else {
      englishRhyme = config.vowelAYVersusE === 'ay' ? 'ay' : (config.vowelAYVersusE === 'aye' ? 'aye' : 'e');
      rhymeRule = 'ေ / ေး -> ay / e / aye';
      detectedVowelPattern = 'ေ/ေး (ay/e)';
      rhymeAlts.push('e', 'ay', 'aye');
    }
  }
  // ဲ / ဲ့ (နောက်ပစ်) -\u003e ai / e (e.g. ကဲ = Kai, ရဲ = Yai — ရဲ handled by explicit rule)
  else if (norm.includes(MY_NAUKPYIT)) {
    englishRhyme = 'ai';
    rhymeRule = 'ဲ -> ai / e';
    detectedVowelPattern = 'ဲ (ai/e)';
    rhymeAlts.push('e');
  }
  // ိ / ီ / ီး (လုံးကြီးတင် / ဆံခတ်) -> i / ee (e.g. ကိ = Ki, နီ = Ni / Nee, သီ = Thi, မီ = Mi)
  else if (norm.includes(MY_LONDIN) || norm.includes(MY_SANKHAT)) {
    englishRhyme = config.vowelEEVersusI === 'ee' ? 'ee' : 'i';
    rhymeRule = 'ိ / ီ -> i / ee';
    detectedVowelPattern = 'ိ/ီ (i/ee)';
    rhymeAlts.push(config.vowelEEVersusI === 'ee' ? 'i' : 'ee');
  }
  // ု / ူ / ူး (ချောင်းငင်) -> u / oo (e.g. ကု = Ku, မြူ = Myu, ဖူး = Phu / Phoo, သူ = Thu)
  else if (norm.includes(MY_CHAUNG) || norm.includes(MY_HNACHAUNG)) {
    englishRhyme = config.vowelOOVersusU === 'oo' ? 'oo' : 'u';
    rhymeRule = 'ု / ူ -> u / oo';
    detectedVowelPattern = 'ု/ူ (u/oo)';
    rhymeAlts.push(config.vowelOOVersusU === 'oo' ? 'u' : 'oo');
  }
  // ံ / ံ့ (သေးသေးတင်) -> an (e.g. ကံ = Kan, စံ = San)
  else if (norm.includes(MY_ANUSVARA)) {
    englishRhyme = norm.includes(MY_AUKMYIT) ? 'ant' : 'an';
    rhymeRule = 'ံ -> an';
    detectedVowelPattern = norm.includes(MY_AUKMYIT) ? 'ံ့ (ant)' : 'ံ (an)';
  }
  // ာ / ါ / ား / ါး (ရေးချ / မောက်ချ) -> a / ar (e.g. ကာ = Ka, မာ = Ma, ဝါ = Wa, သာ = Tha)
  else if (norm.includes(MY_YAYCHA) || norm.includes(MY_MAUKCHA)) {
    englishRhyme = 'a';
    rhymeRule = 'ာ / ါ -> a';
    detectedVowelPattern = 'ာ/ါ (a/ar)';
    rhymeAlts.push('ar');
  }
  // Inherent vowel (no overt sign e.g. က = Ka, မ = Ma, ပ = Pa, သ = Tha)
  else {
    englishRhyme = 'a';
    rhymeRule = 'သရ: အ (a)';
    detectedVowelPattern = 'အသံ (a)';
    rhymeAlts.push('ar');
  }

  breakdown.vowelPattern = detectedVowelPattern;

  // Combine Onset & Rhyme
  let combined = '';
  if (baseChar === 'အ') {
    // အ-based initial (starts with vowel sound)
    // Capitalize first vowel letter
    combined = englishRhyme;
  } else {
    combined = englishOnset + englishRhyme;
  }

  // Capitalize first letter
  if (combined.length > 0) {
    combined = combined.charAt(0).toUpperCase() + combined.slice(1).toLowerCase();
  }

  breakdown.recommendedEnglish = combined;
  breakdown.ruleApplied = `${onsetRule} + ${rhymeRule}`;

  // Build alternatives
  const altSet = new Set<string>();

  // Add combinations of onset alternatives and rhyme alternatives
  for (const altOnset of [englishOnset, ...onsetAlts]) {
    for (const altRhyme of [englishRhyme, ...rhymeAlts]) {
      let cand = baseChar === 'အ' ? altRhyme : altOnset + altRhyme;
      if (cand) {
        cand = cand.charAt(0).toUpperCase() + cand.slice(1).toLowerCase();
        if (cand !== combined) {
          altSet.add(cand);
        }
      }
    }
  }

  breakdown.alternativeEnglish = Array.from(altSet).slice(0, 4);

  // Ambiguity flag
  if (breakdown.alternativeEnglish.length > 1) {
    breakdown.isUncertain = true;
    breakdown.uncertaintyReason = `စာလုံးပေါင်း အခြားရွေးချယ်စရာများ ရှိသည် (${breakdown.alternativeEnglish.join(', ')})`;
    breakdown.confidence = 82;
  }

  return breakdown;
}

/**
 * Transliterates a complete Myanmar name, honoring dictionary matches,
 * religious joining conventions, prefixes, titles, and individual syllable breakdown.
 */
export function transliterateMyanmarName(
  input: string,
  dictionary: DictionaryEntry[] = [],
  config: RulePreferenceConfig = DEFAULT_RULE_CONFIG
): TransliterationResult {
  const normInput = normalizeMyanmarText(input);

  const result: TransliterationResult = {
    inputMyanmar: input,
    normalizedMyanmar: normInput,
    recommendedEnglish: '',
    alternativeEnglish: [],
    syllables: [],
    overallConfidence: 90,
    isExactDictionaryMatch: false,
    nameType: 'ORDINARY',
    explanation: '',
    warnings: []
  };

  if (!normInput) {
    result.explanation = 'ကျေးဇူးပြု၍ မြန်မာအမည် ရိုက်ထည့်ပါ';
    return result;
  }

  // 1. Check exact established irregular names first (e.g. ညောင်လေးပင်, မန္တလေး, ရေကျော်)
  if (IRREGULAR_ESTABLISHED_NAMES[normInput]) {
    const irreg = IRREGULAR_ESTABLISHED_NAMES[normInput];
    result.recommendedEnglish = irreg.english;
    result.alternativeEnglish = irreg.alternatives;
    result.overallConfidence = 100;
    result.isExactDictionaryMatch = true;
    result.nameType = irreg.category === 'GEOGRAPHIC' ? 'GEOGRAPHIC' : 'ORDINARY';
    result.explanation = `အသံထွက်နှင့် အစဉ်အလာအရ သတ်မှတ်ထားသော စံအမည်: ${irreg.notes}`;
    const rawSyllables = groupPaliConjunctSyllables(segmentMyanmarSyllables(normInput));
    result.syllables = rawSyllables.map(s => transliterateSyllable(s, config));
    return result;
  }

  // 2. Check exact verified dictionary match
  const dictMatch = dictionary.find(
    d => d.normalizedMyanmar === normInput || d.myanmarName.trim() === normInput
  );

  if (dictMatch) {
    result.recommendedEnglish = dictMatch.englishSpelling;
    result.alternativeEnglish = dictMatch.alternativeSpellings || [];
    result.overallConfidence = dictMatch.isVerified ? 100 : 92;
    result.isExactDictionaryMatch = true;
    result.matchedDictionaryEntry = dictMatch;
    result.nameType = dictMatch.category === 'RELIGIOUS' ? 'RELIGIOUS' : 'ORDINARY';
    result.explanation = dictMatch.isVerified
      ? 'အဘိဓာန်တွင် စံသတ်မှတ်ချက်ဖြင့် အတည်ပြုပြီးဖြစ်သော အမည်ဖြစ်ပါသည်'
      : 'အဘိဓာန်တွင် မှတ်တမ်းတင်ထားသော စာလုံးပေါင်းဖြစ်ပါသည်';

    const rawSyllables = groupPaliConjunctSyllables(segmentMyanmarSyllables(normInput));
    result.syllables = rawSyllables.map(s => transliterateSyllable(s, config));
    return result;
  }

  // 3. Segment all syllables first to prevent accidental prefix substring matching (e.g. မ consuming မိုင်း)
  const allSyllables = segmentMyanmarSyllables(normInput);

  // Sort prefix rules strictly by length descending (longest match first)
  const sortedPrefixRules = [...TITLE_PREFIX_RULES].sort(
    (a, b) => b.myanmar.length - a.myanmar.length
  );

  const detectedPrefixes: Array<{
    myanmar: string;
    english: string;
    alternatives?: string[];
    type: 'TITLE' | 'RELIGIOUS' | 'ROLE' | 'ETHNIC';
  }> = [];

  let remainingSyllables: string[] = [...allSyllables];

  // Extract 1 or more leading titles/prefixes in a loop (Compound Prefixes support e.g. ဒေါ်နန်း, ဦးစိုင်း)
  let matchedPrefixInLoop = true;
  while (matchedPrefixInLoop && remainingSyllables.length > 1) {
    matchedPrefixInLoop = false;
    for (const rule of sortedPrefixRules) {
      const ruleSyllables = segmentMyanmarSyllables(rule.myanmar);
      const ruleCount = ruleSyllables.length;

      if (remainingSyllables.length > ruleCount) {
        const candidatePrefixText = remainingSyllables.slice(0, ruleCount).join('');
        if (candidatePrefixText === rule.myanmar) {
          detectedPrefixes.push({
            myanmar: rule.myanmar,
            english: rule.english,
            alternatives: rule.alternatives || [],
            type: rule.type
          });
          remainingSyllables = remainingSyllables.slice(ruleCount);
          if (rule.isMonasticOrReligious) {
            result.nameType = 'RELIGIOUS';
          } else if (rule.isRoleOrOccupation) {
            result.nameType = 'ROLE_TITLED';
          }
          matchedPrefixInLoop = true;
          break;
        }
      }
    }
  }

  let detectedPrefix: TransliterationResult['detectedPrefix'] | undefined = undefined;
  if (detectedPrefixes.length > 0) {
    detectedPrefix = {
      myanmar: detectedPrefixes.map(p => p.myanmar).join(''),
      english: detectedPrefixes.map(p => p.english).join(' '),
      type: detectedPrefixes[0].type
    };
    result.detectedPrefix = detectedPrefix;
    result.detectedPrefixes = detectedPrefixes;
  }

  // 4. Check Known Ethnic & Contextual Name Patterns (e.g. မိုင်းအောင်သိန်း -> Mai Naing Aung Thein)
  if (detectedPrefixes.length > 0) {
    const primaryPrefix = detectedPrefixes[0].myanmar;
    const bodyText = remainingSyllables.join('');
    const matchedPattern = KNOWN_NAME_PATTERNS.find(
      p => p.prefixMyanmar === primaryPrefix && p.bodyMyanmar === bodyText
    );
    if (matchedPattern) {
      result.recommendedEnglish = matchedPattern.recommendedEnglish;
      result.alternativeEnglish = matchedPattern.alternativeEnglish;
      result.overallConfidence = 98;
      result.explanation = matchedPattern.description;
      const rawSyllables = groupPaliConjunctSyllables(remainingSyllables);
      result.syllables = [
        ...detectedPrefixes.map(p => transliterateSyllable(p.myanmar, config)),
        ...rawSyllables.map(s => transliterateSyllable(s, config))
      ];
      return result;
    }
  }

  // 4. Conjunct & Exception Matching: Group multi-syllable Pali conjunct words
  const conjunctResolvedSyllables = groupPaliConjunctSyllables(remainingSyllables);

  // 5. Syllable-by-Syllable Transliteration
  const breakdowns: SyllableBreakdown[] = [];
  const isReligious = result.nameType === 'RELIGIOUS';

  for (const syl of conjunctResolvedSyllables) {
    const b = transliterateSyllable(syl, config);
    breakdowns.push(b);
  }

  result.syllables = breakdowns;

  // 6. Assemble English Name Components
  // - Ordinary Personal Names: Capitalize each component and separate with spaces
  // - Religious Names: Capitalize first letter only and join remaining into one word
  let bodyEnglish = '';

  if (isReligious && config.religiousNameSingleWord && breakdowns.length > 1) {
    const first = breakdowns[0]?.recommendedEnglish || '';
    const rest = breakdowns.slice(1).map(b => b.recommendedEnglish.toLowerCase()).join('');
    bodyEnglish = first + rest;
    result.explanation = 'ဘုန်းကြီး/သီလရှင် ဘွဲ့တော်ဖြစ်၍ ပထမစာလုံးကိုသာ စာလုံးကြီးထားပြီး တဆက်တည်း စာလုံးပေါင်းထားပါသည်';
  } else {
    bodyEnglish = breakdowns.map(b => b.recommendedEnglish).filter(Boolean).join(' ');
    result.explanation = 'အသံထွက်စာလုံးတိုင်းကို စာလုံးကြီး (Capital Letter) ဖြင့်စ၍ စာလုံးခွဲ၍ ရေးသားထားပါသည်';
  }

  // Prepend title/prefix(es) if present
  let fullEnglish = '';
  if (detectedPrefixes.length > 0) {
    const prefixEn = detectedPrefixes.map(p => p.english).join(' ');
    fullEnglish = `${prefixEn} ${bodyEnglish}`.trim();
  } else {
    fullEnglish = bodyEnglish;
  }

  result.recommendedEnglish = fullEnglish;

  // 7. Calculate overall confidence and explain uncertainty
  if (breakdowns.length > 0) {
    const avgConfidence = Math.round(
      breakdowns.reduce((acc, curr) => acc + curr.confidence, 0) / breakdowns.length
    );
    result.overallConfidence = avgConfidence;
  }

  const alts: string[] = [];
  const uncertainSyllables = breakdowns.filter(b => b.isUncertain || b.alternativeEnglish.length > 0);

  // If this is a rule-based guess and not in official verified dictionary, mark as Requires Review
  if (!result.isExactDictionaryMatch) {
    result.warnings.push(
      'ပြန်လည်စစ်ဆေးရန် လိုအပ်သည် (ဤရလဒ်သည် စနစ်၏ စည်းမျဉ်းအရ အကြံပြုချက်သာဖြစ်ပြီး တရားဝင် စံသတ်မှတ်ချက် အတည်ပြုထားခြင်း မဟုတ်သေးပါ)'
    );
  }

  if (uncertainSyllables.length > 0) {
    const uncertainNoticeList = breakdowns.filter(b => b.isUncertain);
    if (uncertainNoticeList.length > 0) {
      result.warnings.push(
        `အောက်ပါ အက္ခရာများတွင် အခြားစာလုံးပေါင်း ရွေးချယ်နိုင်သည်: ${uncertainNoticeList.map(u => u.rawMyanmar).join(', ')}`
      );
    }

    const formatBody = (parts: string[]) => {
      if (isReligious && config.religiousNameSingleWord && parts.length > 1) {
        return (parts[0] || '') + parts.slice(1).map(s => s.toLowerCase()).join('');
      }
      return parts.join(' ');
    };

    const prefixEn = detectedPrefixes.map(p => p.english).join(' ');

    // 1. Single replacement alternatives (e.g. Kyaw Yai Aung)
    for (const unc of uncertainSyllables) {
      for (const altSyl of unc.alternativeEnglish) {
        const altBreakdowns = breakdowns.map(b =>
          b.rawMyanmar === unc.rawMyanmar ? altSyl : b.recommendedEnglish
        );
        const altBody = formatBody(altBreakdowns);
        const altFull = prefixEn ? `${prefixEn} ${altBody}`.trim() : altBody;
        if (altFull && altFull !== fullEnglish && !alts.includes(altFull)) {
          alts.push(altFull);
        }
      }
    }

    // 2. Uniform replacement across all instances (e.g. Htun Htun Kyaw -> Tun Tun Kyaw)
    if (uncertainSyllables.length > 1) {
      const allReplaced = breakdowns.map(b => (b.alternativeEnglish.length > 0 ? b.alternativeEnglish[0] : b.recommendedEnglish));
      const altBody = formatBody(allReplaced);
      const altFull = prefixEn ? `${prefixEn} ${altBody}`.trim() : altBody;
      if (altFull && altFull !== fullEnglish && !alts.includes(altFull)) {
        alts.push(altFull);
      }
    }
  }

  // 3. Prefix alternatives (e.g. Maung -> Mg, Nang -> Nan, Lwe -> Lway, Nai -> Naing)
  for (let pIdx = 0; pIdx < detectedPrefixes.length; pIdx++) {
    const pref = detectedPrefixes[pIdx];
    for (const altPref of pref.alternatives || []) {
      const prefList = detectedPrefixes.map((p, idx) => idx === pIdx ? altPref : p.english);
      const prefStr = prefList.join(' ');
      const altFull = `${prefStr} ${bodyEnglish}`.trim();
      if (altFull && altFull !== fullEnglish && !alts.includes(altFull)) {
        alts.push(altFull);
      }
    }
  }

  result.alternativeEnglish = alts.slice(0, 8);

  return result;
}
