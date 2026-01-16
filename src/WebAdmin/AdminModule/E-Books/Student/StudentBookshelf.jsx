// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import * as ebooksApiModule from "../api/ebooksApi";
// const api = ebooksApiModule.default || ebooksApiModule;

// export default function StudentBookshelf() {
//   const [items, setItems] = useState([]);
//   const [err, setErr] = useState("");
//   const [loading, setLoading] = useState(true);
//   const instituteId = "0z2w1ep"; // TODO: take from logged-in user/org

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const res = await api.listEBooks(instituteId); // GET /ebooks?instituteId=...
//         // keep only PUBLISHED
//         const published = (res.data?.items || []).filter(
//           (e) => (e.status || "").toUpperCase() === "PUBLISHED"
//         );
//         setItems(published);
//       } catch (e) {
//         setErr(e?.response?.data?.error || e.message || "Failed to load");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [instituteId]);

//   if (loading) {
//     return (
//       <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//         {[...Array(6)].map((_, i) => (
//           <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white overflow-hidden">
//             <div className="h-40 bg-gray-200" />
//             <div className="p-4 space-y-2">
//               <div className="h-5 w-3/4 bg-gray-200 rounded" />
//               <div className="h-4 w-1/2 bg-gray-200 rounded" />
//               <div className="h-9 w-24 bg-gray-200 rounded mt-3" />
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (err) return <div className="p-6 text-red-600">{err}</div>;

//   if (!items.length) {
//     return <div className="p-6 text-gray-600">No published e-books yet.</div>;
//   }

//   return (
//     <div className="p-6">
//       <div className="mb-4 flex items-center justify-between">
//         <h2 className="text-xl font-bold">Published E-Books</h2>
//       </div>

//       <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
//         {items.map((e) => (
//           <div
//             key={e.ebookid}
//             className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
//           >
//             {/* Cover — now clickable */}
//             <Link to={`/ebooks/read/${e.ebookid}`} className="block">
//               {e.coverImage ? (
//                 <img
//                   src={e.coverImage}
//                   alt={e.title || "E-Book cover"}
//                   className="h-44 w-full object-cover cursor-pointer"
//                   loading="lazy"
//                 />
//               ) : (
//                 <div className="h-44 w-full bg-indigo-50 grid place-items-center cursor-pointer">
//                   <div className="text-indigo-700 font-semibold">E-Book</div>
//                 </div>
//               )}
//             </Link>

//             {/* Body */}
//             <div className="p-4 flex flex-col gap-2 grow">
//               <h3 className="font-semibold line-clamp-2">{e.title}</h3>
//               {e.slug ? (
//                 <p className="text-xs text-gray-500 line-clamp-1">/{e.slug}</p>
//               ) : null}

//               {/* (Optional) tags/chapters if present */}
//               <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
//                 {Array.isArray(e.tags) && e.tags.length
//                   ? e.tags.slice(0, 3).map((t) => (
//                       <span
//                         key={t}
//                         className="px-2 py-0.5 bg-gray-100 rounded-full"
//                       >
//                         {t}
//                       </span>
//                     ))
//                   : null}
//                 {e.chaptersCount ? (
//                   <span className="px-2 py-0.5 bg-gray-100 rounded-full">
//                     {e.chaptersCount} chapters
//                   </span>
//                 ) : null}
//               </div>

//               {/* Actions */}
//               <div className="mt-3">
//                 <Link
//                   to={`/ebooks/read/${e.ebookid}`}
//                   className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                 >
//                   Read
//                 </Link>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }




import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import EnrollButton from "../../../../Shared/EnrollButton";
import * as ebooksApiModule from "../../../../WebAdmin/AdminModule/EBooks/api/ebooksApi";
import API from "../../../../LoginSystem/axios";

/* ✅ CRITICAL: these CSS imports make intro-backdrop fixed overlay (2nd screenshot look) */
import "../EBookIntro.css";
import "../../EBookIntro.css";
import "../../../../WebAdmin/AdminModule/E-Books/Student/EBookIntro.css";

const api = ebooksApiModule.default || ebooksApiModule;

export default function StudentBookshelf() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ SAME PATTERN AS COURSE / MOCK / QBANK (unchanged)
  const [enrolledMap, setEnrolledMap] = useState({});

  const instituteId = "0z2w1ep"; // unchanged
  const navigate = useNavigate();
  const location = useLocation();

  // Modal state (unchanged)
  const [showIntro, setShowIntro] = useState(false);
  const [pendingEbookId, setPendingEbookId] = useState(null);

  /* ---------------- LOAD EBOOKS (UNCHANGED) ---------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.listEBooks(instituteId);
        const published = (res.data?.items || []).filter(
          (e) => (e.status || "").toUpperCase() === "PUBLISHED"
        );
        setItems(published);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [instituteId]);

  /* ---------------- LOAD ENROLLMENTS (UNCHANGED) ---------------- */
  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await API.get("/api/student/enrollments");
      const list = res.data?.enrollments || [];

      const map = {};
      list.forEach((e) => {
        if (e.productType === "EBOOK") {
          map[e.productId] = true;
        }
      });

      setEnrolledMap(map);
    } catch (error) {
      console.error("❌ Failed to fetch ebook enrollments", error);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  /* =========================================================
     ✅ AUTO OPEN INTRO WHEN COMING FROM MY ENROLLMENTS
     (NO LOGIC CHANGE — just correctly applied)
  ========================================================= */
  useEffect(() => {
    const openId = location.state?.openEbookId;
    if (!openId) return;

    setPendingEbookId(openId);
    setShowIntro(true);

    // 🔒 prevent repeat open on refresh/back
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  /* ---------------- INTRO / READING FLOW (UNCHANGED) ---------------- */
  const openIntro = (e, ebookid) => {
    if (e?.preventDefault) e.preventDefault();
    setPendingEbookId(ebookid);
    setShowIntro(true);
  };

  const startReading = () => {
    if (!pendingEbookId) return;
    setShowIntro(false);
    navigate(`/ebooks/read/${pendingEbookId}`);
  };

  /* ---------------- STATES (UNCHANGED) ---------------- */
  if (loading) {
    return (
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200 bg-white overflow-hidden"
          >
            <div className="h-40 bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="h-9 w-24 bg-gray-200 rounded mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!items.length)
    return <div className="p-6 text-gray-600">No published e-books yet.</div>;

  /* ---------------- UI (UNCHANGED) ---------------- */
  return (
    <div className="p-6">
      {/* ✅ Intro Modal (CSS makes it overlay like your 2nd screenshot) */}
      {showIntro && (
        <div className="intro-backdrop">
          <div className="intro-modal">
            <div className="intro-head">
              <div className="intro-title">Features & Tools</div>
              <button
                className="intro-close"
                onClick={() => setShowIntro(false)}
              >
                Close
              </button>
            </div>

            <div className="intro-body">
              <p className="text-sm text-gray-600">
                Quick tips to get the most out of your reading experience:
              </p>
              <ol className="intro-list">
                <li>Summarize chapters easily</li>
                <li>Notes pad with shortcuts</li>
                <li>Download / save notes</li>
                <li>Google search selected text</li>
                <li>Convert paragraphs to bullet points</li>
              </ol>
            </div>

            <div className="intro-foot">
              <button className="intro-start" onClick={startReading}>
                Start Reading
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Published E-Books</h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((e) => {
          const isPaid = e.isPaid === true;
          const isEnrolled = enrolledMap[e.ebookid] === true;

          return (
            <div
              key={e.ebookid}
              className="group rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              {/* Cover – clickable only if enrolled */}
              <div
                onClick={
                  isEnrolled ? (evt) => openIntro(evt, e.ebookid) : undefined
                }
                className={isEnrolled ? "cursor-pointer" : "cursor-not-allowed"}
              >
                {e.coverImage ? (
                  <img
                    src={e.coverImage}
                    alt={e.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="h-44 w-full bg-indigo-50 grid place-items-center">
                    <div className="text-indigo-700 font-semibold">E-Book</div>
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col gap-2 grow">
                <h5 className="font-semibold line-clamp-2">{e.title}</h5>

                {/* ✅ SAME ENROLL BUTTON AS OTHER PRODUCTS */}
                <div className="mt-3">
                  <EnrollButton
                    productId={e.ebookid}
                    productType="EBOOK"
                    title={e.title}
                    thumbnailUrl={e.coverImage}
                    isPaid={isPaid}
                    pricePaise={(e.price || 0) * 100}
                    isEnrolled={isEnrolled}
                    onEnrolled={fetchEnrollments}
                    onOpen={(evt) => openIntro(evt, e.ebookid)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
