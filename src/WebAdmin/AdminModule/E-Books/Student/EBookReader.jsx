// // src/components/EBookReader.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useSearchParams, useParams } from "react-router-dom";
// import ChapterViewer from "./ChapterViewer";

// // ✅ Safe import for both named/default export patterns
// import * as ebooksApiModule from "../api/ebooksApi";
// // import LoadingAnimation from "../../json_files/LoadingAnimation";
// const api = ebooksApiModule.default || ebooksApiModule;

// /**
//  * Normalize chapters to ensure every block has a consistent structure.
//  * This ensures "quiz" blocks with nested "data" appear properly for students.
//  */
// function normalizeChapters(rawChapters = []) {
//   return rawChapters.map((chapter) => {
//     const normalizedBlocks = (chapter.blocks || []).map((block) => {
//       if (block.data && typeof block.data === "object") {
//         return {
//           ...block,
//           ...block.data, // includes table props like rows/cols/cells
//           type:
//             (block.type || block.data?.type || "").toLowerCase() || "text",
//         };
//       }
//       return {
//         ...block,
//         type: (block.type || "").toLowerCase() || "text",
//       };
//     });

//     return {
//       ...chapter,
//       blocks: normalizedBlocks,
//     };
//   });
// }

// export default function EBookReader() {
//   const params = useParams();
//   const [search] = useSearchParams();

//   // sanitize route param: ignore placeholders like ":ebookid"
//   const rawId = params?.ebookid || null;
//   const ebookIdParam =
//     rawId && !rawId.startsWith(":") && rawId.trim() !== "" ? rawId : null;

//   const instituteId = search.get("instituteId") || "0z2w1ep";
//   const slug = search.get("slug") || null;

//   const [ebook, setEbook] = useState(null);
//   const [active, setActive] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   // 👉 ref for the scrollable main reading area
//   const mainRef = useRef(null);

//   // whether the end of current chapter is visible (set by ChapterViewer)
//   const [atEnd, setAtEnd] = useState(false);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");
//         let res;

//         if (ebookIdParam) {
//           res = await api.getEBookById(ebookIdParam);
//         } else if (slug) {
//           res = await api.getEBookBySlug(instituteId, slug);
//         } else {
//           throw new Error("Provide ebookid or (instituteId & slug)");
//         }

//         if (!mounted) return;
//         const data = res.data;

//         // only show published books to students
//         if (data.status !== "PUBLISHED" && data.status !== "Published") {
//           setErr(
//             "This e-book is not published yet. Please contact your instructor."
//           );
//           setEbook(null);
//         } else {
//           const chapters = normalizeChapters(data.chapters || []);
//           const fixedData = { ...data, chapters };
//           setEbook(fixedData);
//           setActive(chapters?.[0]?.chapterId || null);
//         }
//       } catch (e) {
//         console.error("[EBookReader] fetch error:", e);
//         setErr(e?.response?.data?.error || e.message || "Failed to load e-book");
//       } finally {
//         setLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [ebookIdParam, instituteId, slug]);

//   // ⬇️ Smooth scroll to top whenever the active chapter changes
//   useEffect(() => {
//     setAtEnd(false); // reset end-visibility on chapter change
//     if (mainRef.current) {
//       mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
//     } else {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   }, [active]);

//   const chapters = useMemo(() => ebook?.chapters || [], [ebook]);

//   const currentIndex = useMemo(
//     () => chapters.findIndex((c) => c.chapterId === active),
//     [chapters, active]
//   );
//   const current = currentIndex >= 0 ? chapters[currentIndex] : null;
//   const hasNext = currentIndex >= 0 && currentIndex < chapters.length - 1;
//   const nextChapter = hasNext ? chapters[currentIndex + 1] : null;

//   const goNextChapter = () => {
//     if (nextChapter?.chapterId) setActive(nextChapter.chapterId);
//   };

//   if (loading) {
//     return (
//       <div className="reader-loading">
//         <style>{css}</style>
//         <div className="loading-card">
//           {/* <LoadingAnimation /> */}
//           <div className="loading-sub">Loading e-book…</div>
//         </div>
//       </div>
//     );
//   }

//   if (err) {
//     return (
//       <div className="reader-error">
//         <style>{css}</style>
//         <div className="error-card">{err}</div>
//       </div>
//     );
//   }

//   if (!ebook) {
//     return (
//       <div className="reader-error">
//         <style>{css}</style>
//         <div className="error-card">Not found.</div>
//       </div>
//     );
//   }

//   return (
//     <div className="reader-shell">
//       <style>{css}</style>

//       {/* Fixed Sidebar: Chapters */}
//       <aside className="reader-sidebar">
//         <div className="sidebar-head">
//           <div className="book-title" title={ebook.title}>
//             {ebook.title}
//           </div>
//         {ebook.slug && <div className="book-slug">/{ebook.slug}</div>}
//         </div>

//         {chapters.length === 0 ? (
//           <div className="sidebar-empty">No chapters available.</div>
//         ) : (
//           <ul className="chapter-list">
//             {chapters.map((ch, i) => {
//               const isActive = active === ch.chapterId;
//               return (
//                 <li key={ch.chapterId || i}>
//                   <button
//                     onClick={() => setActive(ch.chapterId)}
//                     className={`chapter-btn ${isActive ? "is-active" : ""}`}
//                   >
//                     <span className="chip">{i + 1}</span>
//                     <span className="chapter-title">
//                       {ch.title || "Untitled Chapter"}
//                     </span>
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>
//         )}
//       </aside>

//       {/* Main reading area */}
//       <main className="reader-main" ref={mainRef}>
//         {current ? (
//           <div className="page-animate">
//             <ChapterViewer
//               chapter={current}
//               onEndVisible={(visible) => setAtEnd(!!visible)}
//             />
//           </div>
//         ) : (
//           <div className="placeholder">Select a chapter to begin reading.</div>
//         )}

//         {/* Show Next Chapter only when end of chapter is visible */}
//         {hasNext && atEnd && (
//           <button
//             type="button"
//             className="next-chapter-btn"
//             onClick={goNextChapter}
//             title={`Go to next chapter: ${nextChapter?.title || "Next"}`}
//           >
//             Next Chapter →
//           </button>
//         )}
//       </main>
//     </div>
//   );
// }

// /* ------------------------------
//    INTERNAL CSS (sidebar fixes + NAV offset)
// ------------------------------- */
// const css = `
// :root{
//   --brand:#4748ac;
//   --bg:#ffffff;
//   --fg:#0f172a;
//   --muted:#6b7280;
//   --card:#ffffff;
//   --line:#e5e7eb;
//   --shadow:0 10px 30px rgba(2,6,23,.06);
//   --sidebar-w: 300px; /* a touch wider for long titles */
//   --nav-h: 72px;      /* ⬅️ height of your fixed navbar; adjust if needed */
// }

// @keyframes slideIn {
//   from { opacity: 0; transform: translateX(-10px); }
//   to   { opacity: 1; transform: translateX(0); }
// }
// @keyframes fadeUp {
//   from { opacity: 0; transform: translateY(10px); }
//   to   { opacity: 1; transform: translateY(0); }
// }
// @keyframes glowPulse {
//   0% { box-shadow: 0 0 0 0 rgba(71,72,172,.28); }
//   70%{ box-shadow: 0 0 0 12px rgba(71,72,172,0); }
//   100%{box-shadow: 0 0 0 0 rgba(71,72,172,0); }
// }
// @keyframes floatIn {
//   from { opacity:0; transform: translateY(10px) scale(.98); }
//   to   { opacity:1; transform: translateY(0) scale(1); }
// }

// /* Layout */
// .reader-shell{
//   display:block;
//   min-height:100vh;
//   background:var(--bg);
//   color:var(--fg);
//   font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue";
//   padding-left: var(--sidebar-w);
//   padding-top: var(--nav-h);       /* ⬅️ push content below the fixed navbar */
// }

// /* Fixed Sidebar */
// .reader-sidebar{
//   position: fixed;
//   left: 0;
//   top: var(--nav-h);               /* ⬅️ start below the navbar */
//   width: var(--sidebar-w);
//   height: calc(100vh - var(--nav-h)); /* ⬅️ keep full height under navbar */
//   border-right:1px solid var(--line);
//   background:linear-gradient(180deg, #fafaff 0%, #ffffff 60%);
//   padding:16px 14px;
//   overflow-y:auto;
//   animation: slideIn .25s ease both;
//   z-index: 20;
// }
// .sidebar-head{
//   background:#fff;
//   border:1px solid var(--line);
//   border-radius:14px;
//   box-shadow: var(--shadow);
//   padding:14px;
//   margin-bottom:14px;
// }

// /* Wrap long book titles (no hiding) */
// .book-title{
//   font-weight:800; font-size:16px; color:#0b1324; line-height:1.35;
//   white-space: normal;
//   overflow: visible;
//   word-break: break-word;
// }

// .book-slug{
//   margin-top:6px; color:var(--muted); font-size:12px;
// }

// /* Chapter list */
// .chapter-list{ list-style:none; padding:0; margin:0; display:grid; gap:10px; }
// .chapter-btn{
//   width:100%;
//   border:1px solid var(--line);
//   background:#fff; color:#0f172a;
//   display:flex; align-items:flex-start;  /* top-align to support wrapping */
//   gap:10px; text-align:left;
//   border-radius:12px; padding:12px 12px; cursor:pointer;
//   transition: transform .06s ease, box-shadow .15s ease, border-color .15s ease, background .15s ease;
// }
// .chapter-btn:hover{ transform: translateY(-1px); box-shadow: var(--shadow); }
// .chapter-btn.is-active{
//   border-color: rgba(71,72,172,.55);
//   box-shadow: 0 0 0 3px rgba(71,72,172,.15) inset;
//   background: #f6f7ff;
//   animation: glowPulse 2.4s ease-out infinite;
// }
// .chapter-btn .chip{
//   min-width:26px; height:26px; margin-top:2px;
//   border-radius:999px; display:inline-grid; place-items:center;
//   background: var(--brand); color:#fff; font-weight:800; font-size:12px;
// }

// /* Wrap long chapter titles (no hiding) */
// .chapter-btn .chapter-title{
//   flex: 1 1 auto;
//   font-weight:600; font-size:14px; color:#111827;
//   white-space: normal;
//   overflow: visible;
//   word-break: break-word;
//   line-height: 1.35;
// }

// /* Main reading area */
// .reader-main{
//   min-height:100vh;
//   overflow-y:auto;
//   padding:22px;
//   padding-top: 16px;               /* minor breathing room below navbar */
//   background:#fff;
//   position: relative;
// }
// .page-animate{ animation: fadeUp .25s ease both; }

// .placeholder{
//   color:#6b7280; font-size:14px; padding:20px; border:1px dashed var(--line);
//   border-radius:12px; background:#fafafa; text-align:center;
// }

// /* Floating 'Next Chapter' button (only rendered when at end) */
// .next-chapter-btn{
//   position: fixed;
//   right: 24px;
//   bottom: 24px;
//   border: none;
//   border-radius: 14px;
//   padding: 12px 18px;
//   font-weight: 800;
//   background: var(--brand);
//   color: #fff;
//   box-shadow: 0 10px 26px rgba(71,72,172,.28);
//   cursor: pointer;
//   transition: transform .08s ease, filter .15s ease, box-shadow .15s ease;
//   animation: floatIn .25s ease both;
//   z-index: 15;
// }
// .next-chapter-btn:hover{
//   transform: translateY(-2px);
//   filter: brightness(1.06);
//   box-shadow: 0 12px 32px rgba(71,72,172,.34);
// }
// .next-chapter-btn:active{ transform: translateY(0); }

// /* Loading & Error */
// .reader-loading, .reader-error{
//   min-height: 60vh; display:grid; place-items:center; background:#fff;
// }
// .loading-card, .error-card{
//   background:#fff; border:1px solid var(--line); border-radius:16px; box-shadow: var(--shadow);
//   padding:24px; min-width:260px; text-align:center; color:#111827;
// }
// .loading-sub{ margin-top:8px; color:#6b7280; font-size:14px; }
// .error-card{ color:#991b1b; background: #fff5f5; border-color:#fecaca; }

// /* Small screens */
// @media (max-width: 720px){
//   :root{ --sidebar-w: 260px; --nav-h: 64px; } /* slightly smaller navbar on mobile */
//   .reader-main{ padding:16px; }
//   .next-chapter-btn{ right: 16px; bottom: 16px; }
// }
// `;





// src/components/EBookReader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import ChapterViewer from "./ChapterViewer";

// ✅ Safe import for both named/default export patterns
import * as ebooksApiModule from "../api/ebooksApi";
// import LoadingAnimation from "../../json_files/LoadingAnimation";
const api = ebooksApiModule.default || ebooksApiModule;

/**
 * Normalize chapters to ensure every block has a consistent structure.
 * This ensures "quiz" blocks with nested "data" appear properly for students.
 */
function normalizeChapters(rawChapters = []) {
  return rawChapters.map((chapter) => {
    const normalizedBlocks = (chapter.blocks || []).map((block) => {
      if (block.data && typeof block.data === "object") {
        return {
          ...block,
          ...block.data, // includes table props like rows/cols/cells
          type:
            (block.type || block.data?.type || "").toLowerCase() || "text",
        };
      }
      return {
        ...block,
        type: (block.type || "").toLowerCase() || "text",
      };
    });

    return {
      ...chapter,
      blocks: normalizedBlocks,
    };
  });
}

export default function EBookReader() {
  const params = useParams();
  const [search] = useSearchParams();

  // sanitize route param: ignore placeholders like ":ebookid"
  const rawId = params?.ebookid || null;
  const ebookIdParam =
    rawId && !rawId.startsWith(":") && rawId.trim() !== "" ? rawId : null;

  const instituteId = search.get("instituteId") || "0z2w1ep";
  const slug = search.get("slug") || null;

  const [ebook, setEbook] = useState(null);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 👉 ref for the scrollable main reading area
  const mainRef = useRef(null);

  // whether the end of current chapter is visible (set by ChapterViewer)
  const [atEnd, setAtEnd] = useState(false);

  // 👉 UI-only: mobile chapters drawer visibility (overlay)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        let res;

        if (ebookIdParam) {
          res = await api.getEBookById(ebookIdParam);
        } else if (slug) {
          res = await api.getEBookBySlug(instituteId, slug);
        } else {
          throw new Error("Provide ebookid or (instituteId & slug)");
        }

        if (!mounted) return;
        const data = res.data;

        // only show published books to students
        if (data.status !== "PUBLISHED" && data.status !== "Published") {
          setErr(
            "This e-book is not published yet. Please contact your instructor."
          );
          setEbook(null);
        } else {
          const chapters = normalizeChapters(data.chapters || []);
          const fixedData = { ...data, chapters };
          setEbook(fixedData);
          setActive(chapters?.[0]?.chapterId || null);
        }
      } catch (e) {
        console.error("[EBookReader] fetch error:", e);
        setErr(e?.response?.data?.error || e.message || "Failed to load e-book");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ebookIdParam, instituteId, slug]);

  // ⬇️ Smooth scroll to top whenever the active chapter changes
  useEffect(() => {
    setAtEnd(false); // reset end-visibility on chapter change
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  const chapters = useMemo(() => ebook?.chapters || [], [ebook]);

  const currentIndex = useMemo(
    () => chapters.findIndex((c) => c.chapterId === active),
    [chapters, active]
  );
  const current = currentIndex >= 0 ? chapters[currentIndex] : null;
  const hasNext = currentIndex >= 0 && currentIndex < chapters.length - 1;
  const nextChapter = hasNext ? chapters[currentIndex + 1] : null;

  const goNextChapter = () => {
    if (nextChapter?.chapterId) setActive(nextChapter.chapterId);
  };

  if (loading) {
    return (
      <div className="reader-loading">
        <style>{css}</style>
        <div className="loading-card">
          {/* <LoadingAnimation /> */}
          <div className="loading-sub">Loading e-book…</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="reader-error">
        <style>{css}</style>
        <div className="error-card">{err}</div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="reader-error">
        <style>{css}</style>
        <div className="error-card">Not found.</div>
      </div>
    );
  }

  return (
    <div className="reader-shell">
      <style>{css}</style>

      {/* Fixed Sidebar: Chapters (desktop only; unchanged) */}
      <aside className="reader-sidebar">
        <div className="sidebar-head">
          <div className="book-title" title={ebook.title}>
            {ebook.title}
          </div>
          {ebook.slug && <div className="book-slug">/{ebook.slug}</div>}
        </div>

        {chapters.length === 0 ? (
          <div className="sidebar-empty">No chapters available.</div>
        ) : (
          <ul className="chapter-list">
            {chapters.map((ch, i) => {
              const isActive = active === ch.chapterId;
              return (
                <li key={ch.chapterId || i}>
                  <button
                    onClick={() => setActive(ch.chapterId)}
                    className={`chapter-btn ${isActive ? "is-active" : ""}`}
                  >
                    <span className="chip">{i + 1}</span>
                    <span className="chapter-title">
                      {ch.title || "Untitled Chapter"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Mobile sticky bar with Chapters toggle */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-inner">
          <div className="mobile-book">
            <div className="mobile-book-title" title={ebook.title}>
              {ebook.title}
            </div>
            {ebook.slug && (
              <div className="mobile-book-slug">/{ebook.slug}</div>
            )}
          </div>
          <button
            className="mobile-open-btn"
            onClick={() => setShowMobileDrawer(true)}
            style={{backgroundColor:"#4748ac"}}
            title="Open chapters"
          >
            Chapters
          </button>
        </div>
      </div>

      {/* Mobile overlay + drawer (overlays above main; main stays full width) */}
      {showMobileDrawer && (
        <div
          className="mobile-mask"
          onClick={() => setShowMobileDrawer(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`mobile-drawer ${showMobileDrawer ? "open" : ""}`}
        aria-hidden={!showMobileDrawer}
      >
        <div className="mobile-drawer-head">
          <div className="mobile-drawer-title">Chapters</div>
          <button
            className="mobile-close-btn"
            onClick={() => setShowMobileDrawer(false)}
            title="Close"
          >
            ✕
          </button>
        </div>

        {chapters.length === 0 ? (
          <div className="sidebar-empty" style={{ marginTop: 8 }}>
            No chapters available.
          </div>
        ) : (
          <ul className="chapter-list">
            {chapters.map((ch, i) => {
              const isActive = active === ch.chapterId;
              return (
                <li key={ch.chapterId || i}>
                  <button
                    onClick={() => {
                      setActive(ch.chapterId);
                      setShowMobileDrawer(false);
                    }}
                    className={`chapter-btn ${isActive ? "is-active" : ""}`}
                  >
                    <span className="chip">{i + 1}</span>
                    <span className="chapter-title">
                      {ch.title || "Untitled Chapter"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Main reading area */}
      <main className="reader-main" ref={mainRef}>
        {current ? (
          <div className="page-animate">
            <ChapterViewer
              chapter={current}
              onEndVisible={(visible) => setAtEnd(!!visible)}
            />
          </div>
        ) : (
          <div className="placeholder">Select a chapter to begin reading.</div>
        )}

        {/* Show Next Chapter only when end of chapter is visible */}
        {hasNext && atEnd && (
          <button
            type="button"
            className="next-chapter-btn"
            onClick={goNextChapter}
            title={`Go to next chapter: ${nextChapter?.title || "Next"}`}
          >
            Next Chapter →
          </button>
        )}
      </main>
    </div>
  );
}

/* ------------------------------
   INTERNAL CSS (desktop preserved; mobile overlay/drawer added)
------------------------------- */
const css = `
:root{
  --brand:#4748ac;
  --bg:#ffffff;
  --fg:#0f172a;
  --muted:#6b7280;
  --card:#ffffff;
  --line:#e5e7eb;
  --shadow:0 10px 30px rgba(2,6,23,.06);
  --sidebar-w: 300px; /* desktop sidebar width */
  --nav-h: 72px;      /* height of your fixed navbar; adjust if needed */
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes glowPulse {
  0% { box-shadow: 0 0 0 0 rgba(71,72,172,.28); }
  70%{ box-shadow: 0 0 0 12px rgba(71,72,172,0); }
  100%{box-shadow: 0 0 0 0 rgba(71,72,172,0); }
}
@keyframes floatIn {
  from { opacity:0; transform: translateY(10px) scale(.98); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}

/* ===== Desktop layout (unchanged) ===== */
.reader-shell{
  display:block;
  min-height:100vh;
  background:var(--bg);
  color:var(--fg);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue";
  padding-left: var(--sidebar-w);
  padding-top: var(--nav-h);       /* push content below the fixed navbar */
}

/* Fixed Sidebar (desktop only) */
.reader-sidebar{
  position: fixed;
  left: 0;
  top: var(--nav-h);
  width: var(--sidebar-w);
  height: calc(100vh - var(--nav-h));
  border-right:1px solid var(--line);
  background:linear-gradient(180deg, #fafaff 0%, #ffffff 60%);
  padding:16px 14px;
  overflow-y:auto;
  animation: slideIn .25s ease both;
  z-index: 20;
}
.sidebar-head{
  background:#fff;
  border:1px solid var(--line);
  border-radius:14px;
  box-shadow: var(--shadow);
  padding:14px;
  margin-bottom:14px;
}

/* Wrap long book titles */
.book-title{
  font-weight:800; font-size:16px; color:#0b1324; line-height:1.35;
  white-space: normal; overflow: visible; word-break: break-word;
}
.book-slug{ margin-top:6px; color:var(--muted); font-size:12px; }

/* Chapter list */
.chapter-list{ list-style:none; padding:0; margin:0; display:grid; gap:10px; }
.chapter-btn{
  width:100%;
  border:1px solid var(--line);
  background:#fff; color:#0f172a;
  display:flex; align-items:flex-start; gap:10px; text-align:left;
  border-radius:12px; padding:12px 12px; cursor:pointer;
  transition: transform .06s ease, box-shadow .15s ease, border-color .15s ease, background .15s ease;
}
.chapter-btn:hover{ transform: translateY(-1px); box-shadow: var(--shadow); }
.chapter-btn.is-active{
  border-color: rgba(71,72,172,.55);
  box-shadow: 0 0 0 3px rgba(71,72,172,.15) inset;
  background: #f6f7ff;
  animation: glowPulse 2.4s ease-out infinite;
}
.chapter-btn .chip{
  min-width:26px; height:26px; margin-top:2px;
  border-radius:999px; display:inline-grid; place-items:center;
  background: var(--brand); color:#fff; font-weight:800; font-size:12px;
}
.chapter-btn .chapter-title{
  flex: 1 1 auto;
  font-weight:600; font-size:14px; color:#111827;
  white-space: normal; overflow: visible; word-break: break-word; line-height: 1.35;
}

/* Main reading area */
.reader-main{
  min-height:100vh;
  overflow-y:auto;
  padding:22px;
  padding-top: 16px;
  background:#fff;
  position: relative;
}
.page-animate{ animation: fadeUp .25s ease both; }
.placeholder{
  color:#6b7280; font-size:14px; padding:20px; border:1px dashed var(--line);
  border-radius:12px; background:#fafafa; text-align:center;
}

/* Floating 'Next Chapter' button (only rendered when at end) */
.next-chapter-btn{
  position: fixed;
  right: 24px;
  bottom: 24px;
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 800;
  background: var(--brand);
  color: #fff;
  box-shadow: 0 10px 26px rgba(71,72,172,.28);
  cursor: pointer;
  transition: transform .08s ease, filter .15s ease, box-shadow .15s ease;
  animation: floatIn .25s ease both;
  z-index: 15;
}
.next-chapter-btn:hover{
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 12px 32px rgba(71,72,172,.34);
}
.next-chapter-btn:active{ transform: translateY(0); }

/* Loading & Error */
.reader-loading, .reader-error{
  min-height: 60vh; display:grid; place-items:center; background:#fff;
}
.loading-card, .error-card{
  background:#fff; border:1px solid var(--line); border-radius:16px; box-shadow: var(--shadow);
  padding:24px; min-width:260px; text-align:center; color:#111827;
}
.loading-sub{ margin-top:8px; color:#6b7280; font-size:14px; }
.error-card{ color:#991b1b; background: #fff5f5; border-color:#fecaca; }

/* ===== Mobile / small screens ===== */
@media (max-width: 900px){
  :root{ --sidebar-w: 260px; --nav-h: 64px; }

  /* shell loses left padding; main is full-width under the fixed navbar */
  .reader-shell{ padding-left: 0; padding-top: var(--nav-h); }

  /* hide desktop sidebar on mobile */
  .reader-sidebar{ display: none; }

  /* sticky topbar inside the reading area for title + drawer button */
  .mobile-topbar{
    position: sticky;
    top: var(--nav-h);
    z-index: 12;
    margin: 0;
  }
  .mobile-topbar-inner{
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    background:#ffffff; border-bottom:1px solid var(--line);
    padding: 10px 14px;
  }
  .mobile-book{
    min-width: 0;
  }
  .mobile-book-title{
    font-weight: 700; font-size: 14px; color:#0b1324;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70vw;
  }
  .mobile-book-slug{ color:#6b7280; font-size: 12px; }

  .mobile-open-btn{
    border:1px solid var(--line);
    background:#fff; font-weight:600; font-size:12px; border-radius:10px;
    padding:8px 10px; cursor:pointer;
  }

  /* overlay mask under the drawer */
  .mobile-mask{
    position: fixed; inset: 0; top: var(--nav-h);
    background: rgba(0,0,0,.35); backdrop-filter: blur(1px);
    z-index: 40;
  }

  /* slide-in drawer that reuses the sidebar styles */
  .mobile-drawer{
    position: fixed;
    top: var(--nav-h);
    left: 0;
    width: var(--sidebar-w);
    height: calc(100vh - var(--nav-h));
    background: linear-gradient(180deg, #fafaff 0%, #ffffff 60%);
    border-right: 1px solid var(--line);
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform .2s ease-out;
    z-index: 50;
    padding: 12px;
  }
  .mobile-drawer.open{ transform: translateX(0); }

  .mobile-drawer-head{
    display:flex; align-items:center; justify-content:space-between;
    background:#fff; border:1px solid var(--line); border-radius:12px;
    padding:8px 10px; margin-bottom:10px; box-shadow: var(--shadow);
  }
  .mobile-drawer-title{ font-weight:700; font-size:13px; color:#0b1324; }
  .mobile-close-btn{
    border:none; background:transparent; font-size:16px; line-height:1;
    color:#374151; cursor:pointer;
  }

  /* main spacing on mobile */
  .reader-main{ padding:16px; }
  .next-chapter-btn{ right: 16px; bottom: 16px; }
}

/* Hide mobile topbar/drawer scaffolding on desktop to preserve original view */
@media (min-width: 901px){
  .mobile-topbar, .mobile-mask, .mobile-drawer{ display: none; }
}
`;
