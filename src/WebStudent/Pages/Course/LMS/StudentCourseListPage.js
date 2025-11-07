// src/MockTest/page/LMS/LMS_Pages/StudentCourseListPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
// ✅ centralized axios wrapper
import API from "../../../../LoginSystem/axios";

/* -------------------------------------------------------
   Config
------------------------------------------------------- */
const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

/* -------------------------------------------------------
   Image helpers
------------------------------------------------------- */
function resolveCourseImage(course) {
  const candidates = [
    course?.image,
    course?.thumbnail,
    course?.wallpaperUrl,
    course?.wallpaper,
  ].filter((s) => typeof s === "string" && s.trim() !== "");

  if (candidates.length === 0) {
    return "https://via.placeholder.com/400x200.png?text=Course+Image";
  }

  const raw = candidates[0].trim();

  // absolute http(s)
  if (/^https?:\/\//i.test(raw)) return raw;

  // data URL
  if (/^data:/i.test(raw)) return raw;

  // backend static path (e.g., /uploads/a.jpg or uploads/a.jpg)
  if (/^(\/)?uploads\//i.test(raw)) {
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${API_BASE}${path}`;
  }

  // looks like base64-only string
  if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length > 100) {
    return `data:image/*;base64,${raw}`;
  }

  // anything else: try to join as relative
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  return raw || "https://via.placeholder.com/400x200.png?text=Course+Image";
}

const normalizeImageField = (course) => {
  const img = course?.image;

  if (img && typeof img === "object" && img.type === "Buffer" && Array.isArray(img.data)) {
    try {
      const bytes = new Uint8Array(img.data);

      // Maybe it's actually a data URL string serialized as bytes
      let asText = "";
      try {
        asText = new TextDecoder().decode(bytes);
      } catch (_) {}
      if (asText && /^data:[^;]+;base64,/.test(asText)) {
        return { ...course, image: asText };
      }

      // Otherwise, convert raw bytes to base64 data URL
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = window.btoa(binary);
      const ct = course?.imageContentType || "image/*";
      return { ...course, image: `data:${ct};base64,${b64}` };
    } catch {
      return course;
    }
  }

  return course;
};

/* -------------------------------------------------------
   Data helpers
------------------------------------------------------- */
const objectIdDate = (id) => {
  if (!id || typeof id !== "string" || id.length < 8) return new Date(0);
  const ts = parseInt(id.substring(0, 8), 16) * 1000;
  return new Date(ts);
};

const getCreatedDate = (course) => {
  if (course?.createdAt) return new Date(course.createdAt);
  return objectIdDate(course?._id);
};

// ✅ NEW: count only *real* sections/lessons (ignore synthetic "Unassigned")
const countRealLessons = (course) =>
  (course?.sections || [])
    .filter(
      (s) =>
        s &&
        !String(s._id || "").startsWith("unassigned-") &&
        String(s.title || "").toLowerCase() !== "unassigned"
    )
    .reduce((sum, s) => sum + (Array.isArray(s.lessons) ? s.lessons.length : 0), 0);

// Normalize whatever shape the backend returns into [{...course}]
function normalizeCourseList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.courses)) return payload.courses;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.course) return [payload.course];
  return [];
}

/* -------------------------------------------------------
   Smart fetcher: tries several endpoints in order until one works
------------------------------------------------------- */
async function fetchCoursesSmart() {
  const endpoints = [
    "/api/courses/student-visible-courses", // intended endpoint
    "/api/courses/public",
    "/api/courses/list",
    "/api/courses",
    "/api/courses/all",
  ];

  let lastErr = null;

  for (const path of endpoints) {
    try {
      const res = await API.get(path);
      const list = normalizeCourseList(res?.data);
      if (list.length) return list;
      // if empty, keep trying
    } catch (e) {
      lastErr = e;
    }
  }

  if (lastErr) throw lastErr;
  return [];
}

/* -------------------------------------------------------
   Component
------------------------------------------------------- */
export default function StudentCourseListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const rawList = await fetchCoursesSmart();

        // image normalization
        const list = rawList.map(normalizeImageField);

        // sort: published first, then newest
        const sorted = list.slice().sort((a, b) => {
          const aPub = String(a.status || "").toLowerCase() === "published" ? 1 : 0;
          const bPub = String(b.status || "").toLowerCase() === "published" ? 1 : 0;
          if (aPub !== bPub) return bPub - aPub;
          return getCreatedDate(b) - getCreatedDate(a);
        });

        if (alive) {
          setCourses(sorted);
          setErrorMsg("");
        }
      } catch (err) {
        console.error("❌ Error fetching courses:", err);
        const detail =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Internal Server Error";
        if (alive) setErrorMsg(`Failed to load courses (${detail}).`);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const totalCourses = useMemo(() => courses.length, [courses]);

  return (
    <div className="container mt-5">
      <h2 className="mb-4 fw-bold">Available Courses</h2>

      {loading && <p>Loading courses…</p>}

      {!loading && errorMsg && (
        <div className="alert alert-danger" role="alert">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && totalCourses === 0 && <p>No courses found.</p>}

      {!loading && !errorMsg && totalCourses > 0 && (
        <div className="row">
          {courses.map((course) => {
            const lessonCount = countRealLessons(course);

            return (
              <div className="col-md-4 mb-4" key={course._id || course.slug}>
                <Link
                  to={`/student/course/${course._id || course.slug}`}
                  className="text-decoration-none text-dark"
                >
                  <div className="card h-100 shadow-sm rounded-4">
                    <img
                      src={resolveCourseImage(course)}
                      className="card-img-top rounded-top-4"
                      alt={course.title || "Course"}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title fw-semibold">{course.title || "Untitled course"}</h5>

                      {/* ✅ Fixed: ignore synthetic Unassigned lessons */}
                      <p className="card-text text-muted">
                        {lessonCount} Lesson{lessonCount === 1 ? "" : "s"}
                      </p>

                      <p className="card-text fw-bold">
                        {course.isFree ? (
                          <span className="text-success">FREE</span>
                        ) : (
                          (course.price != null ? `₹ ${course.price}` : "Paid")
                        )}
                      </p>
                      <div className="mt-auto">
                        <span className="btn btn-outline-primary w-100">
                          View Course
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
