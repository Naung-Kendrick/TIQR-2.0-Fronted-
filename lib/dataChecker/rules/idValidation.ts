import { ValidationErrorItem } from '../types';

export interface IdValidationResult {
  isValid: boolean;
  errors: ValidationErrorItem[];
  sanitizedId: string;
}

/**
 * Normalizes an ID value by removing standard ID prefixes (like "No -", "No.-", "ID No -", "No.", etc.)
 * and removing cosmetic formatting spaces/dashes between digits.
 */
export function extractCleanIdDigits(rawVal: any): { stripped: string; cleanDigits: string } {
  if (rawVal === undefined || rawVal === null) {
    return { stripped: '', cleanDigits: '' };
  }

  const str = String(rawVal).trim();
  if (!str) return { stripped: '', cleanDigits: '' };

  // Match and strip standard ID prefixes:
  // e.g. "No -", "No - ", "No-", "No.-", "No.", "No ", "NO -", "ID No -", "ID No.", "ID -", "TL ID -", "နံပါတ် -", "အမှတ် -"
  const prefixRegex = /^(?:(?:ID|TL|TL-ID)\s*[-–—.:/]?\s*)?(?:(?:No|NO|no|နံပါတ်|အမှတ်)\s*[-–—.:/]?\s*|ID\s*[-–—.:/]\s*)/i;
  const stripped = str.replace(prefixRegex, '').trim();

  // Remove harmless formatting separators between digits: spaces, dashes (- – —), dots, slashes
  const cleanDigits = stripped.replace(/[\s\-–—./]/g, '');

  return { stripped, cleanDigits };
}

/**
 * Validates Ta'ang Land ID No.:
 * - "No -" means "ID NO"; strips common prefix labels automatically.
 * - Extracts and counts the numeric digits.
 * - Must contain exactly 19 numeric digits (0-9).
 * - Flag values containing fewer or more than 19 digits, letters, special chars, or empty.
 * - Detects Excel scientific notation conversions.
 */
export function validateTaangLandId(rawVal: any): IdValidationResult {
  const errors: ValidationErrorItem[] = [];

  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    errors.push({
      id: 'ID_EMPTY',
      category: 'MISSING_VALUE',
      severity: 'ERROR',
      code: 'MISSING_ID',
      field: "Ta'ang Land ID No.",
      message: "Ta'ang Land ID No. is missing or empty.",
      suggestedCorrection: 'Enter a valid 19-digit Ta\'ang Land ID No.',
      value: rawVal
    });
    return { isValid: false, errors, sanitizedId: '' };
  }

  const str = String(rawVal).trim();

  // Check for Excel scientific notation (e.g. 1.2345678901234567e+18)
  if (/[eE][+-]?\d+/.test(str)) {
    errors.push({
      id: 'ID_SCIENTIFIC',
      category: 'ID_ERROR',
      severity: 'ERROR',
      code: 'SCIENTIFIC_NOTATION_DETECTED',
      field: "Ta'ang Land ID No.",
      message: `ID "${str}" was converted into scientific notation by Excel, causing precision loss. Format the column as Text in Excel.`,
      suggestedCorrection: 'Re-export Excel with column formatted as Plain Text.',
      value: str
    });
    return { isValid: false, errors, sanitizedId: str };
  }

  // Extract clean digits after recognizing "No -" and other standard ID prefixes
  const { stripped, cleanDigits } = extractCleanIdDigits(str);

  if (!stripped || !cleanDigits) {
    errors.push({
      id: 'ID_EMPTY',
      category: 'MISSING_VALUE',
      severity: 'ERROR',
      code: 'MISSING_ID',
      field: "Ta'ang Land ID No.",
      message: "Ta'ang Land ID No. contains only prefix label with no digits.",
      suggestedCorrection: 'Enter a valid 19-digit Ta\'ang Land ID No.',
      value: rawVal
    });
    return { isValid: false, errors, sanitizedId: '' };
  }

  // Check for non-numeric characters inside the digit sequence (letters, special symbols)
  if (/[^0-9]/.test(cleanDigits)) {
    const nonDigitChars = cleanDigits.replace(/[0-9]/g, '');
    errors.push({
      id: 'ID_NON_NUMERIC',
      category: 'ID_ERROR',
      severity: 'ERROR',
      code: 'INVALID_ID_CHARS',
      field: "Ta'ang Land ID No.",
      message: `ID contains non-numeric characters (${JSON.stringify(nonDigitChars)}). Only digits 0–9 are accepted.`,
      suggestedCorrection: 'Remove all non-numeric letters and special characters.',
      value: str
    });
    return { isValid: false, errors, sanitizedId: cleanDigits };
  }

  // Check digit count: must be exactly 19 digits
  const digitCount = cleanDigits.length;
  if (digitCount !== 19) {
    errors.push({
      id: 'ID_INVALID_LENGTH',
      category: 'ID_ERROR',
      severity: 'ERROR',
      code: 'Id must 19 digits',
      field: "Ta'ang Land ID No.",
      message: `ID contains ${digitCount} digits (expected exactly 19 digits).`,
      suggestedCorrection: digitCount < 19
        ? `Value has ${digitCount} digit(s) (short by ${19 - digitCount}). Verify missing digits.`
        : `Value has ${digitCount} digit(s) (${digitCount - 19} extra digit(s)). Remove surplus digits.`,
      value: str
    });
    return { isValid: false, errors, sanitizedId: cleanDigits };
  }

  // Exactly 19 digits -> Valid!
  return {
    isValid: true,
    errors: [],
    sanitizedId: cleanDigits
  };
}
