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

console.log("🔥 StudentEnrollmentsRoute LOADED");

const express = require("express");
const router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const { authAccess } = require("../../middleware/auth");

const REGION = process.env.AWS_REGION || "ap-south-1";

/* ✅ SAFE FALLBACK (THIS IS THE FIX) */
const ENROLLMENTS_TABLE =
  process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

/* =========================================================
   GET: STUDENT ENROLLMENTS (MY ENROLLMENTS)
========================================================= */
router.get("/student/enrollments", authAccess, async (req, res) => {
  try {
    const studentSub = req.user?.sub;

    console.log("🔥 Fetch enrollments for:", studentSub);

    if (!studentSub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await ddb.send(
      new QueryCommand({
        TableName: ENROLLMENTS_TABLE,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${studentSub}`,
          ":sk": "ENROLLMENT#",
        },
      })
    );

    return res.json({
      enrollments: result.Items || [],
    });
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
    const studentSub = req.user?.sub;
    const { productId, productType } = req.body || {};

    if (!studentSub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!productId || !productType) {
      return res
        .status(400)
        .json({ message: "productId & productType required" });
    }

    const nowIso = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: ENROLLMENTS_TABLE,
        Item: {
          pk: `USER#${studentSub}`,
          sk: `ENROLLMENT#${productType}#${productId}`,

          productId,
          productType,
          accessSource: "free",
          status: "ACTIVE",

          expiry: null,
          createdAt: nowIso,
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
   POST: UNIVERSAL ENROLL (UNCHANGED)
========================================================= */
router.post("/student/enroll", authAccess, async (req, res) => {
  try {
    const studentSub = req.user?.sub;
    const {
      productId,
      productType,
      title,
      thumbnailUrl,
      accessSource = "free",
      expiry = null,
    } = req.body || {};

    if (!studentSub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!productId || !productType) {
      return res
        .status(400)
        .json({ message: "productId & productType required" });
    }

    const sk = `ENROLLMENT#${productType}#${productId}`;

    const existing = await ddb.send(
      new QueryCommand({
        TableName: ENROLLMENTS_TABLE,
        KeyConditionExpression: "pk = :pk AND sk = :sk",
        ExpressionAttributeValues: {
          ":pk": `USER#${studentSub}`,
          ":sk": sk,
        },
      })
    );

    if (existing.Items && existing.Items.length > 0) {
      return res.json({ success: true, alreadyEnrolled: true });
    }

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

          accessSource,
          status: "ACTIVE",
          expiry,
          createdAt: new Date().toISOString(),
        },
      })
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Enroll failed", err);
    return res.status(500).json({ message: "Failed to enroll" });
  }
});

module.exports = router;
