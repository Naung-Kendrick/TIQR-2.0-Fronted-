import { DateParsedResult, ValidationErrorItem, DateRuleConfig } from '../types';

export const DEFAULT_DATE_CONFIG: DateRuleConfig = {
  expectedFormat: 'DD/MM/YYYY',
  allowAmbiguousWarning: false,
  ambiguousResolution: 'FORCE_DD_MM',
  minBirthYear: 1900,
  maxBirthDateIsToday: true,
  enableMinAgeAtIssue: false,
  minAgeAtIssue: 10
};

export const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

/**
 * Gregorian Leap Year Rule:
 * - Divisible by 400 -> LEAP
 * - Divisible by 100 but not 400 -> NOT LEAP
 * - Divisible by 4 but not 100 -> LEAP
 */
export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

/**
 * Returns number of days in given month and year.
 */
export function getDaysInMonth(month: number, year: number): number {
  if (month < 1 || month > 12) return 0;
  switch (month) {
    case 1: // Jan
    case 3: // Mar
    case 5: // May
    case 7: // Jul
    case 8: // Aug
    case 10: // Oct
    case 12: // Dec
      return 31;
    case 4: // Apr
    case 6: // Jun
    case 9: // Sep
    case 11: // Nov
      return 30;
    case 2: // Feb
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
}

/**
 * Formats day, month, year as DD/MM/YYYY
 */
export function formatCalendarDate(day: number, month: number, year: number): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yyyy = String(year).padStart(4, '0');
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Converts Excel Serial Date code (e.g. 45351) into { day, month, year }
 */
export function parseExcelSerialDate(serial: number): { day: number; month: number; year: number } | null {
  if (isNaN(serial) || serial <= 0 || serial > 150000) return null;

  // Approximate day count conversion accounting for Excel 1900 leap year bug
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const dateInfo = new Date(utcValue);

  return {
    day: dateInfo.getUTCDate(),
    month: dateInfo.getUTCMonth() + 1,
    year: dateInfo.getUTCFullYear()
  };
}

/**
 * Parses raw input into calendar date parts without automatic JavaScript rollover.
 */
export function parseDateRaw(
  rawVal: any,
  config: DateRuleConfig
): {
  day?: number;
  month?: number;
  year?: number;
  isAmbiguous: boolean;
  parseError?: string;
  errorCode?: string;
} {
  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return { isAmbiguous: false, parseError: 'Date is empty', errorCode: 'MISSING_DATE' };
  }

  // 1. Check if raw value is a JavaScript Date object (from XLSX cellDates: true)
  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    return {
      day: rawVal.getDate(),
      month: rawVal.getMonth() + 1,
      year: rawVal.getFullYear(),
      isAmbiguous: false
    };
  }

  // 2. Check if raw value is an Excel numeric serial
  if (typeof rawVal === 'number' || (/^\d{4,5}(\.\d+)?$/.test(String(rawVal).trim()) && !String(rawVal).includes('/'))) {
    const num = Number(rawVal);
    // Serial dates between 1900 and 2100 are approx 1 to 75000
    if (num > 1000 && num < 100000) {
      const parsedSerial = parseExcelSerialDate(num);
      if (parsedSerial) {
        return { ...parsedSerial, isAmbiguous: false };
      }
    }
  }

  const str = String(rawVal).trim();

  // 3. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return { day, month, year, isAmbiguous: false };
  }

  // 4. Delimited format: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const delimitedMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (delimitedMatch) {
    const part1 = parseInt(delimitedMatch[1], 10);
    const part2 = parseInt(delimitedMatch[2], 10);
    let year = parseInt(delimitedMatch[3], 10);
    // Handle 2-digit years
    if (year < 100) {
      year = year < 30 ? 2000 + year : 1900 + year;
    }

    // Determine Day vs Month
    let day = part1;
    let month = part2;
    let isAmbiguous = false;

    if (config.expectedFormat === 'MM/DD/YYYY') {
      month = part1;
      day = part2;
    }

    // Check for ambiguity: both parts are <= 12 and part1 !== part2
    if (part1 <= 12 && part2 <= 12 && part1 !== part2) {
      if (config.ambiguousResolution === 'FORCE_MM_DD') {
        month = part1;
        day = part2;
        isAmbiguous = false;
      } else if (config.ambiguousResolution === 'FORCE_DD_MM' || !config.allowAmbiguousWarning) {
        // Default: Day/Month/Year (e.g. 3.12.1994 = 03/12/1994, 3 December)
        day = part1;
        month = part2;
        isAmbiguous = false;
      } else {
        // PROMPT only when allowAmbiguousWarning is explicitly enabled
        isAmbiguous = true;
        day = part1;
        month = part2;
      }
    } else {
      // Unambiguous: if one part is > 12
      if (part1 > 12 && part2 <= 12) {
        day = part1;
        month = part2;
      } else if (part2 > 12 && part1 <= 12) {
        month = part1;
        day = part2;
      }
    }

    return { day, month, year, isAmbiguous };
  }

  return {
    isAmbiguous: false,
    parseError: `The date value "${str}" cannot be interpreted using the configured date format (${config.expectedFormat}).`,
    errorCode: 'INVALID_FORMAT'
  };
}

/**
 * Validates Date of Birth (DOB) according to Rule 3:
 * - Real calendar dates
 * - Leap year rules
 * - Future date rejection
 * - Ambiguous date detection
 * - Suggested corrections
 */
export function validateDateOfBirth(
  rawDob: any,
  config: DateRuleConfig = DEFAULT_DATE_CONFIG,
  systemDate: Date = new Date()
): {
  result: DateParsedResult;
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
} {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];

  if (rawDob === undefined || rawDob === null || String(rawDob).trim() === '') {
    errors.push({
      id: 'MISSING_DOB',
      category: 'DOB_ERROR',
      severity: 'ERROR',
      code: 'MISSING_DOB',
      field: 'Date of Birth',
      message: 'MISSING_DOB: Date of Birth is empty.',
      suggestedCorrection: 'Enter Date of Birth in DD/MM/YYYY format.',
      value: rawDob
    });

    return {
      result: { raw: rawDob, isValid: false, error: 'MISSING_DOB: Date of Birth is empty.', errorCode: 'MISSING_DOB' },
      errors,
      warnings
    };
  }

  const parsed = parseDateRaw(rawDob, config);

  if (parsed.parseError || !parsed.day || !parsed.month || !parsed.year) {
    errors.push({
      id: 'DOB_INVALID_FORMAT',
      category: 'DOB_ERROR',
      severity: 'ERROR',
      code: parsed.errorCode || 'INVALID_FORMAT',
      field: 'Date of Birth',
      message: `INVALID_FORMAT: ${parsed.parseError || 'Invalid date structure.'}`,
      suggestedCorrection: `Use format ${config.expectedFormat} (e.g. 15/06/1995).`,
      value: rawDob
    });

    return {
      result: { raw: rawDob, isValid: false, error: parsed.parseError, errorCode: parsed.errorCode },
      errors,
      warnings
    };
  }

  const { day, month, year, isAmbiguous } = parsed;

  // 1. Month range validation
  if (month < 1 || month > 12) {
    errors.push({
      id: 'DOB_INVALID_MONTH',
      category: 'DOB_ERROR',
      severity: 'ERROR',
      code: 'INVALID_DATE',
      field: 'Date of Birth',
      message: `INVALID_DATE: Month ${month} is invalid (must be 1–12).`,
      suggestedCorrection: 'Verify month value.',
      value: rawDob
    });
    return {
      result: { raw: rawDob, isValid: false, day, month, year, error: 'Invalid month' },
      errors,
      warnings
    };
  }

  // 2. Calendar day and Leap Year validation
  const maxDays = getDaysInMonth(month, year);
  const monthName = MONTH_NAMES[month];

  if (day < 1) {
    errors.push({
      id: 'DOB_DAY_BELOW_ONE',
      category: 'DOB_ERROR',
      severity: 'ERROR',
      code: 'INVALID_DATE',
      field: 'Date of Birth',
      message: `INVALID_DATE: Day ${day} cannot be less than 1.`,
      value: rawDob
    });
  } else if (month === 2) {
    // Special handling for February
    if (day === 29 && !isLeapYear(year)) {
      errors.push({
        id: 'DOB_INVALID_LEAP_DAY',
        category: 'DOB_ERROR',
        severity: 'ERROR',
        code: 'INVALID_LEAP_DAY',
        field: 'Date of Birth',
        message: `INVALID_LEAP_DAY: February 29 is not valid in ${year}.`,
        suggestedCorrection: `Change to 28/02/${year} or 01/03/${year}. ${year} is not a leap year.`,
        value: rawDob
      });
    } else if (day >= 30) {
      const febMax = isLeapYear(year) ? 29 : 28;
      errors.push({
        id: 'DOB_FEB_IMPOSSIBLE',
        category: 'DOB_ERROR',
        severity: 'ERROR',
        code: 'INVALID_DATE',
        field: 'Date of Birth',
        message: `INVALID_DATE: February ${day} does not exist. (February has only ${febMax} days in ${year})`,
        suggestedCorrection: `Change to ${febMax}/02/${year} or a valid date.`,
        value: rawDob
      });
    }
  } else if (day > maxDays) {
    // 30-day months or other overflow
    errors.push({
      id: 'DOB_DAY_EXCEEDS_MONTH',
      category: 'DOB_ERROR',
      severity: 'ERROR',
      code: 'INVALID_DATE',
      field: 'Date of Birth',
      message: `INVALID_DATE: ${monthName} has only ${maxDays} days.`,
      suggestedCorrection: `Change day ${day} to ${maxDays} or a valid calendar day.`,
      value: rawDob
    });
  }

  // 3. Future date check against system clock
  const todayY = systemDate.getFullYear();
  const todayM = systemDate.getMonth() + 1;
  const todayD = systemDate.getDate();

  const isFuture =
    year > todayY ||
    (year === todayY && month > todayM) ||
    (year === todayY && month === todayM && day > todayD);

  if (isFuture) {
    errors.push({
      id: 'DOB_FUTURE_DATE',
      category: 'DOB_ERROR',
      severity: 'ERROR',
      code: 'FUTURE_DATE',
      field: 'Date of Birth',
      message: 'FUTURE_DATE: Date of Birth cannot be in the future.',
      suggestedCorrection: `Verify year ${year}; birth date must be on or before today (${formatCalendarDate(todayD, todayM, todayY)}).`,
      value: rawDob
    });
  }

  // 4. Min birth year range check
  if (year < config.minBirthYear) {
    errors.push({
      id: 'DOB_RANGE_PAST',
      category: 'DOB_ERROR',
      severity: 'ERROR',
      code: 'OUT_OF_RANGE_DOB',
      field: 'Date of Birth',
      message: `OUT_OF_RANGE_DOB: Birth year ${year} is outside the permitted range (minimum configured year: ${config.minBirthYear}).`,
      suggestedCorrection: 'Verify birth year.',
      value: rawDob
    });
  }

  // 5. Ambiguous date warning
  if (isAmbiguous && config.allowAmbiguousWarning && errors.length === 0) {
    const opt1 = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} (${day} ${MONTH_NAMES[month]})`;
    const opt2 = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year} (${month} ${MONTH_NAMES[day]})`;
    warnings.push({
      id: 'DOB_AMBIGUOUS_FORMAT',
      category: 'DOB_ERROR',
      severity: 'WARNING',
      code: 'AMBIGUOUS_DATE',
      field: 'Date of Birth',
      message: `AMBIGUOUS_DATE: Confirm whether ${String(rawDob).trim()} means ${opt1} or ${opt2}.`,
      suggestedCorrection: 'Click "Confirm Date Formats" in toolbar to set default interpretation.',
      value: rawDob
    });
  }

  const isValid = errors.length === 0;
  const formattedDisplay = formatCalendarDate(day, month, year);
  const parsedDateObj = isValid ? new Date(year, month - 1, day) : undefined;

  return {
    result: {
      raw: rawDob,
      isValid,
      isAmbiguous,
      parsedDate: parsedDateObj,
      formattedDisplay,
      day,
      month,
      year,
      errorCode: errors[0]?.code
    },
    errors,
    warnings
  };
}

/**
 * Validates Date of Issue (DOI) according to Rule 4:
 * - Real calendar dates and leap years
 * - Prevent Future Issue Dates (uses live system clock)
 * - Check DOI against DOB (DOI cannot be earlier than DOB)
 * - Optional configurable minimum age at issuance
 */
export function validateDateOfIssue(
  rawDoi: any,
  dobResult?: DateParsedResult,
  config: DateRuleConfig = DEFAULT_DATE_CONFIG,
  systemDate: Date = new Date()
): {
  result: DateParsedResult;
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
} {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];

  if (rawDoi === undefined || rawDoi === null || String(rawDoi).trim() === '') {
    errors.push({
      id: 'MISSING_DOI',
      category: 'DOI_ERROR',
      severity: 'ERROR',
      code: 'MISSING_DOI',
      field: 'Date of Issue',
      message: 'MISSING_DOI: Date of Issue is empty.',
      suggestedCorrection: 'Enter Date of Issue in DD/MM/YYYY format.',
      value: rawDoi
    });

    return {
      result: { raw: rawDoi, isValid: false, error: 'MISSING_DOI: Date of Issue is empty.', errorCode: 'MISSING_DOI' },
      errors,
      warnings
    };
  }

  const parsed = parseDateRaw(rawDoi, config);

  if (parsed.parseError || !parsed.day || !parsed.month || !parsed.year) {
    errors.push({
      id: 'DOI_INVALID_FORMAT',
      category: 'DOI_ERROR',
      severity: 'ERROR',
      code: parsed.errorCode || 'INVALID_FORMAT',
      field: 'Date of Issue',
      message: `INVALID_FORMAT: ${parsed.parseError || 'Invalid date structure.'}`,
      suggestedCorrection: `Use format ${config.expectedFormat} (e.g. 12/10/2026).`,
      value: rawDoi
    });

    return {
      result: { raw: rawDoi, isValid: false, error: parsed.parseError, errorCode: parsed.errorCode },
      errors,
      warnings
    };
  }

  const { day, month, year, isAmbiguous } = parsed;

  // 1. Month validation
  if (month < 1 || month > 12) {
    errors.push({
      id: 'DOI_INVALID_MONTH',
      category: 'DOI_ERROR',
      severity: 'ERROR',
      code: 'INVALID_DATE',
      field: 'Date of Issue',
      message: `INVALID_DATE: Month ${month} does not exist.`,
      value: rawDoi
    });
    return {
      result: { raw: rawDoi, isValid: false, day, month, year, error: 'Invalid month' },
      errors,
      warnings
    };
  }

  // 2. Calendar day and Leap Year validation
  const maxDays = getDaysInMonth(month, year);
  const monthName = MONTH_NAMES[month];

  if (day < 1) {
    errors.push({
      id: 'DOI_DAY_BELOW_ONE',
      category: 'DOI_ERROR',
      severity: 'ERROR',
      code: 'INVALID_DATE',
      field: 'Date of Issue',
      message: `INVALID_DATE: Day ${day} cannot be less than 1.`,
      value: rawDoi
    });
  } else if (month === 2) {
    if (day === 29 && !isLeapYear(year)) {
      errors.push({
        id: 'DOI_INVALID_LEAP_DAY',
        category: 'DOI_ERROR',
        severity: 'ERROR',
        code: 'INVALID_LEAP_DAY',
        field: 'Date of Issue',
        message: `INVALID_LEAP_DAY: February 29 is not valid in ${year}.`,
        suggestedCorrection: `Change to 28/02/${year} or 01/03/${year}.`,
        value: rawDoi
      });
    } else if (day >= 30) {
      const febMax = isLeapYear(year) ? 29 : 28;
      errors.push({
        id: 'DOI_FEB_IMPOSSIBLE',
        category: 'DOI_ERROR',
        severity: 'ERROR',
        code: 'INVALID_DATE',
        field: 'Date of Issue',
        message: `INVALID_DATE: February ${day} does not exist. (February has only ${febMax} days in ${year})`,
        value: rawDoi
      });
    }
  } else if (day > maxDays) {
    errors.push({
      id: 'DOI_DAY_EXCEEDS_MONTH',
      category: 'DOI_ERROR',
      severity: 'ERROR',
      code: 'INVALID_DATE',
      field: 'Date of Issue',
      message: `INVALID_DATE: ${monthName} has only ${maxDays} days.`,
      suggestedCorrection: `Change day ${day} to ${maxDays}.`,
      value: rawDoi
    });
  }

  // 3. Prevent Future Issue Dates (Using live system clock)
  const todayY = systemDate.getFullYear();
  const todayM = systemDate.getMonth() + 1;
  const todayD = systemDate.getDate();

  const isFutureIssue =
    year > todayY ||
    (year === todayY && month > todayM) ||
    (year === todayY && month === todayM && day > todayD);

  if (isFutureIssue) {
    errors.push({
      id: 'DOI_FUTURE_DATE',
      category: 'DOI_ERROR',
      severity: 'ERROR',
      code: 'FUTURE_ISSUE_DATE',
      field: 'Date of Issue',
      message: 'FUTURE_ISSUE_DATE: Date of Issue cannot be later than today\'s date.',
      suggestedCorrection: `Issue date must be on or before today (${formatCalendarDate(todayD, todayM, todayY)}).`,
      value: rawDoi
    });
  }

  // 4. Check Date of Issue Against Date of Birth
  if (dobResult && dobResult.day && dobResult.month && dobResult.year && dobResult.isValid) {
    const dobD = dobResult.day;
    const dobM = dobResult.month;
    const dobY = dobResult.year;

    const isBeforeDob =
      year < dobY ||
      (year === dobY && month < dobM) ||
      (year === dobY && month === dobM && day < dobD);

    if (isBeforeDob) {
      errors.push({
        id: 'DOI_BEFORE_DOB',
        category: 'DOI_ERROR',
        severity: 'ERROR',
        code: 'ISSUE_BEFORE_DOB',
        field: 'Date of Issue',
        message: `ISSUE_BEFORE_DOB: Date of Issue (${formatCalendarDate(day, month, year)}) cannot be earlier than Date of Birth (${formatCalendarDate(dobD, dobM, dobY)}).`,
        suggestedCorrection: 'Check both Date of Issue and Date of Birth values for inverted entries.',
        value: rawDoi
      });
    } else if (config.enableMinAgeAtIssue) {
      // Optional minimum age check
      let ageAtIssue = year - dobY;
      if (month < dobM || (month === dobM && day < dobD)) {
        ageAtIssue--;
      }
      if (ageAtIssue < config.minAgeAtIssue) {
        warnings.push({
          id: 'DOI_MIN_AGE_WARNING',
          category: 'DOI_ERROR',
          severity: 'WARNING',
          code: 'MIN_AGE_WARNING',
          field: 'Date of Issue',
          message: `MIN_AGE_WARNING: Person was only ${ageAtIssue} year(s) old when document was issued (configured minimum eligibility age is ${config.minAgeAtIssue}).`,
          suggestedCorrection: 'Verify document eligibility or adjust minimum age setting.',
          value: rawDoi
        });
      }
    }
  }

  // 5. Ambiguous date warning
  if (isAmbiguous && config.allowAmbiguousWarning && errors.length === 0) {
    const opt1 = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} (${day} ${MONTH_NAMES[month]})`;
    const opt2 = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year} (${month} ${MONTH_NAMES[day]})`;
    warnings.push({
      id: 'DOI_AMBIGUOUS_FORMAT',
      category: 'DOI_ERROR',
      severity: 'WARNING',
      code: 'AMBIGUOUS_DATE',
      field: 'Date of Issue',
      message: `AMBIGUOUS_DATE: Confirm whether ${String(rawDoi).trim()} means ${opt1} or ${opt2}.`,
      suggestedCorrection: 'Confirm date format in toolbar settings.',
      value: rawDoi
    });
  }

  const isValid = errors.length === 0;
  const formattedDisplay = formatCalendarDate(day, month, year);
  const parsedDateObj = isValid ? new Date(year, month - 1, day) : undefined;

  return {
    result: {
      raw: rawDoi,
      isValid,
      isAmbiguous,
      parsedDate: parsedDateObj,
      formattedDisplay,
      day,
      month,
      year,
      errorCode: errors[0]?.code
    },
    errors,
    warnings
  };
}
