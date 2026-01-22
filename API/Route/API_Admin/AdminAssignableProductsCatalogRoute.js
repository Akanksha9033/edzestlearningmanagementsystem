console.log("🔥 AdminAssignableProductsCatalogRoute LOADED");

const express = require("express");
const router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const { authAccess, requireRoles } = require("../../middleware/auth");

const REGION = process.env.AWS_REGION || "ap-south-1";

/**
 * Tables (ENV fallback)
 * NOTE: keep same defaults as your other routes to avoid mismatch
 */
const COURSES_TABLE = process.env.COURSES_TABLE || "Courses";
const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";
const QBANK_TABLE = process.env.QBANK_TABLE || "QBanks";
const EBOOKS_TABLE =
  process.env.DDB_EBOOKS_TABLE || process.env.EBOOKS_TABLE || "EBooks";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

/* =========================
   Helpers
========================= */

function isPublished(item) {
  const v =
    item?.status ??
    item?.publishStatus ??
    item?.published ??
    item?.isPublished ??
    item?.is_published;

  // supports "PUBLISHED", "published", true, 1, "true"
  if (typeof v === "string") return v.toLowerCase() === "published";
  if (typeof v === "boolean") return v === true;
  if (typeof v === "number") return v === 1;
  return false;
}

async function scanAll(TableName) {
  const out = [];
  let ExclusiveStartKey = undefined;

  do {
    const resp = await ddb.send(
      new ScanCommand({
        TableName,
        ExclusiveStartKey,
      })
    );

    out.push(...(resp.Items || []));
    ExclusiveStartKey = resp.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return out;
}

/* =========================
   GET /api/admin/products
   Unified Assignable Products Catalog
   (COURSE + MOCKTEST + QBANK + EBOOK) [PUBLISHED only]
========================= */
router.get(
  "/admin/products",
  authAccess,
  requireRoles(["Admin", "SuperAdmin"]),
  async (req, res) => {
    try {
      console.log("📦 FETCHING ASSIGNABLE PRODUCTS (DDB SCAN MODE)");
      console.log("📌 TABLES:", {
        COURSES_TABLE,
        MOCKTESTS_TABLE,
        QBANK_TABLE,
        EBOOKS_TABLE,
      });

      const products = [];

      /* ================= COURSES ================= */
      try {
        const courses = await scanAll(COURSES_TABLE);
        console.log("📘 COURSES scanned:", courses.length);

        courses
          .filter(isPublished)
          .forEach((c) => {
            const id = c.courseId || c.id || c._id;
            if (!id) return;

            products.push({
              productId: `COURSE_${id}`,
              title: c.title || c.name || c.courseTitle || "Course",
              kind: "COURSE",
              rawId: id,
            });
          });

        console.log(
          "✅ COURSES published:",
          products.filter((p) => p.kind === "COURSE").length
        );
      } catch (err) {
        console.error(
          "❌ Courses scan failed:",
          err?.response?.data || err?.message || err
        );
      }

      /* ================= MOCK TESTS ================= */
      try {
        const mocks = await scanAll(MOCKTESTS_TABLE);
        console.log("📝 MOCKTESTS scanned:", mocks.length);

        mocks
          .filter(isPublished)
          .forEach((m) => {
            const id = m.mockTestId || m.id || m._id;
            if (!id) return;

            products.push({
              productId: `MOCK_${id}`,
              title: m.title || m.name || m.mockTestTitle || "Mock Test",
              kind: "MOCKTEST",
              rawId: id,
            });
          });

        console.log(
          "✅ MOCKTESTS published:",
          products.filter((p) => p.kind === "MOCKTEST").length
        );
      } catch (err) {
        console.error(
          "❌ MockTests scan failed:",
          err?.response?.data || err?.message || err
        );
      }

      /* ================= QBANK ================= */
      try {
        const banks = await scanAll(QBANK_TABLE);
        console.log("🧠 QBANK scanned:", banks.length);

        banks
          .filter(isPublished)
          .forEach((q) => {
            const id = q.bankId || q.id || q._id;
            if (!id) return;

            products.push({
              productId: `QBANK_${id}`,
              title: q.name || q.bankName || q.title || "Q-Bank",
              kind: "QBANK",
              rawId: id,
            });
          });

        console.log(
          "✅ QBANK published:",
          products.filter((p) => p.kind === "QBANK").length
        );
      } catch (err) {
        console.error(
          "❌ QBank scan failed:",
          err?.response?.data || err?.message || err
        );
      }

      /* ================= EBOOKS ================= */
      try {
        const ebooks = await scanAll(EBOOKS_TABLE);
        console.log("📚 EBOOKS scanned:", ebooks.length);

        ebooks
          .filter(isPublished)
          .forEach((e) => {
            const id = e.ebookId || e.id || e._id || e.ebookid;
            if (!id) return;

            products.push({
              productId: `EBOOK_${id}`,
              title: e.title || e.name || e.bookTitle || "E-Book",
              kind: "EBOOK",
              rawId: id,
            });
          });

        console.log(
          "✅ EBOOKS published:",
          products.filter((p) => p.kind === "EBOOK").length
        );
      } catch (err) {
        console.error(
          "❌ EBooks scan failed:",
          err?.response?.data || err?.message || err
        );
      }

      // final sort: COURSE, MOCKTEST, QBANK, EBOOK
      const order = { COURSE: 1, MOCKTEST: 2, QBANK: 3, EBOOK: 4 };
      products.sort((a, b) => (order[a.kind] || 99) - (order[b.kind] || 99));

      console.log("✅ PRODUCTS SENT total:", products.length);
      console.log("🔎 SAMPLE:", products.slice(0, 5));

      return res.json({ products });
    } catch (err) {
      console.error("❌ FETCH PRODUCTS FAILED", err);
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  }
);

module.exports = router;
