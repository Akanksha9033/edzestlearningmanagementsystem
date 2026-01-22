// console.log("🔥 AdminAssignProductRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// const { authAccess } = require("../../middleware/auth");
// const { enrollStudent } = require("../../Services/enrollStudent");
// const { sendAssignmentEmail } = require("../../Services/sendAssignmentEmail");


// const REGION = process.env.AWS_REGION || "ap-south-1";
// const ENROLLMENTS_TABLE =
//   process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* =========================================================
//    POST: ADMIN ASSIGN PRODUCT
// ========================================================= */
// router.post("/admin/assign-product", authAccess, async (req, res) => {
//   try {
//     const adminSub = req.user?.sub;

//     const {
//       studentSub,
//       productId,
//       productType,
//       title,
//         thumbnailUrl, // ✅ ADD
//       expiry,          // "2026-12-31"
//       studentEmail,
//       studentName,
//     } = req.body || {};

//     if (!adminSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!studentSub || !productId || !productType) {
//       return res.status(400).json({
//         message: "studentSub, productId, productType required",
//       });
//     }

//     const result = await enrollStudent({
//       ddb,
//       tableName: ENROLLMENTS_TABLE,
//       studentSub,
//       productId,
//       productType,
//       title,
//         thumbnailUrl, // ✅ ADD
//       accessSource: "admin",
//       expiry: expiry ? new Date(expiry).toISOString() : null,
//       assignedBy: adminSub,
//     });

//     // 📧 Send email
//     if (studentEmail) {
//      await sendAssignmentEmail({
//   to: studentEmail,               // student ka email
//   studentName,
//   productName: title || productType,
//   productType,
//   expiry,
// });

//     }

//     return res.json({ success: true, ...result });
//   } catch (err) {
//     console.error("❌ Admin assign failed", err);
//     return res.status(500).json({ message: "Admin assign failed" });
//   }
// });

// module.exports = router;

// console.log("🔥 AdminAssignProductRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   GetCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const { authAccess } = require("../../middleware/auth");
// const { enrollStudent } = require("../../Services/enrollStudent");
// const { sendAssignmentEmail } = require("../../Services/sendAssignmentEmail");

// const REGION = process.env.AWS_REGION || "ap-south-1";
// const ENROLLMENTS_TABLE =
//   process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// /* =========================================================
//    POST: ADMIN ASSIGN PRODUCT
// ========================================================= */
// router.post("/admin/assign-product", authAccess, async (req, res) => {
//   try {
//     const adminSub = req.user?.sub;

//     const {
//       studentSub,
//       productId,
//       productType,
//       title,
//       expiry,
//       studentEmail,
//       studentName,
//     } = req.body || {};

//     console.log("📥 [ASSIGN] Request body:", req.body);

//     if (!adminSub) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (!studentSub || !productId || !productType) {
//       return res.status(400).json({
//         message: "studentSub, productId, productType required",
//       });
//     }

//     /* -------------------------------------------
//        🔍 FETCH THUMBNAIL FROM PRODUCT TABLE
//     -------------------------------------------- */
//     let thumbnailUrl = null;

//     try {
//       if (productType === "MOCKTEST" && process.env.MOCKTEST_TABLE) {
//         const r = await ddb.send(
//           new GetCommand({
//             TableName: process.env.MOCKTEST_TABLE,
//             Key: { mockTestId: productId },
//           })
//         );
//         thumbnailUrl = r.Item?.imageUrl || null;
//       }

//       if (productType === "QBANK" && process.env.QBANK_TABLE) {
//         const r = await ddb.send(
//           new GetCommand({
//             TableName: process.env.QBANK_TABLE,
//             Key: { bankId: productId },
//           })
//         );
//         thumbnailUrl = r.Item?.thumbnailUrl || null;
//       }

//       // ⚠️ Course me thumbnail hi nahi hai (tumhare SS se confirmed)
//       if (productType === "COURSE") {
//         thumbnailUrl = null;
//       }

//       console.log("🖼️ [ASSIGN] Resolved thumbnail:", thumbnailUrl);
//     } catch (e) {
//       console.error("❌ [ASSIGN] Thumbnail fetch failed", e);
//     }

//     const result = await enrollStudent({
//       ddb,
//       tableName: ENROLLMENTS_TABLE,
//       studentSub,
//       productId,
//       productType,
//       title,
//       thumbnailUrl,
//       accessSource: "admin",
//       expiry: expiry ? new Date(expiry).toISOString() : null,
//       assignedBy: adminSub,
//     });

//     if (studentEmail) {
//       await sendAssignmentEmail({
//         to: studentEmail,
//         studentName,
//         productName: title || productType,
//         productType,
//         expiry,
//       });
//     }

//     return res.json({ success: true, ...result });
//   } catch (err) {
//     console.error("❌ Admin assign failed", err);
//     return res.status(500).json({ message: "Admin assign failed" });
//   }
// });

// module.exports = router;


console.log("🔥 AdminAssignProductRoute LOADED");

const express = require("express");
const router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const { authAccess } = require("../../middleware/auth");
const { enrollStudent } = require("../../Services/enrollStudent");
const { sendAssignmentEmail } = require("../../Services/sendAssignmentEmail");

const REGION = process.env.AWS_REGION || "ap-south-1";
const ENROLLMENTS_TABLE =
  process.env.STUDENT_ENROLLMENTS_TABLE || "StudentEnrollments";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

/* =========================================================
   POST: ADMIN ASSIGN PRODUCT
========================================================= */
router.post("/admin/assign-product", authAccess, async (req, res) => {
  try {
    const adminSub = req.user?.sub;

    const {
      studentSub,
      productId,
      productType,
      title,
      expiry,
      studentEmail,
      studentName,
    } = req.body || {};

    console.log("📥 [ASSIGN] Request body:", req.body);

    if (!adminSub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!studentSub || !productId || !productType) {
      return res.status(400).json({
        message: "studentSub, productId, productType required",
      });
    }

    /* -------------------------------------------
       🔍 FETCH THUMBNAIL FROM PRODUCT TABLE
    -------------------------------------------- */
    let thumbnailUrl = null;

    try {
     if (productType === "MOCKTEST" && process.env.MOCKTEST_TABLE) {
  const r = await ddb.send(
    new GetCommand({
      TableName: process.env.MOCKTEST_TABLE,
      Key: { mockTestId: productId },
    })
  );
  thumbnailUrl =
    r.Item?.thumbnailUrl ||
    r.Item?.imageUrl ||
    r.Item?.image ||
    null;
}

if (productType === "QBANK" && process.env.QBANK_TABLE) {
  const r = await ddb.send(
    new GetCommand({
      TableName: process.env.QBANK_TABLE,
      Key: { bankId: productId },
    })
  );
  thumbnailUrl =
    r.Item?.thumbnailUrl ||
    r.Item?.image ||
    null;
}


      // ⚠️ Course me thumbnail hi nahi hai (tumhare SS se confirmed)
      if (productType === "COURSE") {
        thumbnailUrl = null;
      }

      console.log("🖼️ [ASSIGN] Resolved thumbnail:", thumbnailUrl);
    } catch (e) {
      console.error("❌ [ASSIGN] Thumbnail fetch failed", e);
    }

    const result = await enrollStudent({
      ddb,
      tableName: ENROLLMENTS_TABLE,
      studentSub,
      productId,
      productType,
      title,
      thumbnailUrl,
      accessSource: "admin",
      expiry: expiry ? new Date(expiry).toISOString() : null,
      assignedBy: adminSub,
    });

    if (studentEmail) {
      await sendAssignmentEmail({
        to: studentEmail,
        studentName,
        productName: title || productType,
        productType,
        expiry,
      });
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Admin assign failed", err);
    return res.status(500).json({ message: "Admin assign failed" });
  }
});

module.exports = router;
