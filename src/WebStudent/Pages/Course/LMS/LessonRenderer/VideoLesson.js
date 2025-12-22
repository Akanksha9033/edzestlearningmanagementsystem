// LMS/LessonRenderer/VideoLesson.js
import React, { useEffect, useMemo, useState } from "react";
import CustomVideoPlayer from "../Players/CustomVideoPlayer";
import "../Players/player.css";

// dev/prod के हिसाब से progress toggles
const PROGRESS_ON =
  String(process.env.REACT_APP_PROGRESS_ENABLED || "").toLowerCase() === "true";

/* ---------------- helpers ---------------- */
function pick(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") {
    if (typeof v.secure_url === "string" && v.secure_url.trim()) return v.secure_url.trim();
    if (typeof v.url === "string" && v.url.trim()) return v.url.trim();
  }
  return "";
}

function normalizeDriveUrl(u = "") {
  if (!u) return u;
  try {
    const url = new URL(u);
    if (/drive\.google\.com$/i.test(url.hostname)) {
      const m = url.pathname.match(/\/file\/d\/([^/]+)/i);
      const id = m?.[1] || url.searchParams.get("id");
      if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  } catch {}
  return u;
}

function forceInlineForS3Video(u = "") {
  try {
    const url = new URL(u);
    const isSigned =
      /X-Amz-Algorithm/i.test(url.search) || /X-Amz-Credential/i.test(url.search);
    if (isSigned) {
      if (!/response-content-disposition=/i.test(url.search)) {
        url.searchParams.append("response-content-disposition", "inline");
      }
      if (!/response-content-type=/i.test(url.search)) {
        url.searchParams.append("response-content-type", "video/mp4");
      }
      return url.toString();
    }
  } catch {}
  return u;
}

/* ---------------- HLS SUPPORT ADDED HERE ---------------- */
const S3 = "https://edzest-bucket.s3.ap-south-1.amazonaws.com/";

function resolveVideoUrlCandidates(lesson, extra) {
  const arr = [];

  // ⭐⭐⭐ Highest priority — HLS (m3u8)
  if (lesson?.hlsKey) arr.push(S3 + lesson.hlsKey);

  // ⭐ Second priority — raw MP4 S3 key
  if (lesson?.videoKey) arr.push(S3 + lesson.videoKey);

  // existing fallbacks (do not remove, keep exact order)
  arr.push(
    pick(extra?.src),
    pick(extra?.videoUrl),
    pick(extra?.fileUrl),

    pick(lesson?.videoUrl),
    pick(lesson?.fileUrl),
    pick(lesson?.url),
    pick(lesson?.source),

    pick(lesson?.video?.url),
    pick(lesson?.file?.url),
    pick(lesson?.cloudinary?.secure_url),
    pick(lesson?.cloudinary?.url),
    pick(lesson?.meta?.videoUrl),
    pick(lesson?.meta?.fileUrl),
    pick(lesson?.meta?.url),
  );

  return arr.filter(Boolean);
}

/* ---------------- component ---------------- */
export default function VideoLesson({
  lesson,
  course,
  onVideoEnded,
  fullscreenTargetRef,
  ...rest
}) {
  const candidates = useMemo(
    () => resolveVideoUrlCandidates(lesson, rest),
    [lesson, rest]
  );

  const [src, setSrc] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    setErr(false);

    const first = candidates[0] || "";
    if (!first) {
      setSrc("");
      return () => { alive = false; };
    }

    if (first.includes("/api/media/sign?")) {
      fetch(first)
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          const real = d?.url || "";
          const fixed = forceInlineForS3Video(normalizeDriveUrl(real));
          setSrc(fixed || real || "");
        })
        .catch(() => {
          if (!alive) return;
          setSrc("");
        });
    } else {
      const fixed = forceInlineForS3Video(normalizeDriveUrl(first));
      setSrc(fixed || first);
    }

    return () => { alive = false; };
  }, [candidates]);

  const videoKey = String(lesson?._id || src || "");

  if (!src) {
    return <div className="alert alert-warning">Video URL not available.</div>;
  }

  return (
    <div>
      {!err ? (
        <CustomVideoPlayer
          key={videoKey}
          src={src}
          autoPlay={false}
          lessonId={String(lesson?._id || "")}
          courseSlug={course?.slug || ""}
          sectionId={String(lesson?.sectionId || "")}
          // ⬇️ dev में false, prod में true (env से)
          persistDurationIfKnown={PROGRESS_ON}
          persistProgress={PROGRESS_ON}
          poster={lesson?.meta?.poster}
          onEnded={onVideoEnded}
          onError={() => setErr(true)}
          fullscreenTargetRef={fullscreenTargetRef}
        />
      ) : (
        <div className="alert alert-danger">
          Video failed to load.{" "}
          <a href={src} target="_blank" rel="noreferrer">Open in new tab</a>
        </div>
      )}
    </div>
  );
} 
