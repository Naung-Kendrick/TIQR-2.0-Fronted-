/**
 * Comprehensive Acceptance Test Suite for Myanmar–English Name Dictionary & Transliteration
 * Run via: npx tsx test_name_dictionary.ts
 */

import { transliterateMyanmarName, transliterateSyllable } from './lib/nameDictionary/transliterationEngine';
import { reverseLookupEnglishName } from './lib/nameDictionary/reverseLookup';
import { INITIAL_DICTIONARY_ENTRIES } from './lib/nameDictionary/initialDictionary';
import { DEFAULT_RULE_CONFIG } from './lib/nameDictionary/rules';
import { checkDictionaryConflicts } from './lib/nameDictionary/dictionaryStorage';

console.log('================================================================');
console.log('  TESTING: MYANMAR–ENGLISH NAME DICTIONARY & TRANSLITERATION   ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testTitle: string, detail?: any) {
  if (condition) {
    console.log(`[PASS] ${testTitle}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testTitle}`, detail ? JSON.stringify(detail) : '');
    failCount++;
  }
}

// -------------------------------------------------------------
// GROUP 1: Reference Names & Examples (Regression Tests)
// -------------------------------------------------------------
console.log('\n--- Group 1: Reference Names & Examples (Regression Tests) ---');

// Specific Regression: အောင်မြင့်မြတ် -> Aung Myint Myat (Syllable-Aware Parsing)
const testAungMyintMyat = transliterateMyanmarName('အောင်မြင့်မြတ်', []);
assert(testAungMyintMyat.recommendedEnglish === 'Aung Myint Myat', '0. အောင်မြင့်မြတ် -> Aung Myint Myat (Rule & Syllable engine without dict)', testAungMyintMyat);
assert(testAungMyintMyat.syllables.length === 3, '0-syl. အောင်မြင့်မြတ် segmented into exactly 3 syllables (not 4)', testAungMyintMyat.syllables.map(s => s.rawMyanmar));
assert(transliterateSyllable('မြင့်').recommendedEnglish === 'Myint', '0-myint. Syllable မြင့် -> Myint');
assert(transliterateSyllable('မြတ်').recommendedEnglish === 'Myat', '0-myat. Syllable မြတ် -> Myat');
assert(transliterateSyllable('အောင်').recommendedEnglish === 'Aung', '0-aung. Syllable အောင် -> Aung');

// Specific Regression: ထွန်းထွန်းကျော် -> Htun Htun Kyaw (with alt Tun Tun Kyaw)
const testTunTunKyaw = transliterateMyanmarName('ထွန်းထွန်းကျော်', []);
assert(testTunTunKyaw.recommendedEnglish === 'Htun Htun Kyaw' || testTunTunKyaw.recommendedEnglish === 'Tun Tun Kyaw', '0-tun. ထွန်းထွန်းကျော် -> Htun Htun Kyaw / Tun Tun Kyaw', testTunTunKyaw);
assert(testTunTunKyaw.syllables.length === 3, '0-tun-syl. ထွန်းထွန်းကျော် segmented into exactly 3 syllables', testTunTunKyaw.syllables.map(s => s.rawMyanmar));
assert(transliterateSyllable('ကျော်').recommendedEnglish === 'Kyaw', '0-kyaw. Syllable ကျော် -> Kyaw');

// Specific Regression: အိန္ဒြာကျော်ဇင် -> Eindra Kyaw Zin (Pali Stacked Consonant / စာလုံးဆင့်)
const testEindraDict = transliterateMyanmarName('အိန္ဒြာကျော်ဇင်', INITIAL_DICTIONARY_ENTRIES);
assert(testEindraDict.recommendedEnglish === 'Eindra Kyaw Zin', '0-eindra-dict. အိန္ဒြာကျော်ဇင် -> Eindra Kyaw Zin (Dict match)', testEindraDict);
assert(testEindraDict.alternativeEnglish.includes('Indra Kyaw Zin'), '0-eindra-alt. အိန္ဒြာကျော်ဇင် has alt Indra Kyaw Zin', testEindraDict);

const testEindraEngine = transliterateMyanmarName('အိန္ဒြာကျော်ဇင်', []);
assert(testEindraEngine.recommendedEnglish === 'Eindra Kyaw Zin', '0-eindra-engine. အိန္ဒြာကျော်ဇင် -> Eindra Kyaw Zin (Engine without dict)', testEindraEngine);
assert(testEindraEngine.syllables.length === 3, '0-eindra-syl. အိန္ဒြာကျော်ဇင် segmented into 3 syllables [အိန္ဒြာ, ကျော်, ဇင်]', testEindraEngine.syllables.map(s => s.rawMyanmar));

const testEindraSyllable = transliterateSyllable('အိန္ဒြာ');
assert(testEindraSyllable.recommendedEnglish === 'Eindra', '0-syl-eindra. Syllable အိန္ဒြာ -> Eindra', testEindraSyllable);
assert(testEindraSyllable.alternativeEnglish.includes('Indra'), '0-syl-indra. Syllable အိန္ဒြာ includes alternative Indra', testEindraSyllable);

assert(transliterateSyllable('စန္ဒာ').recommendedEnglish === 'Sandar', '0-sanda. Syllable စန္ဒာ -> Sandar');
assert(transliterateSyllable('စန္ဒာ').alternativeEnglish.includes('Sanda'), '0-sanda-alt. Syllable စန္ဒာ has alt Sanda');
assert(transliterateSyllable('စန္ဒီ').recommendedEnglish === 'Sandi', '0-sandi. Syllable စန္ဒီ -> Sandi');
assert(transliterateSyllable('သန္တာ').recommendedEnglish === 'Thandar', '0-thandar. Syllable သန္တာ -> Thandar');
assert(transliterateSyllable('မေတ္တာ').recommendedEnglish === 'Metta', '0-metta. Syllable မေတ္တာ -> Metta');
assert(transliterateSyllable('သုန္ဒရ').recommendedEnglish === 'Thundara', '0-thundara. Syllable သုန္ဒရ -> Thundara');
assert(transliterateSyllable('သိင်္ဂီ').recommendedEnglish === 'Theingi', '0-theingi. Syllable သိင်္ဂီ -> Theingi');
assert(transliterateSyllable('အင်္ဂါ').recommendedEnglish === 'Inga', '0-inga. Syllable အင်္ဂါ -> Inga');
assert(transliterateSyllable('မင်္ဂလာ').recommendedEnglish === 'Mingalar', '0-mingalar. Syllable မင်္ဂလာ -> Mingalar');
assert(transliterateSyllable('ဥက္ကာ').recommendedEnglish === 'Okkar', '0-okkar. Syllable ဥက္ကာ -> Okkar');
assert(transliterateSyllable('ဝဏ္ဏ').recommendedEnglish === 'Wunna', '0-wunna. Syllable ဝဏ္ဏ -> Wunna');
assert(transliterateSyllable('ဘုန်း').recommendedEnglish === 'Phone', '0-phone. Syllable ဘုန်း -> Phone');
assert(transliterateSyllable('ဘုန်း').alternativeEnglish.includes('Bhone'), '0-phone-alt. Syllable ဘုန်း has alt Bhone');

const test0 = transliterateMyanmarName('မိုင်းအောင်သိန်း', INITIAL_DICTIONARY_ENTRIES);
assert(test0.recommendedEnglish === 'Mai Naing Aung Thein', '0a. မိုင်းအောင်သိန်း -> Mai Naing Aung Thein (Verified match)', test0);

const test0b = transliterateMyanmarName('မိုင်းအောင်သိန်း', []);
assert(test0b.recommendedEnglish === 'Mai Naing Aung Thein', '0b. မိုင်းအောင်သိန်း -> Mai Naing Aung Thein (Rule & Pattern engine without dict)', test0b);

const test0c = transliterateMyanmarName('မိုင်းစော', []);
assert(test0c.recommendedEnglish.startsWith('Mai') && !test0c.recommendedEnglish.startsWith('Ma Ngaing'), '0c. မိုင်းစော -> starts with Mai (Prefix မိုင်း never broken into Ma Ngaing)', test0c);

const test1 = transliterateMyanmarName('မအေး', INITIAL_DICTIONARY_ENTRIES);
assert(test1.recommendedEnglish === 'Ma Aye', '1. မအေး -> Ma Aye', test1);

const test1b = transliterateMyanmarName('မအေး', []);
assert(test1b.recommendedEnglish === 'Ma Aye', '1b. မအေး -> Ma Aye (Rule engine without dict)', test1b);

const test2 = transliterateMyanmarName('ဦးအေးမောင်', INITIAL_DICTIONARY_ENTRIES);
assert(test2.recommendedEnglish === 'U Aye Maung', '2. ဦးအေးမောင် -> U Aye Maung', test2);

const test2b = transliterateMyanmarName('ဦးအေးမောင်', []);
assert(test2b.recommendedEnglish === 'U Aye Maung', '2b. ဦးအေးမောင် -> U Aye Maung (Rule engine without dict)', test2b);

const test3 = transliterateMyanmarName('ဒေါ်မြကြည်', INITIAL_DICTIONARY_ENTRIES);
assert(test3.recommendedEnglish === 'Daw Mya Kyi', '3. ဒေါ်မြကြည် -> Daw Mya Kyi', test3);

const test4 = transliterateMyanmarName('မသန်းလှိုင်', INITIAL_DICTIONARY_ENTRIES);
assert(test4.recommendedEnglish === 'Ma Than Hlaing', '4. မသန်းလှိုင် -> Ma Than Hlaing', test4);

const test5 = transliterateMyanmarName('မောင်သောင်းလွင်', INITIAL_DICTIONARY_ENTRIES);
assert(test5.recommendedEnglish === 'Maung Thaung Lwin', '5. မောင်သောင်းလွင် -> Maung Thaung Lwin', test5);

const test6 = transliterateMyanmarName('မတင်ရီ', INITIAL_DICTIONARY_ENTRIES);
assert(test6.recommendedEnglish === 'Ma Tin Yee', '6. မတင်ရီ -> Ma Tin Yee', test6);

const test7 = transliterateMyanmarName('ခင်စိုးမြင့်', INITIAL_DICTIONARY_ENTRIES);
assert(test7.recommendedEnglish === 'Khin Soe Myint', '7. ခင်စိုးမြင့် -> Khin Soe Myint', test7);

const test8 = transliterateMyanmarName('မခင်', INITIAL_DICTIONARY_ENTRIES);
assert(test8.recommendedEnglish === 'Ma Kin' || test8.alternativeEnglish.includes('Ma Kin'), '8. မခင် -> Ma Kin (allowed alt for Khin)', test8);

const test9 = transliterateMyanmarName('မောင်ထင်', INITIAL_DICTIONARY_ENTRIES);
assert(test9.recommendedEnglish === 'Mg Tin' || test9.alternativeEnglish.includes('Mg Tin'), '9. မောင်ထင် -> Mg Tin (allowed alt for Htin)', test9);

const test10 = transliterateMyanmarName('ဦးဖေ', INITIAL_DICTIONARY_ENTRIES);
assert(test10.recommendedEnglish === 'U Pe' || test10.alternativeEnglish.includes('U Pe'), '10. ဦးဖေ -> U Pe (allowed alt for Phe)', test10);

// -------------------------------------------------------------
// GROUP 2: CRITICAL EXCEPTIONS
// -------------------------------------------------------------
console.log('\n--- Group 2: Critical Exceptions ---');

// Exception A: ချ, ခြ must NOT be Khy, but Ch
const sCho = transliterateSyllable('ချို');
assert(sCho.recommendedEnglish === 'Cho' && !sCho.recommendedEnglish.startsWith('Khy'), '11. Exception ချ: ချို -> Cho (Khy မဟုတ်)', sCho);

const sChan = transliterateSyllable('ချမ်း');
assert(sChan.recommendedEnglish === 'Chan' && !sChan.recommendedEnglish.startsWith('Khy'), '12. Exception ချ: ချမ်း -> Chan (Khy မဟုတ်)', sChan);

const sChu = transliterateSyllable('ခြူး');
assert(sChu.recommendedEnglish === 'Chu' && !sChu.recommendedEnglish.startsWith('Khy'), '13. Exception ခြ: ခြူး -> Chu (Khy မဟုတ်)', sChu);

// Exception B: ရှ, ယှ must NOT be Hy or Hr, but Sh
const sShwe = transliterateSyllable('ရွှေ');
assert(sShwe.recommendedEnglish === 'Shwe' && !sShwe.recommendedEnglish.startsWith('Hr'), '14. Exception ရှ: ရွှေ -> Shwe (Hr မဟုတ်)', sShwe);

const sShin = transliterateSyllable('ရှင်း');
assert(sShin.recommendedEnglish === 'Shin' && !sShin.recommendedEnglish.startsWith('Hr'), '15. Exception ရှ: ရှင်း -> Shin (Hr မဟုတ်)', sShin);

const sShan = transliterateSyllable('ရှမ်း');
assert(sShan.recommendedEnglish === 'Shan' && !sShan.recommendedEnglish.startsWith('Hr'), '16. Exception ရှ: ရှမ်း -> Shan (Hr မဟုတ်)', sShan);

// Exception C: ဝဆွဲ + နသတ် must be un (e.g. ထွန်း -> Tun, Twan ဟုမရေးရ!)
const sTun = transliterateSyllable('ထွန်း', { ...DEFAULT_RULE_CONFIG, htVersusT: 'T' });
assert(sTun.recommendedEnglish === 'Tun' && !sTun.recommendedEnglish.includes('wan'), '17. Exception ဝဆွဲ+နသတ်: ထွန်း -> Tun (Twan မဟုတ်)', sTun);

// Exception D: ဝဆွဲ + တသတ် must be ut (e.g. ထွတ် -> Htut / Kut, Twat ဟုမရေးရ!)
const sHtut = transliterateSyllable('ထွတ်');
assert(sHtut.recommendedEnglish === 'Htut' && !sHtut.recommendedEnglish.includes('wat'), '18. Exception ဝဆွဲ+တသတ်: ထွတ် -> Htut (Twat မဟုတ်)', sHtut);

// -------------------------------------------------------------
// GROUP 3: Consonant Combinations (၆ မျိုး)
// -------------------------------------------------------------
console.log('\n--- Group 3: Consonant Combinations (၆ မျိုး) ---');

// 1. Y combinations
assert(transliterateSyllable('ကျာ').recommendedEnglish === 'Kya', '19. Y-Medial: ကျာ -> Kya');
assert(transliterateSyllable('ပြား').recommendedEnglish === 'Pya', '20. Y-Medial: ပြား -> Pya');
assert(transliterateSyllable('မြ').recommendedEnglish === 'Mya', '21. Y-Medial: မြ -> Mya');

// 2. W combinations
assert(transliterateSyllable('ကွာ').recommendedEnglish === 'Kwa', '22. W-Medial: ကွာ -> Kwa');
assert(transliterateSyllable('လွတ်').recommendedEnglish === 'Lut', '23. W-Medial: လွတ် -> Lut');
assert(transliterateSyllable('စွန်း').recommendedEnglish === 'Sun', '24. W-Medial: စွန်း -> Sun');

// 3. H-prefixed combinations
assert(transliterateSyllable('ငှက်').recommendedEnglish === 'Hnget', '25. H-prefixed: ငှက် -> Hnget');
assert(transliterateSyllable('နှင်း').recommendedEnglish === 'Hnin', '26. H-prefixed: နှင်း -> Hnin');
assert(transliterateSyllable('မှန်').recommendedEnglish === 'Hman', '27. H-prefixed: မှန် -> Hman');

// 4. YW combinations
assert(transliterateSyllable('ကျွန်း').recommendedEnglish === 'Kyun', '28. YW-Medial: ကျွန်း -> Kyun');
assert(transliterateSyllable('ကြွက်').recommendedEnglish === 'Kywet', '29. YW-Medial: ကြွက် -> Kywet');

// 5. HY combinations
assert(transliterateSyllable('မျှော်').recommendedEnglish === 'Hmyaw', '30. HY-Medial: မျှော် -> Hmyaw');
assert(transliterateSyllable('လျှံ').recommendedEnglish === 'Hlyan', '31. HY-Medial: လျှံ -> Hlyan');

// 6. HW combinations
assert(transliterateSyllable('လွှ').recommendedEnglish === 'Hlwa', '32. HW-Medial: လွှ -> Hlwa');
assert(transliterateSyllable('မွှေး').recommendedEnglish.startsWith('Hmw'), '33. HW-Medial: မွှေး -> Hmway/Hmwe');

// -------------------------------------------------------------
// GROUP 4: Religious / Monastic Naming Conventions
// -------------------------------------------------------------
console.log('\n--- Group 4: Religious / Monastic Naming Conventions ---');

const rel1 = transliterateMyanmarName('အရှင်သုမန', INITIAL_DICTIONARY_ENTRIES);
assert(rel1.recommendedEnglish === 'Ashin Thumana', '34. Monastic: အရှင်သုမန -> Ashin Thumana (single word joined)', rel1);

const rel2 = transliterateMyanmarName('ဦးခေမိန္ဒ', INITIAL_DICTIONARY_ENTRIES);
assert(rel2.recommendedEnglish === 'U Khemeinda', '35. Monastic: ဦးခေမိန္ဒ -> U Khemeinda', rel2);

const rel3 = transliterateMyanmarName('ရှင်သောဘဏ', INITIAL_DICTIONARY_ENTRIES);
assert(rel3.recommendedEnglish === 'Shin Thawbana', '36. Monastic: ရှင်သောဘဏ -> Shin Thawbana', rel3);

const rel4 = transliterateMyanmarName('ကိုရင်ဇဝန', INITIAL_DICTIONARY_ENTRIES);
assert(rel4.recommendedEnglish === 'Koyin Zawana', '37. Monastic: ကိုရင်ဇဝန -> Koyin Zawana', rel4);

const rel5 = transliterateMyanmarName('ဒေါ်သီလစာရီ', INITIAL_DICTIONARY_ENTRIES);
assert(rel5.recommendedEnglish === 'Daw Thilasari', '38. Monastic (Nun): ဒေါ်သီလစာရီ -> Daw Thilasari', rel5);

// -------------------------------------------------------------
// GROUP 5: Role & Occupational Titles
// -------------------------------------------------------------
console.log('\n--- Group 5: Role & Occupational Titles ---');

const role1 = transliterateMyanmarName('ဆရာမ မတင်ရီ', INITIAL_DICTIONARY_ENTRIES);
assert(role1.recommendedEnglish === 'Sayama Ma Tin Yee', '39. Role Title: ဆရာမ မတင်ရီ -> Sayama Ma Tin Yee', role1);

const role2 = transliterateMyanmarName('ဗိုလ်ချုပ်အောင်ဆန်း', INITIAL_DICTIONARY_ENTRIES);
assert(role2.recommendedEnglish === 'Bogyoke Aung San', '40. Role Title: ဗိုလ်ချုပ်အောင်ဆန်း -> Bogyoke Aung San', role2);

// -------------------------------------------------------------
// GROUP 6: Established Geographical & Pronunciation Names
// -------------------------------------------------------------
console.log('\n--- Group 6: Established Geographical & Pronunciation Names ---');

const geo1 = transliterateMyanmarName('ညောင်လေးပင်', INITIAL_DICTIONARY_ENTRIES);
assert(geo1.recommendedEnglish === 'Nyaunglebin', '41. Established: ညောင်လေးပင် -> Nyaunglebin', geo1);

const geo2 = transliterateMyanmarName('မန္တလေး', INITIAL_DICTIONARY_ENTRIES);
assert(geo2.recommendedEnglish === 'Mandalay', '42. Established: မန္တလေး -> Mandalay', geo2);

const geo3 = transliterateMyanmarName('ရေကျော်', INITIAL_DICTIONARY_ENTRIES);
assert(geo3.recommendedEnglish === 'Yegyaw', '43. Established: ရေကျော် -> Yegyaw', geo3);

// -------------------------------------------------------------
// GROUP 7: Reverse English to Myanmar Lookup
// -------------------------------------------------------------
console.log('\n--- Group 7: Reverse English to Myanmar Lookup ---');

const rev1 = reverseLookupEnglishName('Ma Aye', INITIAL_DICTIONARY_ENTRIES);
assert(rev1.exactMatches.some(m => m.myanmarName === 'မအေး'), '44. Reverse: Ma Aye -> မအေး found in exact matches', rev1);

const rev2 = reverseLookupEnglishName('U Aye Maung', INITIAL_DICTIONARY_ENTRIES);
assert(rev2.exactMatches.some(m => m.myanmarName === 'ဦးအေးမောင်'), '45. Reverse: U Aye Maung -> ဦးအေးမောင် found in exact matches', rev2);

const rev3 = reverseLookupEnglishName('Daw Mya Kyi', INITIAL_DICTIONARY_ENTRIES);
assert(rev3.exactMatches.some(m => m.myanmarName === 'ဒေါ်မြကြည်'), '46. Reverse: Daw Mya Kyi -> ဒေါ်မြကြည် found in exact matches', rev3);

// -------------------------------------------------------------
// GROUP 8: Conflict & Duplicate Detection
// -------------------------------------------------------------
console.log('\n--- Group 8: Conflict & Duplicate Detection ---');

const dupCheck1 = checkDictionaryConflicts('မအေး', 'Ma Aye', undefined, INITIAL_DICTIONARY_ENTRIES);
assert(dupCheck1.hasDuplicateExact, '47. Exact Duplicate detected for မအေး (Ma Aye)', dupCheck1);

const dupCheck2 = checkDictionaryConflicts('မအေး', 'Ma E', undefined, INITIAL_DICTIONARY_ENTRIES);
assert(dupCheck2.hasSpellingConflict && !dupCheck2.hasDuplicateExact, '48. Spelling Conflict flagged for မအေး with new spelling "Ma E"', dupCheck2);

// -------------------------------------------------------------
// GROUP 9: Required Verification Test Suite (Specification Section 6)
// -------------------------------------------------------------
console.log('\n--- Group 9: Required Verification Test Suite (Specification Section 6) ---');

// 1. အိန္ဒြာကျော်ဇင် -> Eindra Kyaw Zin
const t1 = transliterateMyanmarName('အိန္ဒြာကျော်ဇင်', []);
assert(t1.recommendedEnglish === 'Eindra Kyaw Zin', 'Req 1. အိန္ဒြာကျော်ဇင် -> Eindra Kyaw Zin', t1);

// 2. မိုင်းအောင်သိန်း -> Mai Naing Aung Thein (via dictionary) or Mai Aung Thein (via prefix + syllable rules)
const t2Dict = transliterateMyanmarName('မိုင်းအောင်သိန်း', INITIAL_DICTIONARY_ENTRIES);
assert(t2Dict.recommendedEnglish === 'Mai Naing Aung Thein', 'Req 2a. မိုင်းအောင်သိန်း -> Mai Naing Aung Thein (via dictionary)', t2Dict);
const t2Engine = transliterateMyanmarName('မိုင်းအောင်သိန်း', []);
assert(t2Engine.recommendedEnglish === 'Mai Naing Aung Thein' || t2Engine.recommendedEnglish === 'Mai Aung Thein', 'Req 2b. မိုင်းအောင်သိန်း -> Mai Naing Aung Thein / Mai Aung Thein (via rules)', t2Engine);

// 3. စန္ဒာမိုး -> Sandar Moe (or Sanda Moe)
const t3 = transliterateMyanmarName('စန္ဒာမိုး', []);
assert(t3.recommendedEnglish === 'Sandar Moe' || t3.recommendedEnglish === 'Sanda Moe', 'Req 3. စန္ဒာမိုး -> Sandar Moe / Sanda Moe', t3);

// 4. သိင်္ဂီကျော် -> Theingi Kyaw
const t4 = transliterateMyanmarName('သိင်္ဂီကျော်', []);
assert(t4.recommendedEnglish === 'Theingi Kyaw', 'Req 4. သိင်္ဂီကျော် -> Theingi Kyaw', t4);

// 5. စိုင်းခမ်းလိတ် -> Sai Kham Leik
const t5 = transliterateMyanmarName('စိုင်းခမ်းလိတ်', []);
assert(t5.recommendedEnglish === 'Sai Kham Leik', 'Req 5. စိုင်းခမ်းလိတ် -> Sai Kham Leik', t5);

// 6. မသန်းလှိုင် -> Ma Than Hlaing
const t6 = transliterateMyanmarName('မသန်းလှိုင်', []);
assert(t6.recommendedEnglish === 'Ma Than Hlaing', 'Req 6. မသန်းလှိုင် -> Ma Than Hlaing', t6);

// 7. ဦးအေးမောင် -> U Aye Maung
const t7 = transliterateMyanmarName('ဦးအေးမောင်', []);
assert(t7.recommendedEnglish === 'U Aye Maung', 'Req 7. ဦးအေးမောင် -> U Aye Maung', t7);

// 8. ဒေါ်မြကြည် -> Daw Mya Kyi
const t8 = transliterateMyanmarName('ဒေါ်မြကြည်', []);
assert(t8.recommendedEnglish === 'Daw Mya Kyi', 'Req 8. ဒေါ်မြကြည် -> Daw Mya Kyi', t8);

// 9. ရွှေစင်မျိုး -> Shwe Sin Myoe (alt: Shwe Sin Myo)
const t9 = transliterateMyanmarName('ရွှေစင်မျိုး', []);
assert(t9.recommendedEnglish === 'Shwe Sin Myoe' || t9.recommendedEnglish === 'Shwe Sin Myo', 'Req 9. ရွှေစင်မျိုး -> Shwe Sin Myoe / Shwe Sin Myo', t9);
assert(t9.alternativeEnglish.includes('Shwe Sin Myo') || t9.alternativeEnglish.includes('Shwe Sin Myoe'), 'Req 9 alt. Shwe Sin Myo / Myoe', t9);

// 10. ထွန်းလွင် -> Htun Lwin
const t10 = transliterateMyanmarName('ထွန်းလွင်', []);
assert(t10.recommendedEnglish === 'Htun Lwin', 'Req 10. ထွန်းလွင် -> Htun Lwin', t10);

// Compound Prefixes (Specification Section 3)
const tCompound1 = transliterateMyanmarName('ဒေါ်နန်းမြကြည်', []);
assert(tCompound1.recommendedEnglish === 'Daw Nang Mya Kyi', 'Req 11. Compound Prefix: ဒေါ်နန်းမြကြည် -> Daw Nang Mya Kyi', tCompound1);

const tCompound2 = transliterateMyanmarName('ဦးစိုင်းခမ်း', []);
assert(tCompound2.recommendedEnglish === 'U Sai Kham', 'Req 12. Compound Prefix: ဦးစိုင်းခမ်း -> U Sai Kham', tCompound2);

// Standalone Vowels & Words (Specification Section 1)
const tAyeYar = transliterateMyanmarName('ဧရာ', []);
assert(tAyeYar.recommendedEnglish === 'Ayeyar', 'Req 13. Standalone Vowel: ဧရာ -> Ayeyar', tAyeYar);

const tAwBar = transliterateMyanmarName('ဩဘာ', []);
assert(tAwBar.recommendedEnglish === 'Awbar', 'Req 14. Standalone Vowel: ဩဘာ -> Awbar', tAwBar);

const tMandalay = transliterateMyanmarName('မန္တလေး', []);
assert(tMandalay.recommendedEnglish === 'Mandalay', 'Req 15. Pali Conjunct: မန္တလေး -> Mandalay', tMandalay);

const tMingalar = transliterateMyanmarName('မင်္ဂလာ', []);
assert(tMingalar.recommendedEnglish === 'Mingalar', 'Req 16. Pali Conjunct: မင်္ဂလာ -> Mingalar', tMingalar);

const tMetta = transliterateMyanmarName('မေတ္တာ', []);
assert(tMetta.recommendedEnglish === 'Metta', 'Req 17. Pali Conjunct: မေတ္တာ -> Metta', tMetta);

const tWunna = transliterateMyanmarName('ဝဏ္ဏ', []);
assert(tWunna.recommendedEnglish === 'Wunna', 'Req 18. Pali Conjunct: ဝဏ္ဏ -> Wunna', tWunna);

// -------------------------------------------------------------
// GROUP 10: 4-Tier Real-World Syllable-Level Dictionary Engine Tests
// -------------------------------------------------------------
console.log('\n--- Group 10: 4-Tier Real-World Syllable-Level Dictionary Engine Tests ---');

// Compounds
assert(transliterateSyllable('အိန္ဒြေ').recommendedEnglish === 'Eindray', 'Tier 2: အိန္ဒြေ -> Eindray');
assert(transliterateSyllable('နန္ဒာ').recommendedEnglish === 'Nandar', 'Tier 2: နန္ဒာ -> Nandar');
assert(transliterateSyllable('နန္ဒ').recommendedEnglish === 'Nanda', 'Tier 2: နန္ဒ -> Nanda');
assert(transliterateSyllable('ရတနာ').recommendedEnglish === 'Yadanar', 'Tier 2: ရတနာ -> Yadanar');
assert(transliterateSyllable('သီရိ').recommendedEnglish === 'Thiri', 'Tier 2: သီရိ -> Thiri');
assert(transliterateSyllable('သူရ').recommendedEnglish === 'Thura', 'Tier 2: သူရ -> Thura');
assert(transliterateSyllable('သုတ').recommendedEnglish === 'Thuta', 'Tier 2: သုတ -> Thuta');
assert(transliterateSyllable('ကဉ္စနာ').recommendedEnglish === 'Kincana', 'Tier 2: ကဉ္စနာ -> Kincana');
assert(transliterateSyllable('ဇာနည်').recommendedEnglish === 'Zarni', 'Tier 2: ဇာနည် -> Zarni');
assert(transliterateSyllable('သစ္စာ').recommendedEnglish === 'Thitsar', 'Tier 2: သစ္စာ -> Thitsar');
assert(transliterateSyllable('ပညာ').recommendedEnglish === 'Pyinnyar', 'Tier 2: ပညာ -> Pyinnyar');
assert(transliterateSyllable('စကြာ').recommendedEnglish === 'Sakya', 'Tier 2: စကြာ -> Sakya');

// Syllable Map Lookups
assert(transliterateSyllable('ရဲ').recommendedEnglish === 'Ye', 'Tier 3: ရဲ -> Ye');
assert(transliterateSyllable('ရဲ').alternativeEnglish.includes('Yai'), 'Tier 3: ရဲ alt Yai');
assert(transliterateSyllable('ဘုန်း').recommendedEnglish === 'Phone', 'Tier 3: ဘုန်း -> Phone');
assert(transliterateSyllable('ဘုန်း').alternativeEnglish.includes('Bhone'), 'Tier 3: ဘုန်း alt Bhone');
assert(transliterateSyllable('အေး').recommendedEnglish === 'Aye', 'Tier 3: အေး -> Aye');
assert(transliterateSyllable('လဲ့').recommendedEnglish === 'Le', 'Tier 3: လဲ့ -> Le');
assert(transliterateSyllable('ကြွယ်').recommendedEnglish === 'Kywe', 'Tier 3: ကြွယ် -> Kywe');
assert(transliterateSyllable('ခမ်း').recommendedEnglish === 'Kham', 'Tier 3: ခမ်း -> Kham');
assert(transliterateSyllable('ဆွေ').recommendedEnglish === 'Swe', 'Tier 3: ဆွေ -> Swe');

// Prefixes and Names
const tYadanar = transliterateMyanmarName('ဒေါ်ရတနာသီရိ', []);
assert(tYadanar.recommendedEnglish === 'Daw Yadanar Thiri', 'Tier 2 & 3 Name: ဒေါ်ရတနာသီရိ -> Daw Yadanar Thiri', tYadanar);

const tTarMai = transliterateMyanmarName('တာမိုင်းအောင်', []);
assert(tTarMai.recommendedEnglish === 'Tar Mai Aung', 'Tier 2 Prefix: တာမိုင်းအောင် -> Tar Mai Aung', tTarMai);

const tYarLwe = transliterateMyanmarName('ယာလွေးမြ', []);
assert(tYarLwe.recommendedEnglish === 'Yar Lway Mya', 'Tier 2 Prefix: ယာလွေးမြ -> Yar Lway Mya', tYarLwe);
assert(tYarLwe.alternativeEnglish.includes('Yar Lwe Mya'), 'Tier 2 Prefix: ယာလွေးမြ has alt Yar Lwe Mya', tYarLwe);

const tMgAlt = transliterateMyanmarName('မောင်သောင်းလွင်', []);
assert(tMgAlt.alternativeEnglish.includes('Mg Thaung Lwin'), 'Prefix alt: မောင်သောင်းလွင် has alt Mg Thaung Lwin', tMgAlt.alternativeEnglish);

// -------------------------------------------------------------
// GROUP 11: Ethnic Kachin, Kayah & Ta'ang Bidirectional Tests
// -------------------------------------------------------------
console.log("\n--- Group 11: Ethnic Kachin, Kayah & Ta'ang Bidirectional Tests ---");

// Ta'ang syllables
assert(transliterateSyllable('လွေး').recommendedEnglish === 'Lway', "Ta'ang: လွေး -> Lway");
assert(transliterateSyllable('လွေး').alternativeEnglish.includes('Lwe'), "Ta'ang: လွေး has alt Lwe");
assert(transliterateSyllable('တာ').recommendedEnglish === 'Tar', "Ta'ang: တာ -> Tar");
assert(transliterateSyllable('တာ').alternativeEnglish.includes('Ta'), "Ta'ang: တာ has alt Ta");
assert(transliterateSyllable('တား').recommendedEnglish === 'Tar', "Ta'ang: တား -> Tar");
assert(transliterateSyllable('တား').alternativeEnglish.includes('Ta'), "Ta'ang: တား has alt Ta");

// J / Gy (ဂျ) Syllables
assert(transliterateSyllable('ဂျာ').recommendedEnglish === 'Jar', 'J-Syllable: ဂျာ -> Jar');
assert(transliterateSyllable('ဂျာ').alternativeEnglish.includes('Ja'), 'J-Syllable: ဂျာ has alt Ja');
assert(transliterateSyllable('ဂျာ').alternativeEnglish.includes('Gyar'), 'J-Syllable: ဂျာ has alt Gyar');
assert(transliterateSyllable('ဂျား').recommendedEnglish === 'Jar', 'J-Syllable: ဂျား -> Jar');
assert(transliterateSyllable('ဂျူး').recommendedEnglish === 'Ju', 'J-Syllable: ဂျူး -> Ju');
assert(transliterateSyllable('ဂျွန်').recommendedEnglish === 'John', 'J-Syllable: ဂျွန် -> John');
assert(transliterateSyllable('ဂျေ').recommendedEnglish === 'J', 'J-Syllable: ဂျေ -> J');
assert(transliterateSyllable('ဂျီ').recommendedEnglish === 'Ji', 'J-Syllable: ဂျီ -> Ji');
assert(transliterateSyllable('ခူး').recommendedEnglish === 'Khu', 'Kayah: ခူး -> Khu');
assert(transliterateSyllable('ခူး').alternativeEnglish.includes('Khue'), 'Kayah: ခူး has alt Khue');
assert(transliterateSyllable('ခူ').recommendedEnglish === 'Khu', 'Kayah: ခူ -> Khu');

// MM -> EN Personal Names
const tKhuJar = transliterateMyanmarName('ခူးဂျာ', []);
assert(tKhuJar.recommendedEnglish === 'Khu Jar', 'MM -> EN: ခူးဂျာ -> Khu Jar', tKhuJar);
assert(tKhuJar.alternativeEnglish.includes('Khu Ja'), 'MM -> EN: ခူးဂျာ has alt Khu Ja', tKhuJar);

const tLaphaiJarSeng = transliterateMyanmarName('လဖိုင်ဂျာဆိုင်း', []);
assert(tLaphaiJarSeng.recommendedEnglish === 'Laphai Jar Seng', 'MM -> EN: လဖိုင်ဂျာဆိုင်း -> Laphai Jar Seng', tLaphaiJarSeng);

// EN -> MM Bidirectional Reverse Lookup
const revKhuJar = reverseLookupEnglishName('Khu Jar', []);
assert(revKhuJar.probableMatches.length > 0, 'EN -> MM: Khu Jar returns matches');
assert(revKhuJar.probableMatches[0].myanmarName === 'ခူးဂျာ', 'EN -> MM: Khu Jar primary match is ခူးဂျာ', revKhuJar.probableMatches);
assert(revKhuJar.probableMatches.some(m => m.myanmarName === 'ခူဂျာ'), 'EN -> MM: Khu Jar includes alternative ခူဂျာ', revKhuJar.probableMatches);

const revKhawnJar = reverseLookupEnglishName('Khawn Jar', []);
assert(revKhawnJar.probableMatches.some(m => m.myanmarName === 'ခေါန်ဂျာ'), 'EN -> MM: Khawn Jar matches ခေါန်ဂျာ', revKhawnJar.probableMatches);

const revCyrillicKhawnJar = reverseLookupEnglishName('хkawn Jar', []);
assert(revCyrillicKhawnJar.probableMatches.some(m => m.myanmarName === 'ခေါန်ဂျာ'), 'EN -> MM: хkawn Jar (cyrillic) matches ခေါန်ဂျာ', revCyrillicKhawnJar.probableMatches);

// Syllable Mapping: မျိူး (Myoe) vs မျို (Myo)
assert(transliterateSyllable('မျိုး').recommendedEnglish === 'Myoe', 'Syllable: မျိုး -> Myoe');
assert(transliterateSyllable('မျိုး').alternativeEnglish.includes('Myo'), 'Syllable: မျိုး has alt Myo');
assert(transliterateSyllable('မျိူး').recommendedEnglish === 'Myoe', 'Syllable (typo): မျိူး -> Myoe');
assert(transliterateSyllable('မျိူး').alternativeEnglish.includes('Myo'), 'Syllable (typo): မျိူး has alt Myo');
assert(transliterateSyllable('မျို').recommendedEnglish === 'Myo', 'Syllable: မျို -> Myo');
assert(transliterateSyllable('မျို').alternativeEnglish.includes('Myoe'), 'Syllable: မျို has alt Myoe');

// Full names: နေမျိုး / နေမျိူး -> Nay Myoe
const tNayMyoe = transliterateMyanmarName('နေမျိုး', []);
assert(tNayMyoe.recommendedEnglish === 'Nay Myoe', 'Name: နေမျိုး -> Nay Myoe', tNayMyoe);
assert(tNayMyoe.alternativeEnglish.includes('Nay Myo'), 'Name: နေမျိုး has alt Nay Myo', tNayMyoe);

const tNayMyoeTypo = transliterateMyanmarName('နေမျိူး', []);
assert(tNayMyoeTypo.recommendedEnglish === 'Nay Myoe', 'Name (typo): နေမျိူး -> Nay Myoe', tNayMyoeTypo);
assert(tNayMyoeTypo.alternativeEnglish.includes('Nay Myo'), 'Name (typo): နေမျိူး has alt Nay Myo', tNayMyoeTypo);

const tNayMyo = transliterateMyanmarName('နေမျို', []);
assert(tNayMyo.recommendedEnglish === 'Nay Myo', 'Name: နေမျို -> Nay Myo', tNayMyo);
assert(tNayMyo.alternativeEnglish.includes('Nay Myoe'), 'Name: နေမျို has alt Nay Myoe', tNayMyo);

console.log('\n================================================================');
console.log(`  RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
