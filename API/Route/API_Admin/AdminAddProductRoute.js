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

      if (process.env.COURSES_TABLE) {
        const c = await ddb.send(
          new ScanCommand({ TableName: process.env.COURSES_TABLE })
        );
        c.Items?.forEach((x) =>
          products.push({
            productId: x.courseId,
            title: x.title,
            kind: "COURSE",
          })
        );
      }

      if (process.env.MOCKTEST_TABLE) {
        const m = await ddb.send(
          new ScanCommand({ TableName: process.env.MOCKTEST_TABLE })
        );
        m.Items?.forEach((x) =>
          products.push({
            productId: x.mockTestId,
            title: x.title,
            kind: "MOCKTEST",
          })
        );
      }

      if (process.env.QBANK_TABLE) {
        const q = await ddb.send(
          new ScanCommand({ TableName: process.env.QBANK_TABLE })
        );
        q.Items?.forEach((x) =>
          products.push({
            productId: x.bankId,
            title: x.title,
            kind: "QBANK",
          })
        );
      }

      return res.json({ products });
    } catch (err) {
      console.error(err);
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

      const item = {
        pk: `USER#${userId}`,
        sk: `ENROLLMENT#${productId}`,
        userId,
        productId,
        productType,
        accessSource: "admin",
        status: "ACTIVE",
        expiry: expiry || null,
        createdAt: new Date().toISOString(),
      };

      await ddb.send(
        new PutCommand({
          TableName: STUDENT_ENROLLMENTS_TABLE,
          Item: item,
        })
      );

      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Assign failed" });
    }
  }
);

module.exports = router;
