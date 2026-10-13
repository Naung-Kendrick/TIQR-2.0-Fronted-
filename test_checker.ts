import { validateTaangLandId } from './lib/dataChecker/rules/idValidation';
import { validateNameAndGender, DEFAULT_PREFIX_CONFIG } from './lib/dataChecker/rules/prefixGenderValidation';
import { validateDateOfBirth, validateDateOfIssue, DEFAULT_DATE_CONFIG } from './lib/dataChecker/rules/dateValidation';
import { validateDataset } from './lib/dataChecker/validator';
import { SAMPLE_DATASET } from './lib/dataChecker/sampleData';

console.log('=== RUNNING COMPREHENSIVE ACCEPTANCE TESTS ===\n');

let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`, detail || '');
    failedTests++;
  }
}

// 1. ID Validation Tests
const validId = validateTaangLandId('1310012004051200101');
assert(validId.isValid && validId.errors.length === 0, '1. ID with exactly 19 digits passes validation');

const validIdWithNoPrefix = validateTaangLandId('No - 1310012004051200101');
assert(validIdWithNoPrefix.isValid && validIdWithNoPrefix.sanitizedId === '1310012004051200101', '1b. ID with "No - " prefix passes validation (19 digits recognized)');

const validIdWithNoPrefix2 = validateTaangLandId('No- 1310012004051200101');
assert(validIdWithNoPrefix2.isValid && validIdWithNoPrefix2.sanitizedId === '1310012004051200101', '1c. ID with "No- " prefix passes validation');

const shortId = validateTaangLandId('131001200405120010'); // 18 digits
assert(!shortId.isValid && shortId.errors.some(e => e.code === 'Id must 19 digits'), '2a. ID with 18 digits fails validation');

const shortIdWithPrefix = validateTaangLandId('No - 131001200405120010'); // 18 digits with prefix
assert(!shortIdWithPrefix.isValid && shortIdWithPrefix.errors.some(e => e.code === 'Id must 19 digits'), '2a2. "No - " with 18 digits fails validation');

const longId = validateTaangLandId('131001200405120010199'); // 21 digits
assert(!longId.isValid && longId.errors.some(e => e.code === 'Id must 19 digits'), '2b. ID with 20/21 digits fails validation');

const letterId = validateTaangLandId('131001200405120010A');
assert(!letterId.isValid && letterId.errors.some(e => e.code === 'INVALID_ID_CHARS'), '2c. ID with non-numeric chars fails validation');

// 2. Name & Gender Validation Tests
const mgMale = validateNameAndGender('Mg Aung', 'M');
assert(mgMale.isValid && mgMale.matchedPrefix === 'Mg', '3. "Mg" + "M" passes gender check');

const dawFemale = validateNameAndGender('Daw Hla', 'F');
assert(dawFemale.isValid && dawFemale.matchedPrefix === 'Daw', '4. "Daw" + "F" passes gender check');

const mgFemale = validateNameAndGender('Mg Kyaw', 'F');
assert(!mgFemale.isValid && mgFemale.errors.some(e => e.code === 'GENDER_MISMATCH'), '5. "Mg" + "F" is flagged as gender mismatch');

const dawMale = validateNameAndGender('Daw Aye', 'M');
assert(!dawMale.isValid && dawMale.errors.some(e => e.code === 'GENDER_MISMATCH'), '6. "Daw" + "M" is flagged as gender mismatch');

const missingVals = validateNameAndGender('', '');
assert(missingVals.errors.some(e => e.code === 'MISSING_NAME') && missingVals.errors.some(e => e.code === 'MISSING_GENDER'), '7. Missing name & gender are clearly reported');

const unrecog = validateNameAndGender('Martin Smith', 'M');
assert(unrecog.warnings.some(w => w.code === 'UNRECOGNIZED_PREFIX') && unrecog.expectedGender === undefined, '8. Unrecognized prefix reported without guessing gender ("Martin" not matched as "Ma")');

const maiMale = validateNameAndGender('Mai Seng', 'M');
assert(maiMale.isValid && maiMale.matchedPrefix === 'Mai', '8b. "Mai" matches "Mai" not "Ma" due to length priority');

const nangFemale = validateNameAndGender('Nang Hla', 'F');
assert(nangFemale.isValid && nangFemale.matchedPrefix === 'Nang' && nangFemale.expectedGender === 'F', '8c. "Nang" matches female prefix (F) successfully');

const nangMismatch = validateNameAndGender('Nang Kham', 'M');
assert(!nangMismatch.isValid && nangMismatch.errors.some(e => e.code === 'GENDER_MISMATCH'), '8d. "Nang" with Gender "M" is flagged as gender mismatch');

const saiMale = validateNameAndGender('Sai Aung', 'M');
assert(saiMale.isValid && saiMale.matchedPrefix === 'Sai' && saiMale.expectedGender === 'M', '8e. "Sai" matches male prefix (M) successfully');

const saiMismatch = validateNameAndGender('Sai Aung', 'F');
assert(!saiMismatch.isValid && saiMismatch.errors.some(e => e.code === 'GENDER_MISMATCH'), '8f. "Sai" with Gender "F" is flagged as gender mismatch');

// 3. DOB Acceptance Tests
const fixedSystemDate = new Date(2026, 9, 12); // 12 Oct 2026

const dob28Feb25 = validateDateOfBirth('28/02/2025', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(dob28Feb25.result.isValid, 'DOB 28/02/2025 -> VALID');

const dob29Feb24 = validateDateOfBirth('29/02/2024', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(dob29Feb24.result.isValid, 'DOB 29/02/2024 -> VALID (Leap Year)');

const dob29Feb25 = validateDateOfBirth('29/02/2025', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!dob29Feb25.result.isValid && dob29Feb25.errors.some(e => e.code === 'INVALID_LEAP_DAY'), 'DOB 29/02/2025 -> INVALID (Non-leap year)');

const dob30Feb24 = validateDateOfBirth('30/02/2024', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!dob30Feb24.result.isValid && dob30Feb24.errors.some(e => e.code === 'INVALID_DATE'), 'DOB 30/02/2024 -> INVALID (Impossible date)');

const dob31Apr24 = validateDateOfBirth('31/04/2024', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!dob31Apr24.result.isValid && dob31Apr24.errors.some(e => e.code === 'INVALID_DATE'), 'DOB 31/04/2024 -> INVALID (April has 30 days)');

const dob31Jun24 = validateDateOfBirth('31/06/2024', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!dob31Jun24.result.isValid && dob31Jun24.errors.some(e => e.code === 'INVALID_DATE'), 'DOB 31/06/2024 -> INVALID (June has 30 days)');

const dob31Dec24 = validateDateOfBirth('31/12/2024', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(dob31Dec24.result.isValid, 'DOB 31/12/2024 -> VALID');

const dobFuture = validateDateOfBirth('15/05/2030', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!dobFuture.result.isValid && dobFuture.errors.some(e => e.code === 'FUTURE_DATE'), 'DOB Future Date -> INVALID');

const dobEmpty = validateDateOfBirth('', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!dobEmpty.result.isValid && dobEmpty.errors.some(e => e.code === 'MISSING_DOB'), 'DOB Empty -> MISSING DOB');

const dob3Dec94 = validateDateOfBirth('3.12.1994', DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(
  dob3Dec94.result.isValid &&
  dob3Dec94.result.day === 3 &&
  dob3Dec94.result.month === 12 &&
  dob3Dec94.result.year === 1994 &&
  dob3Dec94.result.formattedDisplay === '03/12/1994' &&
  dob3Dec94.warnings.length === 0,
  'DOB 3.12.1994 -> VALID (03/12/1994, 3 December, Day/Month/Year without false warning)'
);

const dobExplicitAmbiguous = validateDateOfBirth('03/04/2000', { ...DEFAULT_DATE_CONFIG, allowAmbiguousWarning: true, ambiguousResolution: 'PROMPT' }, fixedSystemDate);
assert(dobExplicitAmbiguous.warnings.some(w => w.code === 'AMBIGUOUS_DATE'), 'DOB 03/04/2000 -> WARNING when strict ambiguous warning enabled');

// 4. DOI Acceptance Tests (with system date 12 Oct 2026)
const dobRef = { raw: '01/01/2000', isValid: true, day: 1, month: 1, year: 2000 };

const doi11Oct = validateDateOfIssue('11/10/2026', dobRef, DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(doi11Oct.result.isValid, 'DOI 11/10/2026 -> VALID');

const doi12Oct = validateDateOfIssue('12/10/2026', dobRef, DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(doi12Oct.result.isValid, 'DOI 12/10/2026 -> VALID (Today)');

const doi13Oct = validateDateOfIssue('13/10/2026', dobRef, DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!doi13Oct.result.isValid && doi13Oct.errors.some(e => e.code === 'FUTURE_ISSUE_DATE'), 'DOI 13/10/2026 -> INVALID (Future issue date)');

const doi15Jan27 = validateDateOfIssue('15/01/2027', dobRef, DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!doi15Jan27.result.isValid && doi15Jan27.errors.some(e => e.code === 'FUTURE_ISSUE_DATE'), 'DOI 15/01/2027 -> INVALID (Future issue date)');

const doi20Jun29 = validateDateOfIssue('20/06/2029', dobRef, DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!doi20Jun29.result.isValid && doi20Jun29.errors.some(e => e.code === 'FUTURE_ISSUE_DATE'), 'DOI 20/06/2029 -> INVALID (Future issue date)');

const doi31Feb26 = validateDateOfIssue('31/02/2026', dobRef, DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!doi31Feb26.result.isValid && doi31Feb26.errors.some(e => e.code === 'INVALID_DATE'), 'DOI 31/02/2026 -> INVALID (Impossible date)');

const dobYoung = { raw: '10/09/2015', isValid: true, day: 10, month: 9, year: 2015 };
const doiBeforeDob = validateDateOfIssue('05/01/2010', dobYoung, DEFAULT_DATE_CONFIG, fixedSystemDate);
assert(!doiBeforeDob.result.isValid && doiBeforeDob.errors.some(e => e.code === 'ISSUE_BEFORE_DOB'), 'DOI earlier than DOB -> INVALID (Issue before birth)');

// 5. Test Full Dataset Validator with SAMPLE_DATASET
const fullValidation = validateDataset(SAMPLE_DATASET);
assert(fullValidation.rows.length === SAMPLE_DATASET.length, `Full dataset verified: ${fullValidation.rows.length} rows processed`);
assert(fullValidation.summary.recordsWithErrors > 0, `Detected error rows: ${fullValidation.summary.recordsWithErrors}`);
assert(fullValidation.summary.validRecords > 0, `Detected valid rows: ${fullValidation.summary.validRecords}`);
assert(fullValidation.summary.totalIdErrors > 0, `Detected ID errors: ${fullValidation.summary.totalIdErrors}`);
assert(fullValidation.summary.totalGenderMismatches > 0, `Detected Gender mismatches: ${fullValidation.summary.totalGenderMismatches}`);
assert(fullValidation.summary.totalDobErrors > 0, `Detected DOB errors: ${fullValidation.summary.totalDobErrors}`);
assert(fullValidation.summary.totalDoiErrors > 0, `Detected DOI errors: ${fullValidation.summary.totalDoiErrors}`);

console.log(`\n=== TEST SUITE COMPLETE: ${failedTests === 0 ? 'ALL TESTS PASSED' : failedTests + ' TESTS FAILED'} ===`);
if (failedTests > 0) process.exit(1);
