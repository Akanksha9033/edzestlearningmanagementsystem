// components/LessonDrawer.js
import React from "react";
import LessonPreview from "./LessonPreview";
import { useAuth } from "../../../../LoginSystem/context/AuthContext";
import API from "../../../../LoginSystem/axios";
import axios from "axios"; // Cloudinary upload के लिए

const LessonDrawer = ({
  courseId,
  selectedSectionId,
  setLessonTitle,
  setLessonType,
  setUploadedUrl,
  lessonTitle,
  lessonType,
  uploadedUrl,
  uploading,
  setUploading,
  fileInputRef,
  setShowDrawer,
  fetchSections,
  navigate,
}) => {
  const { user } = useAuth() || {};

  const handleCloseDrawer = () => setShowDrawer(false);

  // ✅ FIX: handleFileUpload अब payload यूज़ नहीं करता
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cloudinary env मौजूद हों तभी upload करें; वरना graceful alert
    const preset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    if (!preset || !cloudName) {
      alert("File upload is disabled (Cloud storage not configured). Please paste a URL instead.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    const isRaw = [
      "PDF",
      "Slides",
      "Article",
      "Assignment",
      "Section Quiz",
      "Scorm/Tincan",
    ].includes(lessonType);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${isRaw ? "raw" : "upload"}`;

    setUploading(true);
    try {
      const res = await axios.post(uploadUrl, formData);
      // Cloudinary public URL
      setUploadedUrl(res?.data?.secure_url || "");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check your Cloudinary setup.");
    } finally {
      setUploading(false);
    }
  };

  const handleLessonTypeClick = (type) => {
  if (!lessonTitle.trim()) {
    alert("Please enter a Lesson Title before selecting type.");
    return;
  }

  // ✅ For "Section Quiz" (old flow)
  if (type === "Section Quiz") {
    if (["Admin", "Teacher"].includes(user?.role)) {
      navigate("/create-mock-test", {
        state: {
          fromLMS: true,
          courseId,
          sectionId: selectedSectionId,
          title: lessonTitle,
        },
      });
    } else {
      alert("Unauthorized access for Section Quiz.");
    }
    return;
  }

  // ✅ NEW: For "Quiz" (redirect to QLesson builder/editor)
  if (type === "Quiz") {
    navigate(
      `/course/${courseId}/section/${selectedSectionId}/lesson/new?type=Quiz&title=${encodeURIComponent(
        lessonTitle
      )}`
    );
    return;
  }

  // ✅ Default flow (Video, PDF, etc.)
  navigate(
    `/course/${courseId}/section/${selectedSectionId}/lesson/new?type=${type}&title=${encodeURIComponent(
      lessonTitle
    )}`
  );
};


  const handleLessonSave = async () => {
    if (!lessonTitle || !lessonType || !selectedSectionId) {
      alert("Missing lesson info or section ID.");
      return;
    }

    const payload = {
      courseId,
      sectionId: selectedSectionId,
      title: lessonTitle,
      type: lessonType,
      fileUrl: uploadedUrl, // URL (Cloudinary/External) यहीं से जाएगा
    };

    try {
      await API.post(`/api/lessons`, payload);
      alert("Lesson saved. You can upload the next one.");
      setLessonTitle("");
      setLessonType("");
      setUploadedUrl("");
      if (fileInputRef?.current) fileInputRef.current.value = "";
      await fetchSections();
    } catch (err) {
      console.error("Lesson save failed:", err);
      alert("Failed to save lesson");
    }
  };

  return (
    <div
      className="position-fixed top-0 end-0 bg-white border-start shadow"
      style={{ width: "400px", height: "100vh", zIndex: 1050 }}
    >
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <h5 className="mb-0">Add Lesson</h5>
        <button className="btn-close" onClick={handleCloseDrawer}></button>
      </div>

      <div className="p-3">
        <div className="mb-3">
          <label className="form-label">Lesson Title</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Lesson Title"
            maxLength={60}
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
          />
        </div>

        <label className="form-label">Select Lesson Type</label>
        <div className="row g-2 mb-3">
          {[
            "Video",
           
            "PDF",
            "Slides",
            "Live",
            "Article",
         
           
           
            "External Link",
               "Quiz",
          ].map((type) => (
            <div className="col-4" key={type}>
              <div
                className={`border rounded text-center p-2 small ${
                  lessonType === type ? "border-success bg-light" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => handleLessonTypeClick(type)}
              >
                {type}
              </div>
            </div>
          ))}
        </div>

        {/* File upload (enabled only if Cloudinary configured) */}
        <input
          type="file"
          ref={fileInputRef}
          className="d-none"
          onChange={handleFileUpload}
        />

        {["External Link", "Live"].includes(lessonType) && (
          <div className="mb-3">
            <label className="form-label">
              {lessonType === "Live" ? "Zoom Link" : "Paste URL"}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="https://..."
              value={uploadedUrl}
              onChange={(e) => setUploadedUrl(e.target.value)}
            />
          </div>
        )}

        {uploading && <p className="text-muted">Uploading...</p>}
        {uploadedUrl && <LessonPreview type={lessonType} fileUrl={uploadedUrl} />}

        <div className="d-flex justify-content-end">
          <button className="btn btn-outline-secondary me-2" onClick={handleCloseDrawer}>
            CANCEL
          </button>
          <button
            className="btn btn-success"
            disabled={!lessonTitle || !lessonType}
            onClick={handleLessonSave}
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonDrawer;
