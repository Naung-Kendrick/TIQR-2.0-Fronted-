import { ValidationErrorItem, PrefixRuleConfig } from '../types';

export const DEFAULT_PREFIX_CONFIG: PrefixRuleConfig = {
  malePrefixes: ['Mg', 'KO', 'Tar', 'U', 'Mai', 'Sai'],
  femalePrefixes: ['Daw', 'Ma', 'Lway', 'Yar', 'Nang']
};

export interface PrefixGenderValidationResult {
  isValid: boolean;
  matchedPrefix?: string;
  expectedGender?: 'M' | 'F';
  actualGenderNormalized?: 'M' | 'F' | 'OTHER';
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
}

/**
 * Normalizes gender value to 'M', 'F', or 'OTHER'
 */
export function normalizeGender(val: any): { normalized: 'M' | 'F' | 'OTHER'; raw: string } {
  if (val === undefined || val === null) {
    return { normalized: 'OTHER', raw: '' };
  }
  const str = String(val).trim();
  const lower = str.toLowerCase();

  if (lower === 'm' || lower === 'male' || lower === 'ကျား') {
    return { normalized: 'M', raw: str };
  }
  if (lower === 'f' || lower === 'female' || lower === 'မ') {
    return { normalized: 'F', raw: str };
  }
  return { normalized: 'OTHER', raw: str };
}

/**
 * Escapes regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Identifies the name prefix using strict word/token boundary rules.
 * Sorts prefixes descending by length to ensure 'Mai' matches before 'Ma'.
 */
export function detectNamePrefix(
  name: string,
  config: PrefixRuleConfig
): { prefix: string; gender: 'M' | 'F' } | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  // Build sorted list of all configured prefixes (longer prefixes first)
  const candidates: { prefix: string; gender: 'M' | 'F' }[] = [
    ...config.malePrefixes.map(p => ({ prefix: p, gender: 'M' as const })),
    ...config.femalePrefixes.map(p => ({ prefix: p, gender: 'F' as const }))
  ].sort((a, b) => b.prefix.length - a.prefix.length);

  for (const candidate of candidates) {
    const escaped = escapeRegex(candidate.prefix);
    // Boundary check: prefix must be at start, followed by whitespace, punctuation, or end of string.
    // This prevents "Martin" or "May" from matching "Ma", "Target" from matching "Tar", "Uncle" from matching "U", etc.
    const regex = new RegExp(`^${escaped}(?=[\\s.\\-_/(),:]|$)`, 'i');
    if (regex.test(trimmed)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Validates Name and Gender according to Rule 2:
 * - Case-insensitive prefix detection with strict boundary rules.
 * - Detects gender mismatch.
 * - Flags missing name or gender.
 * - Flags unrecognized prefix without guessing gender.
 */
export function validateNameAndGender(
  rawName: any,
  rawGender: any,
  config: PrefixRuleConfig = DEFAULT_PREFIX_CONFIG
): PrefixGenderValidationResult {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];

  const nameStr = rawName !== undefined && rawName !== null ? String(rawName).trim() : '';
  const genderInfo = normalizeGender(rawGender);

  // 1. Check Missing Name
  if (!nameStr) {
    errors.push({
      id: 'MISSING_NAME',
      category: 'MISSING_VALUE',
      severity: 'ERROR',
      code: 'MISSING_NAME',
      field: 'Name',
      message: 'Person name is missing or empty.',
      suggestedCorrection: 'Enter the person\'s full legal name.',
      value: rawName
    });
  }

  // 2. Check Missing Gender
  if (!genderInfo.raw) {
    errors.push({
      id: 'MISSING_GENDER',
      category: 'MISSING_VALUE',
      severity: 'ERROR',
      code: 'MISSING_GENDER',
      field: 'Gender',
      message: 'Gender value is missing or empty.',
      suggestedCorrection: 'Enter Gender as "M" (Male) or "F" (Female).',
      value: rawGender
    });
  }

  // If name is missing, we cannot evaluate prefix
  if (!nameStr) {
    return {
      isValid: false,
      actualGenderNormalized: genderInfo.normalized,
      errors,
      warnings
    };
  }

  // 3. Detect Prefix
  const prefixMatch = detectNamePrefix(nameStr, config);

  if (!prefixMatch) {
    // Unrecognized Prefix: Do NOT guess gender! Label as warning.
    warnings.push({
      id: 'UNRECOGNIZED_PREFIX',
      category: 'UNRECOGNIZED_PREFIX',
      severity: 'WARNING',
      code: 'UNRECOGNIZED_PREFIX',
      field: 'Name',
      message: `Name "${nameStr}" does not start with any configured prefix (${[...config.malePrefixes, ...config.femalePrefixes].join(', ')}). Gender cannot be verified automatically.`,
      suggestedCorrection: 'Verify prefix or add custom prefix in Settings.',
      value: nameStr
    });

    return {
      isValid: errors.length === 0,
      actualGenderNormalized: genderInfo.normalized,
      errors,
      warnings
    };
  }

  const { prefix: matchedPrefix, gender: expectedGender } = prefixMatch;

  // 4. Validate Gender Match if gender is provided
  if (genderInfo.raw) {
    if (genderInfo.normalized === 'OTHER') {
      errors.push({
        id: 'INVALID_GENDER_VALUE',
        category: 'GENDER_MISMATCH',
        severity: 'ERROR',
        code: 'INVALID_GENDER',
        field: 'Gender',
        message: `Unrecognized gender value "${genderInfo.raw}". Expected "${expectedGender}" for prefix "${matchedPrefix}".`,
        suggestedCorrection: `Set Gender to "${expectedGender}".`,
        value: genderInfo.raw
      });
    } else if (genderInfo.normalized !== expectedGender) {
      const expectedLabel = expectedGender === 'M' ? 'Male (M)' : 'Female (F)';
      const actualLabel = genderInfo.normalized === 'M' ? 'Male (M)' : 'Female (F)';

      errors.push({
        id: 'GENDER_MISMATCH',
        category: 'GENDER_MISMATCH',
        severity: 'ERROR',
        code: 'GENDER_MISMATCH',
        field: 'Gender',
        message: `Gender mismatch: Name starts with "${matchedPrefix}" (expected ${expectedLabel}), but actual Gender is "${actualLabel}".`,
        suggestedCorrection: `Change Gender to "${expectedGender}" or correct the name prefix.`,
        value: genderInfo.raw
      });
    }
  }

  return {
    isValid: errors.length === 0,
    matchedPrefix,
    expectedGender,
    actualGenderNormalized: genderInfo.normalized,
    errors,
    warnings
  };
}
