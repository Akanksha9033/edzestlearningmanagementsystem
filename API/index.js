process.on("unhandledRejection", (err) => console.error("UNHANDLED →", err));
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const uuidv4 = require("uuid").v4;

/* -----------------------------------------------------
   REMOVE aws-sdk (SDK v2) COMPLETELY
------------------------------------------------------ */
// ❌ const AWS = require("aws-sdk");  ← REMOVE

/* -----------------------------------------------------
   AWS SDK v3 (DynamoDB)
------------------------------------------------------ */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "ap-south-1";

const ddbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);


/* -----------------------------------------------------
   Express initialization
------------------------------------------------------ */
const { sendContactEmail } = require("./email");
const app = express();

/* ------------ TRUST PROXY ------------ */
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

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD"
  );
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

/* -------------------- PARSERS -------------------- */
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(corsMiddleware);

/* -------------------- API Gateway Prefix Fix -------------------- */
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

/* -------------------- HEALTH -------------------- */
app.get("/health", (_req, res) => res.send("ok"));

/* -------------------- CONTACT FORM (UPDATED v3) -------------------- */
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
    await dynamoDB.send(
      new PutCommand({
        TableName: process.env.CONTACT_TABLE || "ContactForm",
        Item: item,
      })
    );

    await sendContactEmail({ fullName, email, phoneNumber, message });

    return res.status(200).json({ message: "Form submitted successfully!" });
  } catch (err) {
    console.error("DDB ERR", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- Multer Uploads -------------------- */
const uploadDir = process.env.AWS_LAMBDA_FUNCTION_NAME
  ? "/tmp"
  : path.join(__dirname, "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const uploadFile = multer({ storage });

/* -------------------- Helper -------------------- */
function pickMiddleware(mod) {
  return (mod && (mod.default || mod.router || mod)) || mod;
}

/* -----------------------------------------------------
   AUTH ROUTES
------------------------------------------------------ */
const authRouter = pickMiddleware(require("./middleware/authRoute"));
const forgotRouter = pickMiddleware(require("./middleware/forgotPassword"));

app.use("/api/auth", authRouter);
app.use("/api/auth", forgotRouter);

/* ------- Admin Guard ------- */
const adminRoute = pickMiddleware(require("./middleware/adminRoute"));

/* -------------------- Admin MockTests -------------------- */
app.use(
  "/api/admin/mocktests",
  pickMiddleware(require("./middleware/authRoute")),
  adminRoute,
  pickMiddleware(require("./Route/API_Admin/AdminModule/AdminMocktestRoute/adminMockTests"))
);

app.use(
  "/api/admin/mocktests",
  pickMiddleware(
    require("./Route/API_Admin/AdminModule/AdminMocktestRoute/deleteAdminMocktest")
  )
);
const adminAddUserRoute = require("./Route/API_Admin/AdminAddUserRoute");
app.use("/api", adminAddUserRoute);

// app.use(
//   "/api/admin/users",
//   pickMiddleware(require("./middleware/authRoute")),
//   adminRoute,
//   pickMiddleware(require("./middleware/adminUsersRoute"))
// );


const adminAddProductRoute = require(
  "./Route/API_Admin/AdminAddProductRoute"
);

app.use("/api", adminAddProductRoute);



// const adminProductsCatalogRoute = require("./Route/API_Admin/AdminAssignableProductsCatalogRoute");
// app.use("/api", adminProductsCatalogRoute);

const getAllPublishedProducts = require("./Route/API_Admin/getAllPublishedProducts"); app.use(getAllPublishedProducts);

const studentEnrollmentsRoute =
  require("./Route/API_Student/StudentEnrollmentsRoute");

app.use("/api", studentEnrollmentsRoute);



/* -------------------- Student MockTests -------------------- */
app.use(
  "/api/student",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestFetch")
  )
);
app.use(
  "/api/student",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestAttempts")
  )
);
app.use(
  "/api/student",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentMocktestRoute/studentMocktestSolution")
  )
);

/* -------------------- QBank Routes -------------------- */
app.use(
  "/api/admin/qbank",
  pickMiddleware(require("./middleware/authRoute")),
  adminRoute,
  pickMiddleware(
    require("./Route/API_Admin/AdminModule/AdminQ-BankRoute/AdminQ-BankRoute")
  )
);

app.use(
  "/api/student/qbank",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentQ-BankRoute/StudentQ-BankRoute")
  )
);

/* -------------------- E-Book Routes -------------------- */
app.use(
  "/summarize",
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentE-BookRoute/summarize")
  )
);

app.use(
  "/suggest",
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentE-BookRoute/suggest")
  )
);

app.use(
  "/api/ebooks/notes",
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentE-BookRoute/notesRoutes")
  )
);

app.use(
  "/ebooks",
  pickMiddleware(
    require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebooks")
  )
);

app.use(
  "/ebooks",
  pickMiddleware(
    require("./Route/API_Admin/AdminModule/AdminE-BookRoute/ebookMedia")
  )
);

app.use(
  "/api/ebooks/progress",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentE-BookRoute/ebooksProgress")
  )
);

app.use(
  "/api/student/ebooks/progress",
  pickMiddleware(require("./middleware/authRoute")),
  pickMiddleware(
    require("./Route/API_Student/StudentModule/StudentE-BookRoute/studentEBookProgress")
  )
);

/* -------------------- Static Uploads -------------------- */
app.use("/uploads", express.static("uploads"));

/* -------------------- LMS ROUTES -------------------- */
app.use(
  "/api/courses",
  pickMiddleware(
    require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/lessons")
  )
);

app.use(
  "/api/courses",
  pickMiddleware(
    require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/courses")
  )
);

app.use(
  "/api",
  require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/AdminQuizRoute")
);

app.use(
  "/api/media",
  require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/media")
);

app.use("/api/zoom", require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/zoom"));

app.use("/api/video-progress", (req, res, next) => {
  console.log(">> [mount] /api/video-progress", req.method, req.url);
  next();
}, require("./Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/videoProgress"));

/* -------------------- Courses Cover -------------------- */
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
app.use("/api/course", coursesCoverRouter);

/* -------------------- Payments -------------------- */
app.use("/api/payments", require("./Route/payments"));

/* -------------------- 404 + Error Handler -------------------- */
app.use((req, res) =>
  res.status(404).json({ error: "Not Found", path: req.originalUrl })
);
app.use((err, _req, res, _next) => {
  console.error("🛑 Unhandled Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* -------------------- Local Dev -------------------- */
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;