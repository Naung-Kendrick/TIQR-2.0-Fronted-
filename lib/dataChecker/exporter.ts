import * as XLSX from 'xlsx';
import { ValidatedRow, ValidationSummaryStats } from './types';

/**
 * Downloads a blob as a file.
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports full validation report as a multi-sheet Excel file (.xlsx)
 */
export function exportValidationExcel(
  rows: ValidatedRow[],
  summary: ValidationSummaryStats,
  sourceFilename: string = 'Data_Validation_Report'
) {
  const wb = XLSX.utils.book_new();

  // 1. SUMMARY SHEET
  const summaryData = [
    ['TIQR 3.0 DATA CHECKER - VALIDATION REPORT SUMMARY'],
    ['Immigration Department of Ta\'ang Land (IDTL)'],
    ['Generated Date & Time', new Date().toLocaleString()],
    ['Source File', sourceFilename],
    [''],
    ['OVERALL METRICS', 'COUNT'],
    ['Total Records Checked', summary.totalRecords],
    ['Valid Records (PASS)', summary.validRecords],
    ['Records With Errors (FAIL)', summary.recordsWithErrors],
    ['Records With Warnings (WARNING)', summary.recordsWithWarnings],
    [''],
    ['VALIDATION BREAKDOWN', 'COUNT'],
    ['Ta\'ang Land ID No. Errors', summary.totalIdErrors],
    ['Gender Mismatch Errors', summary.totalGenderMismatches],
    ['Missing Value Errors', summary.totalMissingValues],
    ['Unrecognized Name Prefixes', summary.totalUnrecognizedPrefixes],
    ['Duplicate ID Records', summary.totalDuplicates],
    [''],
    ['DATE OF BIRTH (DOB) BREAKDOWN', 'COUNT'],
    ['Total DOB Errors', summary.totalDobErrors],
    ['Invalid Calendar Dates / Leap Days', summary.dobInvalidCalendar],
    ['Future Birth Dates', summary.dobFutureDates],
    ['Ambiguous Formats', summary.dobAmbiguousFormats],
    ['Missing DOB Values', summary.dobMissingValues],
    [''],
    ['DATE OF ISSUE (DOI) BREAKDOWN', 'COUNT'],
    ['Total DOI Errors', summary.totalDoiErrors],
    ['Invalid Calendar Dates / Leap Days', summary.doiInvalidCalendar],
    ['Future Issue Dates (vs System Clock)', summary.doiFutureDates],
    ['Issue Dates Earlier than DOB', summary.doiBeforeDob],
    ['Ambiguous Formats', summary.doiAmbiguousFormats],
    ['Missing DOI Values', summary.doiMissingValues]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. ALL RECORDS SHEET
  const allRowsData = rows.map(r => {
    const errorMsgs = r.errors.map(e => `[${e.code}] ${e.message}`).join('; ');
    const warningMsgs = r.warnings.map(w => `[${w.code}] ${w.message}`).join('; ');

    return {
      'Excel Row': r.rowNumber,
      'Status': r.status,
      'Issues Count': r.errors.length + r.warnings.length,
      'Errors': errorMsgs || 'None',
      'Warnings': warningMsgs || 'None',
      'Ta\'ang Land ID No.': r.rawId,
      'Name': r.rawName,
      'Matched Prefix': r.matchedPrefix || 'None',
      'Actual Gender': r.rawGender,
      'Expected Gender': r.expectedGender || 'N/A',
      'Original DOB': String(r.rawDob ?? ''),
      'Parsed DOB': r.dobResult?.formattedDisplay || 'N/A',
      'Original DOI': String(r.rawDoi ?? ''),
      'Parsed DOI': r.doiResult?.formattedDisplay || 'N/A',
      ...r.originalData
    };
  });

  const wsAll = XLSX.utils.json_to_sheet(allRowsData);
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Records');

  // 3. ERROR & WARNING RECORDS ONLY SHEET
  const errorOnlyRows = rows
    .filter(r => r.status === 'FAIL' || r.status === 'WARNING')
    .map(r => {
      const allIssues = [...r.errors, ...r.warnings];
      return {
        'Excel Row': r.rowNumber,
        'Status': r.status,
        'Ta\'ang Land ID No.': r.rawId,
        'Name': r.rawName,
        'Actual Gender': r.rawGender,
        'Expected Gender': r.expectedGender || 'N/A',
        'Date of Birth': String(r.rawDob ?? ''),
        'Date of Issue': String(r.rawDoi ?? ''),
        'Error Codes': allIssues.map(i => i.code).join(', '),
        'Detailed Explanations': allIssues.map(i => i.message).join(' | '),
        'Suggested Corrections': allIssues.map(i => i.suggestedCorrection || '').filter(Boolean).join(' | ')
      };
    });

  const wsErrors = XLSX.utils.json_to_sheet(errorOnlyRows);
  XLSX.utils.book_append_sheet(wb, wsErrors, 'Errors Only');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `IDTL_Data_Validation_Report_${stamp}.xlsx`);
}

/**
 * Exports only error records as Excel (.xlsx)
 */
export function exportErrorsOnlyExcel(rows: ValidatedRow[]) {
  const wb = XLSX.utils.book_new();

  const errorOnlyRows = rows
    .filter(r => r.status === 'FAIL' || r.status === 'WARNING')
    .map(r => {
      const allIssues = [...r.errors, ...r.warnings];
      return {
        'Excel Row': r.rowNumber,
        'Status': r.status,
        'Ta\'ang Land ID No.': r.rawId,
        'Name': r.rawName,
        'Actual Gender': r.rawGender,
        'Expected Gender': r.expectedGender || 'N/A',
        'Date of Birth': String(r.rawDob ?? ''),
        'Date of Issue': String(r.rawDoi ?? ''),
        'Error Codes': allIssues.map(i => i.code).join(', '),
        'Explanations': allIssues.map(i => i.message).join(' | '),
        'Suggested Correction': allIssues.map(i => i.suggestedCorrection || '').filter(Boolean).join(' | '),
        ...r.originalData
      };
    });

  const ws = XLSX.utils.json_to_sheet(errorOnlyRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Error Records');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `IDTL_Validation_Errors_Only_${stamp}.xlsx`);
}

/**
 * Exports data as CSV (.csv)
 */
export function exportValidationCsv(rows: ValidatedRow[], errorsOnly: boolean = false) {
  const targetRows = errorsOnly ? rows.filter(r => r.status === 'FAIL' || r.status === 'WARNING') : rows;

  const exportData = targetRows.map(r => {
    const allIssues = [...r.errors, ...r.warnings];
    return {
      'Excel Row': r.rowNumber,
      'Status': r.status,
      'Ta\'ang Land ID No.': `="${r.rawId}"`, // Excel formula wrapper prevents CSV number conversion
      'Name': r.rawName,
      'Actual Gender': r.rawGender,
      'Expected Gender': r.expectedGender || '',
      'Date of Birth': String(r.rawDob ?? ''),
      'Date of Issue': String(r.rawDoi ?? ''),
      'Issues Count': allIssues.length,
      'Error Codes': allIssues.map(i => i.code).join('; '),
      'Explanations': allIssues.map(i => i.message).join('; '),
      'Suggested Corrections': allIssues.map(i => i.suggestedCorrection || '').filter(Boolean).join('; ')
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const csvContent = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

  const stamp = new Date().toISOString().slice(0, 10);
  const nameSuffix = errorsOnly ? 'Errors_Only' : 'Full_Report';
  triggerDownload(blob, `IDTL_Data_Validation_${nameSuffix}_${stamp}.csv`);
}
