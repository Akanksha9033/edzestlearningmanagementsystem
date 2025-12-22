import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import LessonDrawer from "../LessonDrawer";
import SectionBuilderUI from "../SectionBuilderUI";

import { useAuth } from "../../../../../LoginSystem/context/AuthContext";
import API from "../../../../../LoginSystem/axios";
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// --- helper: detect virtual "Unassigned" bucket ids ---
const isVirtualUnassigned = (sid) => {
  const s = String(sid || "").trim().toLowerCase();
  // matches "unassigned" and "unassigned-<courseId>" (or any suffix)
  return /^unassigned(?:[-_].+)?$/.test(s);
};

const SectionBuilder = () => {
  const { user, ready } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [sections, setSections] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [showAddSectionDrawer, setShowAddSectionDrawer] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");

  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const sectionRefs = useRef({});

  useEffect(() => {
    if (!ready) return;
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, ready]);

  const fetchSections = async () => {
    try {
      let res = await API.get(`/api/courses/${courseId}`);
      let course = res.data?.course || {};
      let sectionsResp = Array.isArray(course.sections) ? course.sections : [];

      // if lessons look empty, try the fallback
      const totalLessons =
        sectionsResp.reduce(
          (sum, s) => sum + (Array.isArray(s.lessons) ? s.lessons.length : 0),
          0
        ) || 0;

      if (sectionsResp.length > 0 && totalLessons === 0) {
        try {
          const res2 = await API.get(`/api/courses/fetchCourse/by/${courseId}`);
          const course2 = res2.data?.course || {};
          const sections2 = Array.isArray(course2.sections) ? course2.sections : [];
          const totalLessons2 =
            sections2.reduce(
              (sum, s) => sum + (Array.isArray(s.lessons) ? s.lessons.length : 0),
              0
            ) || 0;
          if (totalLessons2 > 0) sectionsResp = sections2;
        } catch (e) {
          console.warn("Fallback route fetch failed:", e?.response?.data || e?.message);
        }
      }

      const normalized = sectionsResp.map((s) => ({
        ...s,
        lessons: Array.isArray(s.lessons) ? s.lessons : [],
        expanded: Boolean(s.expanded),
      }));

      setSections(normalized);
    } catch (err) {
      console.error("Failed to fetch sections:", err?.response?.data || err);
    }
  };

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) return;
    const exists = sections.some(
      (s) => s.title.trim().toLowerCase() === sectionTitle.trim().toLowerCase()
    );
    if (exists) {
      alert("Section with this title already exists.");
      return;
    }

    try {
      const res = await API.post(`/api/courses/${courseId}/add-section`, {
        title: sectionTitle,
      });

      const newSection = res.data.section;
      if (!newSection._id) return;

      const updatedSections = [
        ...sections,
        { ...newSection, expanded: false, lessons: [] },
      ];
      setSections(updatedSections);
      setSectionTitle("");
      setShowAddSectionDrawer(false);

      setTimeout(() => {
        const element = sectionRefs.current[newSection._id];
        if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    } catch (err) {
      console.error("Error creating section:", err);
    }
  };

  const handleUpdateSectionTitle = async (id) => {
    try {
      await API.put(`/api/courses/${courseId}/section/${id}`, {
        title: editingTitle,
      });
      setSections((prev) =>
        prev.map((s) => (s._id === id ? { ...s, title: editingTitle } : s))
      );
      setEditingSectionId(null);
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  const handleToggleExpand = (index) => {
    const updated = [...sections];
    updated[index].expanded = !updated[index].expanded;
    setSections(updated);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSections(reordered);

    try {
      await API.patch(`/api/courses/${courseId}/reorder-sections`, {
        sectionIds: reordered.map((s) => s._id),
      });
    } catch (err) {
      console.error("Failed to sync section order:", err);
    }
  };

  const handleOpenDrawer = (sectionId) => {
    setSelectedSectionId(sectionId);
    setLessonTitle("");
    setLessonType("");
    setUploadedUrl("");
    setShowDrawer(true);
  };

  if (!ready) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading auth…</span>
        </div>
      </div>
    );
  }

  // hide the virtual "Unassigned" section from UI
  const filteredSections = (sections || []).filter((s) => {
    const sid = s?._id ?? s?.id ?? s?.slug;
    return !isVirtualUnassigned(sid);
  });

  return (
    <div className="container py-4">
        {/* 🔙 Back Button */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">📚 Section Builder</h4>
        <Link to={`/course/settings/${courseId}`}>
          <button className="btn btn-outline-primary">Settings</button>
        </Link>
      </div>

      <SectionBuilderUI
        sections={filteredSections}
        onDragEnd={handleDragEnd}
        onToggleExpand={handleToggleExpand}
        editingSectionId={editingSectionId}
        editingTitle={editingTitle}
        setEditingSectionId={setEditingSectionId}
        setEditingTitle={setEditingTitle}
        onSaveTitle={handleUpdateSectionTitle}
        handleOpenDrawer={handleOpenDrawer}
        courseId={courseId}
        navigate={navigate}
        sectionRefs={sectionRefs}
      />

      <div
        className="border border-2 rounded mt-3 p-4 text-center bg-light"
        style={{ cursor: "pointer" }}
        onClick={() => setShowAddSectionDrawer(true)}
      >
        + Add Section
      </div>

      {showDrawer && (
        <LessonDrawer
          courseId={courseId}
          selectedSectionId={selectedSectionId}
          setLessonTitle={setLessonTitle}
          setLessonType={setLessonType}
          setUploadedUrl={setUploadedUrl}
          lessonTitle={lessonTitle}
          lessonType={lessonType}
          uploadedUrl={uploadedUrl}
          uploading={uploading}
          setUploading={setUploading}
          fileInputRef={fileInputRef}
          setShowDrawer={setShowDrawer}
          fetchSections={fetchSections}
          navigate={navigate}
        />
      )}

      {showAddSectionDrawer && (
        <div
          className="offcanvas offcanvas-end show"
          style={{ visibility: "visible", width: 400, zIndex: 1050 }}
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Add Section</h5>
            <button
              className="btn-close text-reset"
              onClick={() => setShowAddSectionDrawer(false)}
            ></button>
          </div>
          <div className="offcanvas-body">
            <label className="form-label">Section Title*</label>
            <input
              type="text"
              className="form-control"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              maxLength={60}
            />
            <div className="text-end small mt-1">{sectionTitle.length}/60</div>
            <div className="d-flex justify-content-end mt-4">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setShowAddSectionDrawer(false)}
              >
                CANCEL
              </button>
              <button
                className="btn btn-success"
                onClick={handleSaveSection}
                disabled={!sectionTitle.trim()}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionBuilder;
