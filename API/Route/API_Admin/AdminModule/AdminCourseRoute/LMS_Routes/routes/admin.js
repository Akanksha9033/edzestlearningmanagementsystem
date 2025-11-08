// const express = require("express");
// const multer = require("multer");
// const xlsx = require("xlsx");
// const mongoose = require("mongoose");
// const router = express.Router();

// const StudentTestData = require('../models/StudentTestData');
// const { verifyToken, verifyRole } = require("../middleware/auth");
// const nodemailer = require("nodemailer");
// const MockTest = require("../models/MockTest");

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// const validQuestionTypes = [
//   "Single-Select",
//   "Multi-Select",
//   "Fill in the Blanks",
//   "True/False",
//   "Drag and Drop",
// ];

// function normalizeQuestionType(type) {
//   const cleaned = (type || "").trim().toLowerCase();
//   if (cleaned === "drag and drop") return "Drag and Drop";
//   if (cleaned === "single-select") return "Single-Select";
//   if (cleaned === "multi-select") return "Multi-Select";
//   if (cleaned === "fill in the blanks") return "Fill in the Blanks";
//   if (cleaned === "true/false" || cleaned === "true-false") return "True/False";
//   return "Single-Select";
// }

// function normalizeCorrectAnswer(rawAnswer, questionType) {
//   if (!rawAnswer) return [];

//   if (questionType === "Multi-Select") {
//     return rawAnswer
//       .toString()
//       .split(",")
//       .map((val) => val.trim().toUpperCase()); // e.g., "A,C" → ["A", "C"]
//   }

//   return [rawAnswer.toString().trim().toUpperCase()]; // e.g., "B" → ["B"]
// }


// function shuffleArray(array) {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// }


// function formatQuestions(sheetData) {
//   const answerLetters = ["A", "B", "C", "D", "E"];
//   let currentSection = "General";

//   return sheetData
//     .map((row, index) => {
//       const isSectionRow =
//         row["Question"] &&
//         !row["Question Type"] &&
//         !row["Option A"] &&
//         !row["Correct Answer"];

//       if (isSectionRow) {
//         currentSection = row["Question"].trim();
//         return null;
//       }

//       if (!row["Question Type"] || !row["Question"]) return null;

//       const rawType = row["Question Type"];
//       const questionType = normalizeQuestionType(rawType);
//       const isDragDrop = questionType === "Drag and Drop";
//       const hasAnswer = row["Correct Answer"] || isDragDrop;
//       if (!hasAnswer) return null;

//       const tags = typeof row["Tags"] === "string"
//         ? row["Tags"]
//             .split(",")
//             .map(tag => tag.trim())
//             .filter(tag => tag.length > 0)
//         : [];

//       const baseQuestion = {
//         questionNumber: row["Question Number"] || index + 1,
//         question: row["Question"] ? row["Question"].toString().trim() : "",
//         questionType,
//         explanation: row["Explanation"] ? row["Explanation"].toString().trim() : "No explanation provided",
//         tags,
//         difficulty: row["Difficulty"] ? row["Difficulty"].toString().trim() : "Medium",
//         marks: Number(row["Marks"]) || 1,
//         time: Number(row["Time (minutes)"]) || 30,
//         section: currentSection.trim().toLowerCase(),
//         subtag: row["Subtag"] ? row["Subtag"].toString().trim() : "",
//         approach: row["Approach"] ? row["Approach"].toString().trim() : "",
//         performanceDomain: row["Performance Domains"] ? row["Performance Domains"].toString().trim() : "",
//       };

//       console.log("📝 Parsed subtag:", baseQuestion.subtag, "for Q", baseQuestion.question);

//       if (isDragDrop) {
//         const terms = [row["Term1"], row["Term2"], row["Term3"], row["Term4"]].filter(Boolean);

//         const definitions = ["Definition1", "Definition2", "Definition3", "Definition4"]
//           .map((key, i) => {
//             return row[key]
//               ? {
//                   text: row[key].trim(),
//                   match: row[`Match${i + 1}`]?.trim() || "",
//                 }
//               : null;
//           })
//           .filter(Boolean);

//         return {
//           ...baseQuestion,
//           terms,
//           definitions,
//           answer: definitions.map((d) => d.match),
//           correctAnswer: definitions.map((d) => d.match), // ✅ Add correctAnswer explicitly
//         };
//       }

//       const options = answerLetters
//         .map((letter) => {
//           const opt = row[`Option ${letter}`];
//           return opt ? { label: letter, text: opt.trim() } : null;
//         })
//         .filter(Boolean);

//       const normalizedAnswer = normalizeCorrectAnswer(row["Correct Answer"], questionType);

//       return {
//         ...baseQuestion,
//         options,
//         correctAnswer: normalizedAnswer, // ✅ Make sure correctAnswer is assigned
//         answer: normalizedAnswer,
//       };
//     })
//     .filter(Boolean);
// }



// router.post("/upload", upload.single("file"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const rawData = xlsx.utils.sheet_to_json(sheet);

//     const errors = [];

//     rawData.forEach((row, index) => {
//       const rowNumber = index + 2;
//       const questionType = row["Question Type"]?.toString().trim().toLowerCase();
//       const questionText = row["Question"]?.toString().toLowerCase();

//       if (Object.values(row).every((v) => !v || v.toString().trim() === "")) return;

//       const isSectionRow =
//         questionText?.startsWith("section") &&
//         Object.values(row).filter((v) => v && v.toString().trim() !== "").length === 1;
//       if (isSectionRow) return;

//       const requiredFields = [
//         "Question Number",
//         "Question Type",
//         "Question",
//         "Correct Answer",
//         "Explanation",
//         "Tags",
//         "Difficulty",
//         "Marks",
//         "Subtag",                // ✅ added
//   "Approach",              // ✅ added
//   "Performance Domains"  
        
//       ];

//       requiredFields.forEach((field) => {
//         // ✅ Skip 'Correct Answer' only for Drag and Drop
//         if (field === "Correct Answer" && questionType === "drag and drop") return;

//         if (!row[field] || row[field].toString().trim() === "") {
//           errors.push(`Row ${rowNumber}: "${field}" is missing or empty`);
//         }

//         if (!row[field] || row[field].toString().trim() === "") {
//         if (["Subtag", "Approach", "Performance Domains"].includes(field)) {
//           errors.push(`Row ${rowNumber}: "${field}" is required for analytics and reporting`);
//         } else {
//           errors.push(`Row ${rowNumber}: "${field}" is missing or empty`);
//         }
// }

//       });

//       const optionKeys = Object.keys(row).filter((k) => /^Option\s?[A-Z]$/i.test(k));
//       const filledOptions = optionKeys.filter((key) => row[key] && row[key].toString().trim() !== "");

//       if (
//         ["single-select", "multi-select", "true/false", "fill in the blanks"].includes(questionType) &&
//         filledOptions.length < 2
//       ) {
//         errors.push(`Row ${rowNumber}: At least 2 options required`);
//       }

//       if (questionType === "drag and drop") {
//         const termKeys = Object.keys(row).filter((k) => /^Term\d+$/i.test(k));
//         const matchKeys = Object.keys(row).filter((k) =>
//           /^Match\d+$/i.test(k) || /^Definition\d+$/i.test(k)
//         );

//         const validTerms = termKeys.filter((k) => row[k]?.toString().trim());
//         const validMatches = matchKeys.filter((k) => row[k]?.toString().trim());

//         if (validTerms.length === 0 || validMatches.length === 0) {
//           errors.push(`Row ${rowNumber}: Drag and Drop must include at least one Term and one Match/Definition`);
//         }
//       }
//     });

//     if (errors.length > 0) {
//       return res.status(400).json({ message: "Validation failed", errors });
//     }

//     const formattedQuestions = formatQuestions(rawData);
//     res.json({ message: "File processed successfully", data: formattedQuestions });
//   } catch (error) {
//     console.error("Error processing file:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });



// router.post("/mock-tests", verifyToken, verifyRole(["admin", "SuperAdmin", "teacher"]), async (req, res) => {
//   try {
//     const { title, price, isFree, excelFile, wallpaper, duration, security, status } = req.body;

//     if (!title || !excelFile || !duration) {
//       return res.status(400).json({ message: "Title, duration, and Excel file are required" });
//     }

//     if (!excelFile || !excelFile.includes(",")) {
//       return res.status(400).json({ message: "Excel file is missing or badly formatted" });
//     }

//     const base64Data = excelFile.split(",")[1];
//     const binaryData = Buffer.from(base64Data, "base64");
//     const workbook = xlsx.read(binaryData, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const rawData = xlsx.utils.sheet_to_json(sheet);
//     const questions = formatQuestions(rawData);

//     const mockTest = new MockTest({
//       title,
//       price,
//       isFree,
//       duration,
//       questions,
//       wallpaper: wallpaper || null,
//       security: security || "none",                   // ✅ added
//       status: status || "draft",                      // ✅ updated default logic
//       instituteName: req.user.instituteName,
//       instituteId: req.user.instituteId,
//       createdBy: req.user.id,
//     });

//     await mockTest.save();

//     try {
//       const students = await mongoose.model("User").find({
//         role: "Student",
//         instituteId: req.user.instituteId,
//       }).select("name email");

//       const emails = students.map((s) => s.email);

//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       if (emails.length === 0) {
//         console.warn("⚠ No valid student emails found, skipping email send.");
//       } else {
//         const mailOptions = {
//           from: `"Edzest Education" <${process.env.EMAIL_USER}>`,
//           to: emails,
//           subject: "New Mock Test Available!",
//           html: `
//             <p>Dear Student,</p>
//             <p>A new mock test titled <strong>${title}</strong> has been added to the Edzest platform.</p>
//             <p>🕒 Duration: ${duration} minutes</p>
//             <p>Please log in and start preparing now.</p>
//             <br />
//             <a href="http://localhost:3000/student-dashboard" target="_blank">Go to Dashboard</a>
//             <br/><br/>
//             <p>Best of luck!</p>
//             <p>— Edzest Team</p>
//           `,
//         };

//         await transporter.sendMail(mailOptions); // ✅ only if emails exist
//       }
//     } catch (emailError) {
//       console.error("❌ Failed to send test notification email:", emailError);
//     }

//     res.status(201).json({ message: "Mock test created successfully", mockTest });
//   } catch (error) {
//     console.error("❌ Error creating mock test:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// router.get("/mock-tests", verifyToken, verifyRole(["admin", "superadmin", "teacher"]), async (req, res) => {
//   try {
//     let filter = {};

//     if (req.user.role.toLowerCase() === "superadmin") {
//       // SuperAdmin sees all tests
//       filter = {};
//     } 
//     else if (req.user.role.toLowerCase() === "admin") {
//       // Admin sees only tests of their institute
//       filter = {
//         instituteId: req.user.instituteId,
//         createdBy: req.user.id // ✅ Make sure Admin only sees tests they created
//       };
//     } 
//     else if (req.user.role.toLowerCase() === "teacher") {
//       const teacher = await mongoose.model("User").findById(req.user.id);

//       filter = {
//         instituteId: teacher.instituteId,
//         $or: [
//           { createdBy: teacher._id },
//           { createdBy: teacher.createdBy } // Admin who created this teacher
//         ]
//       };
//     }

//     const mockTests = await MockTest.find(filter).populate("createdBy", "name email");
//     res.json(mockTests);

//   } catch (err) {
//     console.error("❌ Error fetching mock tests:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });




// // ✅ Get one mock test by ID
// router.get("/mock-tests/:testId", async (req, res) => {
//   const { testId } = req.params;
//   try {
//     const mockTest = await MockTest.findById(testId);
//     if (!mockTest) {
//       return res.status(404).json({ message: "Mock test not found" });
//     }
//     res.json(mockTest);
//   } catch (error) {
//     console.error("Error fetching mock test:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ Update a single question in a mock test
// router.put("/api/mock-tests/:testId/questions/:questionId", async (req, res) => {
//   try {
//     const { testId, questionId } = req.params;
//     const updatedData = req.body;

//     const mockTest = await MockTest.findById(testId);
//     if (!mockTest) {
//       return res.status(404).json({ message: "Mock test not found" });
//     }

//     const question = mockTest.questions.id(questionId);
//     if (!question) {
//       return res.status(404).json({ message: "Question not found" });
//     }

//     for (let key in updatedData) {
//       if (key === "options") {
//         question.options = [];
//         updatedData.options.forEach(opt => question.options.push(opt));
//         question.markModified("options");
//       } else if (key === "definitions") {
//         question.definitions = [];
//         updatedData.definitions.forEach(def => question.definitions.push(def));
//         question.markModified("definitions");
//       } else {
//         question[key] = updatedData[key];
//       }
//     }

//     await mockTest.save();
//     res.json({
//       message: "Question updated",
//       updatedQuestion: question.toObject({ depopulate: true }),
//     });
//   } catch (error) {
//     console.error("Error updating question:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // DELETE a mock test by ID
// router.delete("/mock-tests/:testId", async (req, res) => {
//   const { testId } = req.params;

//   try {
//     const deletedTest = await MockTest.findByIdAndDelete(testId);

//     if (!deletedTest) {
//       return res.status(404).json({ message: "Mock test not found" });
//     }

//     res.status(200).json({
//       message: "Mock test deleted successfully",
//       deletedTest,
//     });
//   } catch (error) {
//     console.error("Error deleting mock test:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // ✅ Toggle mock test status (active/inactive)
// router.patch("/mock-tests/:id/status", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!["active", "inactive"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     const updated = await MockTest.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Mock test not found" });
//     }

//     res.status(200).json({ message: "Mock test status updated", updated });
//   } catch (error) {
//     console.error("Error updating test status:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // POST: Submit or Update Test Data
// // router.post('/api/studentTestData/submit-test', verifyToken, async (req, res) => {

// //   const { userId, testId, answers, score } = req.body;

// //   try {
// //     const attempts = await StudentTestData.countDocuments({ userId, testId });

// //     if (attempts >= 20) {
// //       return res.status(400).json({ error: 'Maximum 3 attempts reached.' });
// //     }

// //     let testAttempt = await StudentTestData.findOne({ userId, testId, status: 'in-progress' });

// //     if (testAttempt) {
// //       testAttempt.answers = answers;
// //       testAttempt.score = score;
// //       testAttempt.status = 'completed';
// //       testAttempt.completedAt = new Date();
// //       await testAttempt.save();
// //       return res.status(200).json({ message: 'Test attempt updated.', attempt: testAttempt });
// //     }

// //     const newAttempt = new StudentTestData({
// //       userId,
// //       testId,
// //       answers,
// //       score,
// //       attemptNumber: attempts + 1,
// //       status: 'completed',
// //       completedAt: new Date(),
// //       instituteId: req.user.instituteId
// //     });

// //     await newAttempt.save();
// //     return res.status(201).json({ message: 'New test attempt saved.', attempt: newAttempt });
// //   } catch (err) {
// //     console.error('Error:', err.message);
// //     return res.status(500).json({ error: 'Internal server error.' });
// //   }
// // });


// // POST /api/studentTestData/submit-test
// router.post(
//   "/api/studentTestData/submit-test",
//   verifyToken,
//   verifyRole(["Student"]), // ✅ only students can submit
//   async (req, res) => {
//     try {
//       // ⛔️ Do NOT accept userId from body
//       const userId = req.user.id; // ✅ enforce self
//       const { testId, answers, score } = req.body;

//       if (!testId) {
//         return res.status(400).json({ error: "testId is required" });
//       }

//       // --- your existing logic begins (unchanged) ---
//       // Example: check prior attempts
//       const priorAttempts = await StudentTestData.countDocuments({ userId, testId });

//       // Keep your original numeric limit; just fix the message to match the number
//       const MAX_ATTEMPTS = 20; // ← keep as-is if you already use 20 elsewhere
//       if (priorAttempts >= MAX_ATTEMPTS) {
//         return res
//           .status(400)
//           .json({ error: `Maximum ${MAX_ATTEMPTS} attempts reached.` }); // ✅ message matches limit
//       }

//       // Save attempt
//       const attempt = new StudentTestData({
//         userId,
//         testId,
//         answers,
//         score,
//         status: "submitted",
//         completedAt: new Date(),
//       });

//       await attempt.save();

//       // (If you already compute analytics/accuracy/etc., keep that code here unchanged)

//       return res.status(200).json({
//         message: "Test submitted successfully",
//         resultId: attempt._id, // keep your original response fields
//       });
//       // --- your existing logic ends (unchanged) ---
//     } catch (err) {
//       console.error("Submit-test error:", err);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//   }
// );


// // GET: All attempts for a student (admin/teacher/management)
// router.get('/api/studentTestData/:studentId', async (req, res) => {
//   try {
//     const studentId = req.params.studentId;
//     const data = await StudentTestData.find({ userId: studentId }).sort({ createdAt: -1 });
//     res.status(200).json(data);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch student test data.' });
//   }
// });


// // ✅ GET: Dashboard Overview (Admin + SuperAdmin)
// router.get("/overview", verifyToken, verifyRole(["Admin", "SuperAdmin"]), async (req, res) => {
//   try {
//     let userFilter = {};
//     let testFilter = {};
//     let attemptFilter = {};

//     if (req.user.role === "Admin") {
//       userFilter = { instituteId: req.user.instituteId   };
//       testFilter = { instituteId: req.user.instituteId };
//       attemptFilter = { instituteId: req.user.instituteId }; // Only their students’ test attempts
//     }

//     const userCount = await mongoose.model("User").countDocuments(userFilter);
//     const testCount = await mongoose.model("MockTest").countDocuments(testFilter);
//     const attemptCount = await mongoose.model("StudentTestData").countDocuments(attemptFilter);

//     res.json({
//       users: userCount,
//       mockTests: testCount,
//       testAttempts: attemptCount,
//     });
//   } catch (error) {
//     console.error("Dashboard overview error:", error.message);
//     res.status(500).json({ message: "Failed to fetch dashboard data" });
//   }
// });


// router.get("/student-visible-tests", verifyToken, verifyRole(["Student"]), async (req, res) => {
//   try {
//     const student = await mongoose.model("User").findById(req.user.id).select("createdBy instituteName");

//     // ✅ Case 1: Student is NOT assigned to an admin (createdBy is null)
//     if (!student?.createdBy) {
//       const allTests = await mongoose.model("MockTest").find({
//   status: "active",
//   $or: [
//     { instituteId: req.user.instituteId },
//     { instituteName: req.user.instituteName }
//   ]
// });
//       return res.status(200).json(allTests);
//     }

//     // ✅ Case 2: Student is assigned → get their Admin + Teachers
//     const teachers = await mongoose.model("User").find({
//       role: "Teacher",
//       createdBy: student.createdBy
//     });

//     const teacherIds = teachers.map(t => t._id);

//     const tests = await mongoose.model("MockTest").find({
//       createdBy: { $in: [student.createdBy, ...teacherIds] },
//       status: "active"
//     });

//     res.status(200).json(tests);
//   } catch (error) {
//     console.error("❌ Error in student-visible-tests:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// // ✅ NEW: Route for Admin to fetch only their created users (for My Users page)
// router.get("/users", verifyToken, verifyRole(["Admin"]), async (req, res) => {
//   try {
//     const users = await mongoose.model("User").find({ instituteId: req.user.instituteId });
//     res.status(200).json(users);
//   } catch (error) {
//     console.error("Error fetching users for admin:", error);
//     res.status(500).json({ message: "Failed to fetch users" });
//   }
// });


// module.exports = router;





// routes/<your-file>.js
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const mongoose = require("mongoose");
const router = express.Router();

// const StudentTestData = require('../models/StudentTestData');
// const MockTest = require("../models/MockTest");

// ✅ NEW auth middleware (replaces verifyToken/verifyRole)
const { authAccess, requireRoles } = require("../middleware/auth");

// ✅ Use centralized mailer helper (no local transporter here)
const { sendEmail } = require("../utils/mailer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const validQuestionTypes = [
  "Single-Select",
  "Multi-Select",
  "Fill in the Blanks",
  "True/False",
  "Drag and Drop",
];

function normalizeQuestionType(type) {
  const cleaned = (type || "").trim().toLowerCase();
  if (cleaned === "drag and drop") return "Drag and Drop";
  if (cleaned === "single-select") return "Single-Select";
  if (cleaned === "multi-select") return "Multi-Select";
  if (cleaned === "fill in the blanks") return "Fill in the Blanks";
  if (cleaned === "true/false" || cleaned === "true-false") return "True/False";
  return "Single-Select";
}

function normalizeCorrectAnswer(rawAnswer, questionType) {
  if (!rawAnswer) return [];

  if (questionType === "Multi-Select") {
    return rawAnswer
      .toString()
      .split(",")
      .map((val) => val.trim().toUpperCase()); // e.g., "A,C" → ["A", "C"]
  }

  return [rawAnswer.toString().trim().toUpperCase()]; // e.g., "B" → ["B"]
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatQuestions(sheetData) {
  const answerLetters = ["A", "B", "C", "D", "E"];
  let currentSection = "General";

  return sheetData
    .map((row, index) => {
      const isSectionRow =
        row["Question"] &&
        !row["Question Type"] &&
        !row["Option A"] &&
        !row["Correct Answer"];

      if (isSectionRow) {
        currentSection = row["Question"].trim();
        return null;
      }

      if (!row["Question Type"] || !row["Question"]) return null;

      const rawType = row["Question Type"];
      const questionType = normalizeQuestionType(rawType);
      const isDragDrop = questionType === "Drag and Drop";
      const hasAnswer = row["Correct Answer"] || isDragDrop;
      if (!hasAnswer) return null;

      const tags = typeof row["Tags"] === "string"
        ? row["Tags"]
            .split(",")
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        : [];

      const baseQuestion = {
        questionNumber: row["Question Number"] || index + 1,
        question: row["Question"] ? row["Question"].toString().trim() : "",
        questionType,
        explanation: row["Explanation"] ? row["Explanation"].toString().trim() : "No explanation provided",
        tags,
        difficulty: row["Difficulty"] ? row["Difficulty"].toString().trim() : "Medium",
        marks: Number(row["Marks"]) || 1,
        time: Number(row["Time (minutes)"]) || 30,
        section: currentSection.trim().toLowerCase(),
        subtag: row["Subtag"] ? row["Subtag"].toString().trim() : "",
        approach: row["Approach"] ? row["Approach"].toString().trim() : "",
        performanceDomain: row["Performance Domains"] ? row["Performance Domains"].toString().trim() : "",
      };

      console.log("📝 Parsed subtag:", baseQuestion.subtag, "for Q", baseQuestion.question);

      if (isDragDrop) {
        const terms = [row["Term1"], row["Term2"], row["Term3"], row["Term4"]].filter(Boolean);

        const definitions = ["Definition1", "Definition2", "Definition3", "Definition4"]
          .map((key, i) => {
            return row[key]
              ? {
                  text: row[key].trim(),
                  match: row[`Match${i + 1}`]?.trim() || "",
                }
              : null;
          })
          .filter(Boolean);

        return {
          ...baseQuestion,
          terms,
          definitions,
          answer: definitions.map((d) => d.match),
          correctAnswer: definitions.map((d) => d.match), // ✅ explicit
        };
      }

      const options = answerLetters
        .map((letter) => {
          const opt = row[`Option ${letter}`];
          return opt ? { label: letter, text: opt.trim() } : null;
        })
        .filter(Boolean);

      const normalizedAnswer = normalizeCorrectAnswer(row["Correct Answer"], questionType);

      return {
        ...baseQuestion,
        options,
        correctAnswer: normalizedAnswer,
        answer: normalizedAnswer,
      };
    })
    .filter(Boolean);
}

/* -------------------------- Excel Upload (memory) -------------------------- */
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    const errors = [];

    rawData.forEach((row, index) => {
      const rowNumber = index + 2;
      const questionType = row["Question Type"]?.toString().trim().toLowerCase();
      const questionText = row["Question"]?.toString().toLowerCase();

      if (Object.values(row).every((v) => !v || v.toString().trim() === "")) return;

      const isSectionRow =
        questionText?.startsWith("section") &&
        Object.values(row).filter((v) => v && v.toString().trim() !== "").length === 1;
      if (isSectionRow) return;

      const requiredFields = [
        "Question Number",
        "Question Type",
        "Question",
        "Correct Answer",
        "Explanation",
        "Tags",
        "Difficulty",
        "Marks",
        "Subtag",
        "Approach",
        "Performance Domains"
      ];

      requiredFields.forEach((field) => {
        // Skip 'Correct Answer' only for Drag and Drop
        if (field === "Correct Answer" && questionType === "drag and drop") return;

        if (!row[field] || row[field].toString().trim() === "") {
          if (["Subtag", "Approach", "Performance Domains"].includes(field)) {
            errors.push(`Row ${rowNumber}: "${field}" is required for analytics and reporting`);
          } else {
            errors.push(`Row ${rowNumber}: "${field}" is missing or empty`);
          }
        }
      });

      const optionKeys = Object.keys(row).filter((k) => /^Option\s?[A-Z]$/i.test(k));
      const filledOptions = optionKeys.filter((key) => row[key] && row[key].toString().trim() !== "");

      if (
        ["single-select", "multi-select", "true/false", "fill in the blanks"].includes(questionType) &&
        filledOptions.length < 2
      ) {
        errors.push(`Row ${rowNumber}: At least 2 options required`);
      }

      if (questionType === "drag and drop") {
        const termKeys = Object.keys(row).filter((k) => /^Term\d+$/i.test(k));
        const matchKeys = Object.keys(row).filter((k) =>
          /^Match\d+$/i.test(k) || /^Definition\d+$/i.test(k)
        );

        const validTerms = termKeys.filter((k) => row[k]?.toString().trim());
        const validMatches = matchKeys.filter((k) => row[k]?.toString().trim());

        if (validTerms.length === 0 || validMatches.length === 0) {
          errors.push(`Row ${rowNumber}: Drag and Drop must include at least one Term and one Match/Definition`);
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const formattedQuestions = formatQuestions(rawData);
    res.json({ message: "File processed successfully", data: formattedQuestions });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------------- Create Mock Test -------------------------- */
router.post(
  "/mock-tests",
  authAccess,
  requireRoles(["Admin", "SuperAdmin", "Teacher"]),
  async (req, res) => {
    try {
      const { title, price, isFree, excelFile, wallpaper, duration, security, status } = req.body;

      if (!title || !excelFile || !duration) {
        return res.status(400).json({ message: "Title, duration, and Excel file are required" });
      }

      if (!excelFile || !excelFile.includes(",")) {
        return res.status(400).json({ message: "Excel file is missing or badly formatted" });
      }

      const base64Data = excelFile.split(",")[1];
      const binaryData = Buffer.from(base64Data, "base64");
      const workbook = xlsx.read(binaryData, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(sheet);
      const questions = formatQuestions(rawData);

      const mockTest = new MockTest({
        title,
        price,
        isFree,
        duration,
        questions,
        wallpaper: wallpaper || null,
        security: security || "none",
        status: status || "draft",
        instituteName: req.user.instituteName,
        instituteId: req.user.instituteId,
        createdBy: req.user.id,
      });

      await mockTest.save();

      // ✅ Notify students in same institute (kept behavior; now via sendEmail)
      try {
        const students = await mongoose.model("User").find({
          role: "Student",
          instituteId: req.user.instituteId,
        }).select("name email");

        const emails = students.map((s) => s.email).filter(Boolean);

        if (emails.length === 0) {
          console.warn("⚠ No valid student emails found, skipping email send.");
        } else {
          // You can loop or send comma-separated; sendEmail supports string "a,b,c"
          const html = `
            <p>Dear Student,</p>
            <p>A new mock test titled <strong>${title}</strong> has been added to the Edzest platform.</p>
            <p>🕒 Duration: ${duration} minutes</p>
            <p>Please log in and start preparing now.</p>
            <br />
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/student-dashboard" target="_blank">Go to Dashboard</a>
            <br/><br/>
            <p>Best of luck!</p>
            <p>— Edzest Team</p>
          `;
          await sendEmail(emails.join(','), "New Mock Test Available!", html);
        }
      } catch (emailError) {
        console.error("❌ Failed to send test notification email:", emailError);
      }

      res.status(201).json({ message: "Mock test created successfully", mockTest });
    } catch (error) {
      console.error("❌ Error creating mock test:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* -------------------------- List Mock Tests -------------------------- */
router.get(
  "/mock-tests",
  authAccess,
  requireRoles(["Admin", "SuperAdmin", "Teacher"]),
  async (req, res) => {
    try {
      let filter = {};

      if ((req.user.role || '').toLowerCase() === "superadmin") {
        filter = {};
      } else if ((req.user.role || '').toLowerCase() === "admin") {
        filter = {
          instituteId: req.user.instituteId,
          createdBy: req.user.id
        };
      } else if ((req.user.role || '').toLowerCase() === "teacher") {
        const teacher = await mongoose.model("User").findById(req.user.id);

        filter = {
          instituteId: teacher.instituteId,
          $or: [
            { createdBy: teacher._id },
            { createdBy: teacher.createdBy } // Admin who created this teacher
          ]
        };
      }

      const mockTests = await MockTest.find(filter).populate("createdBy", "name email");
      res.json(mockTests);

    } catch (err) {
      console.error("❌ Error fetching mock tests:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* -------------------------- Get One Mock Test -------------------------- */
router.get("/mock-tests/:testId", async (req, res) => {
  const { testId } = req.params;
  try {
    const mockTest = await MockTest.findById(testId);
    if (!mockTest) {
      return res.status(404).json({ message: "Mock test not found" });
    }
    res.json(mockTest);
  } catch (error) {
    console.error("Error fetching mock test:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------- Update One Question -------------------------- */
router.put("/mock-tests/:testId/questions/:questionId", async (req, res) => {
  try {
    const { testId, questionId } = req.params;
    const updatedData = req.body;

    const mockTest = await MockTest.findById(testId);
    if (!mockTest) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    const question = mockTest.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    for (let key in updatedData) {
      if (key === "options") {
        question.options = [];
        updatedData.options.forEach(opt => question.options.push(opt));
        question.markModified("options");
      } else if (key === "definitions") {
        question.definitions = [];
        updatedData.definitions.forEach(def => question.definitions.push(def));
        question.markModified("definitions");
      } else {
        question[key] = updatedData[key];
      }
    }

    await mockTest.save();
    res.json({
      message: "Question updated",
      updatedQuestion: question.toObject({ depopulate: true }),
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/* -------------------------- Delete Mock Test -------------------------- */
router.delete("/mock-tests/:testId", async (req, res) => {
  const { testId } = req.params;

  try {
    const deletedTest = await MockTest.findByIdAndDelete(testId);

    if (!deletedTest) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    res.status(200).json({
      message: "Mock test deleted successfully",
      deletedTest,
    });
  } catch (error) {
    console.error("Error deleting mock test:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/* -------------------------- Toggle Status -------------------------- */
router.patch("/mock-tests/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await MockTest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    res.status(200).json({ message: "Mock test status updated", updated });
  } catch (error) {
    console.error("Error updating test status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------- Submit Test Attempt -------------------------- */
// (removed extra '/api' prefix here)
router.post(
  "/studentTestData/submit-test",
  authAccess,
  requireRoles(["Student"]),
  async (req, res) => {
    try {
      const userId = req.user.id; // enforce self
      const { testId, answers, score } = req.body;

      if (!testId) {
        return res.status(400).json({ error: "testId is required" });
      }

      const priorAttempts = await StudentTestData.countDocuments({ userId, testId });
      const MAX_ATTEMPTS = 20;
      if (priorAttempts >= MAX_ATTEMPTS) {
        return res
          .status(400)
          .json({ error: `Maximum ${MAX_ATTEMPTS} attempts reached.` });
      }

      const attempt = new StudentTestData({
        userId,
        testId,
        answers,
        score,
        status: "submitted",
        completedAt: new Date(),
      });

      await attempt.save();

      return res.status(200).json({
        message: "Test submitted successfully",
        resultId: attempt._id,
      });
    } catch (err) {
      console.error("Submit-test error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/* -------------------------- Fetch Attempts For Student -------------------------- */
router.get('/studentTestData/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const data = await StudentTestData.find({ userId: studentId }).sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student test data.' });
  }
});

/* -------------------------- Admin Dashboard Overview -------------------------- */
router.get("/overview", authAccess, requireRoles(["Admin", "SuperAdmin"]), async (req, res) => {
  try {
    let userFilter = {};
    let testFilter = {};
    let attemptFilter = {};

    if (req.user.role === "Admin") {
      userFilter = { instituteId: req.user.instituteId };
      testFilter = { instituteId: req.user.instituteId };
      attemptFilter = { instituteId: req.user.instituteId };
    }

    const userCount = await mongoose.model("User").countDocuments(userFilter);
    const testCount = await mongoose.model("MockTest").countDocuments(testFilter);
    const attemptCount = await mongoose.model("StudentTestData").countDocuments(attemptFilter);

    res.json({
      users: userCount,
      mockTests: testCount,
      testAttempts: attemptCount,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error.message);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

/* -------------------------- Student-visible tests -------------------------- */
router.get("/student-visible-tests", authAccess, requireRoles(["Student"]), async (req, res) => {
  try {
    const student = await mongoose.model("User").findById(req.user.id).select("createdBy instituteName");

    if (!student?.createdBy) {
      const allTests = await mongoose.model("MockTest").find({
        status: "active",
        $or: [
          { instituteId: req.user.instituteId },
          { instituteName: req.user.instituteName }
        ]
      });
      return res.status(200).json(allTests);
    }

    const teachers = await mongoose.model("User").find({
      role: "Teacher",
      createdBy: student.createdBy
    });

    const teacherIds = teachers.map(t => t._id);

    const tests = await mongoose.model("MockTest").find({
      createdBy: { $in: [student.createdBy, ...teacherIds] },
      status: "active"
    });

    res.status(200).json(tests);
  } catch (error) {
    console.error("❌ Error in student-visible-tests:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------- Admin: My users -------------------------- */
router.get("/users", authAccess, requireRoles(["Admin"]), async (req, res) => {
  try {
    const users = await mongoose.model("User").find({ instituteId: req.user.instituteId });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

module.exports = router;
