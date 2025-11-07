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




import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as ebooksApiModule from "../../../../WebAdmin/AdminModule/EBooks/api/ebooksApi";
const api = ebooksApiModule.default || ebooksApiModule;

export default function StudentBookshelf() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const instituteId = "0z2w1ep"; // TODO: take from logged-in user/org

  // Modal state (unchanged logic)
  const [showIntro, setShowIntro] = useState(false);
  const [pendingEbookId, setPendingEbookId] = useState(null);
  const navigate = useNavigate();

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

  const openIntro = (e, ebookid) => {
    if (e && e.preventDefault) e.preventDefault();
    setPendingEbookId(ebookid);
    setShowIntro(true);
  };

  const startReading = () => {
    if (!pendingEbookId) return;
    const url = `/ebooks/read/${pendingEbookId}`;
    setShowIntro(false);
    navigate(url);
  };

  if (loading) {
    return (
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Custom shimmer is injected via CSS below by overriding animate-pulse within this view */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white overflow-hidden">
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

  if (!items.length) {
    return <div className="p-6 text-gray-600">No published e-books yet.</div>;
  }

  return (
    <div className="p-6">
      {/* ✨ Global-ish enhancements scoped by selectors used in this component */}
      <style>{`
        /* ===== Grid entrance: fade-up with stagger ===== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .p-6 .grid > div {
          animation: fadeUp .28s ease both;
        }
        .p-6 .grid > div:nth-child(1){ animation-delay: 40ms }
        .p-6 .grid > div:nth-child(2){ animation-delay: 80ms }
        .p-6 .grid > div:nth-child(3){ animation-delay: 120ms }
        .p-6 .grid > div:nth-child(4){ animation-delay: 160ms }
        .p-6 .grid > div:nth-child(5){ animation-delay: 200ms }
        .p-6 .grid > div:nth-child(6){ animation-delay: 240ms }

        /* ===== Card hover: lift, glow border, soft tilt ===== */
        @keyframes glowPulse {
          0% { box-shadow: 0 8px 26px rgba(2, 6, 23, .06); }
          50% { box-shadow: 0 12px 34px rgba(2, 6, 23, .10); }
          100% { box-shadow: 0 8px 26px rgba(2, 6, 23, .06); }
        }
        .group {
          position: relative;
          transform: translateZ(0); /* create new layer for smoothness */
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
          will-change: transform, box-shadow;
          overflow: hidden;
          background: linear-gradient(180deg, #ffffff, #fcfdff);
        }
        .group:hover {
          transform: translateY(-4px) rotateX(.6deg) rotateY(.6deg);
          animation: glowPulse 2.2s ease-in-out infinite;
          border-color: rgba(71,72,172,.25);
          box-shadow: 0 16px 36px rgba(2,6,23,.12);
        }
        /* gradient halo on hover using ::before */
        .group::before {
          content: "";
          position: absolute; inset: -2px;
          border-radius: 18px;
          background: radial-gradient(120% 60% at 20% 10%, rgba(71,72,172,.18), transparent 60%),
                      radial-gradient(120% 60% at 80% 0%, rgba(99,102,241,.16), transparent 60%);
          opacity: 0; pointer-events: none;
          transition: opacity .22s ease;
        }
        .group:hover::before { opacity: 1; }

        /* ===== Cover image subtle parallax on hover ===== */
        .group .h-44 {
          transition: transform .3s cubic-bezier(.2,.7,.2,1), filter .3s ease;
          will-change: transform, filter;
        }
        .group:hover .h-44 {
          transform: scale(1.03) translateY(-2px);
          filter: saturate(1.05) contrast(1.02);
        }

        /* ===== Title hover underline slide ===== */
        .group h3 {
          position: relative;
        }
        .group h3::after {
          content:"";
          position:absolute; left:0; bottom:-2px;
          height:2px; width:0%;
          background: linear-gradient(90deg, #6366f1, #60a5fa);
          transition: width .22s ease;
          border-radius: 999px;
        }
        .group:hover h3::after { width: 28%; }

        /* ===== Tag chip micro-animations ===== */
        .group .px-2 {
          transition: transform .16s ease, background-color .18s ease;
        }
        .group .px-2:hover {
          transform: translateY(-2px);
          background-color: #eef2ff;
        }

        /* ===== Primary button: ripple + gradient shine ===== */
        @keyframes shine {
          from { transform: translateX(-120%) skewX(-12deg); }
          to   { transform: translateX(220%) skewX(-12deg); }
        }
        .group .bg-indigo-600 {
          position: relative;
          overflow: hidden;
          background-image: linear-gradient(180deg, #4f46e5, #4338ca);
          box-shadow: 0 10px 24px rgba(79,70,229,.28);
          transition: transform .16s ease, filter .16s ease, box-shadow .2s ease;
        }
        .group .bg-indigo-600::before{
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
          transform: translateX(-120%) skewX(-12deg);
        }
        .group .bg-indigo-600:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow: 0 14px 30px rgba(79,70,229,.34);
        }
        .group .bg-indigo-600:hover::before{
          animation: shine 1.2s ease both;
        }

        /* ===== Skeleton shimmer (overrides animate-pulse locally) ===== */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .p-6 .animate-pulse .bg-gray-200 {
          background: linear-gradient(90deg, #eceff3 0%, #f7f8fb 20%, #eceff3 40%);
          background-size: 200% 100%;
          animation: shimmer 1.6s linear infinite;
        }

        /* ===== Section title subtle entrance ===== */
        .p-6 h2 {
          animation: fadeUp .28s ease both;
        }
      `}</style>

      {/* Modal styles */}
      <style>{`
        .intro-backdrop{
          position: fixed; inset: 0; 
          background: rgba(2,6,23,.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display:flex; align-items:center; justify-content:center; z-index: 1000;
          animation: backdropIn .2s ease both;
        }
        @keyframes backdropIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }

        .intro-modal{
          width: min(720px, 92vw);
          max-height: 86vh;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 30px 80px rgba(0,0,0,.35);
          overflow: hidden;
          display:flex; flex-direction: column;
          animation: introIn .22s cubic-bezier(.2,.7,.2,1) both;
          transform-origin: 50% 40%;
        }
        /* Refined intro pop with slight scale & bounce */
        @keyframes introIn{
          0%   { opacity:0; transform: translateY(10px) scale(.96) }
          60%  { opacity:1; transform: translateY(0)    scale(1.01) }
          100% { opacity:1; transform: translateY(0)    scale(1) }
        }

        .intro-head{
          padding: 14px 16px;
          background: linear-gradient(180deg,#f8fafc,#f3f6fb);
          border-bottom: 1px solid #e5e7eb;
          display:flex; align-items:center; justify-content:space-between;
        }
        .intro-title{
          font-weight: 800; color:#0f172a; letter-spacing:.2px; font-size: 16px;
        }
        .intro-close{
          border:1px solid #e5e7eb; background:#fff; color:#111827;
          border-radius:10px; padding:8px 12px; font-weight:700; cursor:pointer;
          transition: transform .12s ease, box-shadow .2s ease, filter .15s ease;
        }
        .intro-close:hover{
          transform: translateY(-1px);
          filter: brightness(1.03);
          box-shadow: 0 10px 20px rgba(2,6,23,.12);
        }
        .intro-body{
          padding: 16px; overflow: auto;
          animation: contentRise .22s ease both;
        }
        @keyframes contentRise {
          from { opacity: .6; transform: translateY(6px) }
          to   { opacity: 1;  transform: translateY(0)   }
        }

        .intro-list{
          margin: 8px 0 0;
          padding-left: 1.2rem;
          color:#374151; line-height: 1.65;
        }
        .intro-list li{ 
          margin: 8px 0; 
          position: relative;
        }
        .intro-list li::marker { color: #4f46e5; }

        /* ▼ Center the footer button */
        .intro-foot{
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          background: #fff;
          display:flex; align-items:center; justify-content:center;
        }
        .intro-start{
          border: none; 
          background: linear-gradient(180deg,#4f46e5,#4338ca);
          color: #fff;
          padding: 10px 18px; border-radius: 12px; font-weight: 800; cursor:pointer;
          box-shadow: 0 12px 24px rgba(71,72,172,.28);
          transition: transform .14s ease, box-shadow .2s ease, filter .14s ease;
          position: relative; overflow: hidden;
        }
        .intro-start::after{
          content:"";
          position:absolute; inset:-2px;
          background:
            radial-gradient(60% 120% at 30% 0%, rgba(255,255,255,.25), transparent 60%),
            linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
          transform: translateX(-120%) skewX(-12deg);
          transition: transform .9s ease;
        }
        .intro-start:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(71,72,172,.34);
          filter: brightness(1.03);
        }
        .intro-start:hover::after {
          transform: translateX(220%) skewX(-12deg);
        }
        .intro-tip{
          font-size: 12px; color:#6b7280;
        }
      `}</style>

      {/* Intro Modal */}
      {showIntro && (
        <div className="intro-backdrop" role="dialog" aria-modal="true" aria-label="Features and Tools">
          <div className="intro-modal">
            <div className="intro-head">
              <div className="intro-title">Features & Tools</div>
              <button className="intro-close" onClick={() => setShowIntro(false)}>Close</button>
            </div>
            <div className="intro-body">
              <p className="text-sm text-gray-600">
                Quick tips to get the most out of your reading experience:
              </p>
              <ol className="intro-list">
                <li>
                  <strong>1. Summarize the chapter</strong> by clicking the top-right button
                  <span className="ml-1 font-semibold">“Summarize chapter”</span>.
                </li>
                <li>
                  <strong>2. Make notes in NOTES PAD</strong>. Press <code>Ctrl+I</code> to open and <code>Ctrl+M</code> to close.
                </li>
                <li>
                  <strong>3. Download your notes as a Word file</strong> or <strong>save to the cloud</strong> anytime.
                </li>
                <li>
                  <strong>4. Select text and search on Google</strong> using the action chip that appears.
                </li>
                <li>
                  <strong>5. Select a paragraph to convert it into bullet points</strong> with the
                  <span className="ml-1 font-semibold">“Summarize”</span> option.
                </li>
              </ol>

              <div className="mt-4 intro-tip">
                You can switch your Notes layout between split-screen and floating window from the Notes toolbar.
              </div>
            </div>
            <div className="intro-foot">
              <button className="intro-start" onClick={startReading}>
                Start Reading 
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Published E-Books</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((e) => (
          <div
            key={e.ebookid}
            className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
          >
            {/* Cover — open intro first */}
            <Link
              to={`/ebooks/read/${e.ebookid}`}
              className="block"
              onClick={(evt) => openIntro(evt, e.ebookid)}
            >
              {e.coverImage ? (
                <img
                  src={e.coverImage}
                  alt={e.title || "E-Book cover"}
                  className="h-44 w-full object-cover cursor-pointer"
                  loading="lazy"
                />
              ) : (
                <div className="h-44 w-full bg-indigo-50 grid place-items-center cursor-pointer">
                  <div className="text-indigo-700 font-semibold">E-Book</div>
                </div>
              )}
            </Link>

            {/* Body */}
            <div className="p-4 flex flex-col gap-2 grow">
              <h5 className="font-semibold line-clamp-2">{e.title}</h5>
              {e.slug ? (
                <p className="text-xs text-gray-500 line-clamp-1">/{e.slug}</p>
              ) : null}

              {/* (Optional) tags/chapters */}
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
                {Array.isArray(e.tags) && e.tags.length
                  ? e.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-gray-100 rounded-full"
                      >
                        {t}
                      </span>
                    ))
                  : null}
                {e.chaptersCount ? (
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                    {e.chaptersCount} chapters
                  </span>
                ) : null}
              </div>

              {/* Actions */}
              <div className="mt-3">
                <Link
                  to={`/ebooks/read/${e.ebookid}`}
                  onClick={(evt) => openIntro(evt, e.ebookid)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Read
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
