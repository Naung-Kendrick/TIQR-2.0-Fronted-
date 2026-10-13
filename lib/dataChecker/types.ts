export type ValidationStatus = 'PASS' | 'FAIL' | 'WARNING';

export type ErrorSeverity = 'ERROR' | 'WARNING';

export type ErrorCategory =
  | 'ID_ERROR'
  | 'GENDER_MISMATCH'
  | 'UNRECOGNIZED_PREFIX'
  | 'MISSING_VALUE'
  | 'DOB_ERROR'
  | 'DOI_ERROR'
  | 'DUPLICATE_ROW';

export interface ValidationErrorItem {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  field: string;
  message: string;
  suggestedCorrection?: string;
  value?: any;
}

export interface DateParsedResult {
  raw: any;
  isValid: boolean;
  isAmbiguous?: boolean;
  parsedDate?: Date;
  formattedDisplay?: string; // e.g. "28/02/2025"
  day?: number;
  month?: number;
  year?: number;
  error?: string;
  errorCode?: string;
}

export interface PrefixRuleConfig {
  malePrefixes: string[];
  femalePrefixes: string[];
}

export type ExpectedDateFormat = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';

export interface DateRuleConfig {
  expectedFormat: ExpectedDateFormat;
  allowAmbiguousWarning: boolean;
  ambiguousResolution: 'PROMPT' | 'FORCE_DD_MM' | 'FORCE_MM_DD';
  minBirthYear: number;
  maxBirthDateIsToday: boolean;
  enableMinAgeAtIssue: boolean;
  minAgeAtIssue: number;
}

export interface ColumnMappingConfig {
  idColumn: string;
  nameColumn: string;
  genderColumn: string;
  dobColumn: string;
  doiColumn: string;
}

export interface CheckerConfig {
  prefixRules: PrefixRuleConfig;
  dateRules: DateRuleConfig;
  columnMapping: ColumnMappingConfig;
}

export interface ValidatedRow {
  rowNumber: number; // 1-based original Excel row number (e.g. 2 for first data row)
  originalData: Record<string, any>;
  
  // Extracted values
  rawId: string;
  rawName: string;
  rawGender: string;
  rawDob: any;
  rawDoi: any;

  // Normalized / Parsed values
  matchedPrefix?: string;
  expectedGender?: 'M' | 'F';
  actualGenderNormalized?: 'M' | 'F' | 'OTHER';
  dobResult?: DateParsedResult;
  doiResult?: DateParsedResult;

  // Status
  status: ValidationStatus;
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];

  // Helper flags
  hasIdError: boolean;
  hasGenderMismatch: boolean;
  hasUnrecognizedPrefix: boolean;
  hasMissingValue: boolean;
  hasDobError: boolean;
  hasDoiError: boolean;
  isDuplicate: boolean;
}

export interface ValidationSummaryStats {
  totalRecords: number;
  validRecords: number;
  recordsWithErrors: number;
  recordsWithWarnings: number;

  totalIdErrors: number;
  totalGenderMismatches: number;
  totalMissingValues: number;
  totalUnrecognizedPrefixes: number;

  // DOB breakdown
  totalDobErrors: number;
  dobInvalidCalendar: number;
  dobFutureDates: number;
  dobAmbiguousFormats: number;
  dobMissingValues: number;

  // DOI breakdown
  totalDoiErrors: number;
  doiInvalidCalendar: number;
  doiFutureDates: number;
  doiBeforeDob: number;
  doiAmbiguousFormats: number;
  doiMissingValues: number;

  totalDuplicates: number;
}
