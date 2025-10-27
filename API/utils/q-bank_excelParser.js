// const ExcelJS = require("exceljs");

// async function parseExcel(filePath) {
//   const workbook = new ExcelJS.Workbook();
//   await workbook.xlsx.readFile(filePath);
//   const sheet = workbook.worksheets[0]; // first sheet

//   const rows = [];
//   sheet.eachRow((row, rowNumber) => {
//     if (rowNumber === 1) return; // skip header
//     const data = row.values;

//     rows.push({
//       questionText: data[1],
//       options: [data[2], data[3], data[4], data[5], data[6]].filter(Boolean),
//       correctAnswer: String(data[7]).split(",").map(v => v.trim()),
//       explanation: data[8],
//       questionType: data[9],
//       difficulty: data[10],
//       marks: data[11],
//       tags: data[12],                // ✅ Excel column "Topic/Tags"
//       subtag: data[13],
//       approach: data[14],
//       performanceDomain: data[15],
//       exam: data[16],
//     });
//   });

//   return rows;
// }

// module.exports = parseExcel;


const ExcelJS = require("exceljs");

async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0]; // first sheet

  const rows = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const data = row.values; // 1-based indexing in ExcelJS: A=1, B=2, ...

    const rawTagsOrTasks = data[12]; // column for Topic/Tags/Tasks (positional)

    rows.push({
      questionText: data[1],
      options: [data[2], data[3], data[4], data[5], data[6]].filter(Boolean),

      // guard against blank -> no ["undefined"]
      correctAnswer: String(data[7] ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),

      explanation: data[8],
      questionType: data[9],
      difficulty: data[10],
      marks: data[11],

      // ✅ primary: tasks (and keep tags mirrored for backward-compat)
      tasks: rawTagsOrTasks,
      tags: rawTagsOrTasks,

      subtag: data[13],
      approach: data[14],
      performanceDomain: data[15],
      exam: data[16],
    });
  });

  // ✅ return AFTER the loop so you include all rows
  return rows;
}

module.exports = parseExcel;
