 

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
const IS_PROD = process.env.NODE_ENV === "production";

const DEFAULT_ALLOWED = IS_PROD
  ? "https://edzest.org,https://www.edzest.org"
  : "http://localhost:3000,http://127.0.0.1:3000,";   

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
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Authorization, Content-Type, X-Requested-With, Accept, Origin, Range"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  return !!isAllowed;
}

function corsMiddleware(req, res, next) {
  const allowed = setCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
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
const STAGE = (process.env.STAGE || "default").replace(/^\//, "");
const GW_BASE_PATH = (process.env.GW_BASE_PATH || "/edzest-test-backend").replace(/\/+$/, "");
const PREFIXES = [`/${STAGE}${GW_BASE_PATH}`, GW_BASE_PATH, "/default/edzest-test-backend"];

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
const uploadFile = multer({ storage }); // (kept)

/* ==================== ROUTES ==================== */
/* Helper to unwrap CJS/ESM router/middleware consistently */
function pickMiddleware(mod) {
  return (mod && (mod.default || mod.router || mod)) || mod;
}

/** Auth (Cognito) — /api/auth/... */
const authRouter = pickMiddleware(require("./middleware/authRoute"));       // login/refresh/etc.
const forgotRouter = pickMiddleware(require("./middleware/forgotPassword")); // forgot/confirm

app.use("/api/auth", authRouter);
app.use("/api/auth", forgotRouter);

/** Admin guard (role-based) */
const adminRoute = pickMiddleware(require("./middleware/adminRoute"));

/** Admin mocktests */
app.use(
  "/api/admin/mocktests",
  pickMiddleware(require("./middleware/authRoute")),
  adminRoute,
  pickMiddleware(require("./Route/API_Admin/AdminModule/AdminMocktestRoute/adminMockTests"))
);

/** Student mocktests */
app.use(
  "/api/student",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestFetch"))
);
app.use(
  "/api/student",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestAttempts"))
);
app.use(
  "/api/student",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestSolution"))
);

/** Q-Bank (admin + student) */
app.use(
  "/api/admin/qbank",
  pickMiddleware(require("./middleware/authRoute")),
  adminRoute,
  pickMiddleware(require("./Route/API_Admin/AdminModule/AdminQ-BankRoute/AdminQ-BankRoute"))
);
app.use(
  "/api/student/qbank",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(require("./Route/API_Student/StudentModule/StudentQ-BankRoute/StudentQ-BankRoute"))
);

/** E-Book routes */
app.use("/summarize", pickMiddleware(require("./Route/API_Student/StudentModule/StudentE-BookRoute/summarize")));
app.use("/suggest", pickMiddleware(require("./Route/API_Student/StudentModule/StudentE-BookRoute/suggest")));
app.use("/api/ebooks/notes", pickMiddleware(require("./Route/API_Student/StudentModule/StudentE-BookRoute/notesRoutes")));
app.use("/ebooks", pickMiddleware(require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebooks")));
app.use("/ebooks", pickMiddleware(require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebookMedia")));
app.use(
  "/api/ebooks/progress",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(require("./Route/API_Student/StudentModule/StudentE-BookRoute/ebooksProgress"))
);
app.use(
  "/api/student/ebooks/progress",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(require("./Route/API_Student/StudentModule/StudentE-BookRoute/studentEBookProgress"))
);





/* -------------------- Static -------------------- */
app.use("/uploads", express.static("uploads"));

/** ✅ Courses + Lessons (LMS Routes) */


app.use(
  "/api/courses",
  pickMiddleware(require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/lessons"))
);

app.use(
  "/api/courses",
  pickMiddleware(require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/courses"))
);

const AdminQuizRoute = require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/AdminQuizRoute");
app.use("/api", AdminQuizRoute);

/** ✅ Media + Zoom + Video Progress */
const mediaRouter = require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/media");
app.use("/api/media", mediaRouter);



const zoomRouter = require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/zoom");
app.use("/api/zoom", zoomRouter);

const videoProgressRouter = require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/videoProgress");
app.use("/api/video-progress", (req, res, next) => {
  console.log(">> [mount] /api/video-progress", req.method, req.url);
  next();
}, videoProgressRouter);

/** ✅ Courses Cover (extra routes) */
const coursesCoverRouter = require(
  path.join(
    __dirname,
    "Route",
    "API_Admin",
    "AdminModule",
    "AdminCourseRoute",
    "LMS_Routes",
    "courses.cover.routes.js"
  )
);
app.use("/api/courses", coursesCoverRouter);

// Optional: alias if frontend uses singular /api/course
app.use("/api/course", coursesCoverRouter);


app.use("/api/payments", require("./Route/payments"));

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
