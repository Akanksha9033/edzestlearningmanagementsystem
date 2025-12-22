// // src/components/EBookEditor.jsx
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import BlockSidebar from "./BlockSidebar";
// import BlockRenderer from "./BlockRenderer";
// import * as ebooksApiModule from "../api/ebooksApi";
// import { toast } from "react-toastify";
// import LoadingAnimation from "../../json_files/LoadingAnimation";

// const api = ebooksApiModule.default || ebooksApiModule;

// export default function EBookEditor() {
//   const { ebookid } = useParams();
//   const navigate = useNavigate();
//   const isEditing = Boolean(ebookid);

//   const [title, setTitle] = useState(""); // read-only (loaded)
//   const [slug, setSlug] = useState("");   // read-only (loaded)

//   // ✅ Chapters-based state (with active chapter)
//   const [chapters, setChapters] = useState([
//     { chapterId: "ch-" + Date.now(), title: "Main Chapter", blocks: [] },
//   ]);
//   const [activeChapter, setActiveChapter] = useState(null);

//   const [status, setStatus] = useState("DRAFT");
//   const [saving, setSaving] = useState(false);
//   const [loading, setLoading] = useState(isEditing);

//   // If no ebookid, redirect to the create page (Title.jsx)
//   useEffect(() => {
//     if (!isEditing) {
//       navigate("/admin/ebooks/create", { replace: true });
//     }
//   }, [isEditing, navigate]);

//   // Load existing e-book (now filling chapters + activeChapter)
//   useEffect(() => {
//     if (!isEditing) return;
//     (async () => {
//       try {
//         setLoading(true);
//         const res = await api.getEBookById(ebookid);
//         const data = res.data;

//         setTitle(data.title || "");
//         setSlug(data.slug || "");
//         setStatus(data.status || "DRAFT");

//         if (Array.isArray(data.chapters) && data.chapters.length) {
//           setChapters(data.chapters);
//           setActiveChapter(data.chapters[0]?.chapterId || null);
//         } else {
//           // fallback: old single-block structure
//           const singleBlocks = data.chapters?.[0]?.blocks || data.blocks || [];
//           const ch = {
//             chapterId: "ch-" + Date.now(),
//             title: "Main Chapter",
//             blocks: singleBlocks,
//           };
//           setChapters([ch]);
//           setActiveChapter(ch.chapterId);
//         }
//       } catch (err) {
//         toast.error("Failed to load e-book for editing");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [ebookid, isEditing]);

//   /* -----------------------
//      Chapter management
//   ------------------------*/
//   const addNewChapter = () => {
//     const newChapter = {
//       chapterId: "ch-" + Date.now(),
//       title: `New Chapter ${chapters.length + 1}`,
//       blocks: [],
//     };
//     setChapters((prev) => [...prev, newChapter]);
//     setActiveChapter(newChapter.chapterId);
//     toast.success("📝 New chapter added");
//   };

//   const renameChapter = (chapterId, newTitle) => {
//     setChapters((prev) =>
//       prev.map((ch) =>
//         ch.chapterId === chapterId ? { ...ch, title: newTitle } : ch
//       )
//     );
//   };

//   /* -----------------------
//      Block actions (per active chapter)
//   ------------------------*/
//   const addBlock = (type) => {
//     if (!activeChapter) return toast.error("Select a chapter first!");
//     setChapters((prev) =>
//       prev.map((ch) =>
//         ch.chapterId === activeChapter
//           ? {
//               ...ch,
//               blocks: [
//                 ...(ch.blocks || []),
//                 { id: Date.now(), type, content: "", url: "" },
//               ],
//             }
//           : ch
//       )
//     );
//   };

//   const updateBlock = (blockId, newBlock) => {
//     setChapters((prev) =>
//       prev.map((ch) =>
//         ch.chapterId === activeChapter
//           ? {
//               ...ch,
//               blocks: ch.blocks.map((b) => (b.id === blockId ? newBlock : b)),
//             }
//           : ch
//       )
//     );
//   };

//   const removeBlock = (blockId) => {
//     setChapters((prev) =>
//       prev.map((ch) =>
//         ch.chapterId === activeChapter
//           ? { ...ch, blocks: ch.blocks.filter((b) => b.id !== blockId) }
//           : ch
//       )
//     );
//   };

//   // 🔼 Move block up
//   const moveBlockUp = (blockId) => {
//     setChapters((prev) =>
//       prev.map((ch) => {
//         if (ch.chapterId !== activeChapter) return ch;
//         const idx = ch.blocks.findIndex((b) => b.id === blockId);
//         if (idx <= 0) return ch; // already at top or not found
//         const newBlocks = ch.blocks.slice();
//         const temp = newBlocks[idx - 1];
//         newBlocks[idx - 1] = newBlocks[idx];
//         newBlocks[idx] = temp;
//         return { ...ch, blocks: newBlocks };
//       })
//     );
//   };

//   // 🔽 Move block down
//   const moveBlockDown = (blockId) => {
//     setChapters((prev) =>
//       prev.map((ch) => {
//         if (ch.chapterId !== activeChapter) return ch;
//         const idx = ch.blocks.findIndex((b) => b.id === blockId);
//         if (idx === -1 || idx >= ch.blocks.length - 1) return ch; // already at bottom or not found
//         const newBlocks = ch.blocks.slice();
//         const temp = newBlocks[idx + 1];
//         newBlocks[idx + 1] = newBlocks[idx];
//         newBlocks[idx] = temp;
//         return { ...ch, blocks: newBlocks };
//       })
//     );
//   };

//   /* -----------------------
//      Save / Republish
//   ------------------------*/
//   const handleSave = async (publish = false) => {
//     // title/slug are loaded; not edited here
//     const ebook = {
//       title,
//       slug,
//       instituteId: "0z2w1ep",
//       chapters, // ✅ save chapters (not a flat blocks array)
//       status: publish ? "PUBLISHED" : "DRAFT",
//     };

//     try {
//       setSaving(true);
//       await api.updateEBook(ebookid, ebook);
//       setStatus(ebook.status);
//       toast.success(publish ? "E-Book republished!" : "E-Book updated!");
//       if (publish) navigate(`/ebooks/read/${ebookid}`);
//     } catch (err) {
//       toast.error(
//         "Error saving e-book: " + (err.response?.data?.error || err.message)
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (!isEditing) return null;

//   if (loading) {
//     return (
//       <div style={{ padding: 16 }}>
//         <LoadingAnimation />
//       </div>
//     );
//   }

//   const currentChapter =
//     chapters.find((ch) => ch.chapterId === activeChapter) || null;

//   // small style for add chapter
//   const styles = {
//     addChapterBtn: {
//       backgroundColor: "#2e8b57",
//       color: "#fff",
//       border: "none",
//       borderRadius: "8px",
//       padding: "6px 12px",
//       fontSize: "14px",
//       cursor: "pointer",
//     },
//     moveBtn: {
//       border: "1px solid #e5e7eb",
//       borderRadius: "8px",
//       padding: "6px 10px",
//       fontSize: "12px",
//       background: "#fff",
//       cursor: "pointer",
//     },
//     moveGroup: {
//       display: "flex",
//       gap: "6px",
//       alignItems: "center",
      
//     },
//   };

//   return (
//     <div className="flex h-screen">
//       {/* Sidebar for adding blocks */}
//       <BlockSidebar onAdd={addBlock} />

//       <div className="relative flex-1 overflow-y-auto p-4 bg-gray-50">
//         {/* Header with title + settings */}
//         <div className="flex items-center justify-between mb-2">
//           <div>
//             <h2 className="text-xl font-bold">{title || "Edit E-Book"}</h2>
//             <div className="text-xs text-gray-500">/{slug || "—"}</div>
//           </div>

//           {/* Settings (top-right) */}
//           <button
//             type="button"
//             onClick={() => navigate(`/admin/ebooks/settings/${ebookid}`)}
//             className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
//             title="Settings"
//             aria-label="Open e-book settings"
//           >
//             {/* fixed SVG (correct xmlns/viewBox) */}
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-5 w-5 text-gray-700"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//             >
//               <path d="M11.983 1.804a1 1 0 00-1.966 0l-.138.833a6.977 6.977 0 00-1.28.741l-.79-.457a1 1 0 00-1.366.366l-.999 1.732a1 1 0 00.366 1.366l.79.456a6.986 6.986 0 000 1.483l-.79.456a1 1 0 00-.366 1.366l.999 1.732a1 1 0 001.366.366l.79-.456c.4.296.832.54 1.28.741l.138.833a1 1 0 001.966 0l.138-.833c.448-.201.881-.445 1.28-.741l.79.456a1 1 0 001.366-.366l1-1.732a1 1 0 00-.366-1.366l-.79-.456c.06-.49.06-.993 0-1.483l.79-.456a1 1 0 00.366-1.366l-1-1.732a1 1 0 00-1.366-.366l-.79.457a6.977 6.977 0 00-1.28-.741l-.138-.833zM10 12a2 2 0 110-4 2 2 0 010 4z" />
//             </svg>
//           </button>
//         </div>

//         {/* Status pill */}
//         <div className="mb-3">
//           <span
//             className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
//               status === "PUBLISHED"
//                 ? "bg-green-100 text-green-700"
//                 : "bg-yellow-100 text-yellow-700"
//             }`}
//           >
//             {status}
//           </span>
//         </div>

//         {/* ✅ Chapter selector + Add Chapter */}
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "10px",
//             marginBottom: "16px",
//           }}
//         >
//           <select
//             className="border rounded p-2"
//             value={activeChapter || ""}
//             onChange={(e) => setActiveChapter(e.target.value)}
//           >
//             <option value="">-- Select Chapter --</option>
//             {chapters.map((ch) => (
//               <option key={ch.chapterId} value={ch.chapterId}>
//                 {ch.title}
//               </option>
//             ))}
//           </select>

//           <button style={styles.addChapterBtn} onClick={addNewChapter}>
//             + Add New Chapter
//           </button>
//         </div>

//         {/* ✅ Inline rename for the active chapter */}
//         {activeChapter && (
//           <div className="mb-3">
//             <input
//               className="border-b p-1 w-full font-medium text-lg bg-transparent"
//               value={
//                 chapters.find((ch) => ch.chapterId === activeChapter)?.title ||
//                 ""
//               }
//               onChange={(e) => renameChapter(activeChapter, e.target.value)}
//             />
//           </div>
//         )}

//         {/* ✅ Active Chapter content editor */}
//         {currentChapter ? (
//           <div>
//             <h3 className="text-lg font-semibold mb-2">
//               {currentChapter.title}
//             </h3>

//             {(currentChapter.blocks || []).map((block, index) => {
//               const isFirst = index === 0;
//               const isLast = index === (currentChapter.blocks?.length || 0) - 1;

//               return (
//                 <div
//                   key={block.id}
//                   className="border rounded p-2 mb-3 bg-white shadow-sm"
//                 >
//                   <div className="flex justify-between items-center mb-2">
//                     <span className="font-medium capitalize">{block.type}</span>

//                     <div >
//                       {/* Move Up */}
//                       <button
//                        className="text-red-600 text-sm ml-2"
//                         type="button"
//                         style={styles.moveBtn}
//                         onClick={() => moveBlockUp(block.id)}
//                         disabled={isFirst}
//                         title="Move block up"
//                       >
//                         ↑
//                       </button>

//                       {/* Move Down */}
//                       <button
//                        className="text-red-600 text-sm ml-2"
//                         type="button"
//                         style={styles.moveBtn}
//                         onClick={() => moveBlockDown(block.id)}
//                         disabled={isLast}
//                         title="Move block down"
//                       >
//                         ↓
//                       </button>

//                       {/* Remove */}
//                       <button
//                         className="text-red-600 text-sm ml-2"
//                         onClick={() => removeBlock(block.id)}
//                         title="Remove block"
//                       >
//                         ✕ Remove
//                       </button>
//                     </div>
//                   </div>

//                   <BlockRenderer
//                     block={block}
//                     onChange={(b) => updateBlock(block.id, b)}
//                   />
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           <p className="text-gray-500 italic">No chapter selected yet.</p>
//         )}

//         {/* Save / Publish */}
//         <div className="flex gap-3 mt-4">
//           <button
//             disabled={saving}
//             onClick={() => handleSave(false)}
//             className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
//           >
//             {saving ? "Saving..." : "Update Draft"}
//           </button>

//           <button
//             disabled={saving}
//             onClick={() => handleSave(true)}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//           >
//             {saving ? "Publishing..." : "Republish Now"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }




























// src/components/EBookEditor.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BlockSidebar from "./BlockSidebar";
import BlockRenderer from "./BlockRenderer";
import * as ebooksApiModule from "../api/ebooksApi";
import { toast } from "react-toastify";
import LoadingAnimation from "../../../../Website/json_files/LoadingAnimation"

const api = ebooksApiModule.default || ebooksApiModule;

export default function EBookEditor() {
  const { ebookid } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(ebookid);

  const [title, setTitle] = useState(""); // read-only (loaded)
  const [slug, setSlug] = useState("");   // read-only (loaded)

  // ✅ Chapters-based state (with active chapter)
  const [chapters, setChapters] = useState([
    { chapterId: "ch-" + Date.now(), title: "Main Chapter", blocks: [] },
  ]);
  const [activeChapter, setActiveChapter] = useState(null);

  const [status, setStatus] = useState("DRAFT");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // If no ebookid, redirect to the create page (Title.jsx)
  useEffect(() => {
    if (!isEditing) {
      navigate("/admin/ebooks/create", { replace: true });
    }
  }, [isEditing, navigate]);

  // Load existing e-book (now filling chapters + activeChapter)
  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.getEBookById(ebookid);
        const data = res.data;

        setTitle(data.title || "");
        setSlug(data.slug || "");
        setStatus(data.status || "DRAFT");

        if (Array.isArray(data.chapters) && data.chapters.length) {
          setChapters(data.chapters);
          setActiveChapter(data.chapters[0]?.chapterId || null);
        } else {
          // fallback: old single-block structure
          const singleBlocks = data.chapters?.[0]?.blocks || data.blocks || [];
          const ch = {
            chapterId: "ch-" + Date.now(),
            title: "Main Chapter",
            blocks: singleBlocks,
          };
          setChapters([ch]);
          setActiveChapter(ch.chapterId);
        }
      } catch (err) {
        toast.error("Failed to load e-book for editing");
      } finally {
        setLoading(false);
      }
    })();
  }, [ebookid, isEditing]);

  /* -----------------------
     Chapter management
  ------------------------*/
  const addNewChapter = () => {
    const newChapter = {
      chapterId: "ch-" + Date.now(),
      title: `New Chapter ${chapters.length + 1}`,
      blocks: [],
      authorSummary: "", // ← ensure new chapters have the field
    };
    setChapters((prev) => [...prev, newChapter]);
    setActiveChapter(newChapter.chapterId);
    toast.success("📝 New chapter added");
  };

  const renameChapter = (chapterId, newTitle) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.chapterId === chapterId ? { ...ch, title: newTitle } : ch
      )
    );
  };

  // ✅ generic chapter meta updater (authorSummary etc.)
  const updateChapterMeta = (chapterId, field, value) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.chapterId === chapterId ? { ...ch, [field]: value } : ch
      )
    );
  };

  /* -----------------------
     Block actions (per active chapter)
  ------------------------*/
  const addBlock = (type) => {
    if (!activeChapter) return toast.error("Select a chapter first!");
    setChapters((prev) =>
      prev.map((ch) =>
        ch.chapterId === activeChapter
          ? {
              ...ch,
              blocks: [
                ...(ch.blocks || []),
                { id: Date.now(), type, content: "", url: "" },
              ],
            }
          : ch
      )
    );
  };

  const updateBlock = (blockId, newBlock) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.chapterId === activeChapter
          ? {
              ...ch,
              blocks: ch.blocks.map((b) => (b.id === blockId ? newBlock : b)),
            }
          : ch
      )
    );
  };

  const removeBlock = (blockId) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.chapterId === activeChapter
          ? { ...ch, blocks: ch.blocks.filter((b) => b.id !== blockId) }
          : ch
      )
    );
  };

  // 🔼 Move block up
  const moveBlockUp = (blockId) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.chapterId !== activeChapter) return ch;
        const idx = ch.blocks.findIndex((b) => b.id === blockId);
        if (idx <= 0) return ch; // already at top or not found
        const newBlocks = ch.blocks.slice();
        const temp = newBlocks[idx - 1];
        newBlocks[idx - 1] = newBlocks[idx];
        newBlocks[idx] = temp;
        return { ...ch, blocks: newBlocks };
      })
    );
  };

  // 🔽 Move block down
  const moveBlockDown = (blockId) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.chapterId !== activeChapter) return ch;
        const idx = ch.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1 || idx >= ch.blocks.length - 1) return ch; // already at bottom or not found
        const newBlocks = ch.blocks.slice();
        const temp = newBlocks[idx + 1];
        newBlocks[idx + 1] = newBlocks[idx];
        newBlocks[idx] = temp;
        return { ...ch, blocks: newBlocks };
      })
    );
  };

  /* -----------------------
     Save / Republish
  ------------------------*/
  const handleSave = async (publish = false) => {
    // title/slug are loaded; not edited here
    const ebook = {
      title,
      slug,
      instituteId: "0z2w1ep",
      chapters, // ✅ save chapters (now includes authorSummary when set)
      status: publish ? "PUBLISHED" : "DRAFT",
    };

    try {
      setSaving(true);
      await api.updateEBook(ebookid, ebook);
      setStatus(ebook.status);
      toast.success(publish ? "E-Book republished!" : "E-Book updated!");
      if (publish) navigate(`/ebooks/read/${ebookid}`);
    } catch (err) {
      toast.error(
        "Error saving e-book: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) return null;

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <LoadingAnimation />
      </div>
    );
  }

  const currentChapter =
    chapters.find((ch) => ch.chapterId === activeChapter) || null;

  // small style for add chapter
  const styles = {
    addChapterBtn: {
      backgroundColor: "#2e8b57",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "6px 12px",
      fontSize: "14px",
      cursor: "pointer",
    },
    moveBtn: {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "6px 10px",
      fontSize: "12px",
      background: "#fff",
      cursor: "pointer",
    },
    moveGroup: {
      display: "flex",
      gap: "6px",
      alignItems: "center",
      
    },
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar for adding blocks */}
      <BlockSidebar onAdd={addBlock} />

      <div className="relative flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Header with title + settings */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold">{title || "Edit E-Book"}</h2>
            <div className="text-xs text-gray-500">/{slug || "—"}</div>
          </div>

        {/* Settings (top-right) */}
         {/* Settings icon (no button) */}
<img
  src="https://cdn-icons-png.flaticon.com/128/3524/3524659.png"
  alt="Settings"
  title="Settings"
  onClick={() => navigate(`/admin/ebooks/settings/${ebookid}`)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      navigate(`/admin/ebooks/settings/${ebookid}`);
    }
  }}
  role="link"
  tabIndex={0}
  className="h-6 w-6 cursor-pointer select-none
             opacity-80 hover:opacity-100
             transition-transform duration-150 ease-out
             hover:scale-105 active:scale-95"
/>

        </div>

        {/* Status pill */}
        <div className="mb-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              status === "PUBLISHED"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {status}
          </span>
        </div>

        {/* ✅ Chapter selector + Add Chapter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <select
            className="border rounded p-2"
            value={activeChapter || ""}
            onChange={(e) => setActiveChapter(e.target.value)}
          >
            <option value="">-- Select Chapter --</option>
            {chapters.map((ch) => (
              <option key={ch.chapterId} value={ch.chapterId}>
                {ch.title}
              </option>
            ))}
          </select>

          <button style={styles.addChapterBtn} onClick={addNewChapter}>
            + Add New Chapter
          </button>
        </div>

        {/* ✅ Inline rename for the active chapter */}
        {activeChapter && (
          <div className="mb-3">
            <input
              className="border-b p-1 w-full font-medium text-lg bg-transparent"
              value={
                chapters.find((ch) => ch.chapterId === activeChapter)?.title ||
                ""
              }
              onChange={(e) => renameChapter(activeChapter, e.target.value)}
            />
          </div>
        )}

        {/* ✅ NEW: Author summary editor for the active chapter */}
        {currentChapter && (
          <div className="mb-4 border rounded-lg bg-white shadow-sm">
            <div className="px-3 py-2 border-b font-semibold">
              Chapter Author Summary (optional)
            </div>
            <div className="p-3">
              <textarea
                rows={6}
                className="w-full border rounded p-2"
                placeholder="Write a concise summary for students. This appears as 'Summary by author' on the student side."
                value={currentChapter.authorSummary || ""}
                onChange={(e) =>
                  updateChapterMeta(currentChapter.chapterId, "authorSummary", e.target.value)
                }
              />
              <div className="text-xs text-gray-500 mt-1">
                Tip: Use 3–8 short lines. They’ll be shown as bullet points for readers.
              </div>
            </div>
          </div>
        )}

        {/* ✅ Active Chapter content editor */}
        {currentChapter ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {currentChapter.title}
            </h3>

            {(currentChapter.blocks || []).map((block, index) => {
              const isFirst = index === 0;
              const isLast = index === (currentChapter.blocks?.length || 0) - 1;

              return (
                <div
                  key={block.id}
                  className="border rounded p-2 mb-3 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium capitalize">{block.type}</span>

                    <div >
                      {/* Move Up */}
                      <button
                       className="text-red-600 text-sm ml-2"
                        type="button"
                        style={styles.moveBtn}
                        onClick={() => moveBlockUp(block.id)}
                        disabled={isFirst}
                        title="Move block up"
                      >
                        ↑
                      </button>

                      {/* Move Down */}
                      <button
                       className="text-red-600 text-sm ml-2"
                        type="button"
                        style={styles.moveBtn}
                        onClick={() => moveBlockDown(block.id)}
                        disabled={isLast}
                        title="Move block down"
                      >
                        ↓
                      </button>

                      {/* Remove */}
                      <button
                        className="text-red-600 text-sm ml-2"
                        onClick={() => removeBlock(block.id)}
                        title="Remove block"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>

                  <BlockRenderer
                    block={block}
                    onChange={(b) => updateBlock(block.id, b)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No chapter selected yet.</p>
        )}

        {/* Save / Publish */}
        <div className="flex gap-3 mt-4">
          <button
            disabled={saving}
            onClick={() => handleSave(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            {saving ? "Saving..." : "Update Draft"}
          </button>

          <button
            disabled={saving}
            onClick={() => handleSave(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {saving ? "Publishing..." : "Republish Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
