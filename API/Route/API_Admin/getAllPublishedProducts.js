




// const express = require("express");
// const router = express.Router();
// const { authAccess } = require("../../middleware/auth");

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* ======================================================
//    GET ALL ASSIGNABLE PRODUCTS (REAL TABLES – FINAL)
// ====================================================== */
// router.get("/api/admin/products/published", authAccess, async (req, res) => {
//   try {
//     const products = [];

//     /* ================= MOCK TESTS ================= */
//     const mockRes = await ddb.send(
//       new ScanCommand({
//         TableName: process.env.MOCKTESTS_TABLE, // MockTests
//         FilterExpression: "#s = :p",
//         ExpressionAttributeNames: { "#s": "status" },
//         ExpressionAttributeValues: { ":p": "PUBLISHED" },
//       })
//     );

//     (mockRes.Items || []).forEach((m) => {
//       products.push({
//         id: m.mockTestId,
//         kind: "MOCKTEST",
//         title: m.title,
//         thumbnailUrl: m.thumbnailUrl || m.imageUrl || m.coverUrl || null, // ✅ ADD
//       });
//     });

 
//   /* ================= COURSES (EDZEST_LMS – FINAL WORKING) ================= */
// /* ================= COURSES (ONLY COURSE ROOT ITEMS) ================= */
// const courseRes = await ddb.send(
//   new ScanCommand({
//     TableName: process.env.DDB_TABLE || "edzest_lms",
//     FilterExpression: "#sk = :meta AND #status = :published",
//     ExpressionAttributeNames: {
//       "#sk": "sk",
//       "#status": "status",
//     },
//     ExpressionAttributeValues: {
//       ":meta": "META",
//       ":published": "PUBLISHED",
//     },
//   })
// );

// (courseRes.Items || []).forEach((c) => {
//   products.push({
//     id: c.courseId || c.pk.replace("COURSE#", ""),
//     kind: "COURSE",
//     title: c.title,
//     thumbnailUrl: c.thumbnailUrl || c.imageUrl || c.bannerUrl || null, // ✅ ADD
//   });
// });
//     /* ================= QBANK ================= */
//     const qbankRes = await ddb.send(
//       new ScanCommand({
//         TableName: process.env.DDB_BANKS, // QuestionBanks
//       })
//     );

//     (qbankRes.Items || []).forEach((q) => {
//       products.push({
//         id: q.bankId || q.qbankId,
//         kind: "QBANK",
//         title: q.title || q.name,
//         thumbnailUrl: q.thumbnailUrl || q.imageUrl || null, // ✅ ADD
//       });
//     });

//     /* ================= EBOOKS ================= */
//     const ebookRes = await ddb.send(
//       new ScanCommand({
//         TableName: process.env.DDB_EBOOKS_TABLE, // e-book
//       })
//     );

//     (ebookRes.Items || []).forEach((e) => {
//       products.push({
//         id: e.ebookId || e.id,
//         kind: "EBOOK",
//         title: e.title,
//         thumbnailUrl: e.thumbnailUrl || e.coverUrl || e.imageUrl || null, // ✅ ADD
//       });
//     });

//     console.log("🔥 FINAL PRODUCTS:", products);
//     res.json(products);
//   } catch (err) {
//     console.error("❌ PRODUCTS FETCH ERROR", err);
//     res.status(500).json({ message: "Failed to load products" });
//   }
// });

// module.exports = router;







// const express = require("express");
// const router = express.Router();
// const { authAccess } = require("../../middleware/auth");

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* ================= PUBLISHED CHECK (FIX) ================= */
// function isPublished(item) {
//   const v =
//     item?.status ??
//     item?.publishStatus ??
//     item?.published ??
//     item?.isPublished;

//   if (typeof v === "string") return v.toLowerCase() === "published";
//   if (typeof v === "boolean") return v === true;
//   if (typeof v === "number") return v === 1;

//   return false;
// }

// /* ======================================================
//    GET ALL ASSIGNABLE PRODUCTS (REAL TABLES – FINAL)
// ====================================================== */
// router.get("/api/admin/products/published", authAccess, async (req, res) => {
//   try {
//     const products = [];

//     /* ================= MOCK TESTS ================= */
//     const mockRes = await ddb.send(
//       new ScanCommand({
//         TableName: process.env.MOCKTESTS_TABLE, // MockTests
//         FilterExpression: "#s = :p",
//         ExpressionAttributeNames: { "#s": "status" },
//         ExpressionAttributeValues: { ":p": "PUBLISHED" },
//       })
//     );

//     (mockRes.Items || []).forEach((m) => {
//       products.push({
//         id: m.mockTestId,
//         kind: "MOCKTEST",
//         title: m.title,
//         thumbnailUrl: m.thumbnailUrl || m.imageUrl || m.coverUrl || null, // ✅ ADD
//       });
//     });

 
//   /* ================= COURSES (EDZEST_LMS – FINAL WORKING) ================= */
// /* ================= COURSES (ONLY COURSE ROOT ITEMS) ================= */
// const courseRes = await ddb.send(
//   new ScanCommand({
//     TableName: process.env.DDB_TABLE || "edzest_lms",
//     FilterExpression: "#sk = :meta AND #status = :published",
//     ExpressionAttributeNames: {
//       "#sk": "sk",
//       "#status": "status",
//     },
//     ExpressionAttributeValues: {
//       ":meta": "META",
//       ":published": "PUBLISHED",
//     },
//   })
// );

// (courseRes.Items || []).forEach((c) => {
//   products.push({
//     id: c.courseId || c.pk.replace("COURSE#", ""),
//     kind: "COURSE",
//     title: c.title,
//     thumbnailUrl: c.thumbnailUrl || c.imageUrl || c.bannerUrl || null, // ✅ ADD
//   });
// });
//     /* ================= QBANK ================= */
    
// const qbankRes = await ddb.send(
//   new ScanCommand({
//     TableName: process.env.DDB_BANKS,
//     FilterExpression: "#s = :p",
//     ExpressionAttributeNames: {
//       "#s": "status",
//     },
//     ExpressionAttributeValues: {
//       ":p": "PUBLISHED",
//     },
//   })
// );

// (qbankRes.Items || []).forEach((q) => {
//   products.push({
//     id: q.bankId || q.qbankId,
//     kind: "QBANK",
//     title: q.title || q.name,
//     thumbnailUrl: q.thumbnailUrl || q.imageUrl || null,
//   });
// });


//     /* ================= EBOOKS ================= */
//     const ebookRes = await ddb.send(
//   new ScanCommand({
//     TableName: process.env.DDB_EBOOKS_TABLE,
//     FilterExpression: "#s = :p",
//     ExpressionAttributeNames: {
//       "#s": "status",
//     },
//     ExpressionAttributeValues: {
//       ":p": "PUBLISHED",
//     },
//   })
// );

// (ebookRes.Items || []).forEach((e) => {
//   products.push({
//     id: e.ebookId || e.id,
//     kind: "EBOOK",
//     title: e.title,
//     thumbnailUrl: e.thumbnailUrl || e.coverUrl || e.imageUrl || null,
//   });
// });

//     console.log("🔥 FINAL PRODUCTS:", products);
//     res.json(products);
//   } catch (err) {
//     console.error("❌ PRODUCTS FETCH ERROR", err);
//     res.status(500).json({ message: "Failed to load products" });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const { authAccess } = require("../../middleware/auth");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "ap-south-1";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

/* ================= PUBLISHED CHECK (SAFE & NON-BREAKING) ================= */
function isPublished(item) {
  const v =
    item?.status ??
    item?.publishStatus ??
    item?.published ??
    item?.isPublished;

  if (typeof v === "string") return v.toLowerCase() === "published";
  if (typeof v === "boolean") return v === true;
  if (typeof v === "number") return v === 1;

  return false;
}

/* ======================================================
   GET ALL ASSIGNABLE PRODUCTS (REAL TABLES – FINAL)
====================================================== */
router.get("/api/admin/products/published", authAccess, async (req, res) => {
  try {
    const products = [];

    /* ================= MOCK TESTS (UNCHANGED) ================= */
    const mockRes = await ddb.send(
      new ScanCommand({
        TableName: process.env.MOCKTESTS_TABLE,
        FilterExpression: "#s = :p",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":p": "PUBLISHED" },
      })
    );

    (mockRes.Items || []).forEach((m) => {
      products.push({
        id: m.mockTestId,
        kind: "MOCKTEST",
        title: m.title,
        thumbnailUrl: m.thumbnailUrl || m.imageUrl || m.coverUrl || null,
      });
    });

    /* ================= COURSES (FIXED – ONLY CHANGE HERE) ================= */
   /* ================= COURSES (META + NON-META – FINAL FIX) ================= */
const courseRes = await ddb.send(
  new ScanCommand({
    TableName: process.env.DDB_TABLE || "edzest_lms",
    FilterExpression: "begins_with(pk, :pk)",
    ExpressionAttributeValues: {
      ":pk": "COURSE#",
    },
  })
);

const courseMap = new Map();

/* ---------- PASS 1: META ROWS ---------- */
(courseRes.Items || [])
  .filter((i) => i.sk === "META")
  .filter(isPublished)
  .forEach((c) => {
    const id =
      c.courseId ||
      (typeof c.pk === "string" ? c.pk.replace("COURSE#", "") : null);

    if (!id) return;

    courseMap.set(id, {
      id,
      kind: "COURSE",
      title: c.title,
      thumbnailUrl:
        c.thumbnailUrl || c.imageUrl || c.bannerUrl || null,
    });
  });

/* ---------- PASS 2: NON-META ROOT ROWS ---------- */
(courseRes.Items || [])
  .filter((i) => i.sk !== "META")
  .filter(isPublished)
  .forEach((c) => {
    const id =
      c.courseId ||
      (typeof c.pk === "string" ? c.pk.replace("COURSE#", "") : null);

    if (!id) return;

    // META already exists → skip
    if (courseMap.has(id)) return;

    courseMap.set(id, {
      id,
      kind: "COURSE",
      title: c.title,
      thumbnailUrl:
        c.thumbnailUrl || c.imageUrl || c.bannerUrl || null,
    });
  });

/* ---------- PUSH FINAL COURSES ---------- */
courseMap.forEach((course) => products.push(course));


    /* ================= QBANK (UNCHANGED) ================= */
    const qbankRes = await ddb.send(
      new ScanCommand({
        TableName: process.env.DDB_BANKS,
        FilterExpression: "#s = :p",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":p": "PUBLISHED",
        },
      })
    );

    (qbankRes.Items || []).forEach((q) => {
      products.push({
        id: q.bankId || q.qbankId,
        kind: "QBANK",
        title: q.title || q.name,
        thumbnailUrl: q.thumbnailUrl || q.imageUrl || null,
      });
    });

    /* ================= EBOOKS (UNCHANGED) ================= */
    const ebookRes = await ddb.send(
      new ScanCommand({
        TableName: process.env.DDB_EBOOKS_TABLE,
        FilterExpression: "#s = :p",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":p": "PUBLISHED",
        },
      })
    );

   (ebookRes.Items || []).forEach((e) => {
  const ebookId =
    e.ebookId ||   // future safe
    e.ebookid ||   // ✅ YOUR DB FIELD (VERY IMPORTANT)
    e.id ||
    (typeof e.pk === "string" ? e.pk.replace("EBOOK#", "") : null);

  if (!ebookId) {
    console.warn("⚠️ SKIPPING EBOOK WITHOUT ID:", e);
    return;
  }

  products.push({
    id: ebookId,
    kind: "EBOOK",
    title: e.title,
    thumbnailUrl:
      e.thumbnailUrl || e.coverUrl || e.imageUrl || null,
  });
});



    console.log("🔥 FINAL PRODUCTS:", products);
    return res.json(products);
  } catch (err) {
    console.error("❌ PRODUCTS FETCH ERROR", err);
    return res.status(500).json({ message: "Failed to load products" });
  }
});

module.exports = router;
