// src/MockTest/page/LMS/LMS_Pages/LessonRenderer/index.jsx
import React, { useEffect, useState, useMemo } from "react";
import { putLessonProgress } from "../../../../../utils/ProgressApi";

import VideoLesson   from "./VideoLesson";
import AudioLesson   from "./AudioLesson";
import QuizLesson    from "./QuizLesson";
import LiveLesson    from "./LiveLesson";
import ArticleLesson    from "./ArticleLesson";
// ✅ IMPORTANT: Article component from types/
// import QLesson from "./QLesson";

import QuizStudent from "./QuizStudent";
/* ---------- S3/CloudFront PDF  inline compel  helper ---------- */
// ✅ ExternalLinkLesson: handles YouTube or other external resource embeds
// ✅ ExternalLinkLesson: handles YouTube or other external resource embeds
function ExternalLinkLesson({ lesson }) {
  const url = lesson?.fileUrl || lesson?.url || "";

  if (!url) {
    return (
      <div className="alert alert-warning">
        No external link found for this lesson.
      </div>
    );
  }

  // ✅ Detect YouTube and auto-fix embed format
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  const embedUrl = match
    ? `https://www.youtube.com/embed/${match[1]}`
    : url;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "1rem",
      }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%", // keeps 16:9 aspect ratio
          height: 0,
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          backgroundColor: "#000", // keeps frame background clean
        }}
      >
        <iframe
          src={embedUrl}
          title={lesson?.title || "External Resource"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "12px",
          }}
        ></iframe>
      </div>
    </div>
  );
}


function forceInlineForS3Pdf(u = "") {
  try {
    const url = new URL(u);
    const isSigned =
      /X-Amz-Algorithm/i.test(url.search) || /X-Amz-Credential/i.test(url.search);
    if (isSigned) {
      if (!/response-content-disposition=/i.test(url.search)) {
        url.searchParams.append("response-content-disposition", "inline");
      }
      if (!/response-content-type=/i.test(url.search)) {
        url.searchParams.append("response-content-type", "application/pdf");
      }
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

/* ============ PdfLesson (Slides/PPT/PDF safely) ============ */
// function PdfLesson({ lesson }) {
//   const pick = (v) => (typeof v === "string" ? v : v?.url || "");
//   const startRaw = pick(lesson?.fileUrl) || pick(lesson?.url) || pick(lesson?.videoUrl);
//   const [href, setHref] = useState(startRaw);

//   useEffect(() => {
//     let alive = true;
//     const raw = pick(lesson?.fileUrl) || pick(lesson?.url) || pick(lesson?.videoUrl);
//     setHref(raw);

//     // sign endpoint हो तो real URL उठा लें
//     if (typeof raw === "string" && raw.includes("/api/media/sign?")) {
//       fetch(raw)
//         .then((r) => r.json())
//         .then((d) => { if (alive && d?.url) setHref(d.url); })
//         .catch(() => {});
//     }
//     return () => { alive = false; };
//   }, [lesson]);

//   const isGoogleUrl = useMemo(
//     () => /(^|\/\/)docs\.google\.com|drive\.google\.com/i.test(href || ""),
//     [href]
//   );
//   const isPdf = useMemo(() => /\.pdf(?:$|\?)/i.test(href || ""), [href]);
//   const isOffice = useMemo(
//     () => /\.(pptx?|potx?|ppsx?)((\?|#).*)?$/i.test((href || "").split("?")[0]),
//     [href]
//   );

//   if (!href) return <div className="alert alert-warning">File URL missing.</div>;

//   // Google Docs/Drive/Slides embed नहीं होंगे → new tab
//   if (isGoogleUrl) {
//     return (
//       <div className="p-3">
//         <div className="alert alert-info mb-2">
//           This file is hosted on Google Drive/Docs and can’t be embedded here.
//         </div>
//         <a className="btn btn-primary" href={href} target="_blank" rel="noreferrer">
//           Open in new tab
//         </a>
//       </div>
//     );
//   }

//   // PPT/PPTX → Microsoft Office viewer
//   if (isOffice) {
//     const officeViewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(href)}`;
//     return (
//       <iframe
//         title={lesson?.title || "Slides"}
//         src={officeViewer}
//         style={{ width: "100%", height: "80vh", border: 0 }}
//         allow="fullscreen"
//       />
//     );
//   }

//   // PDF → inline iframe (S3 inline forced)
//   if (isPdf) {
//     const inlineHref = forceInlineForS3Pdf(href);
//     return (
//       <iframe
//         title={lesson?.title || "PDF"}
//         src={`${inlineHref}#view=FitH`}
//         style={{ width: "100%", height: "80vh", border: 0 }}
//         allow="fullscreen"
//       />
//     );
//   }

//   // Unknown doc → open as link
//   return (
//     <div className="p-3">
//       <div className="alert alert-secondary mb-2">Unsupported document type for inline view.</div>
//       <a className="btn btn-outline-primary" href={href} target="_blank" rel="noreferrer">
//         Open file
//       </a>
//     </div>
//   );
// }

/* ============ PdfLesson (Slides/PPT/PDF safely) ============ */
function PdfLesson({ lesson, course }) {
  const pick = (v) => (typeof v === "string" ? v : v?.url || "");
  const startRaw = pick(lesson?.fileUrl) || pick(lesson?.url) || pick(lesson?.videoUrl);
  const [href, setHref] = useState(startRaw);

  // ✅ Extract needed info
  const lessonId = lesson?.id || lesson?._id || lesson?.lessonId;
  const courseSlug = course?.slug || course?.courseSlug;

  useEffect(() => {
    let alive = true;
    const raw = pick(lesson?.fileUrl) || pick(lesson?.url) || pick(lesson?.videoUrl);
    setHref(raw);

    // Resolve signed URL if applicable
    if (typeof raw === "string" && raw.includes("/api/media/sign?")) {
      fetch(raw)
        .then((r) => r.json())
        .then((d) => { if (alive && d?.url) setHref(d.url); })
        .catch(() => {});
    }

    // ✅ NEW: auto mark PDF as completed after small delay
    const markProgress = async () => {
      try {
        await putLessonProgress({
          lessonId,
          courseSlug,
          percent: 100,
          completed: true,
          type: "pdf",
        });
        console.log("📄 PDF progress marked complete:", { lessonId, courseSlug });
      } catch (err) {
        console.error("❌ Failed to update PDF progress:", err);
      }
    };

    // Wait 3 seconds after load to avoid false triggers
    const timer = setTimeout(markProgress, 3000);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [lessonId, courseSlug, lesson]);

  const isGoogleUrl = useMemo(
    () => /(^|\/\/)docs\.google\.com|drive\.google\.com/i.test(href || ""),
    [href]
  );
  const isPdf = useMemo(() => /\.pdf(?:$|\?)/i.test(href || ""), [href]);
  const isOffice = useMemo(
    () => /\.(pptx?|potx?|ppsx?)((\?|#).*)?$/i.test((href || "").split("?")[0]),
    [href]
  );

  if (!href) return <div className="alert alert-warning">File URL missing.</div>;

  if (isGoogleUrl) {
    return (
      <div className="p-3">
        <div className="alert alert-info mb-2">
          This file is hosted on Google Drive/Docs and can’t be embedded here.
        </div>
        <a className="btn btn-primary" href={href} target="_blank" rel="noreferrer">
          Open in new tab
        </a>
      </div>
    );
  }

  if (isOffice) {
    const officeViewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(href)}`;
    return (
      <iframe
        title={lesson?.title || "Slides"}
        src={officeViewer}
        style={{ width: "100%", height: "80vh", border: 0 }}
        allow="fullscreen"
      />
    );
  }

  if (isPdf) {
    const inlineHref = forceInlineForS3Pdf(href);
    return (
      <iframe
        title={lesson?.title || "PDF"}
        src={`${inlineHref}#view=FitH`}
        style={{ width: "100%", height: "80vh", border: 0 }}
        allow="fullscreen"
        onLoad={() => console.log("✅ PDF loaded:", inlineHref)}
      />
    );
  }

  return (
    <div className="p-3">
      <div className="alert alert-secondary mb-2">
        Unsupported document type for inline view.
      </div>
      <a className="btn btn-outline-primary" href={href} target="_blank" rel="noreferrer">
        Open file
      </a>
    </div>
  );
}


/* ---------------- smart mapping ---------------- */
const norm = (t) => String(t || "").trim().toLowerCase();

/** Smart resolver:
 *  - 'article' शब्द आता है → ArticleLesson
 *  - pdf/slide/ppt/doc/file/scorm → PdfLesson
 *  - quiz/mock/test aliases → QuizLesson
 *  - url से .pdf मिले तो भी PdfLesson
 */
function pickRendererKey(lesson) {
  const t = norm(lesson?.type);
  const url = String(lesson?.fileUrl || lesson?.url || "");

  if (/article/.test(t)) return "article";
  if (/(pdf|slide|slides|pptx?|docx?|doc|file|scorm\/tincan|scorm|tincan)/.test(t)) return "pdf";
  if (/\.pdf(?:$|\?)/i.test(url)) return "pdf";

  if (/(quiz|mock[- _]?test|section[- _]?quiz|test)/.test(t)) return "quiz";
  if (/audio/.test(t)) return "audio";
  if (/video/.test(t)) return "video";
  if (/live/.test(t))  return "live";

  return t; // fallback
}

const RENDERERS = {
  video:   VideoLesson,
  audio:   AudioLesson,
  article: ArticleLesson,
  live:    LiveLesson,
  external: ExternalLinkLesson,
  "external link": ExternalLinkLesson,

  // docs
  pdf:     PdfLesson,
  slides:  PdfLesson,
  ppt:     PdfLesson,
  pptx:    PdfLesson,
  doc:     PdfLesson,
  file:    PdfLesson,
  "scorm/tincan": PdfLesson,

  // quiz / mock
 
  quiz: QuizStudent,
  test: QuizStudent,
  mocktest: QuizStudent,
  "mock-test": QuizStudent,
  "mock test": QuizStudent,
};

const Fallback = ({ lesson }) => (
  <div className="alert alert-secondary">
    <div className="text-muted small">Type: {lesson?.type || "unknown"}</div>
    <p className="mb-0">No renderer registered yet for this type.</p>
  </div>
);

export default function LessonRenderer({ lesson, course, ...rest }) {
  console.log("📌 STUDENT RECEIVED LESSON:", lesson);

  const key = pickRendererKey(lesson);
  console.log("🎯 FINAL RENDERER KEY:", key);

  const Comp = RENDERERS[key] || Fallback;
  return <Comp lesson={lesson} course={course} {...rest} />;
}
