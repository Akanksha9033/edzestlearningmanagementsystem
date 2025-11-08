// Web/src/WebStudent/Pages/Course/LMS/LMS_Pages/CoursesPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../../../LoginSystem/axios";
import { useAuth } from "../../../../../LoginSystem/context/AuthContext";
const API_BASE = process.env.REACT_APP_API_URL || "";
// ADD: absolute placeholder + url checker
const PLACEHOLDER = "/no-image.png"; // public/no-image.png rakho (ya CDN URL use karo)
const isHttpUrl = (u) => { try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; } catch { return false; } };

const CoursesPage = () => {
  const { user, ready } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ---------- image helpers ----------
  const normalizeImageField = (course) => {
    const img = course?.image;
    const safeAtob = (str) => {
      try { if (typeof atob === "function") return atob(str); } catch (_) {}
      return "";
    };

    // { base64: "..." }
    if (img && typeof img === "object" && typeof img.base64 === "string") {
      const b64 = img.base64;
      const ascii = safeAtob(b64);
      if (ascii && ascii.startsWith("data:")) return { ...course, image: ascii };
      const ct = course?.imageContentType || "image/*";
      return { ...course, image: `data:${ct};base64,${b64}` };
    }

    // { $binary: { base64: "..." } }
    if (img && typeof img === "object" && img.$binary && typeof img.$binary.base64 === "string") {
      const b64 = img.$binary.base64;
      const ascii = safeAtob(b64);
      if (ascii && ascii.startsWith("data:")) return { ...course, image: ascii };
      const ct = course?.imageContentType || "image/*";
      return { ...course, image: `data:${ct};base64,${b64}` };
    }

    // Buffer { type: "Buffer", data: [...] }
    if (img && typeof img === "object" && img.type === "Buffer" && Array.isArray(img.data)) {
      try {
        const bytes = new Uint8Array(img.data);
        try {
          const asText = new TextDecoder().decode(bytes);
          if (asText && /^data:[^;]+;base64,/.test(asText)) return { ...course, image: asText };
        } catch (_) {}
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const b64 = window.btoa(bin);
        const ct = course?.imageContentType || "image/*";
        return { ...course, image: `data:${ct};base64,${b64}` };
      } catch {
        return course;
      }
    }

    return course;
  };

  const resolveCourseImage = (course) => {
    const candidates = [
      course?.image,
      course?.thumbnail,
      course?.wallpaperUrl,
      course?.wallpaper,
    ].filter((s) => typeof s === "string" && s.trim() !== "");

    if (!candidates.length) return PLACEHOLDER;

    const raw = candidates[0].trim();

    // keep valid absolute/data urls
    if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw)) return raw;

    // server static under /uploads
    if (/^(\/)?uploads\//i.test(raw)) {
      const path = raw.startsWith("/") ? raw : `/${raw}`;
      return `${API_BASE}${path}`;
    }

    // bare base64 once → data url
    if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length > 100) {
      const ct = course?.imageContentType || "image/*";
      return `data:${ct};base64,${raw}`;
    }

    // any other relative/unknown → hard placeholder (no "300?text=...")
    return PLACEHOLDER;
  };

  const getCreatedDate = (course) => {
    if (course?.createdAt) return new Date(course.createdAt);
    if (course?._id && typeof course._id === "string" && course._id.length >= 8) {
      const ts = parseInt(course._id.substring(0, 8), 16) * 1000;
      return new Date(ts);
    }
    return new Date(0);
  };

  // ---------- load ----------
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const res = await API.get("/api/courses");
        const rawList = res.data.courses || [];
        const normalized = rawList.map(normalizeImageField);
        const sorted = normalized.slice().sort((a, b) => getCreatedDate(b) - getCreatedDate(a));
        setCourses(sorted);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  if (!ready || loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const isStaff = ["admin", "teacher"].includes(String(user?.role || "").toLowerCase());

  // ---------- DELETE: handler (ADDED) ----------
  const handleDeleteCourse = async (e, id) => {
    e.stopPropagation(); // card ke onClick se navigation na ho
    if (!window.confirm("Delete this course and all its sections/lessons?")) return;
    try {
      await API.delete(`/api/courses/${id}`);
      // UI se turant card hata do
      setCourses(prev => prev.filter(c => String(c._id) !== String(id)));
      try { localStorage.removeItem("coursesCache"); } catch {}
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed. Please check server logs.");
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Available Courses</h3>

        {isStaff && (
          <button className="btn btn-primary" onClick={() => navigate("/create-course")}>
            + Create Course
          </button>
        )}
      </div>

      <div className="row">
        {courses.map((course) => {
          const firstSectionId = course.sections?.[0]?._id;

          return (
            <div
              key={course._id}
              className="col-md-4 mb-4"
              onClick={() => {
                if (isStaff) {
                  navigate(
                    firstSectionId
                      ? `/course/${course._id}/section/${firstSectionId}`
                      : `/course/${course._id}`
                  );
                } else if (String(user?.role).toLowerCase() === "student") {
                  navigate(`/student/course/${course._id}`);
                } else {
                  navigate(`/course/${course._id}`);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="card shadow-sm h-100">
                <img
                  src={resolveCourseImage(course)}
                  className="card-img-top"
                  alt={course.title || "Course Cover"}
                  style={{ height: "180px", objectFit: "cover" }}
                  onError={(e) => {
                    // one-shot fallback: infinite loop se bacho
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied === "1") return;
                    img.dataset.fallbackApplied = "1";
                    img.src = PLACEHOLDER;
                  }}
                />

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">
                    {`${
  (course.sections || [])
    .filter(
      (s) =>
        s &&
        !String(s._id || "").startsWith("unassigned-") &&
        String(s.title || "").toLowerCase() !== "unassigned"
    )
    .reduce((sum, s) => sum + (Array.isArray(s.lessons) ? s.lessons.length : 0), 0)
} Lessons`} •{" "}

                    {course.duration || "0 hrs"}
                  </p>
                  <p className="card-text fw-bold">₹{course.price || 0}</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span
                      className={`badge ${
                        String(course.status || "").toLowerCase() === "published"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {course.status || "Draft"}
                    </span>

                    {/* DELETE button — only staff, and stops navigation */}
                    {isStaff && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => handleDeleteCourse(e, course._id)}
                        title="Delete Course"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {courses.length === 0 && (
          <div className="col-12">
            <div className="alert alert-info">No courses available yet.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
