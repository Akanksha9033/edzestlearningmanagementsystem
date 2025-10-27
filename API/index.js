
// require("dotenv").config();

// const express = require("express");
// const cookieParser = require("cookie-parser");
// const bodyParser = require("body-parser");
// const multer = require("multer");
// const path = require("path");
// const helmet = require("helmet");
// const nodemailer = require("nodemailer");
// const AWS = require("aws-sdk");
// const uuidv4 = require("uuid").v4;

// const { SESClient } = require("@aws-sdk/client-ses");
// const { sendContactEmail } = require("./email");

// const app = express();
// app.set("trust proxy", true);

// /* -------------------- CORS -------------------- */
// /* -------------------- CORS -------------------- */
// const DEFAULT_ALLOWED =
//   process.env.NODE_ENV === "production"
//     ? "https://www.edzest.org"
//     : "https://rfu0lanztd.execute-api.ap-south-1.amazonaws.com/default/edzest-test-backend";

// const allowedOrigins = new Set(
//   (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED)
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean)
// );

// const USE_CREDENTIALS = true;

// function setCorsHeaders(req, res) {
//   const origin = req.headers.origin;
//   const isAllowed = origin && allowedOrigins.has(origin);

//   // Always set Vary so CDN/API GW can cache per-origin
//   res.setHeader("Vary", "Origin");

//   if (isAllowed) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     if (USE_CREDENTIALS) res.setHeader("Access-Control-Allow-Credentials", "true");
//   } else {
//     // If the request has no Origin (e.g., curl) you can skip A-C-A-O.
//     // For browsers, OPTIONS will always include Origin; we only echo if allowed.
//   }

//   // These are safe to include on preflight every time
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     req.headers["access-control-request-headers"] ||
//       "Authorization, Content-Type, X-Requested-With, Accept, Origin, Range"
//   );
//   res.setHeader("Access-Control-Max-Age", "86400");

//   return !!isAllowed;
// }

// function corsMiddleware(req, res, next) {
//   const allowed = setCorsHeaders(req, res);

//   if (req.method === "OPTIONS") {
//     // For preflight, always return 204 *with* the headers already set above
//     return res.status(allowed ? 204 : 204).end();
//   }

//   if (req.headers.origin && !allowed) {
//     // Block non-preflight, cross-site calls from disallowed origins
//     return res.status(403).json({ message: "CORS origin not allowed" });
//   }

//   next();
// }

// app.use(corsMiddleware);

// app.use(prefixStripper);

// // Handle API Gateway HTTP API stage + base-prefix transparently.
// // Works whether the stage ("default") is present or not.
// const STAGE = process.env.STAGE || "default";
// const PREFIXES = [
//   `/default/edzest-test-backend`,     // common case in your logs
//   `/${STAGE}/edzest-test-backend`,    // stage-aware
//   `/edzest-test-backend`              // no stage
// ];

// app.use((req, _res, next) => {
//   for (const p of PREFIXES) {
//     if (req.url === p) { req.url = "/"; break; }
//     if (req.url.startsWith(p + "/")) { req.url = req.url.slice(p.length); break; }
//   }
//   next();
// });


// // 3) Body parsers (MUST be before routes)
// app.use(express.json({ limit: "5mb" }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // 4) Cookies (if you read/write cookies)

// app.use(cookieParser());


// /* -------------------- File Upload -------------------- */
// const uploadDir =
//   process.env.AWS_LAMBDA_FUNCTION_NAME
//     ? "/tmp"
//     : path.join(__dirname, "uploads");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) =>
//     cb(null, `${Date.now()}_${file.originalname}`),
// });
// const uploadFile = multer({ storage });

// /* -------------------- Email -------------------- */
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
// });

// /* -------------------- AWS SDK -------------------- */
// AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
// const dynamoDB = new AWS.DynamoDB.DocumentClient();

// /* -------------------- Health -------------------- */
// app.get("/health", (req, res) => res.send("ok"));

// /* -------------------- Contact Form -------------------- */
// app.post("/api/contact", async (req, res) => {
//   const { fullName, email, phoneNumber, message } = req.body || {};
//   const origin = req.headers.origin;

//   if (!fullName || !email || !phoneNumber || !message) {
//     return res.status(400).json({ message: "All fields are required." });
//   }

//   const item = {
//     id: uuidv4(),
//     fullName,
//     email,
//     phoneNumber,
//     message,
//     createdAt: new Date().toISOString(),
//   };

//   try {
//     await dynamoDB
//       .put({
//         TableName: process.env.CONTACT_TABLE || "ContactForm",
//         Item: item,
//       })
//       .promise();

//     await sendContactEmail({ fullName, email, phoneNumber, message });

//     return res
//       .status(200)
//       .json({ message: "Form submitted successfully!" });
//   } catch (err) {
//     console.error("DDB ERR", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// /* -------------------- Helper: ensure router -------------------- */
// function ensureRouter(mod, name) {
//   if (typeof mod === "function") return mod; // router fn
//   if (mod && typeof mod.default === "function") return mod.default; // ESM default
//   if (mod && typeof mod.router === "function") return mod.router;   // { router }
//   console.error(`❌ ${name} is not exporting a router. Got:`, mod);
//   throw new TypeError(`Invalid router export from ${name}`);
// }

// function mount(path, modPath) {
//   const mod = require(modPath);
//   const router = ensureRouter(mod, modPath);
//   app.use(path, router);
//   console.log(`✅ Mounted ${modPath} at ${path}`);
// }

// /* -------------------- Routers -------------------- */

// // Admin mocktest routes
// mount("/api/auth", "./middleware/authRoute");
// mount("/api/auth", "./middleware/adminRoute");
// const adminMockTests = require("./Route/API_Admin/AdminModule/AdminMocktestRoute/adminMockTests");
// app.use("/api/admin/mocktests", adminMockTests);

// // Student mocktest side 
// const studentMocktestsRoutes = require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestFetch");
// const studentAttemptsRoutes  = require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestAttempts");

// app.use("/api/student", studentMocktestsRoutes);
// app.use("/api/student", studentAttemptsRoutes);
// const solutions = require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestSolution");
// app.use("/api/student",solutions); 


// //Q-Bank Routes

// // Admin Q-bank Routes
// mount("/api/auth", "./middleware/authRoute");
// mount("/api/auth", "./middleware/adminRoute");
// mount(
//   "/api/admin/qbank",
//   "./Route/API_Admin/AdminModule/AdminQ-BankRoute/AdminQ-BankRoute"
// );
// app.use("/uploads", express.static("uploads"));
// // Student Q-bank Routes
// mount(
//   "/api/student/qbank",
//   "./Route/API_Student/StudentModule/StudentQ-BankRoute/StudentQ-BankRoute"
// );




// /* -------------------- E-Book Routes (from E-book server) -------------------- */
// // Student-facing helpers (summarize/suggest)
// mount(
//   "/summarize",
//   "./Route/API_Student/StudentModule/StudentE-BookRoute/summarize"
// );
// mount(
//   "/suggest",
//   "./Route/API_Student/StudentModule/StudentE-BookRoute/suggest"
// );

// // Notes API
// mount(
//   "/api/ebooks/notes",
//   "./Route/API_Student/StudentModule/StudentE-BookRoute/notesRoutes"
// );

// // Admin E-book core + media (mounted at /ebooks like your ESM server)
// mount(
//   "/ebooks",
//   "./Route/API_Admin/AdminModule/AdminE-BookRoute/ebooks"
// );
// mount(
//   "/ebooks",
//   "./Route/API_Admin/AdminModule/AdminE-BookRoute/ebookMedia"
// );

// // Progress APIs
// mount(
//   "/api/ebooks/progress",
//   "./Route/API_Student/StudentModule/StudentE-BookRoute/ebooksProgress"
// );
// mount(
//   "/api/student/ebooks/progress",
//   "./Route/API_Student/StudentModule/StudentE-BookRoute/studentEBookProgress"
// );
// /* -------------------------------------------------------------------------- *Thank you for your business! We look forward to working with you again.

// /* -------------------- 404 & Error -------------------- */
// app.use((req, res) =>
//   res.status(404).json({ error: "Not Found", path: req.originalUrl })
// );

// app.use((err, req, res, next) => {
//   console.error("🛑 Unhandled Error:", err);
//   res.status(500).json({ message: "Internal server error" });
// });

// /* -------------------- Local dev -------------------- */
// if (require.main === module) {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () =>
//     console.log(`🚀 Server running on port ${PORT}`)
//   );
// }

// module.exports = app;


// require("dotenv").config(); 

// const express = require("express");
// const cookieParser = require("cookie-parser");
// const multer = require("multer");
// const path = require("path");
// const nodemailer = require("nodemailer");
// const AWS = require("aws-sdk");
// const uuidv4 = require("uuid").v4;

// const { sendContactEmail } = require("./email");

// const app = express();

// /* ------------ TRUST PROXY (required behind API GW/Amplify) ------------ */
// // API Gateway only → trust a single hop
// app.set("trust proxy", 1);

// /* -------------------- CORS -------------------- */
// const DEFAULT_ALLOWED =
//   process.env.NODE_ENV === "production"
//     ? "https://www.edzest.org"
//     : "https://rfu0lanztd.execute-api.ap-south-1.amazonaws.com/default/edzest-test-backend";

// const allowedOrigins = new Set(
//   (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED)
//     .split(",")
//     .map(s => s.trim())
//     .filter(Boolean)
// );

// const USE_CREDENTIALS = true;

// function setCorsHeaders(req, res) {
//   const origin = req.headers.origin;
//   const isAllowed = origin && allowedOrigins.has(origin);

//   res.setHeader("Vary", "Origin");
//   if (isAllowed) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     if (USE_CREDENTIALS) res.setHeader("Access-Control-Allow-Credentials", "true");
//   }
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     req.headers["access-control-request-headers"] ||
//       "Authorization, Content-Type, X-Requested-With, Accept, Origin, Range"
//   );
//   res.setHeader("Access-Control-Max-Age", "86400");
//   return !!isAllowed;
// }

// function corsMiddleware(req, res, next) {
//   const allowed = setCorsHeaders(req, res);
//   if (req.method === "OPTIONS") return res.status(204).end(); // preflight handled here
//   if (req.headers.origin && !allowed)
//     return res.status(403).json({ message: "CORS origin not allowed" });
//   next();
// }
// app.use(corsMiddleware);

// /* --------- STRIP APIGW STAGE + BASE PREFIX (BEFORE ROUTES) --------- */
// const STAGE = process.env.STAGE || "default";
// const PREFIXES = [
//   `/${STAGE}/edzest-test-backend`, // stage-aware
//   "/default/edzest-test-backend",  // explicit default (seen in your logs)
//   "/edzest-test-backend",          // no stage
// ];
// app.use((req, _res, next) => {
//   for (const p of PREFIXES) {
//     if (req.url === p) { req.url = "/"; break; }
//     if (req.url.startsWith(p + "/")) { req.url = req.url.slice(p.length); break; }
//   }
//   next();
// });

// /* -------------------- PARSERS (BEFORE ROUTES) -------------------- */
// app.use(express.json({ limit: "5mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// /* -------------------- AWS SDK -------------------- */
// AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
// const dynamoDB = new AWS.DynamoDB.DocumentClient();

// /* -------------------- Health -------------------- */
// app.get("/health", (_req, res) => res.send("ok"));

// /* -------------------- Contact Form -------------------- */
// app.post("/api/contact", async (req, res) => {
//   const { fullName, email, phoneNumber, message } = req.body || {};
//   if (!fullName || !email || !phoneNumber || !message) {
//     return res.status(400).json({ message: "All fields are required." });
//   }
//   const item = {
//     id: uuidv4(),
//     fullName,
//     email,
//     phoneNumber,
//     message,
//     createdAt: new Date().toISOString(),
//   };
//   try {
//     await dynamoDB.put({
//       TableName: process.env.CONTACT_TABLE || "ContactForm",
//       Item: item,
//     }).promise();

//     await sendContactEmail({ fullName, email, phoneNumber, message });

//     return res.status(200).json({ message: "Form submitted successfully!" });
//   } catch (err) {
//     console.error("DDB ERR", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// /* -------------------- File Upload (kept) -------------------- */
// const uploadDir = process.env.AWS_LAMBDA_FUNCTION_NAME ? "/tmp" : path.join(__dirname, "uploads");
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, uploadDir),
//   filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
// });
// const uploadFile = multer({ storage }); // keep if used elsewhere


// /** Auth/admin middleware (mounted once) */
// const authRoute  = require("./middleware/authRoute");
// const adminRoute = require("./middleware/adminRoute");
// app.use("/api/auth", authRoute);
// app.use("/api/auth", adminRoute);

// /** Admin mocktests */
// const adminMockTests = require("./Route/API_Admin/AdminModule/AdminMocktestRoute/adminMockTests");
// app.use("/api/admin/mocktests", adminMockTests);

// /** Student mocktests */
// const studentMocktestsRoutes = require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestFetch");
// const studentAttemptsRoutes  = require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestAttempts");
// const solutions              = require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestSolution");
// app.use("/api/student", studentMocktestsRoutes);
// app.use("/api/student", studentAttemptsRoutes);
// app.use("/api/student", solutions);

// /** Q-Bank (admin + student) */
// const adminQBank   = require("./Route/API_Admin/AdminModule/AdminQ-BankRoute/AdminQ-BankRoute");
// const studentQBank = require("./Route/API_Student/StudentModule/StudentQ-BankRoute/StudentQ-BankRoute");
// app.use("/api/admin/qbank", adminQBank);
// app.use("/api/student/qbank", studentQBank);

// /** E-Book routes */
// app.use("/summarize",                       require("./Route/API_Student/StudentModule/StudentE-BookRoute/summarize"));
// app.use("/suggest",                         require("./Route/API_Student/StudentModule/StudentE-BookRoute/suggest"));
// app.use("/api/ebooks/notes",                require("./Route/API_Student/StudentModule/StudentE-BookRoute/notesRoutes"));
// app.use("/ebooks",                          require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebooks"));
// app.use("/ebooks",                          require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebookMedia"));
// app.use("/api/ebooks/progress",             require("./Route/API_Student/StudentModule/StudentE-BookRoute/ebooksProgress"));
// app.use("/api/student/ebooks/progress",     require("./Route/API_Student/StudentModule/StudentE-BookRoute/studentEBookProgress"));

// /* -------------------- Static -------------------- */
// app.use("/uploads", express.static("uploads"));

// /* -------------------- 404 & Error -------------------- */
// app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.originalUrl }));
// app.use((err, _req, res, _next) => {
//   console.error("🛑 Unhandled Error:", err);
//   res.status(500).json({ message: "Internal server error" });
// });

// /* -------------------- Local dev -------------------- */
// if (require.main === module) {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// }

// module.exports = app;


//production code 

// require("dotenv").config();

// const express = require("express");
// const cookieParser = require("cookie-parser");
// const multer = require("multer");
// const path = require("path");
// const AWS = require("aws-sdk");
// const uuidv4 = require("uuid").v4;

// const { sendContactEmail } = require("./email");

// const app = express();

// /* ------------ TRUST PROXY (behind API Gateway/Amplify) ------------ */
// app.set("trust proxy", 1);

// /* -------------------- CORS -------------------- */
// const DEFAULT_ALLOWED =
//   process.env.NODE_ENV === "production"
//     ? "https://edzest.org,https://www.edzest.org,"
//     : "https://rfu0lanztd.execute-api.ap-south-1.amazonaws.com/default/edzest-test-backend";

// const allowedOrigins = new Set(
//   (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED)
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean)
// );

// const USE_CREDENTIALS = true;

// function setCorsHeaders(req, res) {
//   const origin = req.headers.origin;
//   const isAllowed = origin && allowedOrigins.has(origin);

//   res.setHeader("Vary", "Origin");
//   if (isAllowed) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     if (USE_CREDENTIALS) res.setHeader("Access-Control-Allow-Credentials", "true");
//   }
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     req.headers["access-control-request-headers"] ||
//       "Authorization, Content-Type, X-Requested-With, Accept, Origin, Range"
//   );
//   res.setHeader("Access-Control-Max-Age", "86400");
//   return !!isAllowed;
// }

// function corsMiddleware(req, res, next) {
//   const allowed = setCorsHeaders(req, res);
//   if (req.method === "OPTIONS") return res.status(204).end(); // preflight
//   if (req.headers.origin && !allowed)
//     return res.status(403).json({ message: "CORS origin not allowed" });
//   next();
// }
// app.use(corsMiddleware);

// /* --------- STRIP APIGW STAGE + BASE PREFIX (BEFORE ROUTES) --------- */
// const STAGE = (process.env.STAGE || "default").replace(/^\//, ""); // "default"
// const GW_BASE_PATH = (process.env.GW_BASE_PATH || "/edzest-test-backend").replace(/\/+$/, ""); // "/edzest-test-backend"

// const PREFIXES = [
//   `/${STAGE}${GW_BASE_PATH}`,    // "/default/edzest-test-backend"
//   GW_BASE_PATH,                  // "/edzest-test-backend"
//   "/default/edzest-test-backend" // explicit (as in screenshots)
// ];

// app.use((req, _res, next) => {
//   for (const p of PREFIXES) {
//     if (!p) continue;
//     if (req.url === p) { req.url = "/"; break; }
//     if (req.url.startsWith(p + "/")) { req.url = req.url.slice(p.length); break; }
//   }
//   next();
// });

// // (optional) request logger for CloudWatch debugging
// // app.use((req, _res, next) => { console.log("INCOMING", req.method, req.originalUrl, "=>", req.url); next(); });

// /* -------------------- PARSERS -------------------- */
// app.use(express.json({ limit: "5mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// /* -------------------- AWS SDK -------------------- */
// AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
// const dynamoDB = new AWS.DynamoDB.DocumentClient();

// /* -------------------- Health -------------------- */
// app.get("/health", (_req, res) => res.send("ok"));

// /* -------------------- Contact Form -------------------- */
// app.post("/api/contact", async (req, res) => {
//   const { fullName, email, phoneNumber, message } = req.body || {};
//   if (!fullName || !email || !phoneNumber || !message) {
//     return res.status(400).json({ message: "All fields are required." });
//   }
//   const item = {
//     id: uuidv4(),
//     fullName,
//     email,
//     phoneNumber,
//     message,
//     createdAt: new Date().toISOString(),
//   };
//   try {
//     await dynamoDB
//       .put({ TableName: process.env.CONTACT_TABLE || "ContactForm", Item: item })
//       .promise();

//     await sendContactEmail({ fullName, email, phoneNumber, message });

//     return res.status(200).json({ message: "Form submitted successfully!" });
//   } catch (err) {
//     console.error("DDB ERR", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// /* -------------------- File Upload (kept) -------------------- */
// const uploadDir = process.env.AWS_LAMBDA_FUNCTION_NAME ? "/tmp" : path.join(__dirname, "uploads");
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, uploadDir),
//   filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
// });
// const uploadFile = multer({ storage }); // exported/used elsewhere if needed

// /* ==================== ROUTES ==================== */
// /** Auth (Cognito) — this file defines /api/auth/login, /refresh, etc. */
// app.use("/api/auth", require("./middleware/authRoute"));

// /** Admin guard (role-based) */
// const adminRoute = require("./middleware/adminRoute");

// /** Admin mocktests */
// app.use(
//   "/api/admin/mocktests",
//   require("./middleware/authRoute"),
//   adminRoute,
//   require("./Route/API_Admin/AdminModule/AdminMocktestRoute/adminMockTests")
// );

// /** Student mocktests */
// app.use(
//   "/api/student",
//   require("./middleware/authRoute"),
//   require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestFetch")
// );
// app.use(
//   "/api/student",
//   require("./middleware/authRoute"),
//   require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestAttempts")
// );
// app.use(
//   "/api/student",
//   require("./middleware/authRoute"),
//   require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestSolution")
// );

// /** Q-Bank (admin + student) */
// app.use(
//   "/api/admin/qbank",
//   require("./middleware/authRoute"),
//   adminRoute,
//   require("./Route/API_Admin/AdminModule/AdminQ-BankRoute/AdminQ-BankRoute")
// );
// app.use(
//   "/api/student/qbank",
//   require("./middleware/authRoute"),
//   require("./Route/API_Student/StudentModule/StudentQ-BankRoute/StudentQ-BankRoute")
// );

// /** E-Book routes */
// app.use("/summarize", require("./Route/API_Student/StudentModule/StudentE-BookRoute/summarize"));
// app.use("/suggest", require("./Route/API_Student/StudentModule/StudentE-BookRoute/suggest"));
// app.use("/api/ebooks/notes", require("./Route/API_Student/StudentModule/StudentE-BookRoute/notesRoutes"));
// app.use("/ebooks", require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebooks"));
// app.use("/ebooks", require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebookMedia"));
// app.use(
//   "/api/ebooks/progress",
//   require("./middleware/authRoute"),
//   require("./Route/API_Student/StudentModule/StudentE-BookRoute/ebooksProgress")
// );
// app.use(
//   "/api/student/ebooks/progress",
//   require("./middleware/authRoute"),
//   require("./Route/API_Student/StudentModule/StudentE-BookRoute/studentEBookProgress")
// );

// /* -------------------- Static -------------------- */
// app.use("/uploads", express.static("uploads"));

// /* -------------------- 404 & Error -------------------- */
// app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.originalUrl }));
// app.use((err, _req, res, _next) => {
//   console.error("🛑 Unhandled Error:", err);
//   res.status(500).json({ message: "Internal server error" });
// });

// /* -------------------- Local dev -------------------- */
// if (require.main === module) {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// }

// // module.exports = app;

//localhost code 

require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const AWS = require("aws-sdk");
const uuidv4 = require("uuid").v4;

const { sendContactEmail } = require("./email");

const app = express();

/* ------------ TRUST PROXY (behind API Gateway/Amplify) ------------ */
app.set("trust proxy", 1);

/* -------------------- CORS -------------------- */
/**
 * Minimal changes:
 * - Local default now includes localhost/127.0.0.1 on ports 3000 & 5173 (CRA/Vite).
 * - Echo EXACT origin + allow credentials.
 * - OPTIONS returns 204 (preflight).
 * - Mounted BEFORE any routes.
 */
const IS_PROD = process.env.NODE_ENV === "production";

const DEFAULT_ALLOWED = IS_PROD
  ? "https://edzest.org,https://www.edzest.org"
  : "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173";

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const isAllowed = origin && allowedOrigins.has(origin);

  res.setHeader("Vary", "Origin");

  if (isAllowed) {
    // For credentialed requests we must echo the exact origin.
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Methods/headers for preflight
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Authorization, Content-Type, X-Requested-With, Accept, Origin, Range"
  );
  res.setHeader("Access-Control-Max-Age", "86400"); // cache preflight for a day

  return !!isAllowed;
}

function corsMiddleware(req, res, next) {
  const allowed = setCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(204).end(); // preflight OK
  if (req.headers.origin && !allowed) {
    return res.status(403).json({ message: "CORS origin not allowed" });
  }
  next();
}

/* -------------------- PARSERS (before routes) -------------------- */
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* mount CORS BEFORE any routes */
app.use(corsMiddleware);

/* --------- STRIP APIGW STAGE + BASE PREFIX (BEFORE ROUTES) --------- */
/* Skip this when running locally; keep it for prod API Gateway paths */
const STAGE = (process.env.STAGE || "default").replace(/^\//, "");
const GW_BASE_PATH = (process.env.GW_BASE_PATH || "/edzest-test-backend").replace(/\/+$/, "");
const PREFIXES = [
  `/${STAGE}${GW_BASE_PATH}`,
  GW_BASE_PATH,
  "/default/edzest-test-backend",
];

if (IS_PROD) {
  app.use((req, _res, next) => {
    for (const p of PREFIXES) {
      if (!p) continue;
      if (req.url === p) {
        req.url = "/";
        break;
      }
      if (req.url.startsWith(p + "/")) {
        req.url = req.url.slice(p.length);
        break;
      }
    }
    next();
  });
}

/* -------------------- AWS SDK -------------------- */
AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/* -------------------- Health -------------------- */
app.get("/health", (_req, res) => res.send("ok"));

/* -------------------- Contact Form -------------------- */
app.post("/api/contact", async (req, res) => {
  const { fullName, email, phoneNumber, message } = req.body || {};
  if (!fullName || !email || !phoneNumber || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const item = {
    id: uuidv4(),
    fullName,
    email,
    phoneNumber,
    message,
    createdAt: new Date().toISOString(),
  };
  try {
    await dynamoDB
      .put({ TableName: process.env.CONTACT_TABLE || "ContactForm", Item: item })
      .promise();

    await sendContactEmail({ fullName, email, phoneNumber, message });

    return res.status(200).json({ message: "Form submitted successfully!" });
  } catch (err) {
    console.error("DDB ERR", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- File Upload (kept) -------------------- */
const uploadDir = process.env.AWS_LAMBDA_FUNCTION_NAME ? "/tmp" : path.join(__dirname, "uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const uploadFile = multer({ storage }); // exported/used elsewhere if needed

/* ==================== ROUTES ==================== */
/** Auth (Cognito) — defines /api/auth/login, /refresh, etc. */
app.use("/api/auth", require("./middleware/authRoute"));

/** Admin guard (role-based) */
const adminRoute = require("./middleware/adminRoute");

/** Admin mocktests */
app.use(
  "/api/admin/mocktests",
  require("./middleware/authRoute"),
  adminRoute,
  require("./Route/API_Admin/AdminModule/AdminMocktestRoute/adminMockTests")
);

/** Student mocktests */
app.use(
  "/api/student",
  require("./middleware/authRoute"),
  require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestFetch")
);
app.use(
  "/api/student",
  require("./middleware/authRoute"),
  require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestAttempts")
);
app.use(
  "/api/student",
  require("./middleware/authRoute"),
  require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestSolution")
);

/** Q-Bank (admin + student) */
app.use(
  "/api/admin/qbank",
  require("./middleware/authRoute"),
  adminRoute,
  require("./Route/API_Admin/AdminModule/AdminQ-BankRoute/AdminQ-BankRoute")
);
app.use(
  "/api/student/qbank",
  require("./middleware/authRoute"),
  require("./Route/API_Student/StudentModule/StudentQ-BankRoute/StudentQ-BankRoute")
);

/** E-Book routes */
app.use("/summarize", require("./Route/API_Student/StudentModule/StudentE-BookRoute/summarize"));
app.use("/suggest", require("./Route/API_Student/StudentModule/StudentE-BookRoute/suggest"));
app.use("/api/ebooks/notes", require("./Route/API_Student/StudentModule/StudentE-BookRoute/notesRoutes"));
app.use("/ebooks", require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebooks"));
app.use("/ebooks", require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebookMedia"));
app.use(
  "/api/ebooks/progress",
  require("./middleware/authRoute"),
  require("./Route/API_Student/StudentModule/StudentE-BookRoute/ebooksProgress")
);
app.use(
  "/api/student/ebooks/progress",
  require("./middleware/authRoute"),
  require("./Route/API_Student/StudentModule/StudentE-BookRoute/studentEBookProgress")
);

/* -------------------- Static -------------------- */
app.use("/uploads", express.static("uploads"));

/* -------------------- 404 & Error -------------------- */
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.originalUrl }));
app.use((err, _req, res, _next) => {
  console.error("🛑 Unhandled Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* -------------------- Local dev -------------------- */
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
