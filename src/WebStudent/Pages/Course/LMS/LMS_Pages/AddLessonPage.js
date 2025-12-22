import React, { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../../../LoginSystem/context/AuthContext";

import LessonPreview from "../LessonPreview";
import LessonTitleInput from "../LessonTitleInput";
import LessonUploadArea from "../LessonUploadArea";
import DeleteSectionButton from "../DeleteSectionButton";
import ArticleEditor from "../ArticleEditor";
import QLesson from "../../../../../WebStudent/Pages/Course/LMS/LessonRenderer/QLesson";

import { createZoomMeeting } from "../../../../../utils/zoomApi";
import API from "../../../../../LoginSystem/axios";

const _chk = (name, C) => console.log(`[AddLessonPage] ${name}:`, typeof C);

_chk("LessonPreview", LessonPreview);
_chk("LessonTitleInput", LessonTitleInput);
_chk("LessonUploadArea", LessonUploadArea);
_chk("DeleteSectionButton", DeleteSectionButton);
_chk("ArticleEditor", ArticleEditor);


const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

/* -------------------- Debug helpers (no logic change) -------------------- */
const DBG_NS = "[AddLessonPage]";
const dbgOn = true; // flip to false to silence logs quickly

function dbg(...args) { if (dbgOn) console.log(DBG_NS, ...args); }
function dbgw(...args) { if (dbgOn) console.warn(DBG_NS, ...args); }
function dbge(...args) { if (dbgOn) console.error(DBG_NS, ...args); }
function tStart(label) {
  if (!dbgOn) return label;
  const l = `${DBG_NS} ${label}`;
  try { console.time(l); } catch {}
  return l;
}
function tEnd(label) {
  if (!dbgOn) return;
  const l = `${DBG_NS} ${label}`;
  try { console.timeEnd(l); } catch {}
}

/* -------------------- Helpers for Article lessons -------------------- */
const htmlToDataUrl = (html) =>
  `data:text/html;base64,${btoa(unescape(encodeURIComponent(html)))}`;

const dataUrlToHtml = (dataUrl) => {
  const m = /^data:text\/html;base64,(.*)$/i.exec(dataUrl || "");
  if (!m) return "";
  try {
    return decodeURIComponent(escape(atob(m[1])));
  } catch {
    return "";
  }
};

const normalizeTitle = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();
const isNonEmptyId = (v) => typeof v === "string" && v.trim().length > 0;

export default function AddLessonPage() {
  const { user, ready } = useAuth();
  const { courseId, sectionId, lessonId: routeLessonId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();

  const typeParam = new URLSearchParams(search).get("type");
  const titleParam = new URLSearchParams(search).get("title");

  const [title, setTitle] = useState(titleParam || "");
  const [lessonType, setLessonType] = useState(typeParam || "");
  const [fileUrl, setFileUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [articleHtml, setArticleHtml] = useState("");

  const [videoKey, setVideoKey] = useState("");
  const [fileKey, setFileKey] = useState("");

  const [existingTitles, setExistingTitles] = useState([]);
  const [knownLessonIds, setKnownLessonIds] = useState(new Set());
  const [prefetchDone, setPrefetchDone] = useState(false); // ✅ guard to avoid premature GET
  const [saving, setSaving] = useState(false);

  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [liveDuration, setLiveDuration] = useState(60);
  const [agenda, setAgenda] = useState(`Live class: ${title}`);

  const fileInputRef = useRef(null);

  // ✅ single source of truth for lessonId (route first, then URL fallback)
  const looksLikeId = (v) => typeof v === "string" && /^[0-9a-f-]{10,}$/i.test(v.trim());
  const urlLastSegment = window.location.pathname.split("/").pop();
  const maybeId = routeLessonId || (urlLastSegment && urlLastSegment !== "new" ? urlLastSegment : "");
  const lessonId = looksLikeId(maybeId) ? maybeId : null;
  const [createUsingUrlId, setCreateUsingUrlId] = useState(false);

  dbg("mount", { ready, courseId, sectionId, routeLessonId, lessonId, typeParam, titleParam });


  // Add near the top of AddLessonPage.jsx
async function resolveSignedUrl(key) {
  try {
    const resp = await fetch(
      `${API_BASE}/api/media/sign?key=${encodeURIComponent(key)}`
    );
    const { url } = await resp.json();
    return url || "";
  } catch (e) {
    dbgw("sign url failed", e?.message);
    return "";
  }
}


  /* ---------------------------------------------------------------------------
   * 1) PRE-FETCH existing lesson titles for duplicate check + known IDs
   * ------------------------------------------------------------------------- */
  useEffect(() => {
    if (!ready) return;

    let alive = true;

    const tryFetch = async () => {
      const t = tStart("prefetch-lessons");
      dbg("prefetch start", { courseId, sectionId });

      // Primary: lessons API (Dynamo)
      try {
        const res1 = await API.get(`/api/courses/${courseId}/lessons`, { params: { sectionId } });
        const lessons = Array.isArray(res1?.data?.lessons) ? res1.data.lessons : (res1.data || []);
        if (alive) {
          const titles = lessons.map((l) => String(l?.title || "")).filter(Boolean).map(normalizeTitle);
          const ids = lessons.map((l) => String(l?._id || l?.id || "")).filter(Boolean);
          setExistingTitles(titles);
          setKnownLessonIds(new Set(ids));
          dbg("prefetch (primary) ok", { count: lessons.length, ids, titles });
        }
        if (alive) setPrefetchDone(true);
        tEnd("prefetch-lessons");
        return;
      } catch (e1) {
        dbgw("prefetch (primary) failed, trying fallback", e1?.message);
      }

      // Fallback: pull entire course then filter the section
      try {
        const res2 = await API.get(`/api/courses/${courseId}`);
        const course = res2?.data?.course || res2?.data;
        const sec = Array.isArray(course?.sections) && course.sections.find((s) => String(s?._id) === String(sectionId));
        const lessons = Array.isArray(sec?.lessons) ? sec.lessons : [];
        if (alive) {
          const titles = lessons.map((l) => String(l?.title || "")).filter(Boolean).map(normalizeTitle);
          const ids = lessons.map((l) => String(l?._id || l?.id || "")).filter(Boolean);
          setExistingTitles(titles);
          setKnownLessonIds(new Set(ids));
          dbg("prefetch (fallback) ok", { count: lessons.length, ids, titles });
        }
      } catch (e2) {
        if (alive) {
          setExistingTitles([]);
          setKnownLessonIds(new Set());
        }
        dbge("prefetch (fallback) failed", e2?.message);
      } finally {
        if (alive) setPrefetchDone(true); // ✅ ensure done even on failure
        tEnd("prefetch-lessons");
      }
    };

    if (isNonEmptyId(sectionId)) {
      tryFetch();
    } else {
      setExistingTitles([]);
      setKnownLessonIds(new Set());
      setPrefetchDone(true); // nothing to prefetch
    }

    return () => { alive = false; };
  }, [ready, courseId, sectionId]);

  /* ---------------------------------------------------------------------------
   * 2) EDIT MODE: hydrate lesson if editing
   * ------------------------------------------------------------------------- */
  useEffect(() => {
    if (!ready) return;

    // ✅ wait until we know the section’s lessons; avoids premature 404 GET
    if (!prefetchDone) {
      dbg("edit-mode waiting for prefetch…", { prefetchDone });
      return;
    }

    (async () => {
      try {
        dbg("edit-mode check", { ready, prefetchDone, lessonId, knownLessonIds: Array.from(knownLessonIds) });

        // NEW lesson → allow querystring to prefill type
        if (!lessonId || !isNonEmptyId(lessonId)) {
          dbg("no lessonId → NEW", { typeParam });
          if (typeParam) setLessonType(typeParam);
          else setLessonType("");
          return;
        }

        // If we already loaded the section’s lessons and this id is NOT among them, skip GET noise
        if (knownLessonIds.size > 0 && !knownLessonIds.has(lessonId)) {
          dbgw("id not in section list; treating as NEW (skip GET)", { lessonId });
          setCreateUsingUrlId(true);
          setLessonType(typeParam || "");
          setTitle("");
          setDuration(0);
          return;
        }

        // EDIT lesson → fetch from backend
        const tl = tStart(`fetch-lesson ${lessonId}`);
        dbg("GET /api/courses/lesson/:id start", { lessonId });
        const res = await API.get(`/api/courses/lesson/${lessonId}`);
        const lesson = res.data?.lesson || {};
        const lt = String(lesson.type || "").trim();
        dbg("GET ok", { lesson });

        setLessonType(lt);
        setTitle(lesson.title || "");
        setDuration(lesson.duration || 0);

       if (lesson.videoKey) {
  try {
    const s = await fetch(`${API_BASE}/api/media/sign?key=${encodeURIComponent(lesson.videoKey)}`);
    const { url } = await s.json();
    setFileUrl(url);
    setVideoKey(lesson.videoKey); // ✅ restore videoKey so Save works
    dbg("signed video url", { key: lesson.videoKey, url });
  } catch (e) {
    dbgw("sign video url failed", e?.message);
    setFileUrl("");
  }
} else if (lesson.fileKey) {
  try {
    const s = await fetch(`${API_BASE}/api/media/sign?key=${encodeURIComponent(lesson.fileKey)}`);
    const { url } = await s.json();
    setFileUrl(url);
    setFileKey(lesson.fileKey); // ✅ restore fileKey so Save works for PDFs/others
    dbg("signed file url", { key: lesson.fileKey, url });
  } catch (e) {
    dbgw("sign file url failed", e?.message);
    setFileUrl("");
  }
}
 else if (lesson.fileKey) {
          try {
            const s = await fetch(`${API_BASE}/api/media/sign?key=${encodeURIComponent(lesson.fileKey)}`);
            const { url } = await s.json();
            setFileUrl(url);
            dbg("signed file url", { key: lesson.fileKey, url });
          } catch (e) {
            dbgw("sign file url failed", e?.message);
            setFileUrl("");
          }
        } else if (lt.toLowerCase() === "article" && lesson.fileUrl) {
          setArticleHtml(dataUrlToHtml(lesson.fileUrl));
          setFileUrl(lesson.fileUrl);
          dbg("article loaded via fileUrl");
        } else if (lesson.fileUrl) {
          setFileUrl(lesson.fileUrl);
          dbg("generic fileUrl loaded");
        }
        tEnd(`fetch-lesson ${lessonId}`);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          dbgw("lesson not found; NEW (reuse URL id on create)", { lessonId });
          setCreateUsingUrlId(true);
          setLessonType(typeParam || "");
          setTitle("");
          setDuration(0);
          return;
        }
        dbge("GET /lesson failed", { status, data: err?.response?.data, message: err?.message });
      }
    })();
  }, [ready, prefetchDone, lessonId, knownLessonIds, typeParam]);

  /* ---------------------------------------------------------------------------
   * 3) Auth readiness
   * ------------------------------------------------------------------------- */
  if (!ready) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading auth…</span>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------------
   * 4) SAVE HANDLER
   * ------------------------------------------------------------------------- */
  const handleSave = async () => {
    if (saving) return;

    const currentType = (lessonType || typeParam || "").toString().trim();
    const lower = currentType.toLowerCase();
    const isVideo = lower === "video";
    const isPdf = lower === "pdf";
    const isArticle = lower === "article";
    const isLive = lower === "live";
    const isOtherFile = ["slides", "audio", "assignment", "scorm/tincan"].includes(lower);
    const isExternal = lower === "external link";
    const isQuiz = lower === "quiz"; // ✅ keep as-is

    dbg("save click", {
      courseId, sectionId, lessonId, createUsingUrlId,
      typeParam, currentType, lower, title, videoKey, fileKey
    });

    if (!title.trim()) return alert("Please enter a lesson title.");
    if (!isNonEmptyId(courseId) || !isNonEmptyId(sectionId)) {
      return alert("Course or Section ID is missing.");
    }

    const normalized = normalizeTitle(title);
    if (existingTitles.includes(normalized) && !lessonId) {
      alert("A lesson with this title already exists in this section.");
      return;
    }

    const payload = {
      courseId,
      sectionId,
      title: title.trim(),
      type: currentType,
      duration: isVideo ? (duration && duration > 0 ? duration : 1) : Number(duration) || 0,
    };

    if (createUsingUrlId && lessonId) {
      payload._id = lessonId;
    }

    // 🔧 The only change: allow Article to send either fileKey or data-URL/HTML.
    if (isArticle) {
      if (fileKey) {
        payload.fileKey = fileKey;
      } else if (fileUrl && String(fileUrl).startsWith("data:")) {
        // ArticleEditor already gave us a data URL
        payload.fileUrl = fileUrl;
      } else if (articleHtml && articleHtml.trim()) {
        // Fallback: build a data URL from the current editor HTML
        payload.fileUrl = htmlToDataUrl(articleHtml);
      } else {
        return alert("Please upload the article file or add article content.");
      }
    } else if (isLive) {
      if (!fileKey) {
        try {
          const zoomData = await createZoomMeeting({
            topic: title,
            start_time: new Date(startTime).toISOString(),
            duration: parseInt(String(liveDuration)) || 60,
            agenda,
          });

          const uploadRes = await API.post(`/api/media/save-text`, {
            folder: `courses/${courseId}/sections/${sectionId}`,
            content: zoomData.joinUrl,
          });

          payload.fileKey = uploadRes.data.key;
        } catch {
          alert("❌ Failed to create Zoom meeting.");
          return;
        }
      } else {
        payload.fileKey = fileKey;
      }
    } else if (isVideo) {
      if (!videoKey) return alert("Please upload a video first.");
      payload.videoKey = videoKey;
    } else if (isPdf) {
      if (!fileKey) return alert("Please upload a PDF first.");
      payload.fileKey = fileKey;
    } else if (isOtherFile) {
      if (!fileKey) return alert(`Please upload a ${currentType} file first.`);
      payload.fileKey = fileKey;
    } else if (isExternal) {
      if (!fileUrl) return alert("Please provide an external link URL.");
      payload.fileUrl = fileUrl;
    } else if (isQuiz) {
  // ✅ Skip file uploads for quizzes; handled in QLesson
  return alert("Use the Quiz Builder below to add and save quiz questions.");
}


    try {
      setSaving(true);

      const dbgPayload = { ...payload };
      if (dbgPayload.videoBase64) dbgPayload.videoBase64 = `<len:${String(dbgPayload.videoBase64.length)}>`;
      if (dbgPayload.fileBase64) dbgPayload.fileBase64 = `<len:${String(dbgPayload.fileBase64.length)}>`;
      const method = lessonId && !createUsingUrlId ? "PUT" : "POST";
      const url = lessonId && !createUsingUrlId
        ? `/api/courses/lesson/${lessonId}`
        : `/api/courses/${courseId}/lessons`;

        // ✅ new: canonical Section Builder url
    const builderUrl = `/course/${courseId}/section/${sectionId}`;

      const t = tStart("save");
      dbg("about to save", { method, url, payload: dbgPayload });

      if (lessonId && !createUsingUrlId) {
        const res = await API.put(url, payload);
        dbg("PUT ok", { status: res?.status, data: res?.data });
        alert("Lesson updated!");
         return navigate(builderUrl); // ✅ go to Section Builder
      } else {
        const res = await API.post(url, payload);
        dbg("POST ok", { status: res?.status, data: res?.data });
        alert("Lesson created!");
        const newId = res?.data?.lesson?._id || lessonId;
        dbg("navigate to saved id", { newId });
        if (newId) {
          setKnownLessonIds(prev => { const s = new Set(prev); s.add(newId); return s; });
          tEnd("save");
           return navigate(builderUrl); // ✅ go to Section Builder
        }
      }

      tEnd("save");
      navigate(-1);
    } catch (err) {
      dbge("save failed", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      alert(err?.response?.data?.message || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const currentType = (typeParam || lessonType || "").toString();
// ✅ If this is a Quiz lesson → render QLesson instead of default form
if (["quiz", "section quiz"].includes(currentType.toLowerCase().trim())) {
  return (
    <div className="container py-4">
      <QLesson
        courseId={courseId}
        sectionId={sectionId}
        title={title}
        navigate={navigate}
      />
    </div>
  );
}

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{currentType} Lesson</h5>
        <div>
          <Link to={`/course/${courseId}/settings`}>
            <button className="btn btn-outline-primary me-2">SETTINGS</button>
          </Link>
          <DeleteSectionButton courseId={courseId} sectionId={sectionId} />
        </div>
      </div>

      <LessonTitleInput title={title} setTitle={setTitle} />

      {/* Live config */}
      {currentType.toLowerCase().trim() === "live" && (
        <>
          <div className="mb-3">
            <label>Zoom Meeting Link</label>
            <input
              type="text"
              className="form-control"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Start Time</label>
            <input
              type="datetime-local"
              className="form-control"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Duration (minutes)</label>
            <input
              type="number"
              className="form-control"
              value={liveDuration}
              onChange={(e) => setLiveDuration(Number(e.target.value))}
            />
          </div>
          <div className="mb-3">
            <label>Agenda</label>
            <input
              type="text"
              className="form-control"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
            />
          </div>
        </>
      )}

      {/* External Link */}
      {currentType.toLowerCase().trim() === "external link" && (
        <div className="mb-3">
          <label>External Resource Link</label>
          <input
            type="text"
            className="form-control"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
        </div>
      )}

      {/* Article */}
      {currentType.toLowerCase().trim() === "article" && (
        <div className="mb-3">
          <ArticleEditor
            value={articleHtml}
            onChangeHtml={setArticleHtml}
            onChangeFileUrl={setFileUrl}
          />
        </div>
      )}

      {/* S3 Uploads */}
      {currentType.toLowerCase().trim() === "video" && (
        <LessonUploadArea
          label="Upload MP4"
          folder={`courses/${courseId}/sections/${sectionId}`}
          fileInputRef={fileInputRef}
          onUploaded={({ key, duration: d }) => {
            dbg("onUploaded(video)", { key, d });
            setVideoKey(key);
            setDuration(d || 1);
            setFileUrl(
              `${API_BASE}/api/media/stream?key=${encodeURIComponent(key)}`
            );
          }}
        />
      )}

      {/* ---- PDF ---- */}
{currentType.toLowerCase().trim() === "pdf" && (
  <LessonUploadArea
    label="Upload PDF"
    folder={`courses/${courseId}/sections/${sectionId}`}
    fileInputRef={fileInputRef}
    onUploaded={async ({ key }) => {
      dbg("onUploaded(pdf)", { key });
      setFileKey(key);
      const url = await resolveSignedUrl(key);  // real S3 URL, not the /sign endpoint
      setFileUrl(url);
    }}
  />
)}

{/* ---- other files (slides, audio, assignment, scorm/tincan) ---- */}
{["slides", "audio", "assignment", "scorm/tincan"].includes(
  currentType.toLowerCase().trim()
) && (
  <LessonUploadArea
    label={`Upload ${currentType}`}
    folder={`courses/${courseId}/sections/${sectionId}`}
    fileInputRef={fileInputRef}
    onUploaded={async ({ key }) => {
      dbg("onUploaded(other)", { key });
      setFileKey(key);
      const url = await resolveSignedUrl(key);  // real S3 URL
      setFileUrl(url);
    }}
  />
)}


      {/* Preview */}
      {[
        "video",
        "audio",
        "pdf",
        "slides",
        "article",
        "section quiz",
        "assignment",
        "scorm/tincan",
      ].includes(currentType.toLowerCase().trim()) && (
        <LessonPreview
          type={currentType}
          fileUrl={fileUrl}
          testId={
            currentType.toLowerCase().trim() === "section quiz"
              ? (fileUrl || "").split("/").pop()
              : undefined
          }
        />
      )}

      {currentType.toLowerCase().trim() !== "section quiz" && (
        <div className="mt-4 d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => {
              dbg("cancel clicked");
              navigate(-1);
            }}
          >
            Cancel
          </button>
         <button
  className="btn btn-success"
  disabled={
    saving ||
    !title ||
    (
      currentType.toLowerCase().trim() === "video" &&
      !videoKey &&
      !fileUrl // ✅ allow existing video
    ) ||
    (
      currentType.toLowerCase().trim() === "pdf" &&
      !fileKey &&
      !fileUrl // ✅ allow existing PDF
    )
  }
  onClick={handleSave}
>
  {saving ? "Saving..." : "Save Lesson"}
</button>

        </div>
      )}
    </div>
  );
}
