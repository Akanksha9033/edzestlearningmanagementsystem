console.log("🔥 AdminAssignableProductsCatalogRoute LOADED");

const express = require("express");
const router = express.Router();
const axios = require("axios");

const { authAccess, requireRoles } = require("../../middleware/auth");

/**
 * GET /api/admin/products
 * Fetch assignable products (COURSE + MOCKTEST + QBANK)
 */
router.get(
  "/admin/products",
  authAccess,
  requireRoles(["Admin", "SuperAdmin"]),
  async (req, res) => {
    try {
      console.log("📦 FETCHING ASSIGNABLE PRODUCTS");

      const products = [];
      const baseURL = process.env.INTERNAL_API_BASE || "http://localhost:5000";

      const headers = {
        Authorization: req.headers.authorization,
      };

      /* ================= COURSES (FIXED) ================= */
      try {
        const courseRes = await axios.get(
          `${baseURL}/api/admin/courses`,
          { headers }
        );

        console.log("📘 COURSES RAW →", courseRes.data);

        const courseList =
          courseRes.data?.courses ||
          courseRes.data?.items ||
          [];

        courseList.forEach((c) => {
          const courseId = c.courseId || c.id || c._id;
          if (!courseId) return;

          products.push({
            productId: `COURSE_${courseId}`,
            title: c.title || c.name || "Course",
            kind: "COURSE",
          });
        });
      } catch (err) {
        console.error(
          "❌ Courses fetch failed",
          err?.response?.data || err.message
        );
      }

      /* ================= MOCK TESTS ================= */
      try {
        const mockRes = await axios.get(
          `${baseURL}/api/admin/mocktests`,
          { headers }
        );

        const mockList =
          mockRes.data?.items ||
          mockRes.data?.mockTests ||
          [];

        mockList.forEach((m) => {
          const mockId = m.mockTestId || m.id || m._id;
          if (!mockId) return;

          products.push({
            productId: `MOCK_${mockId}`,
            title: m.title || m.name || "Mock Test",
            kind: "MOCKTEST",
          });
        });
      } catch (err) {
        console.error(
          "❌ MockTests fetch failed",
          err?.response?.data || err.message
        );
      }

      /* ================= QBANK ================= */
      try {
        const qbankRes = await axios.get(
          `${baseURL}/api/admin/qbank`,
          { headers }
        );

        (qbankRes.data?.banks || []).forEach((q) => {
          if (!q.bankId) return;

          products.push({
            productId: `QBANK_${q.bankId}`,
            title: q.name || q.bankName || "QBank",
            kind: "QBANK",
          });
        });
      } catch (err) {
        console.error(
          "❌ QBank fetch failed",
          err?.response?.data || err.message
        );
      }

      console.log("✅ PRODUCTS SENT →", products);
      return res.json({ products });
    } catch (err) {
      console.error("❌ FETCH PRODUCTS FAILED", err);
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  }
);

module.exports = router;
