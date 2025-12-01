// backend/routes/ebooks.js  (FINAL AWS SDK v3)

// ⭐ Express router for API routes
const express = require("express");
const { v4: uuidv4 } = require("uuid");

/* ======================================================================
   AWS SDK v3 — DynamoDB Client Setup
   This is needed only for DELETE route in this file.
====================================================================== */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

// Region (default to ap-south-1)
const REGION = process.env.AWS_REGION || "ap-south-1";

// ⭐ Initialize DynamoDB Document Client (v3)
const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

/* ======================================================================
   Import E-Book Repo (database functions)
   NOTE: These functions already contain all logic, here we only call them.
====================================================================== */
const {
  createEBook,
  updateEBook,
  getById,
  getByInstituteAndSlug,
  listByInstitute,
} = require("../AdminE-BookRoute/ebooksRepo.js");

const router = express.Router();

/* ======================================================================
   POST /ebooks/create
   → Creates a new E-book entry in DynamoDB
====================================================================== */
router.post("/create", async (req, res) => {
  try {
    // Extract fields from request body
    const { title, slug, instituteId } = req.body || {};

    // Validate required fields
    if (!title || !slug || !instituteId) {
      return res.status(400).json({
        error: "title, slug, and instituteId are required",
      });
    }

    // Check if slug already exists for same institute
    const existing = await getByInstituteAndSlug(instituteId, slug);
    if (existing) {
      return res.status(409).json({
        error: "Slug already exists for this institute",
      });
    }

    // Prepare new e-book object
    const now = new Date().toISOString();
    const item = {
      ebookid: uuidv4(),                 // unique ID for e-book
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

    // Save to DynamoDB
    const saved = await createEBook(item);

    console.log("[EBooks] Created:", item.ebookid);

    // Return response
    res.json({
      message: "E-Book created successfully",
      ebook: saved,
    });
  } catch (err) {
    console.error("[EBooks:create] error", err);
    res.status(500).json({
      error: "Failed to create e-book",
      detail: String(err.message || err),
    });
  }
});

/* ======================================================================
   PUT /ebooks/:ebookid
   → Updates an existing e-book fields
====================================================================== */
router.put("/:ebookid", async (req, res) => {
  try {
    const { ebookid } = req.params;

    // Update only the fields provided
    const updated = await updateEBook(ebookid, req.body || {});
    if (!updated) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ message: "Updated", ebook: updated });
  } catch (err) {
    console.error("[EBooks:update] error", err);
    res.status(500).json({
      error: "Failed to update e-book",
      detail: String(err.message || err),
    });
  }
});

/* ======================================================================
   GET /ebooks/:ebookid
   → Fetch e-book by ID
====================================================================== */
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

/* ======================================================================
   GET /ebooks/by-slug/find?instituteId=...&slug=...
   → Fetch e-book by its institute + slug combo
====================================================================== */
router.get("/by-slug/find", async (req, res) => {
  try {
    const { instituteId, slug } = req.query;

    if (!instituteId || !slug) {
      return res.status(400).json({
        error: "instituteId and slug are required",
      });
    }

    const item = await getByInstituteAndSlug(
      String(instituteId),
      String(slug)
    );

    if (!item) return res.status(404).json({ error: "Not found" });

    res.json(item);
  } catch (err) {
    console.error("[EBooks:getBySlug] error", err);
    res.status(500).json({ error: "Failed to fetch e-book" });
  }
});

/* ======================================================================
   GET /ebooks?instituteId=...&status=...&limit=...
   → List E-books of an institute (with pagination)
====================================================================== */
router.get("/", async (req, res) => {
  try {
    const { instituteId } = req.query;

    if (!instituteId)
      return res.status(400).json({ error: "instituteId required" });

    const status = req.query.status;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

    // Decode pagination cursor (base64 encoded)
    const cursor = req.query.cursor
      ? JSON.parse(
          Buffer.from(req.query.cursor, "base64").toString("utf8")
        )
      : null;

    // DynamoDB GSI query inside repo
    const out = await listByInstitute(String(instituteId), {
      status: status ? String(status) : undefined,
      limit,
      cursor,
      descending: true,
    });

    // Encode next cursor back to base64 for frontend
    const nextCursor = out.cursor
      ? Buffer.from(JSON.stringify(out.cursor)).toString("base64")
      : null;

    res.json({
      items: out.items,
      nextCursor,
    });
  } catch (err) {
    console.error("[EBooks:list] error", err);
    res.status(500).json({ error: "Failed to list e-books" });
  }
});

/* ======================================================================
   DELETE /ebooks/:ebookid
   → Permanently delete an e-book record
====================================================================== */
router.delete("/:ebookid", async (req, res) => {
  try {
    const { ebookid } = req.params;

    if (!ebookid) {
      return res.status(400).json({
        ok: false,
        message: "EBook ID is required",
      });
    }

    // Delete from DynamoDB using AWS SDK v3
    await ddb.send(
      new DeleteCommand({
        TableName: process.env.DDB_EBOOKS_TABLE || "EBooks",
        Key: { ebookid },
      })
    );

    console.log(`[EBOOK DELETE] Removed: ${ebookid}`);

    res.json({
      ok: true,
      message: "E-Book deleted successfully",
    });
  } catch (err) {
    console.error("[EBOOK DELETE ERROR]", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
