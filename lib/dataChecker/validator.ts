import * as XLSX from 'xlsx';
import {
  ValidatedRow,
  ValidationSummaryStats,
  CheckerConfig,
  ColumnMappingConfig,
  ValidationErrorItem
} from './types';
import { validateTaangLandId, extractCleanIdDigits } from './rules/idValidation';
import { validateNameAndGender, DEFAULT_PREFIX_CONFIG } from './rules/prefixGenderValidation';
import { validateDateOfBirth, validateDateOfIssue, DEFAULT_DATE_CONFIG } from './rules/dateValidation';

export const DEFAULT_COLUMN_MAPPING: ColumnMappingConfig = {
  idColumn: "Ta'ang Land ID No.",
  nameColumn: 'Name',
  genderColumn: 'Gender',
  dobColumn: 'Date of Birth',
  doiColumn: 'Date of Issue'
};

export const DEFAULT_CHECKER_CONFIG: CheckerConfig = {
  prefixRules: DEFAULT_PREFIX_CONFIG,
  dateRules: DEFAULT_DATE_CONFIG,
  columnMapping: DEFAULT_COLUMN_MAPPING
};

/**
 * Automatically detects column names in an array of headers.
 */
export function autoDetectColumns(headers: string[]): ColumnMappingConfig {
  const mapping: ColumnMappingConfig = {
    idColumn: '',
    nameColumn: '',
    genderColumn: '',
    dobColumn: '',
    doiColumn: ''
  };

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  headers.forEach(h => {
    const c = clean(h);
    const originalTrimmed = h.trim();

    // 1. ID Column: Prefer exact "Ta'ang Land ID No."
    if (originalTrimmed === "Ta'ang Land ID No.") {
      mapping.idColumn = originalTrimmed;
    } else if (!mapping.idColumn) {
      if (c.includes('taanglandid') || c.includes('taangid') || c.includes('tlid') || c === 'idno' || c === 'id') {
        mapping.idColumn = originalTrimmed;
      }
    }

    // 2. Name Column
    if (!mapping.nameColumn) {
      if (c === 'name' || c === 'fullname' || c === 'personname' || h.includes('နာမည်') || c === 'person') {
        mapping.nameColumn = originalTrimmed;
      }
    }

    // 3. Gender Column
    if (!mapping.genderColumn) {
      if (c === 'gender' || c === 'sex' || h.includes('ကျား') || h.includes('မ')) {
        mapping.genderColumn = originalTrimmed;
      }
    }

    // 4. DOB Column
    if (!mapping.dobColumn) {
      if (
        c === 'dateofbirth' ||
        c === 'dob' ||
        c === 'birthdate' ||
        c === 'datebirth' ||
        h.includes('မွေးသက္ကရာဇ်')
      ) {
        mapping.dobColumn = originalTrimmed;
      }
    }

    // 5. DOI Column
    if (!mapping.doiColumn) {
      if (
        c === 'dateofissue' ||
        c === 'doi' ||
        c === 'issuedate' ||
        c === 'dateissued' ||
        h.includes('ထုတ်ပေးသည့်ရက်စွဲ')
      ) {
        mapping.doiColumn = originalTrimmed;
      }
    }
  });

  // Fallbacks if exact not found
  if (!mapping.idColumn) {
    mapping.idColumn = headers.find(h => h.toLowerCase().includes('id')) || headers[0] || "Ta'ang Land ID No.";
  }
  if (!mapping.nameColumn) {
    mapping.nameColumn = headers.find(h => h.toLowerCase().includes('name')) || headers[1] || 'Name';
  }
  if (!mapping.genderColumn) {
    mapping.genderColumn = headers.find(h => h.toLowerCase().includes('gender') || h.toLowerCase().includes('sex')) || headers[2] || 'Gender';
  }
  if (!mapping.dobColumn) {
    mapping.dobColumn = headers.find(h => h.toLowerCase().includes('birth') || h.toLowerCase().includes('dob')) || headers[3] || 'Date of Birth';
  }
  if (!mapping.doiColumn) {
    mapping.doiColumn = headers.find(h => h.toLowerCase().includes('issue') || h.toLowerCase().includes('doi')) || headers[4] || 'Date of Issue';
  }

  return mapping;
}

/**
 * Reads Excel or CSV file buffer preserving cell formatted strings (leading zeros).
 */
export async function parseFileToData(file: File): Promise<{
  headers: string[];
  rawRows: Record<string, any>[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  // cellDates: false prevents timezone offset corruption; raw: false keeps formatted string representation
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, raw: false });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    return { headers: [], rawRows: [] };
  }

  // Convert sheet to json array of objects
  const rawJson = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false // Ensures strings like '00123' keep leading zeros
  }) as any[][];

  if (!rawJson || rawJson.length === 0) {
    return { headers: [], rawRows: [] };
  }

  // Extract first row as headers
  const headerRow = rawJson[0] || [];
  const headers = headerRow
    .map(h => String(h || '').trim())
    .filter(Boolean);

  const rawRows: Record<string, any>[] = [];

  for (let r = 1; r < rawJson.length; r++) {
    const rowCells = rawJson[r];
    if (!rowCells || rowCells.every(c => c === '' || c === undefined || c === null)) {
      continue; // Skip entirely empty rows
    }

    const rowObj: Record<string, any> = {};
    headers.forEach((hdr, colIndex) => {
      const cellVal = rowCells[colIndex];
      rowObj[hdr] = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
    });
    rawRows.push(rowObj);
  }

  return { headers, rawRows };
}

/**
 * Validates a dataset against all business rules.
 */
export function validateDataset(
  rawRows: Record<string, any>[],
  config: CheckerConfig = DEFAULT_CHECKER_CONFIG,
  systemDate: Date = new Date()
): {
  rows: ValidatedRow[];
  summary: ValidationSummaryStats;
} {
  const { idColumn, nameColumn, genderColumn, dobColumn, doiColumn } = config.columnMapping;

  // Track ID occurrences to detect duplicates using normalized digits
  const idOccurrences = new Map<string, number[]>();
  rawRows.forEach((row, idx) => {
    const { cleanDigits } = extractCleanIdDigits(row[idColumn]);
    const idKey = cleanDigits || String(row[idColumn] || '').trim();
    if (idKey) {
      const list = idOccurrences.get(idKey) || [];
      list.push(idx);
      idOccurrences.set(idKey, list);
    }
  });

  const validatedRows: ValidatedRow[] = [];

  const summary: ValidationSummaryStats = {
    totalRecords: rawRows.length,
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
  };

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row index (1-based, row 1 is header)
    const rawId = row[idColumn];
    const rawName = row[nameColumn];
    const rawGender = row[genderColumn];
    const rawDob = row[dobColumn];
    const rawDoi = row[doiColumn];

    const errors: ValidationErrorItem[] = [];
    const warnings: ValidationErrorItem[] = [];

    // 1. Validate Ta'ang Land ID No. (handles "No -", digits check)
    const idValidation = validateTaangLandId(rawId);
    if (!idValidation.isValid) {
      errors.push(...idValidation.errors);
      summary.totalIdErrors++;
      if (idValidation.errors.some(e => e.code === 'MISSING_ID')) {
        summary.totalMissingValues++;
      }
    }

    // Check duplicate ID
    const effectiveId = idValidation.sanitizedId || extractCleanIdDigits(rawId).cleanDigits || String(rawId || '').trim();
    let isDuplicate = false;
    if (effectiveId && idOccurrences.has(effectiveId) && (idOccurrences.get(effectiveId)!.length > 1)) {
      isDuplicate = true;
      const dupRows = idOccurrences.get(effectiveId)!.map(i => i + 2);
      warnings.push({
        id: `DUP_${rowNumber}`,
        category: 'DUPLICATE_ROW',
        severity: 'WARNING',
        code: 'DUPLICATE_ID',
        field: "Ta'ang Land ID No.",
        message: `DUPLICATE_ID: Ta'ang Land ID No. appears ${dupRows.length} times (Rows: ${dupRows.join(', ')}).`,
        suggestedCorrection: 'Verify if duplicate row or distinct person.',
        value: effectiveId
      });
      summary.totalDuplicates++;
    }

    // 2. Validate Name Prefix and Gender
    const nameGenderVal = validateNameAndGender(rawName, rawGender, config.prefixRules);
    if (nameGenderVal.errors.length > 0) {
      errors.push(...nameGenderVal.errors);
      nameGenderVal.errors.forEach(e => {
        if (e.code === 'GENDER_MISMATCH' || e.code === 'INVALID_GENDER') {
          summary.totalGenderMismatches++;
        }
        if (e.code === 'MISSING_NAME' || e.code === 'MISSING_GENDER') {
          summary.totalMissingValues++;
        }
      });
    }
    if (nameGenderVal.warnings.length > 0) {
      warnings.push(...nameGenderVal.warnings);
      nameGenderVal.warnings.forEach(w => {
        if (w.code === 'UNRECOGNIZED_PREFIX') {
          summary.totalUnrecognizedPrefixes++;
        }
      });
    }

    // 3. Validate Date of Birth (DOB)
    const dobVal = validateDateOfBirth(rawDob, config.dateRules, systemDate);
    if (dobVal.errors.length > 0) {
      errors.push(...dobVal.errors);
      summary.totalDobErrors++;
      dobVal.errors.forEach(e => {
        if (e.code === 'MISSING_DOB') summary.dobMissingValues++;
        else if (e.code === 'FUTURE_DATE') summary.dobFutureDates++;
        else if (e.code === 'INVALID_DATE' || e.code === 'INVALID_LEAP_DAY' || e.code === 'INVALID_FORMAT') {
          summary.dobInvalidCalendar++;
        }
      });
    }
    if (dobVal.warnings.length > 0) {
      warnings.push(...dobVal.warnings);
      dobVal.warnings.forEach(w => {
        if (w.code === 'AMBIGUOUS_DATE') summary.dobAmbiguousFormats++;
      });
    }

    // 4. Validate Date of Issue (DOI)
    const doiVal = validateDateOfIssue(rawDoi, dobVal.result, config.dateRules, systemDate);
    if (doiVal.errors.length > 0) {
      errors.push(...doiVal.errors);
      summary.totalDoiErrors++;
      doiVal.errors.forEach(e => {
        if (e.code === 'MISSING_DOI') summary.doiMissingValues++;
        else if (e.code === 'FUTURE_ISSUE_DATE') summary.doiFutureDates++;
        else if (e.code === 'ISSUE_BEFORE_DOB') summary.doiBeforeDob++;
        else if (e.code === 'INVALID_DATE' || e.code === 'INVALID_LEAP_DAY' || e.code === 'INVALID_FORMAT') {
          summary.doiInvalidCalendar++;
        }
      });
    }
    if (doiVal.warnings.length > 0) {
      warnings.push(...doiVal.warnings);
      doiVal.warnings.forEach(w => {
        if (w.code === 'AMBIGUOUS_DATE') summary.doiAmbiguousFormats++;
      });
    }

    // Determine Overall Status
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    if (errors.length > 0) {
      status = 'FAIL';
      summary.recordsWithErrors++;
    } else if (warnings.length > 0) {
      status = 'WARNING';
      summary.recordsWithWarnings++;
    } else {
      status = 'PASS';
      summary.validRecords++;
    }

    validatedRows.push({
      rowNumber,
      originalData: row,
      rawId: String(rawId || ''),
      rawName: String(rawName || ''),
      rawGender: String(rawGender || ''),
      rawDob,
      rawDoi,

      matchedPrefix: nameGenderVal.matchedPrefix,
      expectedGender: nameGenderVal.expectedGender,
      actualGenderNormalized: nameGenderVal.actualGenderNormalized,
      dobResult: dobVal.result,
      doiResult: doiVal.result,

      status,
      errors,
      warnings,

      hasIdError: !idValidation.isValid,
      hasGenderMismatch: nameGenderVal.errors.some(e => e.code === 'GENDER_MISMATCH' || e.code === 'INVALID_GENDER'),
      hasUnrecognizedPrefix: nameGenderVal.warnings.some(w => w.code === 'UNRECOGNIZED_PREFIX'),
      hasMissingValue: errors.some(e => e.category === 'MISSING_VALUE'),
      hasDobError: dobVal.errors.length > 0,
      hasDoiError: doiVal.errors.length > 0,
      isDuplicate
    });
  });

  return {
    rows: validatedRows,
    summary
  };
}
