/**
 * Myanmar–English Name Dictionary & Transliteration System
 * Storage, Administration, Audit Logging, and Import/Export Engine
 */

import * as XLSX from 'xlsx';
import {
  DictionaryEntry,
  AuditLogEntry,
  RulePreferenceConfig,
  BatchNameRecord
} from './types';
import { INITIAL_DICTIONARY_ENTRIES } from './initialDictionary';
import { DEFAULT_RULE_CONFIG } from './rules';
import { normalizeMyanmarText, transliterateMyanmarName } from './transliterationEngine';

const DICTIONARY_STORAGE_KEY = 'tiqr_name_dictionary_v1';
const AUDIT_LOG_STORAGE_KEY = 'tiqr_name_dictionary_audit_v1';
const RULE_CONFIG_STORAGE_KEY = 'tiqr_name_translit_rules_v1';

/**
 * Loads the active dictionary from localStorage, initializing with defaults if empty.
 */
export function loadDictionary(): DictionaryEntry[] {
  try {
    const raw = localStorage.getItem(DICTIONARY_STORAGE_KEY);
    if (!raw) {
      // First-time setup: initialize with verified reference entries
      saveDictionary(INITIAL_DICTIONARY_ENTRIES);
      return INITIAL_DICTIONARY_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load dictionary from storage:', err);
  }
  return INITIAL_DICTIONARY_ENTRIES;
}

/**
 * Saves dictionary entries to localStorage.
 */
export function saveDictionary(entries: DictionaryEntry[]): void {
  try {
    localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save dictionary to storage:', err);
  }
}

/**
 * Loads the rule preferences from localStorage.
 */
export function loadRuleConfig(): RulePreferenceConfig {
  try {
    const raw = localStorage.getItem(RULE_CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_RULE_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load rule configuration:', err);
  }
  return DEFAULT_RULE_CONFIG;
}

/**
 * Saves rule preferences to localStorage.
 */
export function saveRuleConfig(config: RulePreferenceConfig): void {
  try {
    localStorage.setItem(RULE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save rule configuration:', err);
  }
}

/**
 * Loads audit log entries.
 */
export function loadAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  }
  return [];
}

/**
 * Appends an audit log entry.
 */
export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  try {
    const logs = loadAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep max 500 audit logs
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to append audit log:', err);
  }
}

/**
 * Checks for conflicts or duplicates when adding/updating an entry.
 */
export interface ConflictCheckResult {
  hasDuplicateExact: boolean;
  hasSpellingConflict: boolean;
  conflictingEntries: DictionaryEntry[];
  message?: string;
}

export function checkDictionaryConflicts(
  myanmarName: string,
  englishSpelling: string,
  currentEntryId?: string,
  dictionary: DictionaryEntry[] = loadDictionary()
): ConflictCheckResult {
  const normMy = normalizeMyanmarText(myanmarName);
  const normEng = englishSpelling.trim().toLowerCase();

  const matchingMyanmar = dictionary.filter(
    d => d.id !== currentEntryId && (d.normalizedMyanmar === normMy || d.myanmarName.trim() === normMy)
  );

  if (matchingMyanmar.length === 0) {
    return { hasDuplicateExact: false, hasSpellingConflict: false, conflictingEntries: [] };
  }

  // Exact duplicate (same Myanmar and same English)
  const exactDup = matchingMyanmar.some(d => d.englishSpelling.trim().toLowerCase() === normEng);
  if (exactDup) {
    return {
      hasDuplicateExact: true,
      hasSpellingConflict: false,
      conflictingEntries: matchingMyanmar,
      message: `"${myanmarName}" သည် "${englishSpelling}" ဖြင့် အဘိဓာန်တွင် ရှိပြီးသား ဖြစ်သည်`
    };
  }

  // Spelling conflict (same Myanmar, but different English spelling)
  return {
    hasDuplicateExact: false,
    hasSpellingConflict: true,
    conflictingEntries: matchingMyanmar,
    message: `"${myanmarName}" အတွက် အခြားစာလုံးပေါင်း "${matchingMyanmar.map(m => m.englishSpelling).join(', ')}" ရှိပြီးဖြစ်သည်။ အခြားစာလုံးပေါင်း (Alternative Spelling) အဖြစ် ထည့်သွင်းရန် သင့်တော်သည်`
  };
}

/**
 * Adds or updates a dictionary entry with verification and audit log.
 */
export function upsertDictionaryEntry(
  entryData: Partial<DictionaryEntry> & { myanmarName: string; englishSpelling: string },
  userName: string = 'Staff'
): { success: boolean; entry: DictionaryEntry; error?: string } {
  const dict = loadDictionary();
  const normMy = normalizeMyanmarText(entryData.myanmarName);

  if (!normMy || !entryData.englishSpelling.trim()) {
    return { success: false, entry: {} as any, error: 'မြန်မာအမည်နှင့် အင်္ဂလိပ်စာလုံးပေါင်း မဖြစ်မနေ ထည့်ရပါမည်' };
  }

  const existingIdx = dict.findIndex(
    d => (entryData.id && d.id === entryData.id) || d.normalizedMyanmar === normMy
  );

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    // Update existing
    const prev = dict[existingIdx];
    const updated: DictionaryEntry = {
      ...prev,
      ...entryData,
      myanmarName: entryData.myanmarName.trim(),
      normalizedMyanmar: normMy,
      englishSpelling: entryData.englishSpelling.trim(),
      alternativeSpellings: entryData.alternativeSpellings || prev.alternativeSpellings || [],
      updatedAt: now
    };

    dict[existingIdx] = updated;
    saveDictionary(dict);

    addAuditLog({
      action: 'UPDATE',
      entryId: updated.id,
      entryName: updated.myanmarName,
      performedBy: userName,
      previousValue: prev,
      newValue: updated,
      reason: 'အဘိဓာန် အချက်အလက် မွမ်းမံခြင်း'
    });

    return { success: true, entry: updated };
  } else {
    // Insert new
    const newEntry: DictionaryEntry = {
      id: entryData.id || `dict-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      myanmarName: entryData.myanmarName.trim(),
      normalizedMyanmar: normMy,
      englishSpelling: entryData.englishSpelling.trim(),
      alternativeSpellings: entryData.alternativeSpellings || [],
      prefix: entryData.prefix,
      category: entryData.category || 'PERSONAL',
      syllableBreakdown: entryData.syllableBreakdown || [],
      transliterationRulesUsed: entryData.transliterationRulesUsed || ['Manual Verified Entry'],
      referenceSource: entryData.referenceSource || 'Immigration Staff Entry',
      isVerified: entryData.isVerified ?? true,
      verifiedBy: entryData.verifiedBy || userName,
      verifiedDate: entryData.verifiedDate || now.split('T')[0],
      notes: entryData.notes,
      createdAt: now,
      updatedAt: now
    };

    dict.unshift(newEntry);
    saveDictionary(dict);

    addAuditLog({
      action: 'CREATE',
      entryId: newEntry.id,
      entryName: newEntry.myanmarName,
      performedBy: userName,
      newValue: newEntry,
      reason: 'အဘိဓာန် အသစ် ထည့်သွင်းခြင်း'
    });

    return { success: true, entry: newEntry };
  }
}

/**
 * Toggles or sets verification status for an entry.
 */
export function setEntryVerification(
  entryId: string,
  isVerified: boolean,
  userName: string = 'Staff'
): boolean {
  const dict = loadDictionary();
  const entry = dict.find(d => d.id === entryId);
  if (!entry) return false;

  const prevVerified = entry.isVerified;
  entry.isVerified = isVerified;
  entry.verifiedBy = userName;
  entry.verifiedDate = new Date().toISOString().split('T')[0];
  entry.updatedAt = new Date().toISOString();

  saveDictionary(dict);

  addAuditLog({
    action: 'VERIFY',
    entryId: entry.id,
    entryName: entry.myanmarName,
    performedBy: userName,
    previousValue: { isVerified: prevVerified },
    newValue: { isVerified: isVerified },
    reason: isVerified ? 'စံသတ်မှတ်ချက်ဖြင့် အတည်ပြုခြင်း' : 'စစ်ဆေးရန်လိုအပ်သဖြင့် အတည်ပြုချက် ဖယ်ရှားခြင်း'
  });

  return true;
}

/**
 * Deletes a dictionary entry.
 */
export function deleteDictionaryEntry(entryId: string, userName: string = 'Staff'): boolean {
  const dict = loadDictionary();
  const idx = dict.findIndex(d => d.id === entryId);
  if (idx === -1) return false;

  const removed = dict.splice(idx, 1)[0];
  saveDictionary(dict);

  addAuditLog({
    action: 'DELETE',
    entryId: removed.id,
    entryName: removed.myanmarName,
    performedBy: userName,
    previousValue: removed,
    reason: 'အဘိဓာန် မှတ်တမ်း ဖျက်ပစ်ခြင်း'
  });

  return true;
}

/**
 * Exports current dictionary to Excel (.xlsx) file.
 */
export function exportDictionaryToExcel(dictionary: DictionaryEntry[] = loadDictionary()): void {
  const rows = dictionary.map((d, index) => ({
    'စဉ် (No)': index + 1,
    'မြန်မာအမည် (Myanmar Name)': d.myanmarName,
    'အင်္ဂလိပ်စာလုံးပေါင်း (English Spelling)': d.englishSpelling,
    'အခြားစာလုံးပေါင်း (Alternatives)': (d.alternativeSpellings || []).join('; '),
    'ရှေ့ဆက်ဘွဲ့/ရာထူး (Prefix)': d.prefix || '-',
    'အမျိုးအစား (Category)': d.category,
    'စံအတည်ပြုမှု (Verified)': d.isVerified ? 'အတည်ပြုပြီး (Verified)' : 'စစ်ဆေးဆဲ (Unverified)',
    'အတည်ပြုသူ (Verified By)': d.verifiedBy || '-',
    'ရည်ညွှန်းကိုးကား (Reference)': d.referenceSource || '-',
    'မှတ်ချက် (Notes)': d.notes || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Name Dictionary');

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 8 },  // No
    { wch: 22 }, // Myanmar Name
    { wch: 22 }, // English Spelling
    { wch: 25 }, // Alternatives
    { wch: 15 }, // Prefix
    { wch: 18 }, // Category
    { wch: 20 }, // Verified
    { wch: 18 }, // Verified By
    { wch: 25 }, // Reference
    { wch: 25 }  // Notes
  ];

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Myanmar_English_Name_Dictionary_${dateStr}.xlsx`);
}

/**
 * Imports dictionary entries from an Excel or CSV file.
 */
export async function importDictionaryFromFile(
  file: File,
  userName: string = 'Staff'
): Promise<{ added: number; updated: number; conflicts: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          return resolve({ added: 0, updated: 0, conflicts: 0, errors: ['ဖိုင်အတွင်း အချက်အလက် မရှိပါ'] });
        }

        let added = 0;
        let updated = 0;
        let conflicts = 0;
        const errors: string[] = [];

        const dict = loadDictionary();

        for (const row of rawJson) {
          // Identify columns flexibly
          const myanmar = (
            row['မြန်မာအမည်'] ||
            row['မြန်မာအမည် (Myanmar Name)'] ||
            row['Myanmar Name'] ||
            row['Name'] ||
            row['myanmarName'] ||
            ''
          ).toString().trim();

          const english = (
            row['အင်္ဂလိပ်စာလုံးပေါင်း'] ||
            row['အင်္ဂလိပ်စာလုံးပေါင်း (English Spelling)'] ||
            row['English Spelling'] ||
            row['English'] ||
            row['englishSpelling'] ||
            ''
          ).toString().trim();

          if (!myanmar || !english) {
            continue;
          }

          const altsRaw = (
            row['အခြားစာလုံးပေါင်း'] ||
            row['အခြားစာလုံးပေါင်း (Alternatives)'] ||
            row['Alternatives'] ||
            row['alternativeSpellings'] ||
            ''
          ).toString().trim();

          const alts = altsRaw ? altsRaw.split(/[;,|]/).map((s: string) => s.trim()).filter(Boolean) : [];
          const prefix = (row['ရှေ့ဆက်ဘွဲ့/ရာထူး (Prefix)'] || row['Prefix'] || '').toString().trim() || undefined;
          const notes = (row['မှတ်ချက်'] || row['မှတ်ချက် (Notes)'] || row['Notes'] || '').toString().trim() || undefined;

          const conflictCheck = checkDictionaryConflicts(myanmar, english, undefined, dict);
          if (conflictCheck.hasSpellingConflict) {
            conflicts++;
          }

          const res = upsertDictionaryEntry(
            {
              myanmarName: myanmar,
              englishSpelling: english,
              alternativeSpellings: alts,
              prefix,
              notes,
              referenceSource: `Imported from ${file.name}`
            },
            userName
          );

          if (res.success) {
            if (res.entry.createdAt === res.entry.updatedAt) {
              added++;
            } else {
              updated++;
            }
          } else if (res.error) {
            errors.push(`${myanmar}: ${res.error}`);
          }
        }

        addAuditLog({
          action: 'BATCH_IMPORT',
          performedBy: userName,
          newValue: { fileName: file.name, added, updated, conflicts },
          reason: `Excel/CSV မှ အမည်ပေါင်း ${added + updated} ခု တင်သွင်းခြင်း`
        });

        resolve({ added, updated, conflicts, errors });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Batch transliteration of a spreadsheet containing Myanmar names.
 */
export async function batchTransliterateFile(
  file: File,
  dictionary: DictionaryEntry[] = loadDictionary(),
  config: RulePreferenceConfig = loadRuleConfig()
): Promise<{ headers: string[]; records: BatchNameRecord[]; detectedNameColumn: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawJson.length === 0) {
          return resolve({ headers: [], records: [], detectedNameColumn: '' });
        }

        const headers = Object.keys(rawJson[0]);

        // Auto-detect Myanmar name column
        let detectedCol = headers.find(h =>
          /အမည်|နာမည်|name|myanmar/i.test(h)
        ) || headers[0];

        const records: BatchNameRecord[] = [];

        rawJson.forEach((row, idx) => {
          const rawName = String(row[detectedCol] || '').trim();
          if (!rawName) return;

          const res = transliterateMyanmarName(rawName, dictionary, config);

          let status: BatchNameRecord['status'] = 'RULE_CONVERTED';
          if (res.isExactDictionaryMatch) {
            status = 'EXACT_MATCH';
          } else if (res.overallConfidence < 85 || res.warnings.length > 0) {
            status = 'NEEDS_REVIEW';
          }

          records.push({
            id: `batch-${idx}-${Date.now()}`,
            originalMyanmar: rawName,
            originalEnglish: row['အင်္ဂလိပ်'] || row['English'] || undefined,
            convertedEnglish: res.recommendedEnglish,
            alternativeSpellings: res.alternativeEnglish,
            confidence: res.overallConfidence,
            status,
            notes: res.warnings.join('; ')
          });
        });

        resolve({ headers, records, detectedNameColumn: detectedCol });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
