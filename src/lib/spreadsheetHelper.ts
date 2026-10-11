import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ImportedQuestionRow, OptionLetter, Question } from '../types';

export const TEMPLATE_HEADERS = [
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Correct Answer',
  'Time Limit',
  'Points',
  'Explanation'
];

export const TEMPLATE_SAMPLE_DATA = [
  {
    'Question': 'What is the capital of India?',
    'Option A': 'Mumbai',
    'Option B': 'New Delhi',
    'Option C': 'Kolkata',
    'Option D': 'Chennai',
    'Correct Answer': 'B',
    'Time Limit': '20',
    'Points': '1000',
    'Explanation': 'New Delhi is the capital of India.'
  },
  {
    'Question': 'Which data structure follows FIFO (First-In, First-Out)?',
    'Option A': 'Stack',
    'Option B': 'Queue',
    'Option C': 'Binary Tree',
    'Option D': 'Graph',
    'Correct Answer': 'B',
    'Time Limit': '30',
    'Points': '1000',
    'Explanation': 'FIFO means First In, First Out; Queue adheres to this principle.'
  },
  {
    'Question': 'Which algorithm design paradigm is used by Merge Sort?',
    'Option A': 'Greedy',
    'Option B': 'Dynamic Programming',
    'Option C': 'Divide and Conquer',
    'Option D': 'Backtracking',
    'Correct Answer': 'C',
    'Time Limit': '25',
    'Points': '1000',
    'Explanation': 'Merge Sort recursively splits the array into two halves, sorts them, and merges.'
  }
];

// Generate and trigger download for CSV template
export function downloadCsvTemplate(): void {
  const csvContent = Papa.unparse(TEMPLATE_SAMPLE_DATA, {
    quotes: true,
    columns: TEMPLATE_HEADERS
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'piqora_questions_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate and trigger download for Excel XLSX template
export function downloadExcelTemplate(): void {
  const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_SAMPLE_DATA, {
    header: TEMPLATE_HEADERS
  });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 40 }, // Question
    { wch: 20 }, // Option A
    { wch: 20 }, // Option B
    { wch: 20 }, // Option C
    { wch: 20 }, // Option D
    { wch: 15 }, // Correct Answer
    { wch: 12 }, // Time Limit
    { wch: 10 }, // Points
    { wch: 35 }, // Explanation
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');
  XLSX.writeFile(workbook, 'piqora_questions_template.xlsx');
}

// Normalize key by stripping non-alphanumeric chars and lowercasing
function normalizeHeaderKey(key: string): string {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Normalize and find column value case-insensitively with flexible aliases
function findColumnValue(row: Record<string, any>, possibleNames: string[]): string {
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const targetNorm = normalizeHeaderKey(name);
    const matchedKey = rowKeys.find(k => normalizeHeaderKey(k) === targetNorm);
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      return String(row[matchedKey]).trim();
    }
  }
  return '';
}

// Parse imported CSV or XLSX raw data into validated rows
export function parseAndValidateRawData(rawRows: Record<string, any>[]): ImportedQuestionRow[] {
  const results: ImportedQuestionRow[] = [];
  const seenTexts = new Set<string>();

  rawRows.forEach((row, index) => {
    // Check if the row has any content at all
    const hasAnyContent = Object.values(row).some(
      val => val !== null && val !== undefined && String(val).trim() !== ''
    );
    if (!hasAnyContent) {
      // Completely empty row, skip without registering an error
      return;
    }

    const rowNumber = index + 2; // account for header row
    const errors: string[] = [];

    const text = findColumnValue(row, ['Question', 'Question Text', 'Prompt', 'Question Prompt', 'Q', 'Title']);
    const optA = findColumnValue(row, ['Option A', 'Option 1', 'Choice A', 'Choice 1', 'OptionA', 'A']);
    const optB = findColumnValue(row, ['Option B', 'Option 2', 'Choice B', 'Choice 2', 'OptionB', 'B']);
    const optC = findColumnValue(row, ['Option C', 'Option 3', 'Choice C', 'Choice 3', 'OptionC', 'C']);
    const optD = findColumnValue(row, ['Option D', 'Option 4', 'Choice D', 'Choice 4', 'OptionD', 'D']);
    const rawAnswer = findColumnValue(row, ['Correct Answer', 'Correct Option', 'Answer', 'Correct', 'Key', 'Ans', 'Correct Answer A B C D']);
    const rawTime = findColumnValue(row, ['Time Limit', 'Time', 'Duration', 'Seconds', 'Time s', 'Timer']);
    const rawPoints = findColumnValue(row, ['Points', 'Score', 'Marks', 'Point Value']);
    const explanation = findColumnValue(row, ['Explanation', 'Notes', 'Reason', 'Rationale', 'Solution', 'Description']);

    // Check required Question Text
    if (!text) {
      errors.push('Question prompt is empty');
    } else if (seenTexts.has(text.toLowerCase())) {
      errors.push('Duplicate question detected in spreadsheet');
    } else {
      seenTexts.add(text.toLowerCase());
    }

    // Check Options
    if (!optA) errors.push('Option A is missing');
    if (!optB) errors.push('Option B is missing');
    if (!optC) errors.push('Option C is missing');
    if (!optD) errors.push('Option D is missing');

    // Parse Correct Answer (accept A/B/C/D, 1/2/3/4, or text match)
    let parsedAnswer: OptionLetter | null = null;
    const cleanAns = rawAnswer.trim();
    const upperAns = cleanAns.toUpperCase();

    if (upperAns === 'A' || upperAns === 'OPTION A' || upperAns === 'OPTION 1' || upperAns === 'CHOICE A' || upperAns === '1') {
      parsedAnswer = 'A';
    } else if (upperAns === 'B' || upperAns === 'OPTION B' || upperAns === 'OPTION 2' || upperAns === 'CHOICE B' || upperAns === '2') {
      parsedAnswer = 'B';
    } else if (upperAns === 'C' || upperAns === 'OPTION C' || upperAns === 'OPTION 3' || upperAns === 'CHOICE C' || upperAns === '3') {
      parsedAnswer = 'C';
    } else if (upperAns === 'D' || upperAns === 'OPTION D' || upperAns === 'OPTION 4' || upperAns === 'CHOICE D' || upperAns === '4') {
      parsedAnswer = 'D';
    } else if (cleanAns) {
      // Check if text matches one of the options case-insensitively
      if (optA && cleanAns.toLowerCase() === optA.toLowerCase()) parsedAnswer = 'A';
      else if (optB && cleanAns.toLowerCase() === optB.toLowerCase()) parsedAnswer = 'B';
      else if (optC && cleanAns.toLowerCase() === optC.toLowerCase()) parsedAnswer = 'C';
      else if (optD && cleanAns.toLowerCase() === optD.toLowerCase()) parsedAnswer = 'D';
      else {
        errors.push(`Invalid Correct Answer "${rawAnswer}". Must be A, B, C, D or match an option.`);
      }
    } else {
      errors.push('Correct Answer is not specified');
    }

    // Parse numerical fields with sensible defaults
    let timeLimit = 20;
    if (rawTime) {
      const parsedTime = parseInt(rawTime, 10);
      if (!isNaN(parsedTime) && parsedTime >= 5 && parsedTime <= 300) {
        timeLimit = parsedTime;
      }
    }

    let points = 1000;
    if (rawPoints) {
      const parsedPts = parseInt(rawPoints, 10);
      if (!isNaN(parsedPts) && parsedPts >= 0) {
        points = parsedPts;
      }
    }

    results.push({
      rowNumber,
      text,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: parsedAnswer,
      timeLimit,
      points,
      explanation: explanation || '',
      isValid: errors.length === 0,
      errors
    });
  });

  return results;
}

// Convert valid rows to Piqora Question models
export function convertImportedRowsToQuestions(rows: ImportedQuestionRow[]): Question[] {
  return rows
    .filter(r => r.isValid && r.correctAnswer)
    .map((r, index) => ({
      id: `imp_q_${Date.now()}_${index + 1}`,
      text: r.text.trim(),
      options: [r.optionA.trim(), r.optionB.trim(), r.optionC.trim(), r.optionD.trim()],
      correctAnswer: r.correctAnswer as OptionLetter,
      explanation: (r.explanation || '').trim(),
      timeLimit: typeof r.timeLimit === 'number' && r.timeLimit > 0 ? r.timeLimit : 20,
      points: typeof r.points === 'number' && r.points >= 0 ? r.points : 1000,
      order: index + 1
    }));
}
