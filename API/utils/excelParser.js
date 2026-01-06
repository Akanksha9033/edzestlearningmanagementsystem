// utils/excelParser.js
const XLSX = require("xlsx");

/* ======================================================================
   HELPERS (UNCHANGED)
====================================================================== */

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

/* ======================================================================
   MAIN PARSER
====================================================================== */

function extractExcelData(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  // Header map (tolerant)
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

    const qText = String(raw[col("Question")] || "").trim();
    if (!qText) continue;

    const qType = String(raw[col("QuestionType")] || "Single_Choice").trim();
    // ✅ DEBUG (1 minute only)
console.log("---- DEBUG ROW ----");
console.log("Q:", qText);
console.log("QuestionType:", qType);
console.log("CorrectOption cell value:", raw[col("CorrectOption")]);
console.log("Row keys:", Object.keys(raw));
console.log("-------------------");


    const options = [1, 2, 3, 4, 5, 6]
      .map((n) => String(raw[col(`Option${n}`)] || "").trim())
      .filter(Boolean);

    const marks = Number(raw[col("Marks")] || 1) || 1;
    const negativeMark = Number(raw[col("NegativeMark")] || 0) || 0;

    const excelSectionName =
      String(raw[col("SectionName")] || "").trim() || null;

    const uiSection =
      excelSectionName ||
      String(
        raw[col("PerformanceDomain")] ||
          raw[col("Performance Domain")] ||
          ""
      ).trim() ||
      null;

    /* ===================== CORRECT ANSWER FIX ===================== */

    const correctRaw =
  raw[col("CorrectOption")] ??
  raw[col("Correct Option")] ??
  raw[col("CorrectOptions")] ??
  raw[col("Correct Options")] ??
  raw[col("CorrectAnswer")] ??
  raw[col("Correct Answer")] ??
  raw[col("Answer")] ??
  null;

    let correct;
    let answer = null;

    // Multi choice
if (/multi/i.test(qType)) {

  const rawParts = splitMulti(correctRaw);

  if (!rawParts.length) {
    console.warn("❌ MULTI_Choice WITHOUT CorrectOption:", qText);
    correct = null;              // 🔥 VERY IMPORTANT
  } else {
    const parts = rawParts
      .map(letterOrIndexToOneBased)
      .filter(Number.isInteger)
      .map((n) => n - 1)
      .filter((n) => n >= 0);

    correct = parts.length
      ? Array.from(new Set(parts)).sort((a, b) => a - b)
      : null;
  }

  answer = null;
}



    // Single / TF / Fill blank
    else if (
      /^Single_Choice$/i.test(qType) ||
      /^True\/?False$/i.test(qType) ||
      /^Fill_In_The_Blank$/i.test(qType)
    ) {
      const oneBased = letterOrIndexToOneBased(correctRaw);
      const zeroBased = Number.isInteger(oneBased)
        ? Math.max(0, oneBased - 1)
        : null;

      // 🔒 FIX: store BOTH as 0-based
      correct = zeroBased;
      answer = zeroBased;
    }

    // Drag & Drop
    else if (/^Drag_And_Drop$/i.test(qType)) {
      const terms = [];
      const definitions = [];
      const key = [];

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

    /* ===================== METADATA (UNCHANGED) ===================== */

    const explanation =
      String(
        raw[col("AnswerExplanation")] || raw[col("Explanation")] || ""
      ).trim();

    const difficulty =
      String(
        raw[col("DIFFICULTY")] ||
          raw[col("Difficulty")] ||
          raw[col("Level")] ||
          ""
      ).trim() || null;

    const task = String(raw[col("Task")] || "").trim() || null;
    const approach = String(raw[col("Approach")] || "").trim() || null;
    const domain = String(raw[col("Domain")] || "").trim() || null;

    const performanceDomain =
      String(
        raw[col("PerformanceDomain")] ||
          raw[col("Performance Domain")] ||
          ""
      ).trim() || null;

    const serialNo = String(raw[col("SerialNo")] || "").trim();
    const id = serialNo ? `q_${serialNo}` : `q_${i + 1}`;

    serialCursor += 1;
    totalMarks += marks;

    if (uiSection && uiSection !== lastSectionLabel) {
      sections.push({ name: uiSection, start: serialCursor });
      lastSectionLabel = uiSection;
    }

    rows.push({
      id,
      instruction: String(
        raw[col("Instruction")] || raw[col("AnswerInstruction")] || ""
      ).trim(),
      question: qText,
      section: uiSection,
      difficulty,
      marks,
      negativeMark,
      explanation,
      options,
      answer,

      excelSectionName,
      questionType: qType,
      questionText: qText,
      correct,
      task,
      approach,
      domain,
      performanceDomain,
      serialNo: serialNo || null,

      meta: { raw },
    });
  }

  /* ===================== SECTION FINALIZE ===================== */

  sections.forEach((s, i) => {
    const nextStart = sections[i + 1]?.start || rows.length + 1;
    s.count = nextStart - s.start;
    s.end = s.start + s.count - 1;
  });

  const sectionNames = Array.from(
    new Set(rows.map((r) => r.section).filter(Boolean))
  );

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
