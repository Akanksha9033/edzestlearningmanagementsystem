

// import API from "../../../../LoginSystem/axios"


// /**
//  * 📘 E-Book API Helper Module
//  * --------------------------------
//  * Works with both named and default imports.
//  *
//  * Example usage:
//  *   import { createEBook, summarizeSelection } from "../api/ebooksApi";
//  *   OR
//  *   import ebooksApi from "../api/ebooksApi";
//  *   ebooksApi.createEBook(...);
//  *   ebooksApi.summarizeSelection("text to summarize", 5);
//  */

// // 🔹 Create a new e-book
// export const createEBook = (data) => {
//   return API.post("/ebooks/create", data);
// };

// // 🔹 Update existing e-book
// export const updateEBook = (ebookid, data) => {
//   return API.put(`/ebooks/${encodeURIComponent(ebookid)}`, data);
// };

// // 🔹 List all e-books for a given institute
// export const listEBooks = (instituteId) => {
//   return API.get(`/ebooks`, { params: { instituteId } });
// };

// // 🔹 Get a single e-book by ID (used in reader view)
// export const getEBookById = (ebookid) => {
//   return API.get(`/ebooks/${encodeURIComponent(ebookid)}`);
// };

// // 🔹 Get an e-book by institute + slug (for direct share URLs)
// export const getEBookBySlug = (instituteId, slug) => {
//   return API.get(`/ebooks/by-slug/find`, {
//     params: {
//       instituteId,
//       slug,
//     },
//   });
// };

// // 🔹 Upload image for e-book blocks (S3)
// export const uploadEBookImage = (file) => {
//   const form = new FormData();
//   form.append("file", file);
//   return API.post("/ebooks/upload-image", form, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// };

// // 🔹 Upload .docx to convert/import content
// export const uploadDocx = (file) => {
//   const form = new FormData();
//   form.append("file", file);
//   return API.post("/ebooks/upload-docx", form, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// };

// // 🔹 Delete an e-book by ID
// export const deleteEBook = (ebookid) => {
//   return API.delete(`/ebooks/${encodeURIComponent(ebookid)}`);
// };

// /* -------------------------------------------------------------------------- */
// /*                             Summarization helpers                           */
// /* -------------------------------------------------------------------------- */

// export const summarizeSelection = (text, maxBullets = 6) => {
//   return API.post("/summarize", { text, maxBullets }).then((r) => r.data);
// };

// export const health = () => API.get("/health").then((r) => r.data);

// /* -------------------------------------------------------------------------- */
// /*                                   Notes APIs                               */
// /* -------------------------------------------------------------------------- */

// /** Legacy: Save notes via old routes (kept for compatibility) */
// export const saveNotesToS3 = ({ userId, ebookId, html, text, meta }) => {
//   return API.post("/notes/save", { userId, ebookId, html, text, meta }).then((r) => r.data);
// };

// /** Legacy: Load notes via old routes (kept for compatibility) */
// export const getNotesFromS3 = (userId, ebookId) => {
//   return API.get("/notes/get", { params: { userId, ebookId } }).then((r) => r.data);
// };

// /** Legacy: Server-made .docx (kept for compatibility) */
// export const downloadNotesAsDocx = async ({ userId, ebookId, html }) => {
//   const resp = await API.post("/notes/docx", { userId, ebookId, html }, { responseType: "blob" });
//   return resp.data; // Blob
// };

// /* ---------- NEW: Notes index/list/delete for "My Notes" page ----------- */

// // Save or update a single note in the new structure
// export const saveNote = ({
//   userId,
//   bookId,
//   chapterId,
//   title = "",
//   text = "",
//   selection = "",
//   meta = {},
//   id,
// }) =>
//   API.post("/api/ebooks/notes/save", {
//     userId,
//     bookId,
//     chapterId,
//     title,
//     text,
//     selection,
//     meta,
//     id,
//   }).then((r) => r.data);

// // Build grouped index (book → chapters with counts)
// export const getNotesIndex = (userId) =>
//   API.get("/api/ebooks/notes/index", { params: { userId } });

// // List notes for a specific book + chapter
// export const getNotesByBookChapter = ({ userId, bookId, chapterId }) =>
//   API.get("/api/ebooks/notes", { params: { userId, bookId, chapterId } });

// // Delete a note by its S3 key
// export const deleteNoteByS3Key = (s3Key) =>
//   API.delete("/api/ebooks/notes/by-key", { data: { s3Key } });

// /**
//  * Helper to fetch ALL notes across the user’s books/chapters.
//  * Useful for “Show all notes”. You can import either name:
//  *   - getAllNotesForUser  (original)
//  *   - getAllNotes         (alias to match your component import)
//  */
// export const getAllNotesForUser = async (userId) => {
//   const idxRes = await getNotesIndex(userId);
//   const index = idxRes?.data?.index || [];
//   const all = [];
//   for (const b of index) {
//     for (const c of b.chapters || []) {
//       // eslint-disable-next-line no-await-in-loop
//       const res = await getNotesByBookChapter({
//         userId,
//         bookId: b.bookId,
//         chapterId: c.chapterId,
//       });
//       const arr = (res?.data?.notes || []).map((n) => ({
//         ...n,
//         _bookId: b.bookId,
//         _chapterId: c.chapterId,
//       }));
//       all.push(...arr);
//     }
//   }
//   all.sort(
//     (a, b) =>
//       new Date(b.updatedAt || b.createdAt || 0) -
//       new Date(a.updatedAt || a.createdAt || 0)
//   );
//   return all;
// };

// // ✅ Alias so existing code that imports `getAllNotes` keeps working
// export const getAllNotes = getAllNotesForUser;

// /* -------------------------------------------------------------------------- */
// /*                           Google Suggest Proxy API                          */
// /* -------------------------------------------------------------------------- */

// export const getGoogleSuggestions = async (q) => {
//   const { data } = await API.get("/suggest", { params: { q } });
//   return Array.isArray(data?.suggestions) ? data.suggestions : [];
// };

// // ✅ Default export (bundle all functions)
// export default {
//   // ebooks
//   createEBook,
//   updateEBook,
//   uploadDocx,
//   listEBooks,
//   getEBookById,
//   getEBookBySlug,
//   uploadEBookImage,
//   deleteEBook,

//   // summarization / health
//   summarizeSelection,
//   health,

//   // legacy notes
//   saveNotesToS3,
//   getNotesFromS3,
//   downloadNotesAsDocx,

//   // new notes
//   saveNote,
//   getNotesIndex,
//   getNotesByBookChapter,
//   deleteNoteByS3Key,
//   getAllNotesForUser,
//   getAllNotes, // ← alias included in default export

//   // suggest
//   getGoogleSuggestions,
// };


// src/WebAdmin/AdminModule/E-Books/api/ebooksApi.js
import API from "../../../../LoginSystem/axios";

/**
 * 📘 E-Book API Helper Module
 * Works with both named and default imports.
 */

// 🔹 Create a new e-book
export const createEBook = (data) => API.post("/ebooks/create", data);

// 🔹 Update existing e-book
export const updateEBook = (ebookid, data) =>
  API.put(`/ebooks/${encodeURIComponent(ebookid)}`, data);

// 🔹 List all e-books for a given institute
export const listEBooks = (instituteId) =>
  API.get(`/ebooks`, { params: { instituteId } });

// 🔹 Get a single e-book by ID (used in reader view)
export const getEBookById = (ebookid) =>
  API.get(`/ebooks/${encodeURIComponent(ebookid)}`);

// 🔹 Get an e-book by institute + slug (for direct share URLs)
export const getEBookBySlug = (instituteId, slug) =>
  API.get(`/ebooks/by-slug/find`, { params: { instituteId, slug } });

// 🔹 Upload image for e-book blocks (S3)
// export const uploadEBookImage = (file) => {
//   const form = new FormData();
//   form.append("file", file, file?.name || "upload.bin"); // include filename
//   // Let Axios set Content-Type with boundary; don't set headers manually
//   return API.post("/ebooks/upload-image", form);
// };

export const uploadEBookImage = (file) => {
  const form = new FormData();
  form.append("file", file, file?.name || "upload.bin");
  return API.post("/ebooks/upload-image", form); // ← no headers override
};


// 🔹 Upload .docx to convert/import content (if your backend exposes it)
export const uploadDocx = (file) => {
  const form = new FormData();
  form.append("file", file, file?.name || "document.docx");
  return API.post("/ebooks/upload-docx", form);
};

// 🔹 Delete an e-book by ID
export const deleteEBook = (ebookid) =>
  API.delete(`/ebooks/${encodeURIComponent(ebookid)}`);

/* -------------------------------------------------------------------------- */
/*                             Summarization helpers                           */
/* -------------------------------------------------------------------------- */

export const summarizeSelection = (text, maxBullets = 6) =>
  API.post("/summarize", { text, maxBullets }).then((r) => r.data);

export const health = () => API.get("/health").then((r) => r.data);

/* -------------------------------------------------------------------------- */
/*                                   Notes APIs                               */
/* -------------------------------------------------------------------------- */

export const saveNotesToS3 = ({ userId, ebookId, html, text, meta }) =>
  API.post("/notes/save", { userId, ebookId, html, text, meta }).then((r) => r.data);

export const getNotesFromS3 = (userId, ebookId) =>
  API.get("/notes/get", { params: { userId, ebookId } }).then((r) => r.data);

export const downloadNotesAsDocx = async ({ userId, ebookId, html }) => {
  const resp = await API.post("/notes/docx", { userId, ebookId, html }, { responseType: "blob" });
  return resp.data; // Blob
};

// ---------- NEW: Notes index/list/delete for "My Notes" page -----------
export const saveNote = ({
  userId,
  bookId,
  chapterId,
  title = "",
  text = "",
  selection = "",
  meta = {},
  id,
}) =>
  API.post("/api/ebooks/notes/save", {
    userId,
    bookId,
    chapterId,
    title,
    text,
    selection,
    meta,
    id,
  }).then((r) => r.data);

export const getNotesIndex = (userId) =>
  API.get("/api/ebooks/notes/index", { params: { userId } });

export const getNotesByBookChapter = ({ userId, bookId, chapterId }) =>
  API.get("/api/ebooks/notes", { params: { userId, bookId, chapterId } });

export const deleteNoteByS3Key = (s3Key) =>
  API.delete("/api/ebooks/notes/by-key", { data: { s3Key } });

export const getAllNotesForUser = async (userId) => {
  const idxRes = await getNotesIndex(userId);
  const index = idxRes?.data?.index || [];
  const all = [];
  for (const b of index) {
    for (const c of b.chapters || []) {
      // eslint-disable-next-line no-await-in-loop
      const res = await getNotesByBookChapter({
        userId,
        bookId: b.bookId,
        chapterId: c.chapterId,
      });
      const arr = (res?.data?.notes || []).map((n) => ({
        ...n,
        _bookId: b.bookId,
        _chapterId: c.chapterId,
      }));
      all.push(...arr);
    }
  }
  all.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0)
  );
  return all;
};

// ✅ Alias so existing code that imports `getAllNotes` keeps working
export const getAllNotes = getAllNotesForUser;

/* -------------------------------------------------------------------------- */
/*                           Google Suggest Proxy API                          */
/* -------------------------------------------------------------------------- */

export const getGoogleSuggestions = async (q) => {
  const { data } = await API.get("/suggest", { params: { q } });
  return Array.isArray(data?.suggestions) ? data.suggestions : [];
};

// ✅ Default export (bundle all functions)
export default {
  // ebooks
  createEBook,
  updateEBook,
  uploadDocx,
  listEBooks,
  getEBookById,
  getEBookBySlug,
  uploadEBookImage,
  deleteEBook,

  // summarization / health
  summarizeSelection,
  health,

  // legacy notes
  saveNotesToS3,
  getNotesFromS3,
  downloadNotesAsDocx,

  // new notes
  saveNote,
  getNotesIndex,
  getNotesByBookChapter,
  deleteNoteByS3Key,
  getAllNotesForUser,
  getAllNotes, // alias

  // suggest
  getGoogleSuggestions,
};
