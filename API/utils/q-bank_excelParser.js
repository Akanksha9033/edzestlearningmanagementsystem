const ExcelJS = require("exceljs");

/**
 * ----------------------------------------------------------
 * parseExcel(filePath)
 * ----------------------------------------------------------
 * PURPOSE:
 * Reads an uploaded Excel file (.xlsx) using ExcelJS and
 * extracts question data row-by-row into a clean JSON format.
 *
 * This parser uses *positional indexing* (data[1], data[2]...)
 * which means Excel column order MUST remain consistent.
 *
 * It supports:
 *  - Question text
 *  - Options (1–5)
 *  - Correct answers (comma-separated)
 *  - Explanation
 *  - Question Type
 *  - Difficulty
 *  - Marks
 *  - Tasks/Tags
 *  - Subtag, Approach, Performance Domain, Exam
 *
 * RETURNS:
 *  Array of row JSON objects.
 * ----------------------------------------------------------
 */
async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();

  // 🔹 Load the file (must be .xlsx)
  await workbook.xlsx.readFile(filePath);

  // 🔹 Use first sheet only
  const sheet = workbook.worksheets[0];

  // 🔹 Output array
  const rows = [];

  // ----------------------------------------------------------
  // Loop through every row in the sheet
  // ----------------------------------------------------------
  sheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    // ExcelJS row.values uses 1-based column indexing:
    // column A → 1, B → 2, C → 3...
    const data = row.values;

    // Positional column for Topic/Tags/Tasks (12th column)
    const rawTagsOrTasks = data[12];

    // Push structured row into array
    rows.push({
      // column A (index 1): Question text
      questionText: data[1],

      // columns B–F (2–6): Options (filter removes empty)
      options: [data[2], data[3], data[4], data[5], data[6]].filter(Boolean),

      // column G (7): correct answers → supports "A, C" or "1,3"
      // Convert to string, split by comma, trim, remove blanks
      correctAnswer: String(data[7] ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),

      // column H (8): Explanation text
      explanation: data[8],

      // column I (9): Question Type (Single_Choice / Multi_Choice / T/F)
      questionType: data[9],

      // column J (10): Difficulty
      difficulty: data[10],

      // column K (11): Marks
      marks: data[11],

      // column L (12): Tasks/Tags (you store it in both fields)
      tasks: rawTagsOrTasks,
      tags: rawTagsOrTasks, // backward compatibility

      // column M (13): Subtag
      subtag: data[13],

      // column N (14): Approach
      approach: data[14],

      // column O (15): Performance Domain
      performanceDomain: data[15],

      // column P (16): Exam name/context
      exam: data[16],
    });
  });

  // ----------------------------------------------------------
  // Return all parsed rows
  // ----------------------------------------------------------
  return rows;
}

module.exports = parseExcel;
