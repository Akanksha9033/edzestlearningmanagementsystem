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

  /* 🔥 ADD THIS EXACTLY HERE */
const handleBack = () => {
  if (dirtySectionId) {
    const ok = window.confirm(
      " ⚠️ Order has not been saved yet.\n\nIf you go back now, your changes will be lost.\n\nDo you want to continue?"
    );
    if (!ok) return;
  }
  navigate(-1);
};

  const [sections, setSections] = useState([]);
  const [dirtySectionId, setDirtySectionId] = useState(null);

  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  // 🔀 Move lesson modal state
const [moveLessonData, setMoveLessonData] = useState(null);
// shape: { lessonId, fromSectionId }

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [showAddSectionDrawer, setShowAddSectionDrawer] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");

  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [moveSectionMode, setMoveSectionMode] = useState(false);
const [activeSectionMenu, setActiveSectionMenu] = useState(null);
// ⚠️ Warn user before leaving page if order not saved
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (dirtySectionId) {
      e.preventDefault();
      e.returnValue = ""; // browser default warning
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [dirtySectionId]);


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
  // 🔀 LESSON MOVE MENU CLICK HANDLER
// 🔀 LESSON MOVE MENU CLICK HANDLER
const handleMoveLessonClick = ({ lessonId, fromSectionId }) => {
  console.log("🟡 Move lesson clicked:", lessonId, fromSectionId);

  setMoveLessonData({
    lessonId,
    fromSectionId,
  });
};

// 🔀 MOVE LESSON TO ANOTHER SECTION
const moveLessonToSection = (toSectionId) => {
  if (!moveLessonData) return;

  const { lessonId, fromSectionId } = moveLessonData;

  // 🟢 1️⃣ FRONTEND STATE UPDATE (UI move)
  setSections((prev) => {
    const updated = structuredClone(prev);

    const fromSection = updated.find(
      (s) => String(s._id) === String(fromSectionId)
    );
    const toSection = updated.find(
      (s) => String(s._id) === String(toSectionId)
    );

    if (!fromSection || !toSection) return prev;

    const idx = fromSection.lessons.findIndex(
      (l) => String(l._id) === String(lessonId)
    );
    if (idx === -1) return prev;

    const [lesson] = fromSection.lessons.splice(idx, 1);

    // update sectionId on lesson
    lesson.sectionId = toSectionId;

    toSection.lessons.push(lesson);

    return updated;
  });

  // 🟢 2️⃣ BACKEND MOVE (THIS FIXES "MOVE → WAPAS AA JANA")
  API.post(`/api/courses/${courseId}/move-lesson`, {
    lessonId,
    fromSectionId,
    toSectionId,
  })
    .then(() => {
      console.log("✅ Backend lesson move saved");
    })
    .catch((err) => {
      console.error(
        "❌ Backend lesson move failed",
        err?.response?.data || err
      );
      alert("Lesson backend me move nahi hua");
    });

  // 🟢 3️⃣ Mark dirty (optional, safe)
  setDirtySectionId(toSectionId);

  // 🟢 4️⃣ Close modal
  setMoveLessonData(null);
};





 const handleLessonDragEnd = async (result) => {
  console.log("🔥 DRAG FIRED (PARENT)", result);

  const { source, destination, type } = result;
  if (!destination) return;
  if (type === "SECTION") {
  if (!destination) return;

  // 1️⃣ Sirf visible sections reorder karo
  const reorderedVisible = Array.from(filteredSections);
  const [moved] = reorderedVisible.splice(source.index, 1);
  reorderedVisible.splice(destination.index, 0, moved);

  // 2️⃣ Original sections ke saath merge karo (hidden safe rahe)
  const merged = [];

  reorderedVisible.forEach(vs => {
    const full = sections.find(s => s._id === vs._id);
    if (full) merged.push(full);
  });

  // 3️⃣ Jo visible nahi the (e.g. unassigned), unko end me rakho
  sections.forEach(s => {
    if (!merged.find(m => m._id === s._id)) {
      merged.push(s);
    }
  });

  setSections(merged);
  setDirtySectionId("SECTION_ORDER");
  return;
}

  if (type !== "LESSON") return;

  const sectionId = source.droppableId.replace("LESSON-", "");

  let reorderedLessons = [];

  setSections((prev) =>
    prev.map((sec) => {
      if (String(sec._id) !== String(sectionId)) return sec;

      const updated = Array.from(sec.lessons || []);
      const [moved] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, moved);
      setDirtySectionId(sectionId);


      // ✅ YAHI FINAL ORDER HAI
      reorderedLessons = updated.map((l) => l._id);

      return {
        ...sec,
        lessons: updated,
      };
    })
    
  );

  // ✅ BACKEND SAVE — UI ORDER KE SAATH
 

};
const handleSaveOrder = async () => {
  try {
    if (!dirtySectionId) {
      alert("First drag, then click Save.");
      return;
    }

    /* =========================================================
       🔵 CASE 1: SECTION ORDER SAVE
       ========================================================= */
    if (dirtySectionId === "SECTION_ORDER") {
      const orderedSectionIds = sections.map((s) => s._id);

      console.log("🟦 SAVING SECTION ORDER:", orderedSectionIds);

      await API.patch(
        `/api/courses/${courseId}/reorder-sections`,
        { sections: orderedSectionIds }
      );

      alert("Section order saved ✅");
      setDirtySectionId(null);
      return;
    }

    /* =========================================================
       🟢 CASE 2: LESSON ORDER SAVE (EXISTING LOGIC SAFE)
       ========================================================= */
    const sec = sections.find(
      (s) => String(s._id) === String(dirtySectionId)
    );

    if (!sec) {
      alert("Section nahi mila");
      return;
    }

    const orderedLessonIds = (sec.lessons || []).map((l) => l._id);

    console.log("🟢 SAVING LESSON ORDER:", dirtySectionId, orderedLessonIds);

    await API.patch(
      `/api/courses/${courseId}/section/${dirtySectionId}/reorder-lessons`,
      { lessons: orderedLessonIds }
    );

    alert("Lesson order saved ✅");
    setDirtySectionId(null);

  } catch (err) {
    console.error("❌ Save failed", err?.response?.data || err);
    alert("Save failed ❌");
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
  onClick={handleBack}
>
  ← Back
</button>

      <div className="d-flex justify-content-between align-items-center mb-3">
  <h4 className="m-0">📚 Section Builder</h4>

  <div className="d-flex gap-2">
    <button
      className={`btn ${dirtySectionId ? "btn-success" : "btn-outline-success"}`}
      onClick={handleSaveOrder}
      type="button"
    >
      Save Order
    </button>

    <Link to={`/course/settings/${courseId}`}>
      <button className="btn btn-outline-primary" type="button">
        Settings
      </button>
    </Link>
  </div>
</div>


      <SectionBuilderUI
        sections={filteredSections}
        onDragEnd={handleLessonDragEnd}

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
          // 🔥 NEW PROPS
           onMoveLessonClick={handleMoveLessonClick}
  moveSectionMode={moveSectionMode}
  setMoveSectionMode={setMoveSectionMode}
  activeSectionMenu={activeSectionMenu}
  setActiveSectionMenu={setActiveSectionMenu}
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
      {/* 🔀 MOVE LESSON MODAL */}
{moveLessonData && (
  <div className="modal show d-block" tabIndex="-1">
    <div className="modal-dialog modal-dialog-centered modal-sm">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Move lesson to</h5>
          <button
            className="btn-close"
            onClick={() => setMoveLessonData(null)}
          />
        </div>

        <div className="modal-body">
          {sections.map((sec) => (
            <button
              key={sec._id}
              className="btn btn-outline-primary w-100 mb-2"
              onClick={() =>
                moveLessonToSection(sec._id)
              }
            >
              {sec.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
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
