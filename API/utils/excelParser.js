// utils/excelParser.js
const XLSX = require("xlsx");

function norm(h) {
  return String(h || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");
}
function pick(map, key) {
  return map[norm(key)];
}

function letterOrIndexToOneBased(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  if (/^[a-f]$/i.test(s)) return s.toUpperCase().charCodeAt(0) - 64; // A->1
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return null;
}
function splitMulti(val) {
  if (val == null) return [];
  return String(val)
    .split(/[,\s;]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function extractExcelData(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  // Build a header lookup that tolerates case/space/underscore differences
  const first = rowsRaw[0] || {};
  const map = {};
  Object.keys(first).forEach((k) => {
    map[norm(k)] = k;
  });
  const col = (name) => pick(map, name);

  const rows = [];
  const sections = [];
  let lastSectionLabel = null;
  let serialCursor = 0;
  let totalMarks = 0;

  for (let i = 0; i < rowsRaw.length; i++) {
    const raw = rowsRaw[i];

    // Question text (required to consider this row a question)
    const qText = String(raw[col("Question")] || "").trim();
    if (!qText) continue; // skip blank rows

    // Type
    const qType = String(raw[col("QuestionType")] || "Single_Choice").trim();

    // Options: Option1..Option6
    const options = [1, 2, 3, 4, 5, 6]
      .map((n) => String(raw[col(`Option${n}`)] || "").trim())
      .filter(Boolean);

    // Marks (+ negative)
    const marks = Number(raw[col("Marks")] || 1) || 1;
    const negativeMark = Number(raw[col("NegativeMark")] || 0) || 0;

    // Original Excel SectionName (kept distinctly to avoid confusion)
    const excelSectionName = String(raw[col("SectionName")] || "").trim() || null;

    // UI section label the editor will use; fallback to Performance Domain if SectionName is empty
    const uiSection =
      excelSectionName ||
      String(raw[col("PerformanceDomain")] || raw[col("Performance Domain")] || "").trim() ||
      null;

    // Correct answer(s)
    const correctRaw = raw[col("CorrectOption")];
    let correct; // original (1-based number / array / {terms,definitions,key})
    let answer = null; // normalized 0-based index for Single_Choice only

    if (/^Multi_Choice$/i.test(qType)) {
      const parts = splitMulti(correctRaw)
        .map(letterOrIndexToOneBased)
        .filter(Number.isInteger);
      correct = Array.from(new Set(parts)).sort((a, b) => a - b); // keep 1-based
      answer = null; // editor handles single-choice 'answer'; we keep multi as 'correct'
    } else if (
      /^Single_Choice$/i.test(qType) ||
      /^True\/?False$/i.test(qType) ||
      /^Fill_In_The_Blank$/i.test(qType)
    ) {
      const oneBased = letterOrIndexToOneBased(correctRaw);
      correct = oneBased; // keep 1-based for fidelity
      answer = Number.isInteger(oneBased) ? Math.max(0, oneBased - 1) : null; // 0-based for UI
    } else if (/^Drag_And_Drop$/i.test(qType)) {
      const terms = [],
        definitions = [],
        key = [];
      for (let j = 1; j <= 20; j++) {
        const t = String(raw[col(`Term${j}`)] || "").trim();
        const d = String(raw[col(`Definition${j}`)] || "").trim();
        const m = String(raw[col(`Match${j}`)] || "").trim();
        if (!t && !d && !m) break;
        if (t) terms.push(t);
        if (d) definitions.push(d);
        if (m) key.push(m);
      }
      correct = { terms, definitions, key };
      answer = null;
    }

    // Other metadata
    const explanation = String(raw[col("AnswerExplanation")] || raw[col("Explanation")] || "").trim();
    const difficulty =
      String(raw[col("DIFFICULTY")] || raw[col("Difficulty")] || raw[col("Level")] || "").trim() ||
      null;
    const task = String(raw[col("Task")] || "").trim() || null;
    const approach = String(raw[col("Approach")] || "").trim() || null;
    const domain = String(raw[col("Domain")] || "").trim() || null;
    const performanceDomain =
      String(raw[col("PerformanceDomain")] || raw[col("Performance Domain")] || "").trim() || null;

    // SerialNo (useful for stable IDs if provided)
    const serialNo = String(raw[col("SerialNo")] || "").trim();
    const id = serialNo ? `q_${serialNo}` : `q_${i + 1}`;

    // sequencing
    serialCursor += 1;
    totalMarks += marks;

    if (uiSection && uiSection !== lastSectionLabel) {
      sections.push({ name: uiSection, start: serialCursor });
      lastSectionLabel = uiSection;
    }

    // Build the row with canonical fields + original fidelity
    rows.push({
      // canonical fields used by the editor/UI
      id,
      instruction: String(raw[col("Instruction")] || raw[col("AnswerInstruction")] || "").trim(),
      question: qText,
      section: uiSection, // what the UI reads
      difficulty,
      marks,
      negativeMark,
      explanation,
      options,
      answer, // 0-based for single choice

      // fidelity/originals (kept distinct to avoid confusion)
      excelSectionName, // the exact value of the Excel "SectionName" column
      questionType: qType,
      questionText: qText,
      correct, // original correct representation
      task,
      approach,
      domain,
      performanceDomain,
      serialNo: serialNo || null,

      // full raw row for debugging/backfill if needed
      meta: { raw },
    });
  }

  // finalize section ranges
  sections.forEach((s, i) => {
    const nextStart = sections[i + 1]?.start || rows.length + 1;
    s.count = nextStart - s.start;
    s.end = s.start + s.count - 1;
  });

  // Also provide a simple distinct name list for filters
  const sectionNames = Array.from(new Set(rows.map((r) => r.section).filter(Boolean)));

  return {
    rows,
    summary: {
      totalQuestions: rows.length,
      totalMarks,
      sections: sections.map(({ name, start, end, count }) => ({
        name,
        startSerial: start,
        endSerial: end,
        count,
      })),
      sectionNames,
    },
  };
}

module.exports = { extractExcelData };
