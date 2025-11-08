// const express = require("express");
// const Blog = require("../models/Blog");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const router = express.Router();

// // 🔧 Ensure uploads folder exists
// const uploadDir = path.join(__dirname, "../uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// // ⚙️ Multer configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + ext); // unique filename
//   },
// });

// const upload = multer({ storage });

// // ✅ Image Upload Endpoint
// router.post("/upload-image", upload.single("image"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }
//   const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
//   res.status(200).json({ imageUrl });
// });

// // ✅ CREATE blog
// router.post("/create", async (req, res) => {
//   try {
//     const { title, content, author, dept, img } = req.body;

//     if (!title || !content || !author || !dept || !img) {
//       return res.status(400).json({ message: "All fields are required." });
//     }

//     const blog = new Blog({ title, content, author, dept, img });
//     await blog.save();

//     res.status(201).json(blog);
//   } catch (err) {
//     console.error("❌ Blog creation error:", err);
//     res.status(500).json({ message: "Server error while creating blog." });
//   }
// });

// // ✅ UPDATE blog
// router.put('/:id', async (req, res) => {
//   try {
//     const updatedBlog = await Blog.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );

//     if (!updatedBlog) {
//       return res.status(404).json({ message: "Blog not found" });
//     }

//     res.status(200).json(updatedBlog);
//   } catch (err) {
//     console.error("❌ Blog update error:", err);
//     res.status(500).json({ message: "Server error while updating blog." });
//   }
// });

// // ✅ DELETE blog
// router.delete('/:id', async (req, res) => {
//   try {
//     await Blog.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Blog deleted' });
//   } catch (err) {
//     console.error("❌ Blog delete error:", err);
//     res.status(500).json({ message: "Server error while deleting blog." });
//   }
// });

// // ✅ GET all blogs
// router.get("/", async (req, res) => {
//   try {
//     const blogs = await Blog.find().sort({ createdAt: -1 });
//     res.status(200).json(blogs);
//   } catch (err) {
//     console.error("❌ Blog fetch error:", err);
//     res.status(500).json({ message: "Server error while fetching blogs." });
//   }
// });

// // ✅ GET blog by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const blog = await Blog.findById(req.params.id);
//     if (!blog) {
//       return res.status(404).json({ message: "Blog not found" });
//     }
//     res.status(200).json(blog);
//   } catch (err) {
//     console.error("❌ Blog fetch by ID error:", err);
//     res.status(500).json({ message: "Server error while fetching blog." });
//   }
// });

// module.exports = router;



const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Types } = require("mongoose");
const Blog = require("../models/Blog");

const router = express.Router();

/* ----------------------- Uploads directory ----------------------- */
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ------------------------- Multer config ------------------------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `${Date.now()}${ext.toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = /image\/(png|jpe?g|webp|gif|svg\+xml)/i.test(file.mimetype);
  cb(ok ? null : new Error("Only image files are allowed"), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* ------------------------ Helper functions ----------------------- */
const buildBaseUrl = (req) =>
  `${req.protocol}://${req.get("host")}`; // e.g., http://localhost:5000

const getLocalPathFromUrl = (url) => {
  try {
    const u = new URL(url);
    if (!u.pathname.startsWith("/uploads/")) return null;
    const filename = u.pathname.replace("/uploads/", "");
    return path.join(uploadDir, filename);
  } catch {
    return null;
  }
};

const safeUnlink = (p) => {
  if (!p) return;
  fs.stat(p, (err) => {
    if (!err) fs.unlink(p, () => {});
  });
};

/* --------------------- Image Upload Endpoint --------------------- */
// POST /api/blogs/upload-image  (form-data: image=<file>)
router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const imageUrl = `${buildBaseUrl(req)}/uploads/${req.file.filename}`;
    return res.status(200).json({ imageUrl });
  } catch (e) {
    return res.status(500).json({ message: "Image upload failed" });
  }
});

/* ----------------------------- CREATE ---------------------------- */
// POST /api/blogs/create   (JSON: {title, content, author, dept, img})
router.post("/create", async (req, res) => {
  try {
    const { title, content, author, dept, img } = req.body;

    if (!title || !content || !author || !dept || !img) {
      return res
        .status(400)
        .json({ message: "All fields are required." });
    }

    const blog = await Blog.create({ title, content, author, dept, img });
    return res.status(201).json(blog);
  } catch (err) {
    console.error("❌ Blog creation error:", err);
    return res
      .status(500)
      .json({ message: "Server error while creating blog." });
  }
});

/* ----------------------------- UPDATE ---------------------------- */
// PUT /api/blogs/:id   (JSON body; if changing img, pass new img URL)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const existing = await Blog.findById(id);
    if (!existing) return res.status(404).json({ message: "Blog not found" });

    const prevImg = existing.img;
    const updated = await Blog.findByIdAndUpdate(id, req.body, { new: true });

    // If the image URL changed and old image was a local upload, clean it up
    if (req.body.img && req.body.img !== prevImg) {
      const localPath = getLocalPathFromUrl(prevImg);
      safeUnlink(localPath);
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Blog update error:", err);
    return res
      .status(500)
      .json({ message: "Server error while updating blog." });
  }
});

/* ----------------------------- DELETE ---------------------------- */
// DELETE /api/blogs/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // If stored image is a local upload, remove file
    const localPath = getLocalPathFromUrl(blog.img);
    safeUnlink(localPath);

    return res.json({ message: "Blog deleted" });
  } catch (err) {
    console.error("❌ Blog delete error:", err);
    return res
      .status(500)
      .json({ message: "Server error while deleting blog." });
  }
});

/* ----------------------------- READ ------------------------------ */
// GET /api/blogs
router.get("/", async (_req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.status(200).json(blogs);
  } catch (err) {
    console.error("❌ Blog fetch error:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching blogs." });
  }
});

// GET /api/blogs/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    return res.status(200).json(blog);
  } catch (err) {
    console.error("❌ Blog fetch by ID error:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching blog." });
  }
});

module.exports = router;
