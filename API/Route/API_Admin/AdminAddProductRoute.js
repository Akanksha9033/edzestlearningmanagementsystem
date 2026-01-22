// console.log("🔥 AdminAddProductRoute LOADED");

// const express = require("express");
// const router = express.Router();

// /* ================= AUTH ================= */
// const { authAccess, requireRoles } =
//   require("../../middleware/auth");

// /* ================= DYNAMODB ================= */
// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   ScanCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// const STUDENT_ENROLLMENTS_TABLE =
//   process.env.STUDENT_ENROLLMENTS_TABLE;

// /* ======================================================
//    GET ALL PRODUCTS (COURSE + MOCK + QBANK)
// ====================================================== */
// router.get(
//   "/admin/products",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const products = [];

//       if (process.env.COURSES_TABLE) {
//         const c = await ddb.send(
//           new ScanCommand({ TableName: process.env.COURSES_TABLE })
//         );
//         c.Items?.forEach((x) =>
//           products.push({
//             productId: x.courseId,
//             title: x.title,
//             kind: "COURSE",
//           })
//         );
//       }

//       if (process.env.MOCKTEST_TABLE) {
//         const m = await ddb.send(
//           new ScanCommand({ TableName: process.env.MOCKTEST_TABLE })
//         );
//         m.Items?.forEach((x) =>
//           products.push({
//             productId: x.mockTestId,
//             title: x.title,
//             kind: "MOCKTEST",
//           })
//         );
//       }

//       if (process.env.QBANK_TABLE) {
//         const q = await ddb.send(
//           new ScanCommand({ TableName: process.env.QBANK_TABLE })
//         );
//         q.Items?.forEach((x) =>
//           products.push({
//             productId: x.bankId,
//             title: x.title,
//             kind: "QBANK",
//           })
//         );
//       }

//       return res.json({ products });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Failed to load products" });
//     }
//   }
// );

// /* ======================================================
//    ASSIGN PRODUCT TO USER
// ====================================================== */
// router.post(
//   "/admin/add-product",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const { userId, productId, productType, expiry } = req.body;

//       if (!userId || !productId || !productType) {
//         return res.status(400).json({ message: "Missing fields" });
//       }

//       const item = {
//         pk: `USER#${userId}`,
//         sk: `ENROLLMENT#${productId}`,
//         userId,
//         productId,
//         productType,
//         accessSource: "admin",
//         status: "ACTIVE",
//         expiry: expiry || null,
//         createdAt: new Date().toISOString(),
//       };

//       await ddb.send(
//         new PutCommand({
//           TableName: STUDENT_ENROLLMENTS_TABLE,
//           Item: item,
//         })
//       );

//       return res.json({ success: true });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Assign failed" });
//     }
//   }
// );

// module.exports = router;

// console.log("🔥 AdminAddProductRoute LOADED");

// const express = require("express");
// const router = express.Router();

// /* ================= AUTH ================= */
// const { authAccess, requireRoles } =
//   require("../../middleware/auth");

// /* ================= DYNAMODB ================= */
// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   ScanCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// const STUDENT_ENROLLMENTS_TABLE =
//   process.env.STUDENT_ENROLLMENTS_TABLE;

// /* ======================================================
//    GET ALL PRODUCTS (COURSE + MOCK + QBANK)
//    ✅ ADD thumbnailUrl (NO LOGIC CHANGE)
// ====================================================== */
// router.get(
//   "/admin/products",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const products = [];

//       if (process.env.COURSES_TABLE) {
//         const c = await ddb.send(
//           new ScanCommand({ TableName: process.env.COURSES_TABLE })
//         );
//         c.Items?.forEach((x) =>
//           products.push({
//             productId: x.courseId,
//             title: x.title,
//             kind: "COURSE",
//             thumbnailUrl:
//               x.thumbnailUrl || x.imageUrl || x.bannerUrl || null, // ✅
//           })
//         );
//       }

//       if (process.env.MOCKTEST_TABLE) {
//         const m = await ddb.send(
//           new ScanCommand({ TableName: process.env.MOCKTEST_TABLE })
//         );
//         m.Items?.forEach((x) =>
//           products.push({
//             productId: x.mockTestId,
//             title: x.title,
//             kind: "MOCKTEST",
//             thumbnailUrl:
//               x.thumbnailUrl || x.imageUrl || x.coverUrl || null, // ✅
//           })
//         );
//       }

//       if (process.env.QBANK_TABLE) {
//         const q = await ddb.send(
//           new ScanCommand({ TableName: process.env.QBANK_TABLE })
//         );
//         q.Items?.forEach((x) =>
//           products.push({
//             productId: x.bankId,
//             title: x.title,
//             kind: "QBANK",
//             thumbnailUrl:
//               x.thumbnailUrl || x.imageUrl || null, // ✅
//           })
//         );
//       }

//       return res.json({ products });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Failed to load products" });
//     }
//   }
// );

// /* ======================================================
//    ASSIGN PRODUCT TO USER
//    ✅ STORE thumbnailUrl
// ====================================================== */
// router.post(
//   "/admin/add-product",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const {
//         userId,
//         productId,
//         productType,
//         title,
//         thumbnailUrl, // ✅ ADD
//         expiry,
//       } = req.body;

//       if (!userId || !productId || !productType) {
//         return res.status(400).json({ message: "Missing fields" });
//       }

//       const item = {
//         pk: `USER#${userId}`,
//         sk: `ENROLLMENT#${productType}#${productId}`,

//         userId,
//         productId,
//         productType,
//         title: title || productType,
//         thumbnailUrl: thumbnailUrl || null, // ✅ STORE

//         accessSource: "admin",
//         status: "ACTIVE",
//         expiry: expiry || null,
//         createdAt: new Date().toISOString(),
//       };

//       await ddb.send(
//         new PutCommand({
//           TableName: STUDENT_ENROLLMENTS_TABLE,
//           Item: item,
//         })
//       );

//       return res.json({ success: true });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Assign failed" });
//     }
//   }
// );

// module.exports = router;

console.log("🔥 AdminAddProductRoute LOADED");

const express = require("express");
const router = express.Router();

/* ================= AUTH ================= */
const { authAccess, requireRoles } =
  require("../../middleware/auth");

/* ================= DYNAMODB ================= */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "ap-south-1";

/* ======================================================
   🔧 NORMALIZE THUMBNAIL URL
   s3://bucket/key → https://bucket.s3.amazonaws.com/key
   (NO LOGIC CHANGE – ONLY FORMAT FIX)
====================================================== */
function normalizeThumbnailUrl(url) {
  if (!url) return null;

  if (typeof url === "string" && url.startsWith("s3://")) {
    const noScheme = url.replace("s3://", "");
    const idx = noScheme.indexOf("/");
    if (idx === -1) return null;

    const bucket = noScheme.slice(0, idx);
    const key = noScheme.slice(idx + 1);
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return url;
}

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

const STUDENT_ENROLLMENTS_TABLE =
  process.env.STUDENT_ENROLLMENTS_TABLE;

/* ======================================================
   GET ALL PRODUCTS (COURSE + MOCK + QBANK)
====================================================== */
router.get(
  "/admin/products",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (req, res) => {
    try {
      const products = [];

      /* ---------- COURSES ---------- */
      if (process.env.COURSES_TABLE) {
        const c = await ddb.send(
          new ScanCommand({ TableName: process.env.COURSES_TABLE })
        );

        console.log("🧪 [COURSES SCAN] table =", process.env.COURSES_TABLE);
        console.log("🧪 [COURSES SCAN] count =", c.Items?.length || 0);

        c.Items?.forEach((x, i) => {
          if (i < 3) {
            console.log("🧩 [COURSE RAW ITEM]", {
              pk: x.pk,
              sk: x.sk,
              title: x.title,
              image: x.image,
              wallpaperUrl: x.wallpaperUrl,
              thumbnail: x.thumbnail,
            });
          }

          const courseId =
            typeof x.pk === "string" && x.pk.startsWith("COURSE#")
              ? x.pk.replace("COURSE#", "")
              : null;

          products.push({
            productId: courseId,
            title: x.title,
            kind: "COURSE",
            thumbnailUrl: normalizeThumbnailUrl(
              x.image ||
              x.wallpaperUrl ||
              x.thumbnail ||
              null
            ),
          });
        });
      }

      /* ---------- MOCKTEST ---------- */
      if (process.env.MOCKTEST_TABLE) {
        const m = await ddb.send(
          new ScanCommand({ TableName: process.env.MOCKTEST_TABLE })
        );

        m.Items?.forEach((x) =>
          products.push({
            productId: x.mockTestId,
            title: x.title,
            kind: "MOCKTEST",
            thumbnailUrl: normalizeThumbnailUrl(
              x.thumbnailUrl || x.imageUrl || x.coverUrl || null
            ),
          })
        );
      }

      /* ---------- QBANK ---------- */
      if (process.env.QBANK_TABLE) {
        const q = await ddb.send(
          new ScanCommand({ TableName: process.env.QBANK_TABLE })
        );

        q.Items?.forEach((x) =>
          products.push({
            productId: x.bankId,
            title: x.title,
            kind: "QBANK",
            thumbnailUrl: normalizeThumbnailUrl(
              x.thumbnailUrl || x.imageUrl || null
            ),
          })
        );
      }

      console.log("🔥 FINAL PRODUCTS:", products);
      return res.json({ products });
    } catch (err) {
      console.error("❌ Failed to load products", err);
      res.status(500).json({ message: "Failed to load products" });
    }
  }
);

/* ======================================================
   ASSIGN PRODUCT TO USER
====================================================== */
router.post(
  "/admin/add-product",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { userId, productId, productType, expiry } = req.body;

      if (!userId || !productId || !productType) {
        return res.status(400).json({ message: "Missing fields" });
      }

      let product = null;

      /* ---------- COURSE ---------- */
      if (productType === "COURSE" && process.env.COURSES_TABLE) {
        const r = await ddb.send(
          new ScanCommand({ TableName: process.env.COURSES_TABLE })
        );

        product = r.Items?.find(
          (x) =>
            x.pk === `COURSE#${productId}` &&
            x.sk === "META"
        );
      }

      /* ---------- MOCKTEST ---------- */
      if (productType === "MOCKTEST" && process.env.MOCKTEST_TABLE) {
        const r = await ddb.send(
          new ScanCommand({ TableName: process.env.MOCKTEST_TABLE })
        );
        product = r.Items?.find((x) => x.mockTestId === productId);
      }

      /* ---------- QBANK ---------- */
      if (productType === "QBANK" && process.env.QBANK_TABLE) {
        const r = await ddb.send(
          new ScanCommand({ TableName: process.env.QBANK_TABLE })
        );
        product = r.Items?.find((x) => x.bankId === productId);
      }

      let rawThumbnail = null;

      if (productType === "COURSE") {
        rawThumbnail =
          product?.image ||
          product?.wallpaperUrl ||
          product?.thumbnail ||
          null;
      } else {
        rawThumbnail =
          product?.thumbnailUrl ||
          product?.imageUrl ||
          product?.coverUrl ||
          null;
      }

      const normalizedThumbnail =
        normalizeThumbnailUrl(rawThumbnail);

      console.log("🖼️ [ASSIGN] productType =", productType);
      console.log("🖼️ [ASSIGN] raw thumbnail =", rawThumbnail);
      console.log("🖼️ [ASSIGN] normalized thumbnail =", normalizedThumbnail);

      const item = {
        pk: `USER#${userId}`,
        sk: `ENROLLMENT#${productType}#${productId}`,

        productId,
        productType,
        title: product?.title || productType,
        thumbnailUrl: normalizedThumbnail,

        accessSource: "admin",
        status: "ACTIVE",
        expiry: expiry || null,
        createdAt: new Date().toISOString(),
      };

      console.log("📦 [ASSIGN] saving enrollment =", item);

      await ddb.send(
        new PutCommand({
          TableName: STUDENT_ENROLLMENTS_TABLE,
          Item: item,
        })
      );

      return res.json({ success: true });
    } catch (err) {
      console.error("❌ Assign failed", err);
      res.status(500).json({ message: "Assign failed" });
    }
  }
);

module.exports = router;
