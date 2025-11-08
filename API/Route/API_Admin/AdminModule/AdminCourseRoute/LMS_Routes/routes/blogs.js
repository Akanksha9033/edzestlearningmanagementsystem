// const express = require("express");
// const multer = require("multer");
// const Blog = require("../models/Blog");
// // const cloudinary = require("../config/cloudinary");

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// function uploadBufferToCloudinary(buffer, folder = "edzest/blogs") {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (err, result) => {
//       if (err) return reject(err);
//       resolve(result);
//     });
//     stream.end(buffer);
//   });
// }

// // CREATE (supports file "cover" OR JSON {coverUrl, coverPublicId})
// router.post("/create", upload.single("cover"), async (req, res) => {
//   try {
//     let { title, content, author, dept, coverUrl, coverPublicId } = req.body;
//     if (req.file?.buffer) {
//       const up = await uploadBufferToCloudinary(req.file.buffer);
//       coverUrl = up.secure_url;
//       coverPublicId = up.public_id;
//     }
//     if (!title || !content || !author || !dept || !coverUrl || !coverPublicId) {
//       return res.status(400).json({ message: "All fields (including cover) are required." });
//     }
//     const blog = await Blog.create({
//       title,
//       content,
//       author,
//       dept,
//       cover: { url: coverUrl, publicId: coverPublicId }
//     });
//     res.status(201).json(blog);
//   } catch (err) {
//     console.error("❌ Blog creation error:", err);
//     res.status(500).json({ message: "Server error while creating blog." });
//   }
// });

// // UPDATE (optional new cover file or {coverUrl, coverPublicId}; cleans old)
// router.put("/:id", upload.single("cover"), async (req, res) => {
//   try {
//     const { title, content, author, dept, coverUrl, coverPublicId, oldPublicId } = req.body;
//     const blog = await Blog.findById(req.params.id);
//     if (!blog) return res.status(404).json({ message: "Blog not found" });

//     let newCover = blog.cover;

//     if (req.file?.buffer) {
//       const up = await uploadBufferToCloudinary(req.file.buffer);
//       newCover = { url: up.secure_url, publicId: up.public_id };
//     } else if (coverUrl && coverPublicId) {
//       newCover = { url: coverUrl, publicId: coverPublicId };
//     }

//     const prevPublicId = blog.cover?.publicId;

//     blog.title = title ?? blog.title;
//     blog.content = content ?? blog.content;
//     blog.author = author ?? blog.author;
//     blog.dept = dept ?? blog.dept;
//     blog.cover = newCover;

//     const updated = await blog.save();

//     // cleanup if changed
//     const toDelete = oldPublicId || (prevPublicId && prevPublicId !== newCover.publicId ? prevPublicId : null);
//     if (toDelete && toDelete !== newCover.publicId) {
//       try { await cloudinary.uploader.destroy(toDelete); }
//       catch (e) { console.warn("⚠️ Destroy old cover failed:", e?.message); }
//     }

//     res.json(updated);
//   } catch (err) {
//     console.error("❌ Blog update error:", err);
//     res.status(500).json({ message: "Server error while updating blog." });
//   }
// });

// // DELETE (and Cloudinary image)
// router.delete("/:id", async (req, res) => {
//   try {
//     const blog = await Blog.findById(req.params.id);
//     if (!blog) return res.status(404).json({ message: "Blog not found" });

//     if (blog.cover?.publicId) {
//       try { await cloudinary.uploader.destroy(blog.cover.publicId); }
//       catch (e) { console.warn("⚠️ Could not destroy Cloudinary image:", e?.message); }
//     }

//     await Blog.findByIdAndDelete(req.params.id);
//     res.json({ message: "Blog deleted" });
//   } catch (err) {
//     console.error("❌ Blog delete error:", err);
//     res.status(500).json({ message: "Server error while deleting blog." });
//   }
// });

// // GET all
// router.get("/", async (_req, res) => {
//   try {
//     const blogs = await Blog.find().sort({ createdAt: -1 });
//     res.json(blogs);
//   } catch (err) {
//     console.error("❌ Blog fetch error:", err);
//     res.status(500).json({ message: "Server error while fetching blogs." });
//   }
// });

// // GET by id
// router.get("/:id", async (req, res) => {
//   try {
//     const blog = await Blog.findById(req.params.id);
//     if (!blog) return res.status(404).json({ message: "Blog not found" });
//     res.json(blog);
//   } catch (err) {
//     console.error("❌ Blog fetch by ID error:", err);
//     res.status(500).json({ message: "Server error while fetching blog." });
//   }
// });

// module.exports = router;





const express = require("express");
const multer = require("multer");
const Blog = require("../models/Blog");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// helper: upload a buffer to Cloudinary
function uploadBufferToCloudinary(buffer, folder = "edzest/blogs") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// CREATE
router.post("/create", upload.single("cover"), async (req, res) => {
  try {
    let { title, content, author, dept, coverUrl, coverPublicId } = req.body;

    // if a file was sent, upload it to Cloudinary
    if (req.file?.buffer) {
      const up = await uploadBufferToCloudinary(req.file.buffer);
      coverUrl = up.secure_url;
      coverPublicId = up.public_id;
    }

    if (!title || !content || !author || !dept || !coverUrl || !coverPublicId) {
      return res
        .status(400)
        .json({ message: "All fields (including cover) are required." });
    }

    const blog = await Blog.create({
      title,
      content,
      author,
      dept,
      cover: { url: coverUrl, publicId: coverPublicId },
    });

    res.status(201).json(blog);
  } catch (err) {
    console.error("❌ Blog creation error:", err);
    res.status(500).json({ message: "Server error while creating blog." });
  }
});

// UPDATE (optional new cover)
router.put("/:id", upload.single("cover"), async (req, res) => {
  try {
    const { title, content, author, dept, coverUrl, coverPublicId, oldPublicId } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    let newCover = blog.cover;

    if (req.file?.buffer) {
      const up = await uploadBufferToCloudinary(req.file.buffer);
      newCover = { url: up.secure_url, publicId: up.public_id };
    } else if (coverUrl && coverPublicId) {
      newCover = { url: coverUrl, publicId: coverPublicId };
    }

    const prevPublicId = blog.cover?.publicId;

    blog.title = title ?? blog.title;
    blog.content = content ?? blog.content;
    blog.author = author ?? blog.author;
    blog.dept = dept ?? blog.dept;
    blog.cover = newCover;

    const updated = await blog.save();

    // cleanup old cover if changed
    const toDelete =
      oldPublicId || (prevPublicId && prevPublicId !== newCover.publicId ? prevPublicId : null);
    if (toDelete && toDelete !== newCover.publicId) {
      try {
        await cloudinary.uploader.destroy(toDelete);
      } catch (e) {
        console.warn("⚠️ Destroy old cover failed:", e?.message);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Blog update error:", err);
    res.status(500).json({ message: "Server error while updating blog." });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.cover?.publicId) {
      try {
        await cloudinary.uploader.destroy(blog.cover.publicId);
      } catch (e) {
        console.warn("⚠️ Could not destroy Cloudinary image:", e?.message);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted" });
  } catch (err) {
    console.error("❌ Blog delete error:", err);
    res.status(500).json({ message: "Server error while deleting blog." });
  }
});

// GET all
router.get("/", async (_req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error("❌ Blog fetch error:", err);
    res.status(500).json({ message: "Server error while fetching blogs." });
  }
});

// GET by id
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    console.error("❌ Blog fetch by ID error:", err);
    res.status(500).json({ message: "Server error while fetching blog." });
  }
});

module.exports = router;
