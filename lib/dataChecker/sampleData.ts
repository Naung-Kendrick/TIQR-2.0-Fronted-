/**
 * Comprehensive sample dataset designed to test all acceptance criteria and edge cases:
 * - 19-digit ID validation (valid, 18-digit, 20-digit, alphanumeric, missing)
 * - Name prefix & gender (Mg, KO, Tar, U, Mai, Daw, Ma, Lway, Yar, mismatches, boundaries like 'Martin')
 * - Date of Birth (28/02/2025, 29/02/2024, 29/02/2025, 30/02/2024, 31/04/2024, 31/06/2024, future, ambiguous, empty)
 * - Date of Issue (past, current, future, impossible date 31/02/2026, DOI earlier than DOB)
 */
export const SAMPLE_DATASET: Record<string, string>[] = [
  {
    "Ta'ang Land ID No.": "No - 1310012004051200101",
    "Name": "Mg Min Naing",
    "Gender": "M",
    "Date of Birth": "3.12.1994",
    "Date of Issue": "10/10/2025"
  },
  {
    "Ta'ang Land ID No.": "1310012000030100202",
    "Name": "Daw Nang Hla",
    "Gender": "F",
    "Date of Birth": "29/02/2024",
    "Date of Issue": "12/03/2024"
  },
  {
    "Ta'ang Land ID No.": "1310011998081500303",
    "Name": "Mai Aik Seng",
    "Gender": "M",
    "Date of Birth": "31/12/2024",
    "Date of Issue": "05/01/2025"
  },
  {
    "Ta'ang Land ID No.": "1310011995042000404",
    "Name": "Lway Moe Kham",
    "Gender": "F",
    "Date of Birth": "15/06/1995",
    "Date of Issue": "20/08/2020"
  },
  {
    "Ta'ang Land ID No.": "1310011992011000505",
    "Name": "Tar Naung Oo",
    "Gender": "M",
    "Date of Birth": "10/01/1992",
    "Date of Issue": "15/02/2018"
  },
  {
    "Ta'ang Land ID No.": "1310011989072500606",
    "Name": "KO Aung Tun",
    "Gender": "M",
    "Date of Birth": "25/07/1989",
    "Date of Issue": "12/09/2019"
  },
  {
    "Ta'ang Land ID No.": "1310011978111200707",
    "Name": "U Ba Myint",
    "Gender": "M",
    "Date of Birth": "12/11/1978",
    "Date of Issue": "18/04/2015"
  },
  {
    "Ta'ang Land ID No.": "1310011999031400808",
    "Name": "Ma Aye Sandar",
    "Gender": "F",
    "Date of Birth": "14/03/1999",
    "Date of Issue": "22/07/2021"
  },
  {
    "Ta'ang Land ID No.": "1310012001091800909",
    "Name": "Yar Nu Nu",
    "Gender": "F",
    "Date of Birth": "18/09/2001",
    "Date of Issue": "01/10/2022"
  },
  // --- Test Case: ID with 18 digits (FAIL) ---
  {
    "Ta'ang Land ID No.": "131001200405120010",
    "Name": "Mg Kyaw Kyaw",
    "Gender": "M",
    "Date of Birth": "12/05/2004",
    "Date of Issue": "15/06/2022"
  },
  // --- Test Case: ID with 20 digits (FAIL) ---
  {
    "Ta'ang Land ID No.": "131001200405120010199",
    "Name": "Daw Tin Tin",
    "Gender": "F",
    "Date of Birth": "14/08/1996",
    "Date of Issue": "10/11/2020"
  },
  // --- Test Case: ID with letters/characters (FAIL) ---
  {
    "Ta'ang Land ID No.": "131001200405120010X",
    "Name": "Mai Lon",
    "Gender": "M",
    "Date of Birth": "01/01/1990",
    "Date of Issue": "02/02/2015"
  },
  // --- Test Case: Name "Mg" with Gender "F" (FAIL: Gender mismatch) ---
  {
    "Ta'ang Land ID No.": "1310011995050501010",
    "Name": "Mg Zaw Hein",
    "Gender": "F",
    "Date of Birth": "05/05/1995",
    "Date of Issue": "10/06/2020"
  },
  // --- Test Case: Name "Daw" with Gender "M" (FAIL: Gender mismatch) ---
  {
    "Ta'ang Land ID No.": "1310011997070701111",
    "Name": "Daw Cho Cho",
    "Gender": "M",
    "Date of Birth": "07/07/1997",
    "Date of Issue": "14/09/2021"
  },
  // --- Test Case: Unrecognized Prefix (WARNING, does not guess gender) ---
  {
    "Ta'ang Land ID No.": "1310011985031201212",
    "Name": "George Hla",
    "Gender": "M",
    "Date of Birth": "12/03/1985",
    "Date of Issue": "20/04/2016"
  },
  // --- Test Case: Prefix boundary check (Martin is not 'Ma') ---
  {
    "Ta'ang Land ID No.": "1310011991040401313",
    "Name": "Martin Shwe",
    "Gender": "M",
    "Date of Birth": "04/04/1991",
    "Date of Issue": "18/05/2019"
  },
  // --- Test Case: DOB Feb 29 2025 (FAIL: Non-leap year) ---
  {
    "Ta'ang Land ID No.": "1310012025022901414",
    "Name": "Mai San Tun",
    "Gender": "M",
    "Date of Birth": "29/02/2025",
    "Date of Issue": "01/04/2025"
  },
  // --- Test Case: DOB Feb 30 2024 (FAIL: Impossible date) ---
  {
    "Ta'ang Land ID No.": "1310012024023001515",
    "Name": "Lway Nang Hom",
    "Gender": "F",
    "Date of Birth": "30/02/2024",
    "Date of Issue": "15/03/2024"
  },
  // --- Test Case: DOB April 31 (FAIL: April has only 30 days) ---
  {
    "Ta'ang Land ID No.": "1310012024043101616",
    "Name": "Tar San Aik",
    "Gender": "M",
    "Date of Birth": "31/04/2024",
    "Date of Issue": "10/05/2024"
  },
  // --- Test Case: DOB June 31 (FAIL: June has only 30 days) ---
  {
    "Ta'ang Land ID No.": "1310012024063101717",
    "Name": "Daw Mu Mu",
    "Gender": "F",
    "Date of Birth": "31/06/2024",
    "Date of Issue": "20/07/2024"
  },
  // --- Test Case: Future DOB (FAIL: Future date of birth) ---
  {
    "Ta'ang Land ID No.": "1310012035051201818",
    "Name": "Mg Kyaw Min",
    "Gender": "M",
    "Date of Birth": "12/05/2035",
    "Date of Issue": "20/06/2035"
  },
  // --- Test Case: Empty DOB (FAIL: Missing DOB) ---
  {
    "Ta'ang Land ID No.": "1310011993080801919",
    "Name": "Ma Win Mar",
    "Gender": "F",
    "Date of Birth": "",
    "Date of Issue": "15/09/2020"
  },
  // --- Test Case: Ambiguous Date (WARNING: 03/04/2000) ---
  {
    "Ta'ang Land ID No.": "1310012000040302020",
    "Name": "Tar Aik Hein",
    "Gender": "M",
    "Date of Birth": "03/04/2000",
    "Date of Issue": "10/05/2021"
  },
  // --- Test Case: Future Date of Issue (FAIL: Future DOI) ---
  {
    "Ta'ang Land ID No.": "1310012002010102121",
    "Name": "Lway Seng Nu",
    "Gender": "F",
    "Date of Birth": "01/01/2002",
    "Date of Issue": "20/06/2029"
  },
  // --- Test Case: Impossible DOI 31/02/2026 (FAIL) ---
  {
    "Ta'ang Land ID No.": "1310011996020202222",
    "Name": "Mai Aung Kham",
    "Gender": "M",
    "Date of Birth": "02/02/1996",
    "Date of Issue": "31/02/2026"
  },
  // --- Test Case: DOI earlier than DOB (FAIL: Issue before birth) ---
  {
    "Ta'ang Land ID No.": "1310012015091002323",
    "Name": "Mg Thant Zin",
    "Gender": "M",
    "Date of Birth": "10/09/2015",
    "Date of Issue": "05/01/2010"
  },
  // --- Test Case: Missing ID and Gender (FAIL: Missing values) ---
  {
    "Ta'ang Land ID No.": "",
    "Name": "Daw Khin Myo",
    "Gender": "",
    "Date of Birth": "12/12/1988",
    "Date of Issue": "15/01/2019"
  }
];
