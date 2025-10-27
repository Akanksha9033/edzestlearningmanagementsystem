const express = require("express");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk"); // ✅ added
AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" }); // ✅ region setup
const ddb = new AWS.DynamoDB.DocumentClient(); // ✅ define DynamoDB client

const {
  createEBook,
  updateEBook,
  getById,
  getByInstituteAndSlug,
  listByInstitute,
} = require("../AdminE-BookRoute/ebooksRepo.js"); // ✅ corrected import

const router = express.Router();

/**
 * ✅ POST /ebooks/create
 * Body: { title, slug, instituteId, coverImage?, chapters?, tags?, status? }
 */
router.post("/create", async (req, res) => {
  try {
    const { title, slug, instituteId } = req.body || {};

    if (!title || !slug || !instituteId) {
      return res
        .status(400)
        .json({ error: "title, slug, and instituteId are required" });
    }

    // Enforce slug uniqueness within institute
    const existing = await getByInstituteAndSlug(instituteId, slug);
    if (existing) {
      return res
        .status(409)
        .json({ error: "Slug already exists for this institute" });
    }

    const now = new Date().toISOString();
    const item = {
      ebookid: uuidv4(),
      title,
      slug,
      instituteId,
      coverImage: req.body.coverImage || "",
      chapters: Array.isArray(req.body.chapters) ? req.body.chapters : [],
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      status: req.body.status || "DRAFT",
      authorId:
        (req.user && (req.user.id || req.user._id)) ||
        req.body.authorId ||
        "unknown",
      createdAt: now,
      updatedAt: now,
      meta: req.body.meta || {},
    };

    const saved = await createEBook(item);
    console.log("[EBooks] Created new item:", item.ebookid);
    res.json({ message: "E-Book created successfully", ebook: saved });
  } catch (err) {
    console.error("[EBooks:create] error", err);
    res
      .status(500)
      .json({ error: "Failed to create e-book", detail: String(err.message || err) });
  }
});

/**
 * ✅ PUT /ebooks/:ebookid
 * Body: fields to update (title, slug, coverImage, chapters, tags, status, meta)
 */
router.put("/:ebookid", async (req, res) => {
  try {
    const { ebookid } = req.params;
    const updated = await updateEBook(ebookid, req.body || {});
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Updated", ebook: updated });
  } catch (err) {
    console.error("[EBooks:update] error", err);
    res
      .status(500)
      .json({ error: "Failed to update e-book", detail: String(err.message || err) });
  }
});

/**
 * ✅ GET /ebooks/:ebookid
 */
router.get("/:ebookid", async (req, res) => {
  try {
    const item = await getById(req.params.ebookid);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("[EBooks:getById] error", err);
    res.status(500).json({ error: "Failed to fetch e-book" });
  }
});

/**
 * ✅ GET /ebooks/by-slug/find?instituteId=...&slug=...
 */
router.get("/by-slug/find", async (req, res) => {
  try {
    const { instituteId, slug } = req.query;
    if (!instituteId || !slug) {
      return res
        .status(400)
        .json({ error: "instituteId and slug are required" });
    }
    const item = await getByInstituteAndSlug(String(instituteId), String(slug));
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("[EBooks:getBySlug] error", err);
    res.status(500).json({ error: "Failed to fetch e-book" });
  }
});

/**
 * ✅ GET /ebooks?instituteId=...&status=PUBLISHED&limit=20
 * Lists all for one institute (newest first)
 */
router.get("/", async (req, res) => {
  try {
    const { instituteId } = req.query;
    if (!instituteId)
      return res.status(400).json({ error: "instituteId required" });

    const status = req.query.status;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const cursor = req.query.cursor
      ? JSON.parse(
          Buffer.from(req.query.cursor, "base64").toString("utf8")
        )
      : null;

    const out = await listByInstitute(String(instituteId), {
      status: status ? String(status) : undefined,
      limit,
      cursor,
      descending: true,
    });

    const next = out.cursor
      ? Buffer.from(JSON.stringify(out.cursor)).toString("base64")
      : null;
    res.json({ items: out.items, nextCursor: next });
  } catch (err) {
    console.error("[EBooks:list] error", err);
    res.status(500).json({ error: "Failed to list e-books" });
  }
});

// ----------------------------------------------------------
// 🗑️ DELETE /ebooks/:ebookid  → Permanently delete an eBook
// ----------------------------------------------------------
router.delete("/:ebookid", async (req, res) => {
  try {
    const { ebookid } = req.params;

    if (!ebookid) {
      return res.status(400).json({ ok: false, message: "EBook ID is required" });
    }

    // ✅ DynamoDB delete
    const params = {
      TableName: process.env.DDB_EBOOKS_TABLE || "EBooks",
      Key: { ebookid },
    };

    await ddb.delete(params).promise();

    console.log(`[EBOOK DELETE] Removed: ${ebookid}`);
    return res.json({ ok: true, message: "E-Book deleted successfully" });

  } catch (err) {
    console.error("[EBOOK DELETE ERROR]", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
