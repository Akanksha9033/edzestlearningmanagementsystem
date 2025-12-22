// components/DeleteEntityButton.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../../LoginSystem/axios";

export default function DeleteEntityButton({
  deleteType = "section",
  courseId,
  sectionId,
  lessonId,
  onDeleted,
  className = "btn btn-outline-danger",
  children,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ---------------- Helpers ---------------- */

  // Treat ONLY the "unassigned" bucket (with optional suffix) as virtual
  const isVirtualUnassigned = (sid) => {
    const s = String(sid || "").trim().toLowerCase();
    // matches: "unassigned", "unassigned-xxxx", "unassigned_xxxx"
    return /^unassigned(?:[-_].+)?$/.test(s);
  };

  // Try a list of endpoints in order until one succeeds (2xx)
  const tryDeleteInOrder = async (urls) => {
    let lastErr;
    for (const url of urls) {
      try {
        await API.delete(url);
        return true;
      } catch (err) {
        lastErr = err;
      }
    }
    if (lastErr) throw lastErr;
    return false;
  };

  /* ---------------- Verifiers (best-effort) ---------------- */

  const verifyCourseGone = async (cid) => {
    try {
      await API.get(`/api/courses/${encodeURIComponent(cid)}`);
      return false; // still exists
    } catch (err) {
      return err?.response?.status === 404;
    }
  };

  const verifySectionGoneFromCourse = async (cid, sid) => {
    if (isVirtualUnassigned(sid)) return true; // nothing real to verify

    try {
      // Direct probe
      await API.get(
        `/api/courses/${encodeURIComponent(cid)}/section/${encodeURIComponent(sid)}`
      );
      return false; // 200 => still exists
    } catch (err) {
      if (err?.response?.status === 404) return true;

      // Fallback: check via course payload
      try {
        const res = await API.get(`/api/courses/${encodeURIComponent(cid)}`);
        const course = res?.data?.course || res?.data;
        if (!Array.isArray(course?.sections)) return true;
        const stillThere = course.sections.some(
          (s) => String(s?._id) === String(sid)
        );
        return !stillThere;
      } catch {
        // If fallback fails (network/etc.), assume gone to avoid noisy warnings
        return true;
      }
    }
  };

  const verifyLessonGoneFromCourse = async (cid, sid, lid) => {
    try {
      const res = await API.get(`/api/courses/${encodeURIComponent(cid)}`);
      const course = res?.data?.course || res?.data;
      const sec = (course?.sections || []).find(
        (s) => String(s?._id) === String(sid)
      );
      if (!sec) return true; // section already gone
      const stillThere =
        (sec.lessons || []).some((l) => String(l?._id) === String(lid));
      return !stillThere;
    } catch (err) {
      return err?.response?.status === 404;
    }
  };

  /* ---------------- Delete flows ---------------- */

  const deleteCourse = async () => {
    if (!courseId) {
      alert("Course ID is missing.");
      return;
    }
    if (
      !window.confirm(
        "This will permanently delete the entire course and all its sections/lessons. Continue?"
      )
    )
      return;

    setLoading(true);
    try {
      await tryDeleteInOrder([
        `/api/courses/${encodeURIComponent(courseId)}?hard=true`,
        `/api/courses/${encodeURIComponent(courseId)}`,
      ]);

      const gone = await verifyCourseGone(courseId);
      if (!gone) {
        alert(
          "The course was removed from the UI, but it still appears to exist in the database. Please check server deletion."
        );
      } else {
        alert("✅ Course deleted successfully.");
      }

      if (typeof onDeleted === "function") onDeleted();
      else navigate(`/courses`);
    } finally {
      setLoading(false);
    }
  };

  const deleteSection = async () => {
    if (!courseId || !sectionId) {
      alert("Course ID or Section ID is missing.");
      return;
    }

    if (isVirtualUnassigned(sectionId)) {
      alert(
        "“Unassigned” is a virtual section. It can’t be deleted. Please move or delete the lessons inside it."
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this section and all its lessons?"
      )
    )
      return;

    setLoading(true);
    try {
      await tryDeleteInOrder([
        `/api/courses/${encodeURIComponent(courseId)}/section/${encodeURIComponent(sectionId)}?hard=true`,
        `/api/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}?hard=true`,
        `/api/courses/sections/${encodeURIComponent(sectionId)}?hard=true`,
        `/api/courses/${encodeURIComponent(courseId)}/section/${encodeURIComponent(sectionId)}`,
      ]);

      const gone = await verifySectionGoneFromCourse(courseId, sectionId);
      if (!gone) {
        alert(
          "The section was removed from the UI, but it still appears to exist in the database. Please check server deletion."
        );
      } else {
        alert("✅ Section deleted successfully.");
      }

      if (typeof onDeleted === "function") onDeleted(sectionId);
      else navigate(0); // Hard refresh as safe default
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async () => {
    if (!courseId || !sectionId || !lessonId) {
      alert("Course/Section/Lesson ID is missing.");
      return;
    }
    if (!window.confirm("Delete this lesson permanently?")) return;

    setLoading(true);
    try {
      await tryDeleteInOrder([
        `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
        `/api/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}`,
        `/api/courses/lessons/${encodeURIComponent(lessonId)}`,
        `/api/lessons/${encodeURIComponent(lessonId)}`,
        `/api/courses/${encodeURIComponent(courseId)}/lesson/${encodeURIComponent(lessonId)}`,
      ]);

      const gone = await verifyLessonGoneFromCourse(
        courseId,
        sectionId,
        lessonId
      );
      if (!gone) {
        alert(
          "The lesson was removed from the UI, but it still appears to exist in the database. Please check server deletion."
        );
      } else {
        alert("✅ Lesson deleted.");
      }

      if (typeof onDeleted === "function") onDeleted();
      else navigate(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === "course") return await deleteCourse();
      if (deleteType === "lesson") return await deleteLesson();
      return await deleteSection();
    } catch (err) {
      console.error("❌ Delete failed:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message || err?.message || "Delete failed.";
      alert(msg);
      setLoading(false);
    }
  };

  const label =
    children ||
    (deleteType === "course"
      ? "Delete Course"
      : deleteType === "lesson"
      ? "Delete Lesson"
      : "Delete Section");

  return (
    <button
      className={className}
      onClick={handleDelete}
      title={label}
      disabled={loading}
    >
      {loading ? `${label}…` : label}
    </button>
  );
}
