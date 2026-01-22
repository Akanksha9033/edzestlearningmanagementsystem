// console.log("🔥 StudentEnrollmentsRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   QueryCommand,
//   PutCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const { authAccess } = require("../../middleware/auth");

// const REGION = process.env.AWS_REGION || "ap-south-1";
// const ENROLLMENTS_TABLE = process.env.STUDENT_ENROLLMENTS_TABLE;

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* =========================================================
//    GET: STUDENT ENROLLMENTS (MY ENROLLMENTS)
//    (SAFE IMPROVEMENT: only enrollment records)
//    ========================================================= */
// router.get(
//   "/student/enrollments",
//   authAccess,
//   async (req, res) => {
//     try {
//       const studentSub = req.user?.sub;

//       console.log("🔥 Fetch enrollments for:", studentSub);

//       if (!studentSub) {
//         return res.status(401).json({ message: "Unauthorized" });
//       }

//       const result = await ddb.send(
//         new QueryCommand({
//           TableName: ENROLLMENTS_TABLE,
//           KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
//           ExpressionAttributeValues: {
//             ":pk": `USER#${studentSub}`,
//             ":sk": "ENROLLMENT#",
//           },
//         })
//       );

//       return res.json({
//         enrollments: result.Items || [],
//       });
//     } catch (err) {
//       console.error("❌ Student enrollments failed", err);
//       return res.status(500).json({ message: "Failed to fetch enrollments" });
//     }
//   }
// );

// /* =========================================================
//    POST: FREE ENROLL (EXISTING – UNCHANGED BEHAVIOR)
//    ========================================================= */
// router.post(
//   "/student/enroll/free",
//   authAccess,
//   async (req, res) => {
//     try {
//       const studentSub = req.user?.sub;
//       const { productId, productType } = req.body || {};

//       if (!studentSub) {
//         return res.status(401).json({ message: "Unauthorized" });
//       }

//       if (!productId || !productType) {
//         return res
//           .status(400)
//           .json({ message: "productId & productType required" });
//       }

//       const nowIso = new Date().toISOString();

//       await ddb.send(
//         new PutCommand({
//           TableName: ENROLLMENTS_TABLE,
//           Item: {
//             pk: `USER#${studentSub}`,
//             sk: `ENROLLMENT#${productType}#${productId}`,

//             productId,
//             productType, // "COURSE" | "QBANK" | "MOCKTEST" | "EBOOK"

//             accessSource: "free",
//             status: "ACTIVE",

//             expiry: null,
//             createdAt: nowIso,
//           },
//         })
//       );

//       return res.json({ success: true });
//     } catch (err) {
//       console.error("❌ Free enroll failed", err);
//       return res.status(500).json({ message: "Failed to enroll (free)" });
//     }
//   }
// );

// /* =========================================================
//    POST: UNIVERSAL ENROLL (NEW – SAFE ADDITION)
//    Used for: Free | Paid | Admin
//    ========================================================= */
// router.post(
//   "/student/enroll",
//   authAccess,
//   async (req, res) => {
//     try {
//       const studentSub = req.user?.sub;
//       const {
//         productId,
//         productType,
//         title,
//         thumbnailUrl,
//         accessSource = "free", // free | paid | admin
//         expiry = null,
//       } = req.body || {};

//       if (!studentSub) {
//         return res.status(401).json({ message: "Unauthorized" });
//       }

//       if (!productId || !productType) {
//         return res
//           .status(400)
//           .json({ message: "productId & productType required" });
//       }

//       const sk = `ENROLLMENT#${productType}#${productId}`;

//       /* ✅ DUPLICATE PROTECTION (SAFE) */
//       const existing = await ddb.send(
//         new QueryCommand({
//           TableName: ENROLLMENTS_TABLE,
//           KeyConditionExpression: "pk = :pk AND sk = :sk",
//           ExpressionAttributeValues: {
//             ":pk": `USER#${studentSub}`,
//             ":sk": sk,
//           },
//         })
//       );

//       if (existing.Items && existing.Items.length > 0) {
//         return res.json({ success: true, alreadyEnrolled: true });
//       }

//       await ddb.send(
//         new PutCommand({
//           TableName: ENROLLMENTS_TABLE,
//           Item: {
//             pk: `USER#${studentSub}`,
//             sk,

//             productId,
//             productType,

//             title: title || productType,
//             thumbnailUrl: thumbnailUrl || null,

//             accessSource,
//             status: "ACTIVE",

//             expiry,
//             createdAt: new Date().toISOString(),
//           },
//         })
//       );

//       return res.json({ success: true });
//     } catch (err) {
//       console.error("❌ Enroll failed", err);
//       return res.status(500).json({ message: "Failed to enroll" });
//     }
//   }
// );

// module.exports = router;

// console.log("🔥 StudentEnrollmentsRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   QueryCommand,
//   PutCommand,
//   GetCommand, // ✅ SAFE ADDITION
// } = require("@aws-sdk/lib-dynamodb");

// const { authAccess } = require("../../middleware/auth");

// const REGION = process.env.AWS_REGION || "ap-south-1";
// const ENROLLMENTS_TABLE = process.env.STUDENT_ENROLLMENTS_TABLE;

// // Product tables (already existing infra)
// const QBANK_TABLE = process.env.DDB_BANKS || "QuestionBanks";
// const MOCKTEST_TABLE = process.env.MOCKTEST_TABLE || "MockTests";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* =========================================================
//    🔹 SAFE HELPER: ENRICH THUMBNAIL (NO LOGIC CHANGE)
// ========================================================= */
// async function enrichThumbnail(enrollment) {
//   if (enrollment.thumbnailUrl) return enrollment;

//   try {
//     if (enrollment.productType === "QBANK") {
//       const r = await ddb.send(
//         new GetCommand({
//           TableName: QBANK_TABLE,
//           Key: { bankId: enrollment.productId },
//         })
//       );
//       enrollment.thumbnailUrl = r.Item?.thumbnailUrl || null;
//     }

//     if (enrollment.productType === "MOCKTEST") {
//       const r = await ddb.send(
//         new GetCommand({
//           TableName: MOCKTEST_TABLE,
//           Key: { mockTestId: enrollment.productId },
//         })
//       );
//       enrollment.thumbnailUrl = r.Item?.imageUrl || null;
//     }
//   } catch (e) {
//     console.warn(
//       "⚠️ Thumbnail enrich failed:",
//       enrollment.productType,
//       enrollment.productId
//     );
//   }

//   return enrollment;
// }

// /* =========================================================
//    GET: STUDENT ENROLLMENTS (MY ENROLLMENTS)
//    ✅ SAFE FIX: DEDUP + THUMBNAIL ENRICH
// ========================================================= */
// router.get("/student/enrollments", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;

//     console.log("🔥 Fetch enrollments for:", studentSub);

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const result = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": "ENROLLMENT#",
//         },
//       })
//     );

//     const items = result.Items || [];

//     /* -----------------------------------------
//        ✅ DEDUP LOGIC (UNCHANGED)
//        Priority: paid > admin > free
//     ------------------------------------------ */
//     const priority = { paid: 3, admin: 2, free: 1 };
//     const map = {};

//     for (const e of items) {
//       const key = e.productId;
//       if (!key) continue;

//       if (!map[key]) {
//         map[key] = e;
//       } else {
//         const prev = map[key];
//         if (
//           (priority[e.accessSource] || 0) >
//           (priority[prev.accessSource] || 0)
//         ) {
//           map[key] = e;
//         }
//       }
//     }

//     /* -----------------------------------------
//        ✅ SAFE ADDITION: THUMBNAIL ENRICH
//     ------------------------------------------ */
//     const finalEnrollments = await Promise.all(
//       Object.values(map).map(enrichThumbnail)
//     );

//     console.log(
//       "✅ Enrollments after dedup:",
//       finalEnrollments.map((e) => ({
//         productId: e.productId,
//         accessSource: e.accessSource,
//         hasThumbnail: !!e.thumbnailUrl,
//       }))
//     );

//     return res.json({
//       enrollments: finalEnrollments,
//     });
//   } catch (err) {
//     console.error("❌ Student enrollments failed", err);
//     return res.status(500).json({ message: "Failed to fetch enrollments" });
//   }
// });

// /* =========================================================
//    POST: FREE ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll/free", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const { productId, productType } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const nowIso = new Date().toISOString();

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk: `ENROLLMENT#${productType}#${productId}`,

//           productId,
//           productType,
//           accessSource: "free",
//           status: "ACTIVE",

//           expiry: null,
//           createdAt: nowIso,
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Free enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll (free)" });
//   }
// });

// /* =========================================================
//    POST: UNIVERSAL ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const {
//       productId,
//       productType,
//       title,
//       thumbnailUrl,
//       accessSource = "free",
//       expiry = null,
//     } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const sk = `ENROLLMENT#${productType}#${productId}`;

//     const existing = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND sk = :sk",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": sk,
//         },
//       })
//     );

//     if (existing.Items && existing.Items.length > 0) {
//       return res.json({ success: true, alreadyEnrolled: true });
//     }

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk,

//           productId,
//           productType,
//           title: title || productType,
//           thumbnailUrl: thumbnailUrl || null,

//           accessSource,
//           status: "ACTIVE",
//           expiry,
//           createdAt: new Date().toISOString(),
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll" });
//   }
// });

// module.exports = router;

// console.log("🔥 StudentEnrollmentsRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   QueryCommand,
//   PutCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const { authAccess } = require("../../middleware/auth");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// /* ✅ SAFE FALLBACK (THIS IS THE FIX) */
// const ENROLLMENTS_TABLE =
//   process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* =========================================================
//    GET: STUDENT ENROLLMENTS (MY ENROLLMENTS)
// ========================================================= */
// router.get("/student/enrollments", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;

//     console.log("🔥 Fetch enrollments for:", studentSub);

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const result = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": "ENROLLMENT#",
//         },
//       })
//     );

//     return res.json({
//       enrollments: result.Items || [],
//     });
//   } catch (err) {
//     console.error("❌ Student enrollments failed", err);
//     return res.status(500).json({ message: "Failed to fetch enrollments" });
//   }
// });

// /* =========================================================
//    POST: FREE ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll/free", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const { productId, productType } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const nowIso = new Date().toISOString();

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk: `ENROLLMENT#${productType}#${productId}`,

//           productId,
//           productType,
//           accessSource: "free",
//           status: "ACTIVE",

//           expiry: null,
//           createdAt: nowIso,
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Free enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll (free)" });
//   }
// });

// /* =========================================================
//    POST: UNIVERSAL ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const {
//       productId,
//       productType,
//       title,
//       thumbnailUrl,
//       accessSource = "free",
//       expiry = null,
//     } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const sk = `ENROLLMENT#${productType}#${productId}`;

//     const existing = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND sk = :sk",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": sk,
//         },
//       })
//     );

//     if (existing.Items && existing.Items.length > 0) {
//       return res.json({ success: true, alreadyEnrolled: true });
//     }

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk,

//           productId,
//           productType,
//           title: title || productType,
//           thumbnailUrl: thumbnailUrl || null,

//           accessSource,
//           status: "ACTIVE",
//           expiry,
//           createdAt: new Date().toISOString(),
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll" });
//   }
// });

// module.exports = router;


//19th jan 

// console.log("🔥 StudentEnrollmentsRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const { sendAssignmentEmail } = require("../../Services/sendAssignmentEmail");


// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   QueryCommand,
//   PutCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const { authAccess } = require("../../middleware/auth");
// const adminRoute = require("../../middleware/adminRoute");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// /* ✅ SAFE FALLBACK */
// const ENROLLMENTS_TABLE =
//   process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* =========================================================
//    GET: STUDENT ENROLLMENTS (MY ENROLLMENTS)
//    ✅ ADDITIVE: isExpired FLAG (NO LOGIC CHANGE)
// ========================================================= */
// router.get("/student/enrollments", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;

//     console.log("🔥 Fetch enrollments for:", studentSub);

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const result = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": "ENROLLMENT#",
//         },
//       })
//     );

//     const now = new Date().toISOString();

//     const enrollments = (result.Items || []).map((item) => ({
//       ...item,
//       isExpired: item.expiry ? item.expiry < now : false,
//     }));

//     return res.json({ enrollments });
//   } catch (err) {
//     console.error("❌ Student enrollments failed", err);
//     return res.status(500).json({ message: "Failed to fetch enrollments" });
//   }
// });

// /* =========================================================
//    POST: FREE ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll/free", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const { productId, productType } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const nowIso = new Date().toISOString();

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk: `ENROLLMENT#${productType}#${productId}`,

//           productId,
//           productType,
//           accessSource: "free",
//           status: "ACTIVE",

//           expiry: null,
//           createdAt: nowIso,
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Free enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll (free)" });
//   }
// });

// /* =========================================================
//    POST: UNIVERSAL ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const {
//       productId,
//       productType,
//       title,
//       thumbnailUrl,
//       accessSource = "free",
//       expiry = null,
//     } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const sk = `ENROLLMENT#${productType}#${productId}`;

//     const existing = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND sk = :sk",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": sk,
//         },
//       })
//     );

//     if (existing.Items && existing.Items.length > 0) {
//       return res.json({ success: true, alreadyEnrolled: true });
//     }

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk,

//           productId,
//           productType,
//           title: title || productType,
//           thumbnailUrl: thumbnailUrl || null,

//           accessSource,
//           status: "ACTIVE",
//           expiry,
//           createdAt: new Date().toISOString(),
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll" });
//   }
// });

// /* =========================================================
//    ✅ POST: ADMIN ASSIGN PRODUCT TO ANY STUDENT
//    ✅ EMAIL SENT ONLY HERE
// ========================================================= */
// router.post(
//   "/admin/assign-product",
//   authAccess,
//   adminRoute,
//   async (req, res) => {
//     try {
//       const {
//         studentSub,
//         studentEmail,
//         studentName,

//         productId,
//         productType,
//         title,
//         thumbnailUrl,

//         accessType,
//         expiry = null,
//       } = req.body || {};

//       if (!studentSub) {
//         return res.status(400).json({ message: "studentSub required" });
//       }
//       if (!productId || !productType) {
//         return res
//           .status(400)
//           .json({ message: "productId & productType required" });
//       }

//       let finalExpiry = expiry;
//       if (!finalExpiry && typeof accessType === "string") {
//         const m = accessType.match(/(\d+)\s*day/i);
//         if (m?.[1]) {
//           const days = parseInt(m[1], 10);
//           const d = new Date();
//           d.setDate(d.getDate() + days);
//           finalExpiry = d.toISOString();
//         }
//       }

//       const sk = `ENROLLMENT#${productType}#${productId}`;

//       const existing = await ddb.send(
//         new QueryCommand({
//           TableName: ENROLLMENTS_TABLE,
//           KeyConditionExpression: "pk = :pk AND sk = :sk",
//           ExpressionAttributeValues: {
//             ":pk": `USER#${studentSub}`,
//             ":sk": sk,
//           },
//         })
//       );

//       if (existing.Items && existing.Items.length > 0) {
//         return res.json({ success: true, alreadyEnrolled: true });
//       }

//       await ddb.send(
//         new PutCommand({
//           TableName: ENROLLMENTS_TABLE,
//           Item: {
//             pk: `USER#${studentSub}`,
//             sk,

//             productId,
//             productType,
//             title: title || productType,
//             thumbnailUrl: thumbnailUrl || null,

//             accessSource: "admin",
//             accessType: accessType || null,
//             status: "ACTIVE",

//             expiry: finalExpiry,
//             createdAt: new Date().toISOString(),
//           },
//         })
//       );

//       // 📧 EMAIL — ADMIN ASSIGN ONLY (NON-BLOCKING)
//       if (studentEmail) {
//         sendAssignmentEmail({
//           to: studentEmail,
//           studentName,
//           productName: title || productType,
//           productType,
//           expiry: finalExpiry,
//         }).catch((err) => {
//           console.error("❌ Assignment email failed:", err);
//         });
//       }

//       return res.json({ success: true });
//     } catch (err) {
//       console.error("❌ Admin assign failed", err);
//       return res.status(500).json({ message: "Failed to assign product" });
//     }
//   }
// );

// module.exports = router;

//21th jan

// console.log("🔥 StudentEnrollmentsRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const { sendAssignmentEmail } = require("../../Services/sendAssignmentEmail");


// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   QueryCommand,
//   PutCommand,
//   GetCommand, // ✅ ADD
// } = require("@aws-sdk/lib-dynamodb");


// const { authAccess } = require("../../middleware/auth");
// const adminRoute = require("../../middleware/adminRoute");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// /* ✅ SAFE FALLBACK */
// const ENROLLMENTS_TABLE =
//   process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";
//   // ✅ Product tables (use your existing envs)
// const COURSES_TABLE = process.env.DDB_TABLE || "edzest_lms";         // Courses meta live here
// const QBANK_TABLE   = process.env.DDB_BANKS;                          // QuestionBanks
// const EBOOK_TABLE   = process.env.DDB_EBOOKS_TABLE;                   // EBooks
// const MOCK_TABLE    = process.env.MOCKTESTS_TABLE;                    // MockTests


// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// async function safeGet(tableName, keyCandidates = []) {
//   if (!tableName) return null;

//   for (const Key of keyCandidates) {
//     try {
//       const out = await ddb.send(new GetCommand({ TableName: tableName, Key }));
//       if (out?.Item) return out.Item;
//     } catch (e) {
//       // Key schema mismatch etc. -> try next candidate
//     }
//   }
//   return null;
// }

// async function fetchProductMeta(productType, productId) {
//   const type = String(productType || "").toUpperCase();

//   // COURSE meta stored in edzest_lms with pk/sk
//   if (type === "COURSE") {
//     const item = await safeGet(COURSES_TABLE, [
//       { pk: `COURSE#${productId}`, sk: "META" },
//     ]);
//     if (!item) return {};
//     return {
//       title: item.title,
//       thumbnailUrl: item.thumbnailUrl || item.imageUrl || item.bannerUrl || null,
//     };
//   }

//   if (type === "MOCKTEST") {
//     const item = await safeGet(MOCK_TABLE, [
//       { mockTestId: productId },
//       { id: productId },
//     ]);
//     if (!item) return {};
//     return {
//       title: item.title,
//       thumbnailUrl: item.thumbnailUrl || item.imageUrl || item.coverUrl || null,
//     };
//   }

//   if (type === "QBANK") {
//     const item = await safeGet(QBANK_TABLE, [
//       { bankId: productId },
//       { qbankId: productId },
//       { id: productId },
//     ]);
//     if (!item) return {};
//     return {
//       title: item.title || item.name,
//       thumbnailUrl: item.thumbnailUrl || item.imageUrl || null,
//     };
//   }

//   if (type === "EBOOK") {
//     const item = await safeGet(EBOOK_TABLE, [
//       { ebookId: productId },
//       { id: productId },
//     ]);
//     if (!item) return {};
//     return {
//       title: item.title,
//       thumbnailUrl: item.thumbnailUrl || item.coverUrl || item.imageUrl || null,
//     };
//   }

//   return {};
// }


// /* =========================================================
//    GET: STUDENT ENROLLMENTS (MY ENROLLMENTS)
//    ✅ ADDITIVE: isExpired FLAG (NO LOGIC CHANGE)
// ========================================================= */
// router.get("/student/enrollments", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;

//     console.log("🔥 Fetch enrollments for:", studentSub);

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const result = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": "ENROLLMENT#",
//         },
//       })
//     );

//     const now = new Date().toISOString();

//    const raw = (result.Items || []).map((item) => ({
//   ...item,
//   isExpired: item.expiry ? item.expiry < now : false,
// }));

// // ✅ ENRICH: if thumbnail/title missing, fetch from product tables
// const enrollments = await Promise.all(
//   raw.map(async (e) => {
//     if (e.thumbnailUrl && e.title) return e;

//     const meta = await fetchProductMeta(e.productType, e.productId);
//     return {
//       ...e,
//       title: e.title || meta.title || e.productType,
//       thumbnailUrl: e.thumbnailUrl || meta.thumbnailUrl || null,
//     };
//   })
// );


//     return res.json({ enrollments });
//   } catch (err) {
//     console.error("❌ Student enrollments failed", err);
//     return res.status(500).json({ message: "Failed to fetch enrollments" });
//   }
// });

// /* =========================================================
//    POST: FREE ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll/free", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const { productId, productType } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const nowIso = new Date().toISOString();

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk: `ENROLLMENT#${productType}#${productId}`,

//           productId,
//           productType,
//           accessSource: "free",
//           status: "ACTIVE",

//           expiry: null,
//           createdAt: nowIso,
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Free enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll (free)" });
//   }
// });

// /* =========================================================
//    POST: UNIVERSAL ENROLL (UNCHANGED)
// ========================================================= */
// router.post("/student/enroll", authAccess, async (req, res) => {
//   try {
//     const studentSub = req.user?.sub;
//     const {
//       productId,
//       productType,
//       title,
//       thumbnailUrl,
//       accessSource = "free",
//       expiry = null,
//     } = req.body || {};

//     if (!studentSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!productId || !productType) {
//       return res
//         .status(400)
//         .json({ message: "productId & productType required" });
//     }

//     const sk = `ENROLLMENT#${productType}#${productId}`;

//     const existing = await ddb.send(
//       new QueryCommand({
//         TableName: ENROLLMENTS_TABLE,
//         KeyConditionExpression: "pk = :pk AND sk = :sk",
//         ExpressionAttributeValues: {
//           ":pk": `USER#${studentSub}`,
//           ":sk": sk,
//         },
//       })
//     );

//     if (existing.Items && existing.Items.length > 0) {
//       return res.json({ success: true, alreadyEnrolled: true });
//     }

//     await ddb.send(
//       new PutCommand({
//         TableName: ENROLLMENTS_TABLE,
//         Item: {
//           pk: `USER#${studentSub}`,
//           sk,

//           productId,
//           productType,
//           title: title || productType,
//           thumbnailUrl: thumbnailUrl || null,

//           accessSource,
//           status: "ACTIVE",
//           expiry,
//           createdAt: new Date().toISOString(),
//         },
//       })
//     );

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Enroll failed", err);
//     return res.status(500).json({ message: "Failed to enroll" });
//   }
// });

// /* =========================================================
//    ✅ POST: ADMIN ASSIGN PRODUCT TO ANY STUDENT
//    ✅ EMAIL SENT ONLY HERE
// ========================================================= */
// router.post(
//   "/admin/assign-product",
//   authAccess,
//   adminRoute,
//   async (req, res) => {
//     try {
//       const {
//         studentSub,
//         studentEmail,
//         studentName,

//         productId,
//         productType,
//         title,
//         thumbnailUrl,

//         accessType,
//         expiry = null,
//       } = req.body || {};

//       if (!studentSub) {
//         return res.status(400).json({ message: "studentSub required" });
//       }
//       if (!productId || !productType) {
//         return res
//           .status(400)
//           .json({ message: "productId & productType required" });
//       }

//       let finalExpiry = expiry;
//       if (!finalExpiry && typeof accessType === "string") {
//         const m = accessType.match(/(\d+)\s*day/i);
//         if (m?.[1]) {
//           const days = parseInt(m[1], 10);
//           const d = new Date();
//           d.setDate(d.getDate() + days);
//           finalExpiry = d.toISOString();
//         }
//       }

//       const sk = `ENROLLMENT#${productType}#${productId}`;

//       const existing = await ddb.send(
//         new QueryCommand({
//           TableName: ENROLLMENTS_TABLE,
//           KeyConditionExpression: "pk = :pk AND sk = :sk",
//           ExpressionAttributeValues: {
//             ":pk": `USER#${studentSub}`,
//             ":sk": sk,
//           },
//         })
//       );

//       if (existing.Items && existing.Items.length > 0) {
//         return res.json({ success: true, alreadyEnrolled: true });
//       }

//       await ddb.send(
//         new PutCommand({
//           TableName: ENROLLMENTS_TABLE,
//           Item: {
//             pk: `USER#${studentSub}`,
//             sk,

//             productId,
//             productType,
//             title: title || productType,
//             thumbnailUrl: thumbnailUrl || null,

//             accessSource: "admin",
//             accessType: accessType || null,
//             status: "ACTIVE",

//             expiry: finalExpiry,
//             createdAt: new Date().toISOString(),
//           },
//         })
//       );

//       // 📧 EMAIL — ADMIN ASSIGN ONLY (NON-BLOCKING)
//       if (studentEmail) {
//         sendAssignmentEmail({
//           to: studentEmail,
//           studentName,
//           productName: title || productType,
//           productType,
//           expiry: finalExpiry,
//         }).catch((err) => {
//           console.error("❌ Assignment email failed:", err);
//         });
//       }

//       return res.json({ success: true });
//     } catch (err) {
//       console.error("❌ Admin assign failed", err);
//       return res.status(500).json({ message: "Failed to assign product" });
//     }
//   }
// );

// module.exports = router;


console.log("🔥 StudentEnrollmentsRoute LOADED");

const express = require("express");
const router = express.Router();

const { sendAssignmentEmail } = require("../../Services/sendAssignmentEmail");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const { authAccess } = require("../../middleware/auth");
const adminRoute = require("../../middleware/adminRoute");

const REGION = process.env.AWS_REGION || "ap-south-1";

/* ✅ SAFE FALLBACK */
const ENROLLMENTS_TABLE =
  process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";

/* ✅ Product tables (existing infra only) */
const COURSES_TABLE = process.env.DDB_TABLE || "edzest_lms";
const QBANK_TABLE   = process.env.DDB_BANKS;
const EBOOK_TABLE   = process.env.DDB_EBOOKS_TABLE;
const MOCK_TABLE    = process.env.MOCKTESTS_TABLE;

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

/* ---------------- SAFE GET ---------------- */
async function safeGet(tableName, keys = []) {
  if (!tableName) return null;
  for (const Key of keys) {
    try {
      const r = await ddb.send(new GetCommand({ TableName: tableName, Key }));
      if (r?.Item) return r.Item;
    } catch {}
  }
  return null;
}

/* ---------------- PRODUCT META FETCH ---------------- */
async function fetchProductMeta(type, productId) {
  type = String(type || "").toUpperCase();

  if (type === "COURSE") {
    const i = await safeGet(COURSES_TABLE, [
      { pk: `COURSE#${productId}`, sk: "META" },
    ]);
    return i ? {
      title: i.title,
      thumbnailUrl: i.thumbnailUrl || i.imageUrl || i.bannerUrl || null,
    } : {};
  }

  if (type === "MOCKTEST") {
    const i = await safeGet(MOCK_TABLE, [{ mockTestId: productId }]);
    return i ? {
      title: i.title,
      thumbnailUrl: i.thumbnailUrl || i.imageUrl || null,
    } : {};
  }

  if (type === "QBANK") {
    const i = await safeGet(QBANK_TABLE, [{ bankId: productId }]);
    return i ? {
      title: i.title || i.name,
      thumbnailUrl: i.thumbnailUrl || i.imageUrl || null,
    } : {};
  }

  if (type === "EBOOK") {
    const i = await safeGet(EBOOK_TABLE, [{ ebookId: productId }]);
    return i ? {
      title: i.title,
      thumbnailUrl: i.thumbnailUrl || i.coverUrl || null,
    } : {};
  }

  return {};
}

/* =========================================================
   GET: STUDENT ENROLLMENTS (SAFE ENRICH)
========================================================= */
router.get("/student/enrollments", authAccess, async (req, res) => {
  try {
    const sub = req.user?.sub;
    if (!sub) return res.status(401).json({ message: "Unauthorized" });

    const result = await ddb.send(
      new QueryCommand({
        TableName: ENROLLMENTS_TABLE,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${sub}`,
          ":sk": "ENROLLMENT#",
        },
      })
    );

    const now = new Date().toISOString();

    const enriched = await Promise.all(
      (result.Items || []).map(async (e) => {
        const meta =
          e.thumbnailUrl && e.title
            ? {}
            : await fetchProductMeta(e.productType, e.productId);

        return {
          ...e,
          isExpired: e.expiry ? e.expiry < now : false,
          title: e.title || meta.title || e.productType,
          thumbnailUrl: e.thumbnailUrl || meta.thumbnailUrl || null,
        };
      })
    );

    return res.json({ enrollments: enriched });
  } catch (err) {
    console.error("❌ Student enrollments failed", err);
    return res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

/* =========================================================
   POST: FREE ENROLL (UNCHANGED)
========================================================= */
router.post("/student/enroll/free", authAccess, async (req, res) => {
  try {
    const sub = req.user?.sub;
    const { productId, productType } = req.body || {};

    if (!sub || !productId || !productType) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await ddb.send(
      new PutCommand({
        TableName: ENROLLMENTS_TABLE,
        Item: {
          pk: `USER#${sub}`,
          sk: `ENROLLMENT#${productType}#${productId}`,
          productId,
          productType,
          accessSource: "free",
          status: "ACTIVE",
          expiry: null,
          createdAt: new Date().toISOString(),
        },
      })
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Free enroll failed", err);
    return res.status(500).json({ message: "Failed to enroll (free)" });
  }
});

/* =========================================================
   POST: ADMIN ASSIGN (UNCHANGED BEHAVIOR)
========================================================= */
router.post(
  "/admin/assign-product",
  authAccess,
  adminRoute,
  async (req, res) => {
    try {
      const {
        studentSub,
        studentEmail,
        studentName,
        productId,
        productType,
        title,
        thumbnailUrl,
        accessType,
        expiry,
      } = req.body || {};

      if (!studentSub || !productId || !productType) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const sk = `ENROLLMENT#${productType}#${productId}`;

      await ddb.send(
        new PutCommand({
          TableName: ENROLLMENTS_TABLE,
          Item: {
            pk: `USER#${studentSub}`,
            sk,
            productId,
            productType,
            title: title || productType,
            thumbnailUrl: thumbnailUrl || null,
            accessSource: "admin",
            accessType: accessType || null,
            status: "ACTIVE",
            expiry: expiry || null,
            createdAt: new Date().toISOString(),
          },
        })
      );

      if (studentEmail) {
        sendAssignmentEmail({
          to: studentEmail,
          studentName,
          productName: title || productType,
          productType,
          expiry,
        }).catch(() => {});
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("❌ Admin assign failed", err);
      return res.status(500).json({ message: "Failed to assign product" });
    }
  }
);

module.exports = router;
