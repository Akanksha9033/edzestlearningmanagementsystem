// // src/MockTest/page/LMS/LMS_Pages/LessonPlayerPage.js
// import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
// import { createPortal } from "react-dom";
// import { useParams, useNavigate } from "react-router-dom";
// import LessonRenderer from "../LessonRenderer";
// import SyllabusSidebar from "../SyllabusSidebar";
// import "./LessonPlayerPage.css";

// import { Drawer, Backdrop, Paper, Typography, IconButton, Box } from "@mui/material";
// import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
// import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
// import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
// import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
// import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

// import { markLessonComplete, getCourseProgress, PROG_ENABLED } from "../../../../utils/ProgressApi";
// import API from "../../../../api/axios";
// import { toast } from "react-toastify";

// /* -------------------------------- constants + helpers -------------------------------- */
// const AUTO_ADVANCE_DELAY = 3;
// const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
// const isObjectId = (s) => typeof s === "string" && /^[a-f\d]{24}$/i.test(s);
// const lc = (x) => String(x || "").toLowerCase();

// const buildLessonPath = (courseKey, sectionId, lessonId) =>
//   `/learn/${encodeURIComponent(String(courseKey))}/${encodeURIComponent(String(sectionId))}/${encodeURIComponent(String(lessonId))}`;

// /** Attach auth token as query param so <video>/<iframe> requests succeed (no headers there) */
// const withAuth = (url) => {
//   try {
//     const token =
//       localStorage.getItem("token") ||
//       localStorage.getItem("authToken") ||
//       sessionStorage.getItem("token");
//     if (!token) return url;
//     const sep = url.includes("?") ? "&" : "?";
//     return `${url}${sep}token=${encodeURIComponent(token)}`;
//   } catch {
//     return url;
//   }
// };

// const buildStreamUrlFromKey = (key) =>
//   key ? withAuth(`${API_BASE}/api/media/stream?key=${encodeURIComponent(String(key))}`) : "";
// const buildSignedUrlFromKey = (key) =>
//   key ? withAuth(`${API_BASE}/api/media/sign?key=${encodeURIComponent(String(key))}`) : "";

// /** Prefer direct urls; else from keys → SIGN first (headerless), STREAM fallback */
// function resolvePlayableUrl(lesson = {}) {
//   const pick = (v) => (typeof v === "string" ? v.trim() : "");

//   // If lesson is LIVE we don't need a streamable URL (renderer will show a button)
//   if (lc(lesson.type) === "live") {
//     const direct = [
//       lesson.liveUrl,
//       lesson.url,
//       lesson.fileUrl,
//       lesson?.meta?.url,
//     ].map(pick).find(Boolean);
//     return direct ? withAuth(direct) : ""; // used only to know a url exists
//   }

//   const direct = [
//     lesson.videoUrl,
//     lesson.fileUrl,
//     lesson.url,
//     lesson?.video?.url,
//     lesson?.file?.url,
//     lesson?.meta?.videoUrl,
//     lesson?.meta?.fileUrl,
//     lesson?.meta?.url,
//   ].map(pick).find(Boolean);
//   if (direct) return withAuth(direct);

//   const preferSignedFirst = (keyVal) => (keyVal ? buildSignedUrlFromKey(keyVal) || buildStreamUrlFromKey(keyVal) : "");

//   if (lesson.videoKey) return preferSignedFirst(lesson.videoKey);
//   if (lesson.fileKey)  return preferSignedFirst(lesson.fileKey);
//   if (lesson.key)      return preferSignedFirst(lesson.key);

//   return "";
// }

// /* --------- ZOOM APP DEEP-LINK HELPERS (NEW) --------- */
// const isHttpUrl = (u) => /^https?:\/\//i.test(u);
// function parseZoomUrl(webUrl) {
//   try {
//     const u = new URL(webUrl);
//     const idMatch = u.pathname.match(/\/j\/(\d+)/);
//     const confno = idMatch ? idMatch[1] : null;
//     const pwd = u.searchParams.get("pwd") || "";
//     const sub = u.hostname.split(".")[0] || "zoom";
//     return { confno, pwd, subdomain: sub };
//   } catch {
//     return { confno: null, pwd: "", subdomain: "zoom" };
//   }
// }
// function buildDeepLinks(webUrl) {
//   const { confno, pwd, subdomain } = parseZoomUrl(webUrl);
//   if (!confno) return { web: webUrl };
//   const q = `?action=join&confno=${encodeURIComponent(confno)}${pwd ? `&pwd=${encodeURIComponent(pwd)}` : ""}`;
//   return {
//     web: webUrl,
//     zoommtg: `zoommtg://${subdomain}.zoom.us/join${q}`, // desktop & Android
//     zoomus:  `zoomus://${subdomain}.zoom.us/join${q}`,   // legacy/iOS
//   };
// }
// function openZoomWithFallback(webUrl) {
//   const links = buildDeepLinks(webUrl);
//   const tryDeep = (schemeUrl, next) => {
//     if (!schemeUrl) return next();
//     window.location.href = schemeUrl;      // deep-link
//     setTimeout(next, 1200);                // fallback if app not handled
//   };
//   tryDeep(links.zoommtg, () => {
//     tryDeep(links.zoomus, () => {
//       if (links.web) window.location.assign(links.web);
//     });
//   });
// }
// /** Resolve a live URL from lesson (direct or via .txt key) then open Zoom */
// async function openLiveFromLesson(lesson) {
//   const direct =
//     lesson?.liveUrl || lesson?.url || lesson?.fileUrl || lesson?.meta?.url || "";
//   if (isHttpUrl(direct)) { openZoomWithFallback(direct); return; }

//   const key = lesson?.fileKey || lesson?.linkKey || lesson?.key;
//   if (key) {
//     try {
//       const sign = await API.get(`/api/media/sign`, {
//         params: { key },
//         validateStatus: (s) => s < 500,
//       });
//       const signedUrl = sign?.data?.url || sign?.data;
//       if (isHttpUrl(signedUrl)) {
//         const res = await fetch(signedUrl, { credentials: "omit" });
//         const text = (await res.text()).trim();
//         if (isHttpUrl(text)) { openZoomWithFallback(text); return; }
//       }
//     } catch (e) {
//       console.warn("openLiveFromLesson:", e?.message);
//     }
//   }
//   alert("Live session link not found. Please contact support.");
// }
// /* --------- END ZOOM HELPERS --------- */

// /** Fullscreen-aware portal for the up-next overlay */
// function FullscreenAwarePortal({ open, fallbackRef, children }) {
//   const [fsEl, setFsEl] =
//     useState(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null);
//   useEffect(() => {
//     const onFsChange = () =>
//       setFsEl(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null);
//     document.addEventListener("fullscreenchange", onFsChange);
//     document.addEventListener("webkitfullscreenchange", onFsChange);
//     document.addEventListener("mozfullscreenchange", onFsChange);
//     document.addEventListener("MSFullscreenChange", onFsChange);
//     return () => {
//       document.removeEventListener("fullscreenchange", onFsChange);
//       document.removeEventListener("webkitfullscreenchange", onFsChange);
//       document.removeEventListener("mozfullscreenchange", onFsChange);
//       document.removeEventListener("MSFullscreenChange", onFsChange);
//     };
//   }, []);
//   if (!open) return null;
//   const target = fsEl || fallbackRef?.current;
//   if (!target) return null;
//   return createPortal(children, target);
// }

// /** Manual complete for non-video lessons (guarded by PROG_ENABLED) */
// function MarkComplete({ lessonId, defaultCompleted, onProgressChanged, onCompleted }) {
//   const [busy, setBusy] = useState(false);
//   const [done, setDone] = useState(!!defaultCompleted);
//   useEffect(() => setDone(!!defaultCompleted), [defaultCompleted]);

//   const toggle = async () => {
//     setBusy(true);
//     try {
//       const next = !done;
//       if (PROG_ENABLED && lessonId) await markLessonComplete(lessonId, next);
//       setDone(next);
//       onProgressChanged && onProgressChanged();
//       if (next && typeof onCompleted === "function") onCompleted();
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <button className="btn btn-primary" onClick={toggle} disabled={busy}>
//       {done ? "Mark as incomplete" : "Mark as complete"}
//     </button>
//   );
// }

// /* -------------------------------- API helpers -------------------------------- */
// const tryUrls = async (urls, pick) => {
//   for (const u of urls) {
//     try {
//       const r = await API.get(u, { validateStatus: (s) => s < 500 });
//       if (r?.status === 404) { console.warn("[LessonPlayer] 404:", u); continue; }
//       const v = pick(r);
//       if (v) { console.log("[LessonPlayer] HIT:", u); return v; }
//     } catch (e) { console.warn("[LessonPlayer] error:", u, e?.message); }
//   }
//   return null;
// };

// const fetchCourseBySlug = async (slug) => {
//   const urls = [
//     `/api/courses/${slug}`,
//     `/api/courses/slug/${slug}`,
//     `/api/courses/bySlug/${slug}`,
//     `/api/courses/fetchCourse/by/${slug}`,
//     `/api/courses?slug=${encodeURIComponent(slug)}`,
//   ];
//   const hit = await tryUrls(urls, (r) => (r?.data?.course || r?.data)?._id && (r.data.course || r.data));
//   if (hit) return hit;
//   throw new Error("no slug route");
// };

// const fetchCourseById = async (id) => {
//   const urls = [`/api/courses/byId/${id}`, `/api/courses/${id}`];
//   const hit = await tryUrls(urls, (r) => (r?.data?.course || r?.data)?._id && (r.data.course || r.data));
//   if (hit) return hit;
//   throw new Error("no id route");
// };

// const fetchLesson = async (id, course, sectionId) => {
//   const courseId = course?._id || course?.id;
//   const params = {};
//   if (courseId) params.courseId = courseId;
//   if (sectionId) params.sectionId = sectionId;

//   const tries = [
//     { url: `/api/lessons/${id}`, params },
//     { url: `/api/courses/lesson/${id}`, params },
//   ];

//   for (const t of tries) {
//     try {
//       const r = await API.get(
//         t.url,
//         Object.keys(params).length ? { params, validateStatus: (s) => s < 500 } : { validateStatus: (s) => s < 500 }
//       );
//       if (r?.status === 404) { console.warn("[LessonPlayer] 404:", t.url); continue; }
//       const l = r?.data?.lesson || r?.data;
//       if (l && (l._id || l.id)) return l;
//     } catch (e) { console.warn("[LessonPlayer] lesson fetch error:", t.url, e?.message); }
//   }
//   throw new Error(`Lesson not found for id "${id}".`);
// };

// const findLessonInCourse = (course, id) => {
//   if (!course || !Array.isArray(course.sections)) return null;
//   for (const s of course.sections) {
//     const hit = (s.lessons || []).find((l) => String(l._id || l.id) === String(id));
//     if (hit) return hit;
//   }
//   return null;
// };

// const fetchCourseBySection = async (sectionId) => {
//   const urls = [`/api/sections/${sectionId}`, `/api/courses/sections/${sectionId}`];
//   const sec = await tryUrls(urls, (r) => r?.data?.section || r?.data);
//   if (!sec) throw new Error("no section route");

//   const courseSlug = sec.courseSlug || sec.course_slug || sec.slug;
//   const courseKey  = sec.courseKey  || sec.course_key;
//   const courseId   = sec.course || sec.courseId || sec.course_id || sec.courseID;

//   const candidateSlug = courseSlug || courseKey;
//   if (candidateSlug) { try { return await fetchCourseBySlug(candidateSlug); } catch {} }
//   if (courseId) {
//     if (isObjectId(String(courseId))) { try { return await fetchCourseById(String(courseId)); } catch {} }
//     else { try { return await fetchCourseBySlug(String(courseId)); } catch {} }
//   }

//   const listUrls = [`/api/courses/public`, `/api/courses/list`];
//   const hit = await tryUrls(listUrls, (r) => {
//     const arr = r?.data?.courses || r?.data || [];
//     return Array.isArray(arr) && arr.find((c) => {
//       if (!c) return false;
//       if (candidateSlug) return String(c.slug || "").toLowerCase() === String(candidateSlug).toLowerCase();
//       if (courseId)      return String(c._id || c.id) === String(courseId);
//       return false;
//     });
//   });
//   if (hit) return hit;

//   throw new Error("course not resolved from section");
// };

// const fetchCourseSmart = async (key, { lessonId, sectionId } = {}) => {
//   try { return await fetchCourseBySlug(key); } catch {}

//   if (isObjectId(key)) {
//     try { return await fetchCourseById(key); } catch {}
//   }

//   if (lessonId) {
//     try {
//       const l = await fetchLesson(lessonId);
//       const cid   = l?.course || l?.courseId || l?.course_id || l?.course?._id || l?.course?.id;
//       const cslug = l?.courseSlug || l?.course_slug || l?.course?.slug;
//       if (cslug) { try { return await fetchCourseBySlug(cslug); } catch {} }
//       if (cid) { if (isObjectId(String(cid))) { try { return await fetchCourseById(String(cid)); } catch {} }
//                  else { try { return await fetchCourseBySlug(String(cid)); } catch {} } }
//     } catch {}
//   }

//   if (sectionId) { try { return await fetchCourseBySection(sectionId); } catch {} }

//   const listUrls = [`/api/courses/public`, `/api/courses/list`];
//   const hit = await tryUrls(listUrls, (r) => {
//     const arr = r?.data?.courses || r?.data || [];
//     return Array.isArray(arr) && arr.find((c) => {
//       const slug = String(c?.slug || "").toLowerCase();
//       const code = String(c?.code || c?.shortCode || "").toLowerCase();
//       const k    = String(key).toLowerCase();
//       return slug === k || (code && code === k);
//     });
//   });
//   if (hit) return hit;

//   throw new Error(`Course not found for key "${key}".`);
// };

// /* -------------------------------- component -------------------------------- */
// export default function LessonPlayerPage() {
//   const params = useParams();
//   let { courseKey: fromCourseKey, courseSlug: fromSlug, courseId: fromId } = params;
//   let { sectionId, lessonId } = params;

//   if (lessonId === "undefined") lessonId = undefined;
//   if (sectionId === "undefined") sectionId = undefined;

//   const courseKey = fromCourseKey || fromSlug || fromId;
//   const navigate = useNavigate();

//   const [course, setCourse] = useState(null);
//   const [lesson, setLesson] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [initialCompleted, setInitialCompleted] = useState(false);
//   const [courseProgress, setCourseProgress] = useState({ percent: 0, completedLessonIds: [] });

//   const [showUpNext, setShowUpNext] = useState(false);
//   const [countDown, setCountDown] = useState(AUTO_ADVANCE_DELAY);
//   const timerRef = useRef(null);
//   const overlayArmedRef = useRef(false);
//   const wrapRef = useRef(null);

//   // responsive
//   const [isSmall, setIsSmall] = useState(false);
//   useEffect(() => {
//     const mq = window.matchMedia("(max-width: 991.98px)");
//     const apply = () => setIsSmall(mq.matches);
//     apply();
//     if (mq.addEventListener) mq.addEventListener("change", apply);
//     else if (mq.addListener) mq.addListener(apply);
//     return () => {
//       if (mq.removeEventListener) mq.removeEventListener("change", apply);
//       else if (mq.removeListener) mq.removeListener(apply);
//     };
//   }, []);

//   // fullscreen helpers
//   const getFsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
//   const requestFs = async () => {
//     const el = wrapRef.current || document.documentElement;
//     try {
//       if (el?.requestFullscreen) await el.requestFullscreen();
//       else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
//     } catch {}
//   };
//   const exitFs = async () => {
//     try {
//       if (document.exitFullscreen) await document.exitFullscreen();
//       else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
//     } catch {}
//   };
//   useEffect(() => {
//     const shell = wrapRef.current;
//     if (!shell) return;
//     const onDblClick = (e) => {
//       const tag = (e.target?.tagName || "").toLowerCase();
//       if (["button", "a"].includes(tag)) return;
//       if (getFsEl() === shell) exitFs(); else requestFs();
//     };
//     const onKeyDown = (e) => {
//       if ((e.key || "").toLowerCase() !== "f") return;
//       if (!shell.contains(document.activeElement) && !shell.contains(e.target)) return;
//       e.preventDefault();
//       if (getFsEl() === shell) exitFs(); else requestFs();
//     };
//     shell.addEventListener("dblclick", onDblClick);
//     document.addEventListener("keydown", onKeyDown);
//     return () => {
//       shell.removeEventListener("dblclick", onDblClick);
//       document.removeEventListener("keydown", onKeyDown);
//     };
//   }, []);

//   // remember last-opened lesson per course
//   useEffect(() => {
//     if (courseKey && sectionId && lessonId) {
//       localStorage.setItem(`last:${courseKey}`, JSON.stringify({ sectionId, lessonId }));
//     }
//   }, [courseKey, sectionId, lessonId]);

//   /* ---------------- loader ---------------- */
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         if (!courseKey) throw new Error("courseKey missing in URL");

//         const c = await fetchCourseSmart(courseKey, { lessonId, sectionId });
//         if (!alive) return;
//         setCourse(c);

//         // resolve missing sid/lid
//         let sid = sectionId;
//         let lid = lessonId;

//         if (!sid || !lid) {
//           const raw = localStorage.getItem(`last:${c.slug || c._id || courseKey}`);
//           if (raw) {
//             try {
//               const last = JSON.parse(raw);
//               sid = sid || last.sectionId;
//               lid = lid || last.lessonId;
//             } catch {}
//           }
//         }
//         if (!sid || !lid) {
//           const first = (c.sections || []).find((s) => Array.isArray(s.lessons) && s.lessons.length > 0);
//           if (first) {
//             sid = String(first._id || first.id);
//             lid = String(first.lessons[0]._id || first.lessons[0].id);
//           }
//         }

//         // normalize URL
//         const desiredKey = isObjectId(courseKey) ? (c._id || courseKey) : (c.slug || courseKey);
//         if (!sectionId || !lessonId || sectionId !== sid || lessonId !== lid) {
//           if (sid && lid) {
//             navigate(buildLessonPath(desiredKey, sid, lid), { replace: true });
//             return;
//           }
//         }

//         // lesson
//         let l = findLessonInCourse(c, lid);
//         if (!l) l = await fetchLesson(lid, c, sid);

//         if (!alive) return;
//         setLesson(l);
//       } catch (e) {
//         console.error("LessonPlayer load error:", e?.response?.data || e.message);
//         toast.error("Course/Lesson not found. Check backend routes.");
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();
//     return () => { alive = false; };
//   }, [courseKey, sectionId, lessonId, navigate]);

//   /* ---------------- progress (guarded) ---------------- */
//   const refreshCourseProgress = useCallback(async () => {
//     if (!PROG_ENABLED) return;
//     try {
//       if (!course?._id) return;
//       const p = await getCourseProgress(course._id);
//       if (p && typeof p.percent === "number") {
//         setCourseProgress({ percent: p.percent, completedLessonIds: p.completedLessonIds || [] });
//       }
//     } catch {}
//   }, [course?._id]);

//   useEffect(() => { refreshCourseProgress(); }, [refreshCourseProgress]);

//   // initial completed state for non-video marker
//   useEffect(() => {
//     if (!PROG_ENABLED) return;
//     let alive = true;
//     (async () => {
//       try {
//         if (!lesson?._id) return;
//         const res = await API.get("/api/video-progress", {
//           params: { courseSlug: course?.slug || courseKey, lessonId: lesson._id },
//           validateStatus: (s) => s < 500,
//         });
//         if (!alive) return;
//         setInitialCompleted(Boolean(res?.data?.completed));
//       } catch {
//         if (alive) setInitialCompleted(false);
//       }
//     })();
//     return () => { alive = false; };
//   }, [course?.slug, courseKey, lesson?._id]);

//   /* ---------------- navigation helpers ---------------- */
//   const section = useMemo(() => {
//     if (!course || !Array.isArray(course.sections)) return null;
//     return course.sections.find((s) => String(s?._id || s?.id || "") === String(sectionId || ""));
//   }, [course, sectionId]);

//   const flatLessons = useMemo(() => {
//     if (!course || !Array.isArray(course.sections)) return [];
//     const out = [];
//     course.sections.forEach((s) =>
//       (s.lessons || []).forEach((l) =>
//         out.push({ sectionId: s._id || s.id, lessonId: l._id || l.id, title: l.title, type: l.type })
//       )
//     );
//     return out;
//   }, [course]);

//   const currentIndex = useMemo(
//     () => flatLessons.findIndex((x) => String(x.lessonId) === String(lessonId)),
//     [flatLessons, lessonId]
//   );

//   const prevPath = useMemo(() => {
//     if (currentIndex <= 0) return null;
//     const p = flatLessons[currentIndex - 1];
//     const k = course?.slug || course?._id || courseKey;
//     return buildLessonPath(k, p.sectionId, p.lessonId);
//   }, [currentIndex, flatLessons, course, courseKey]);

//   const nextPath = useMemo(() => {
//     if (currentIndex < 0 || currentIndex + 1 >= flatLessons.length) return null;
//     const n = flatLessons[currentIndex + 1];
//     const k = course?.slug || course?._id || courseKey;
//     return buildLessonPath(k, n.sectionId, n.lessonId);
//   }, [currentIndex, flatLessons, course, courseKey]);

//   const goPrev = () => prevPath && navigate(prevPath);
//   const goNext = () => { if (nextPath) navigate(nextPath); };

//   /* ---------------- overlay + end handling ---------------- */
//   const startOverlay = useCallback(() => {
//     if (!nextPath) return;
//     if (overlayArmedRef.current) return;
//     overlayArmedRef.current = true;
//     setCountDown(AUTO_ADVANCE_DELAY);
//     setShowUpNext(true);
//     clearInterval(timerRef.current);
//     timerRef.current = setInterval(() => {
//       setCountDown((c) => {
//         if (c <= 1) {
//           clearInterval(timerRef.current);
//           setShowUpNext(false);
//           overlayArmedRef.current = false;
//           goNext();
//           return 0;
//         }
//         return c - 1;
//       });
//     }, 1000);
//   }, [nextPath]);

//   const cancelOverlay = useCallback(() => {
//     clearInterval(timerRef.current);
//     setShowUpNext(false);
//     overlayArmedRef.current = false;
//   }, []);
//   const playNow = useCallback(() => {
//     clearInterval(timerRef.current);
//     setShowUpNext(false);
//     overlayArmedRef.current = false;
//     goNext();
//   }, [goNext]);
//   useEffect(() => () => clearInterval(timerRef.current), []);

//   const onVideoEnded = useCallback(async () => {
//     try {
//       if (PROG_ENABLED && lesson?._id) {
//         await markLessonComplete(lesson._id, true);
//       }
//     } catch {}
//     finally {
//       await refreshCourseProgress();
//       startOverlay();
//     }
//   }, [lesson?._id, refreshCourseProgress, startOverlay]);

//   /* ---------------- render ---------------- */
//   const lessonForRender = useMemo(() => {
//     if (!lesson) return lesson;
//     const url = resolvePlayableUrl(lesson);

//     if (lc(lesson.type) === "live") {
//       return { ...lesson, liveResolvedUrl: url || null, type: "live" };
//     }

//     if (!url) return { ...lesson, __noMedia: true };

//     const ltype = lc(lesson.type);
//     const isPdfLike = ltype === "pdf" || /\.pdf(?:$|\?)/i.test(url);
//     const isVideoLike = ltype === "video" || /\.(mp4|webm|m3u8)(?:$|\?)/i.test(url) || url.includes("/api/media/stream?key=");
//     const finalType = isVideoLike ? "video" : (isPdfLike ? "pdf" : (lesson.type || "video"));

//     return { ...lesson, fileUrl: url, url, videoUrl: url, type: finalType };
//   }, [lesson]);

//   if (loading) return <div className="container py-5">Loading lesson…</div>;
//   if (!course || !lessonForRender) return <div className="container py-5 text-danger">Lesson not found</div>;

//   const mobilePct = Math.round(Number(courseProgress.percent) || 0);

//   const overlayUI = (
//     <Backdrop
//       open
//       sx={{
//         color: "#fff",
//         position: "fixed",
//         inset: 0,
//         zIndex: 2147483650,
//         background: "rgba(6,10,25,.72)",
//         backdropFilter: "blur(2px)",
//         p: 2,
//       }}
//     >
//       <Paper
//         elevation={3}
//         sx={{
//           position: "relative",
//           width: { xs: "92%", sm: 520 },
//           textAlign: "center",
//           bgcolor: "#111827",
//           color: "#F9FAFB",
//           borderRadius: 3,
//           p: { xs: 2.5, sm: 4 },
//           overflow: "hidden",
//           zIndex: 2147483651,
//         }}
//       >
//         <IconButton aria-label="Cancel auto play" onClick={cancelOverlay} sx={{ position: "absolute", top: 8, right: 8 }}>
//           <CloseRoundedIcon sx={{ color: "#F9FAFB" }} />
//         </IconButton>
//         <IconButton
//           aria-label="Play next"
//           onClick={playNow}
//           sx={{ width: 64, height: 64, border: "2px solid #F9FAFB", borderRadius: "50%", mb: 2 }}
//         >
//           <PlayArrowRoundedIcon sx={{ color: "#F9FAFB", fontSize: 40 }} />
//         </IconButton>
//         <Typography sx={{ color: "#D1D5DB", fontSize: 14 }}>
//           Playing next automatically{" "}
//           <Box component="span" sx={{ fontWeight: 700, color: "#F9FAFB" }}>in {countDown}s…</Box>
//         </Typography>
//       </Paper>

//       <IconButton aria-label="Previous lesson" onClick={goPrev} disabled={!prevPath} className="overlay-nav prev"
//         sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}>
//         <ChevronLeftRoundedIcon className="overlay-icon" />
//       </IconButton>
//       <IconButton aria-label="Next lesson" onClick={() => { if (!showUpNext) goNext(); }} disabled={!nextPath} className="overlay-nav next"
//         sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
//         <ChevronRightRoundedIcon className="overlay-icon" />
//       </IconButton>
//     </Backdrop>
//   );

//   return (
//     <div className="container-fluid py-3">
//       <div className="row g-3">
//         <div className={sidebarOpen ? "col-lg-8 col-12" : "col-12"}>
//           {/* top bar */}
//           <div className="lesson-topbar d-lg-flex justify-content-between align-items-center mb-2">
//             <div className="text-muted small type-label">
//               {String(lessonForRender?.type || "").toUpperCase()}
//               {section ? ` • ${section.title}` : ""}
//             </div>

//             <div className="actions">
//               {isSmall && (
//                 <span className="badge bg-light text-dark progress-pill" style={{ fontWeight: 700, border: "1px solid #e5e7eb" }} aria-label={`Course progress ${mobilePct}%`}>
//                   {mobilePct}% complete
//                 </span>
//               )}
//               <button className="btn btn-outline-secondary btn-sm d-inline-flex d-lg-none content-btn" onClick={() => setSidebarOpen(true)} title="Course content" type="button">
//                 <MenuBookRoundedIcon style={{ fontSize: 18, marginRight: 6 }} />
//                 Content
//               </button>
//               {!sidebarOpen && (
//                 <button className="btn btn-outline-secondary btn-sm d-none d-lg-inline-flex" onClick={() => setSidebarOpen(true)} title="Show course content" type="button">
//                   Show Content ◂
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* player */}
//           <div className="card p-3 p-md-2 p-lg-3">
//             <div ref={wrapRef} className="lesson-overlay-wrap" style={{ position: "relative" }} tabIndex={-1}>
//               {lessonForRender.__noMedia ? (
//                 <div className="text-danger fw-semibold">
//                   No playable URL for this lesson. Set <code>videoUrl</code> (or <code>fileUrl/url</code>), or provide <code>videoKey</code>/<code>fileKey</code>.
//                 </div>
//               ) : lc(lessonForRender.type) === "live" ? (
//                 <div className="d-flex justify-content-center align-items-center" style={{ height: 420 }}>
//                   <button
//                     className="btn btn-primary btn-lg"
//                     onClick={() => openLiveFromLesson(lessonForRender)}
//                     type="button"
//                   >
//                     Join live session
//                   </button>
//                 </div>
//               ) : (
//                 <LessonRenderer
//                   lesson={lessonForRender}
//                   course={course}
//                   onVideoEnded={onVideoEnded}
//                   fullscreenTargetRef={wrapRef}
//                 />
//               )}

//               <IconButton aria-label="Previous lesson" onClick={goPrev} disabled={!prevPath} className="overlay-nav prev">
//                 <ChevronLeftRoundedIcon className="overlay-icon" />
//               </IconButton>
//               <IconButton aria-label="Next lesson" onClick={() => { if (!showUpNext) goNext(); }} disabled={!nextPath} className="overlay-nav next">
//                 <ChevronRightRoundedIcon className="overlay-icon" />
//               </IconButton>

//               <FullscreenAwarePortal open={showUpNext} fallbackRef={wrapRef}>
//                 {overlayUI}
//               </FullscreenAwarePortal>
//             </div>

//             {/* Non-video lessons → manual complete (only when progress is enabled) */}
//             {lc(lessonForRender?.type) !== "video" && PROG_ENABLED && (
//               <div className="mt-3">
//                 <MarkComplete
//                   lessonId={lesson?._id || lesson?.id}
//                   defaultCompleted={initialCompleted}
//                   onProgressChanged={refreshCourseProgress}
//                   onCompleted={startOverlay}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Desktop sidebar */}
//         {sidebarOpen && !isSmall && (
//           <div className="col-lg-4 d-none d-lg-block">
//             <SyllabusSidebar
//               course={course}
//               currentLessonId={lesson?._id || lesson?.id || lessonId}
//               onOpenChange={setSidebarOpen}
//               progressPercent={courseProgress.percent}
//               completedLessonIds={courseProgress.completedLessonIds}
//             />
//           </div>
//         )}
//       </div>

//       {/* Mobile drawer */}
//       <Drawer anchor="right" open={isSmall && sidebarOpen} onClose={() => setSidebarOpen(false)} PaperProps={{ sx: { width: "88vw", maxWidth: 420 } }}>
//         <div className="drawer-header d-flex align-items-center justify-content-between px-3 py-2">
//           <strong>Course content</strong>
//           <button className="btn btn-sm btn-light" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" type="button">
//             <CloseRoundedIcon fontSize="small" />
//           </button>
//         </div>
//         <div className="drawer-body">
//           <SyllabusSidebar
//             course={course}
//             currentLessonId={lesson?._id || lesson?.id || lessonId}
//             onOpenChange={setSidebarOpen}
//             progressPercent={courseProgress.percent}
//             completedLessonIds={courseProgress.completedLessonIds}
//             renderMobile
//           />
//         </div>
//       </Drawer>
//     </div>
//   );
// }


// src/MockTest/page/LMS/LMS_Pages/LessonPlayerPage.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import LessonRenderer from "../LessonRenderer";
import SyllabusSidebar from "../SyllabusSidebar";
import "./LessonPlayerPage.css";

import { Drawer, Backdrop, Paper, Typography, IconButton, Box } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { PROG_ENABLED, markLessonComplete, getCourseProgress, putLessonProgress }  from "../../../../../utils/ProgressApi";

import API from '../../../../../LoginSystem/axios';
import { toast } from "react-toastify";

/* -------------------------------- constants + helpers -------------------------------- */
const AUTO_ADVANCE_DELAY = 3;
const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const isObjectId = (s) => typeof s === "string" && /^[a-f\d]{24}$/i.test(s);
const lc = (x) => String(x || "").toLowerCase();

const buildLessonPath = (courseKey, sectionId, lessonId) =>
  `/learn/${encodeURIComponent(String(courseKey))}/${encodeURIComponent(String(sectionId))}/${encodeURIComponent(String(lessonId))}`;

/** Attach auth token as query param so <video>/<iframe> requests succeed (no headers there) */
const withAuth = (url) => {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token");
    if (!token) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}token=${encodeURIComponent(token)}`;
  } catch {
    return url;
  }
};

const buildStreamUrlFromKey = (key) =>
  key ? withAuth(`${API_BASE}/api/media/stream?key=${encodeURIComponent(String(key))}`) : "";
const buildSignedUrlFromKey = (key) =>
  key ? withAuth(`${API_BASE}/api/media/sign?key=${encodeURIComponent(String(key))}`) : "";

/** Prefer direct urls; else from keys → SIGN first (headerless), STREAM fallback */
function resolvePlayableUrl(lesson = {}) {
  const pick = (v) => (typeof v === "string" ? v.trim() : "");

  // If lesson is LIVE we don't need a streamable URL (renderer will show a button)
  if (lc(lesson.type) === "live") {
    const direct = [
      lesson.liveUrl,
      lesson.url,
      lesson.fileUrl,
      lesson?.meta?.url,
    ].map(pick).find(Boolean);
    return direct ? withAuth(direct) : ""; // used only to know a url exists
  }

  const direct = [
    lesson.videoUrl,
    lesson.fileUrl,
    lesson.url,
    lesson?.video?.url,
    lesson?.file?.url,
    lesson?.meta?.videoUrl,
    lesson?.meta?.fileUrl,
    lesson?.meta?.url,
  ].map(pick).find(Boolean);
  if (direct) return withAuth(direct);

  const preferSignedFirst = (keyVal) => (keyVal ? buildSignedUrlFromKey(keyVal) || buildStreamUrlFromKey(keyVal) : "");

  if (lesson.videoKey) return preferSignedFirst(lesson.videoKey);
  if (lesson.fileKey)  return preferSignedFirst(lesson.fileKey);
  if (lesson.key)      return preferSignedFirst(lesson.key);

  return "";
}

/* --------- ZOOM APP DEEP-LINK HELPERS (NEW) --------- */
const isHttpUrl = (u) => /^https?:\/\//i.test(u);
function parseZoomUrl(webUrl) {
  try {
    const u = new URL(webUrl);
    const idMatch = u.pathname.match(/\/j\/(\d+)/);
    const confno = idMatch ? idMatch[1] : null;
    const pwd = u.searchParams.get("pwd") || "";
    const sub = u.hostname.split(".")[0] || "zoom";
    return { confno, pwd, subdomain: sub };
  } catch {
    return { confno: null, pwd: "", subdomain: "zoom" };
  }
}
function buildDeepLinks(webUrl) {
  const { confno, pwd, subdomain } = parseZoomUrl(webUrl);
  if (!confno) return { web: webUrl };
  const q = `?action=join&confno=${encodeURIComponent(confno)}${pwd ? `&pwd=${encodeURIComponent(pwd)}` : ""}`;
  return {
    web: webUrl,
    zoommtg: `zoommtg://${subdomain}.zoom.us/join${q}`, // desktop & Android
    zoomus:  `zoomus://${subdomain}.zoom.us/join${q}`,   // legacy/iOS
  };
}
function openZoomWithFallback(webUrl) {
  const links = buildDeepLinks(webUrl);
  const tryDeep = (schemeUrl, next) => {
    if (!schemeUrl) return next();
    window.location.href = schemeUrl;      // deep-link
    setTimeout(next, 1200);                // fallback if app not handled
  };
  tryDeep(links.zoommtg, () => {
    tryDeep(links.zoomus, () => {
      if (links.web) window.location.assign(links.web);
    });
  });
}
/** Resolve a live URL from lesson (direct or via .txt key) then open Zoom */
async function openLiveFromLesson(lesson) {
  const direct =
    lesson?.liveUrl || lesson?.url || lesson?.fileUrl || lesson?.meta?.url || "";
  if (isHttpUrl(direct)) { openZoomWithFallback(direct); return; }

  const key = lesson?.fileKey || lesson?.linkKey || lesson?.key;
  if (key) {
    try {
      const sign = await API.get(`/api/media/sign`, {
        params: { key },
        validateStatus: (s) => s < 500,
      });
      const signedUrl = sign?.data?.url || sign?.data;
      if (isHttpUrl(signedUrl)) {
        const res = await fetch(signedUrl, { credentials: "omit" });
        const text = (await res.text()).trim();
        if (isHttpUrl(text)) { openZoomWithFallback(text); return; }
      }
    } catch (e) {
      console.warn("openLiveFromLesson:", e?.message);
    }
  }
  alert("Live session link not found. Please contact support.");
}
/* --------- END ZOOM HELPERS --------- */

/** Fullscreen-aware portal for the up-next overlay */
function FullscreenAwarePortal({ open, fallbackRef, children }) {
  const [fsEl, setFsEl] =
    useState(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null);
  useEffect(() => {
    const onFsChange = () =>
      setFsEl(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);
  if (!open) return null;
  const target = fsEl || fallbackRef?.current;
  if (!target) return null;
  return createPortal(children, target);
}

/** Manual complete for non-video lessons (guarded by PROG_ENABLED) */
function MarkComplete({ lessonId, defaultCompleted, onProgressChanged, onCompleted }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(!!defaultCompleted);
  useEffect(() => setDone(!!defaultCompleted), [defaultCompleted]);

  const toggle = async () => {
    setBusy(true);
    try {
      const next = !done;
      if (PROG_ENABLED && lessonId) await markLessonComplete(lessonId, next);
      setDone(next);
      onProgressChanged && onProgressChanged();
      if (next && typeof onCompleted === "function") onCompleted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="btn btn-primary" onClick={toggle} disabled={busy}>
      {done ? "Mark as incomplete" : "Mark as complete"}
    </button>
  );
}

/* -------------------------------- API helpers -------------------------------- */
const tryUrls = async (urls, pick) => {
  for (const u of urls) {
    try {
      const r = await API.get(u, { validateStatus: (s) => s < 500 });
      if (r?.status === 404) { console.warn("[LessonPlayer] 404:", u); continue; }
      const v = pick(r);
      if (v) { console.log("[LessonPlayer] HIT:", u); return v; }
    } catch (e) { console.warn("[LessonPlayer] error:", u, e?.message); }
  }
  return null;
};

const fetchCourseBySlug = async (slug) => {
  const urls = [
    `/api/courses/${slug}`,
    `/api/courses/slug/${slug}`,
    `/api/courses/bySlug/${slug}`,
    `/api/courses/fetchCourse/by/${slug}`,
    `/api/courses?slug=${encodeURIComponent(slug)}`,
  ];
  const hit = await tryUrls(urls, (r) => (r?.data?.course || r?.data)?._id && (r.data.course || r.data));
  if (hit) return hit;
  throw new Error("no slug route");
};

const fetchCourseById = async (id) => {
  const urls = [`/api/courses/byId/${id}`, `/api/courses/${id}`];
  const hit = await tryUrls(urls, (r) => (r?.data?.course || r?.data)?._id && (r.data.course || r.data));
  if (hit) return hit;
  throw new Error("no id route");
};

const fetchLesson = async (id, course, sectionId) => {
  const courseId = course?._id || course?.id;
  const params = {};
  if (courseId) params.courseId = courseId;
  if (sectionId) params.sectionId = sectionId;

  const tries = [
  { url: `/api/courses/lesson/${id}`, params },
];


  for (const t of tries) {
    try {
      const r = await API.get(
        t.url,
        Object.keys(params).length ? { params, validateStatus: (s) => s < 500 } : { validateStatus: (s) => s < 500 }
      );
      if (r?.status === 404) { console.warn("[LessonPlayer] 404:", t.url); continue; }
      const l = r?.data?.lesson || r?.data;
      if (l && (l._id || l.id)) return l;
    } catch (e) { console.warn("[LessonPlayer] lesson fetch error:", t.url, e?.message); }
  }
  throw new Error(`Lesson not found for id "${id}".`);
};

const findLessonInCourse = (course, id) => {
  if (!course || !Array.isArray(course.sections)) return null;
  for (const s of course.sections) {
    const hit = (s.lessons || []).find((l) => String(l._id || l.id) === String(id));
    if (hit) return hit;
  }
  return null;
};

const fetchCourseBySection = async (sectionId) => {
  const urls = [`/api/sections/${sectionId}`, `/api/courses/sections/${sectionId}`];
  const sec = await tryUrls(urls, (r) => r?.data?.section || r?.data);
  if (!sec) throw new Error("no section route");

  const courseSlug = sec.courseSlug || sec.course_slug || sec.slug;
  const courseKey  = sec.courseKey  || sec.course_key;
  const courseId   = sec.course || sec.courseId || sec.course_id || sec.courseID;

  const candidateSlug = courseSlug || courseKey;
  if (candidateSlug) { try { return await fetchCourseBySlug(candidateSlug); } catch {} }
  if (courseId) {
    if (isObjectId(String(courseId))) { try { return await fetchCourseById(String(courseId)); } catch {} }
    else { try { return await fetchCourseBySlug(String(courseId)); } catch {} }
  }

  const listUrls = [`/api/courses/public`, `/api/courses/list`];
  const hit = await tryUrls(listUrls, (r) => {
    const arr = r?.data?.courses || r?.data || [];
    return Array.isArray(arr) && arr.find((c) => {
      if (!c) return false;
      if (candidateSlug) return String(c.slug || "").toLowerCase() === String(candidateSlug).toLowerCase();
      if (courseId)      return String(c._id || c.id) === String(courseId);
      return false;
    });
  });
  if (hit) return hit;

  throw new Error("course not resolved from section");
};

const fetchCourseSmart = async (key, { lessonId, sectionId } = {}) => {
  try { return await fetchCourseBySlug(key); } catch {}

  if (isObjectId(key)) {
    try { return await fetchCourseById(key); } catch {}
  }

  if (lessonId) {
    try {
      const l = await fetchLesson(lessonId);
      const cid   = l?.course || l?.courseId || l?.course_id || l?.course?._id || l?.course?.id;
      const cslug = l?.courseSlug || l?.course_slug || l?.course?.slug;
      if (cslug) { try { return await fetchCourseBySlug(cslug); } catch {} }
      if (cid) { if (isObjectId(String(cid))) { try { return await fetchCourseById(String(cid)); } catch {} }
                 else { try { return await fetchCourseBySlug(String(cid)); } catch {} } }
    } catch {}
  }

  if (sectionId) { try { return await fetchCourseBySection(sectionId); } catch {} }

  const listUrls = [`/api/courses/public`, `/api/courses/list`];
  const hit = await tryUrls(listUrls, (r) => {
    const arr = r?.data?.courses || r?.data || [];
    return Array.isArray(arr) && arr.find((c) => {
      const slug = String(c?.slug || "").toLowerCase();
      const code = String(c?.code || c?.shortCode || "").toLowerCase();
      const k    = String(key).toLowerCase();
      return slug === k || (code && code === k);
    });
  });
  if (hit) return hit;

  throw new Error(`Course not found for key "${key}".`);
};

/* -------------------------------- component -------------------------------- */
export default function LessonPlayerPage() {
  const params = useParams();
  let { courseKey: fromCourseKey, courseSlug: fromSlug, courseId: fromId } = params;
  let { sectionId, lessonId } = params;

  if (lessonId === "undefined") lessonId = undefined;
  if (sectionId === "undefined") sectionId = undefined;

  const courseKey = fromCourseKey || fromSlug || fromId;
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialCompleted, setInitialCompleted] = useState(false);
  const [courseProgress, setCourseProgress] = useState({ percent: 0, completedLessonIds: [] });

  const [showUpNext, setShowUpNext] = useState(false);
  const [countDown, setCountDown] = useState(AUTO_ADVANCE_DELAY);
  const timerRef = useRef(null);
  const overlayArmedRef = useRef(false);
  const wrapRef = useRef(null);

  // responsive
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 991.98px)");
    const apply = () => setIsSmall(mq.matches);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else if (mq.addListener) mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else if (mq.removeListener) mq.removeListener(apply);
    };
  }, []);

  // fullscreen helpers
  const getFsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const requestFs = async () => {
    const el = wrapRef.current || document.documentElement;
    try {
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {}
  };
  const exitFs = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } catch {}
  };
  useEffect(() => {
    const shell = wrapRef.current;
    if (!shell) return;
    const onDblClick = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (["button", "a"].includes(tag)) return;
      if (getFsEl() === shell) exitFs(); else requestFs();
    };
    const onKeyDown = (e) => {
      if ((e.key || "").toLowerCase() !== "f") return;
      if (!shell.contains(document.activeElement) && !shell.contains(e.target)) return;
      e.preventDefault();
      if (getFsEl() === shell) exitFs(); else requestFs();
    };
    shell.addEventListener("dblclick", onDblClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      shell.removeEventListener("dblclick", onDblClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // remember last-opened lesson per course
  useEffect(() => {
    if (courseKey && sectionId && lessonId) {
      localStorage.setItem(`last:${courseKey}`, JSON.stringify({ sectionId, lessonId }));
    }
  }, [courseKey, sectionId, lessonId]);

  /* ---------------- loader ---------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!courseKey) throw new Error("courseKey missing in URL");

       const c = await fetchCourseSmart(courseKey, { lessonId, sectionId });
if (!alive) return;

// ✅ Sort lessons in each section by upload time (oldest first)
if (Array.isArray(c.sections)) {
  c.sections.forEach((sec) => {
    if (Array.isArray(sec.lessons)) {
      sec.lessons.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
    }
  });
}

setCourse(c);


        // resolve missing sid/lid
        let sid = sectionId;
        let lid = lessonId;

        if (!sid || !lid) {
          const raw = localStorage.getItem(`last:${c.slug || c._id || courseKey}`);
          if (raw) {
            try {
              const last = JSON.parse(raw);
              sid = sid || last.sectionId;
              lid = lid || last.lessonId;
            } catch {}
          }
        }
        if (!sid || !lid) {
          const first = (c.sections || []).find((s) => Array.isArray(s.lessons) && s.lessons.length > 0);
          if (first) {
            sid = String(first._id || first.id);
            lid = String(first.lessons[0]._id || first.lessons[0].id);
          }
        }

        // normalize URL
        const desiredKey = isObjectId(courseKey) ? (c._id || courseKey) : (c.slug || courseKey);
        if (!sectionId || !lessonId || sectionId !== sid || lessonId !== lid) {
          if (sid && lid) {
            navigate(buildLessonPath(desiredKey, sid, lid), { replace: true });
            return;
          }
        }

        // lesson
        let l = findLessonInCourse(c, lid);
        if (!l) l = await fetchLesson(lid, c, sid);
        // 🟦 Load full quiz lesson for student
if (l?.type === "quiz") {
  try {
    const full = await API.get(`/api/quiz/${c._id}/${l._id}`);
    if (full?.data?.lesson) {
      l = full.data.lesson; // override shallow lesson
    }
  } catch (err) {
    console.error("Quiz full load failed:", err);
  }
}


        if (!alive) return;
        setLesson(l);
      } catch (e) {
        console.error("LessonPlayer load error:", e?.response?.data || e.message);
        toast.error("Course/Lesson not found. Check backend routes.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [courseKey, sectionId, lessonId, navigate]);

  /* ---------------- progress (guarded) ---------------- */
const refreshCourseProgress = useCallback(async () => {
  if (!PROG_ENABLED) return;

  try {
    const slug = course?.slug || course?._id;
    if (!slug) return;

    // 🔵 1. UI total lessons (fresh count)
    const uiTotalLessons = Array.isArray(course?.sections)
      ? course.sections.reduce(
          (sum, sec) =>
            sum + (Array.isArray(sec.lessons) ? sec.lessons.length : 0),
          0
        )
      : 0;

    // 🔵 2. Fetch backend progress
    const p = await getCourseProgress(slug);

    if (!p) return;

    // 🔵 3. backend completed ids/count
    const backendCompleted = Array.isArray(p?.completedLessonIds)
      ? p.completedLessonIds.length
      : Number(p?.completedLessons) || 0;

    // 🔵 4. Remove completed IDs that no longer exist (deleted lessons)
    const validCompleted = Array.isArray(p?.completedLessonIds)
      ? p.completedLessonIds.filter((id) =>
          course.sections.some((sec) =>
            (sec.lessons || []).some(
              (l) => String(l._id) === String(id)
            )
          )
        ).length
      : backendCompleted;

    // 🔵 5. Final total must not be 0
    const finalTotal = Math.max(uiTotalLessons, 1);

    // 🔵 6. Safe percent (0–100)
    let finalPercent = Math.round((validCompleted / finalTotal) * 100);
    finalPercent = Math.min(100, Math.max(0, finalPercent));

    // 🔵 7. Update UI
    setCourseProgress({
      percent: finalPercent,
      completedLessonIds: p.completedLessonIds || [],
    });

    console.log(
      `[Progress Sidebar] ${validCompleted}/${finalTotal} → ${finalPercent}%`
    );
  } catch (err) {
    console.error("[Progress Sidebar] refreshCourseProgress error:", err);
  }
}, [course?.slug, course?.sections]);




  useEffect(() => { refreshCourseProgress(); }, [refreshCourseProgress]);

  // initial completed state for non-video marker
  useEffect(() => {
    if (!PROG_ENABLED) return;
    let alive = true;
    (async () => {
      try {
        if (!lesson?._id) return;
        const res = await API.get("/api/video-progress", {
          params: { courseSlug: course?.slug || courseKey, lessonId: lesson._id },
          validateStatus: (s) => s < 500,
        });
        if (!alive) return;
        setInitialCompleted(Boolean(res?.data?.completed));
      } catch {
        if (alive) setInitialCompleted(false);
      }
    })();
    return () => { alive = false; };
  }, [course?.slug, courseKey, lesson?._id]);

  /* ---------------- navigation helpers ---------------- */
  const section = useMemo(() => {
    if (!course || !Array.isArray(course.sections)) return null;
    return course.sections.find((s) => String(s?._id || s?.id || "") === String(sectionId || ""));
  }, [course, sectionId]);

  const flatLessons = useMemo(() => {
    if (!course || !Array.isArray(course.sections)) return [];
    const out = [];
    course.sections.forEach((s) =>
      (s.lessons || []).forEach((l) =>
        out.push({ sectionId: s._id || s.id, lessonId: l._id || l.id, title: l.title, type: l.type })
      )
    );
    return out;
  }, [course]);

  const currentIndex = useMemo(
    () => flatLessons.findIndex((x) => String(x.lessonId) === String(lessonId)),
    [flatLessons, lessonId]
  );

  const prevPath = useMemo(() => {
    if (currentIndex <= 0) return null;
    const p = flatLessons[currentIndex - 1];
    const k = course?.slug || course?._id || courseKey;
    return buildLessonPath(k, p.sectionId, p.lessonId);
  }, [currentIndex, flatLessons, course, courseKey]);

  const nextPath = useMemo(() => {
    if (currentIndex < 0 || currentIndex + 1 >= flatLessons.length) return null;
    const n = flatLessons[currentIndex + 1];
    const k = course?.slug || course?._id || courseKey;
    return buildLessonPath(k, n.sectionId, n.lessonId);
  }, [currentIndex, flatLessons, course, courseKey]);

  const goPrev = () => prevPath && navigate(prevPath);
  const goNext = () => { if (nextPath) navigate(nextPath); };

  /* ---------------- overlay + end handling ---------------- */
  const startOverlay = useCallback(() => {
    if (!nextPath) return;
    if (overlayArmedRef.current) return;
    overlayArmedRef.current = true;
    setCountDown(AUTO_ADVANCE_DELAY);
    setShowUpNext(true);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountDown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setShowUpNext(false);
          overlayArmedRef.current = false;
          goNext();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [nextPath]);

  const cancelOverlay = useCallback(() => {
    clearInterval(timerRef.current);
    setShowUpNext(false);
    overlayArmedRef.current = false;
  }, []);
  const playNow = useCallback(() => {
    clearInterval(timerRef.current);
    setShowUpNext(false);
    overlayArmedRef.current = false;
    goNext();
  }, [goNext]);
  useEffect(() => () => clearInterval(timerRef.current), []);

 const onVideoEnded = useCallback(async () => {
  try {
    if (PROG_ENABLED && lesson?._id) {
      // ⏺️ 1. Send full completion update to backend
      await putLessonProgress({
        lessonId: lesson._id,
        courseSlug: course?.slug || courseKey,
        percent: 100,
        completed: true,
        watchedSeconds: Number(lesson?.duration || 0),
        duration: Number(lesson?.duration || 0),
      });

      // ⏺️ 2. Also mark the lesson as complete (legacy alias)
      await markLessonComplete(lesson._id, true, course?.slug || courseKey);
    }
  } catch (err) {
    console.error("[onVideoEnded] Error updating progress:", err);
  } finally {
    // ⏺️ 3. Refresh progress circle + start next video overlay
    await refreshCourseProgress();
    startOverlay();
  }
}, [lesson?._id, lesson?.duration, course?.slug, courseKey, refreshCourseProgress, startOverlay]);


  /* ---------------- render ---------------- */
  const lessonForRender = useMemo(() => {
    if (!lesson) return lesson;
    const url = resolvePlayableUrl(lesson);

    if (lc(lesson.type) === "live") {
      return { ...lesson, liveResolvedUrl: url || null, type: "live" };
    }

    if (!url) return { ...lesson, __noMedia: true };

    const ltype = lc(lesson.type);
    const isPdfLike = ltype === "pdf" || /\.pdf(?:$|\?)/i.test(url);
    const isVideoLike = ltype === "video" || /\.(mp4|webm|m3u8)(?:$|\?)/i.test(url) || url.includes("/api/media/stream?key=");
    const finalType = isVideoLike ? "video" : (isPdfLike ? "pdf" : (lesson.type || "video"));

    return { ...lesson, fileUrl: url, url, videoUrl: url, type: finalType };
  }, [lesson]);

  if (loading) return <div className="container py-5">Loading lesson…</div>;
  if (!course || !lessonForRender) return <div className="container py-5 text-danger">Lesson not found</div>;

  const mobilePct = Math.round(Number(courseProgress.percent) || 0);

  const overlayUI = (
    <Backdrop
      open
      sx={{
        color: "#fff",
        position: "fixed",
        inset: 0,
        zIndex: 2147483650,
        background: "rgba(6,10,25,.72)",
        backdropFilter: "blur(2px)",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          position: "relative",
          width: { xs: "92%", sm: 520 },
          textAlign: "center",
          bgcolor: "#111827",
          color: "#F9FAFB",
          borderRadius: 3,
          p: { xs: 2.5, sm: 4 },
          overflow: "hidden",
          zIndex: 2147483651,
        }}
      >
        <IconButton aria-label="Cancel auto play" onClick={cancelOverlay} sx={{ position: "absolute", top: 8, right: 8 }}>
          <CloseRoundedIcon sx={{ color: "#F9FAFB" }} />
        </IconButton>
        <IconButton
          aria-label="Play next"
          onClick={playNow}
          sx={{ width: 64, height: 64, border: "2px solid #F9FAFB", borderRadius: "50%", mb: 2 }}
        >
          <PlayArrowRoundedIcon sx={{ color: "#F9FAFB", fontSize: 40 }} />
        </IconButton>
        <Typography sx={{ color: "#D1D5DB", fontSize: 14 }}>
          Playing next automatically{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "#F9FAFB" }}>in {countDown}s…</Box>
        </Typography>
      </Paper>

      <IconButton aria-label="Previous lesson" onClick={goPrev} disabled={!prevPath} className="overlay-nav prev"
        sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}>
        <ChevronLeftRoundedIcon className="overlay-icon" />
      </IconButton>
      <IconButton aria-label="Next lesson" onClick={() => { if (!showUpNext) goNext(); }} disabled={!nextPath} className="overlay-nav next"
        sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
        <ChevronRightRoundedIcon className="overlay-icon" />
      </IconButton>
    </Backdrop>
  );

  return (
    <div className="container-fluid py-3">
      <div className="row g-3">
        <div className={sidebarOpen ? "col-lg-8 col-12" : "col-12"}>
          {/* top bar */}
          <div className="lesson-topbar d-lg-flex justify-content-between align-items-center mb-2">
            <div className="text-muted small type-label">
              {String(lessonForRender?.type || "").toUpperCase()}
              {section ? ` • ${section.title}` : ""}
            </div>

            <div className="actions">
              {isSmall && (
                <span className="badge bg-light text-dark progress-pill" style={{ fontWeight: 700, border: "1px solid #e5e7eb" }} aria-label={`Course progress ${mobilePct}%`}>
                  {mobilePct}% complete
                </span>
              )}
              <button className="btn btn-outline-secondary btn-sm d-inline-flex d-lg-none content-btn" onClick={() => setSidebarOpen(true)} title="Course content" type="button">
                <MenuBookRoundedIcon style={{ fontSize: 18, marginRight: 6 }} />
                Content
              </button>
              {!sidebarOpen && (
                <button className="btn btn-outline-secondary btn-sm d-none d-lg-inline-flex" onClick={() => setSidebarOpen(true)} title="Show course content" type="button">
                  Show Content ◂
                </button>
              )}
            </div>
          </div>

          {/* player */}
          <div className="card p-3 p-md-2 p-lg-3">
            <div ref={wrapRef} className="lesson-overlay-wrap" style={{ position: "relative" }} tabIndex={-1}>
             {lc(lessonForRender.type) === "quiz" ? (
    <LessonRenderer 
      lesson={lessonForRender} 
      course={course} 
    />
) : lessonForRender.__noMedia ? (
    <div className="text-danger fw-semibold">
      No playable URL for this lesson...
    </div>
) : lc(lessonForRender.type) === "live" ? (

                <div className="d-flex justify-content-center align-items-center" style={{ height: 420 }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => openLiveFromLesson(lessonForRender)}
                    type="button"
                  >
                    Join live session
                  </button>
                </div>
              ) : (
                <LessonRenderer
                  lesson={lessonForRender}
                  course={course}
                  onVideoEnded={onVideoEnded}
                  fullscreenTargetRef={wrapRef}
                />
              )}

              <IconButton aria-label="Previous lesson" onClick={goPrev} disabled={!prevPath} className="overlay-nav prev">
                <ChevronLeftRoundedIcon className="overlay-icon" />
              </IconButton>
              <IconButton aria-label="Next lesson" onClick={() => { if (!showUpNext) goNext(); }} disabled={!nextPath} className="overlay-nav next">
                <ChevronRightRoundedIcon className="overlay-icon" />
              </IconButton>

              <FullscreenAwarePortal open={showUpNext} fallbackRef={wrapRef}>
                {overlayUI}
              </FullscreenAwarePortal>
            </div>

            {/* Non-video lessons → manual complete (only when progress is enabled) */}
            {lc(lessonForRender?.type) !== "video" && PROG_ENABLED && (
              <div className="mt-3">
                <MarkComplete
                  lessonId={lesson?._id || lesson?.id}
                  defaultCompleted={initialCompleted}
                  onProgressChanged={refreshCourseProgress}
                  onCompleted={startOverlay}
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        {sidebarOpen && !isSmall && (
          <div className="col-lg-4 d-none d-lg-block">
            <SyllabusSidebar
              course={course}
              currentLessonId={lesson?._id || lesson?.id || lessonId}
              onOpenChange={setSidebarOpen}
              progressPercent={courseProgress.percent}
              completedLessonIds={courseProgress.completedLessonIds}
            />
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={isSmall && sidebarOpen} onClose={() => setSidebarOpen(false)} PaperProps={{ sx: { width: "88vw", maxWidth: 420 } }}>
        <div className="drawer-header d-flex align-items-center justify-content-between px-3 py-2">
          <strong>Course content</strong>
          <button className="btn btn-sm btn-light" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" type="button">
            <CloseRoundedIcon fontSize="small" />
          </button>
        </div>
        <div className="drawer-body">
          <SyllabusSidebar
            course={course}
            currentLessonId={lesson?._id || lesson?.id || lessonId}
            onOpenChange={setSidebarOpen}
            progressPercent={courseProgress.percent}
            completedLessonIds={courseProgress.completedLessonIds}
            renderMobile
          />
        </div>
      </Drawer>
    </div>
  );
}
