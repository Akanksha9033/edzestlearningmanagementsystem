// src/WebStudent/Pages/Course/LMS/LessonRenderer/QLesson.js final
import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import API from "../../../../../LoginSystem/axios";

export default function QLesson({ lesson, course }) {
  // ---- pull IDs from URL first (most reliable) ----
  const params = useParams();
  const location = useLocation();
  const search = new URLSearchParams(location.search);

  const urlCourseId  = params.courseId || params.cid || "";
  const urlSectionId = params.sectionId || params.sid || "";
  const urlLessonId  = params.lessonId || params.lid || (params.lesson === "new" ? "new" : "");

  const queryTitle   = search.get("title");

  // ---- fallbacks from props if URL is missing ----
  const courseId  = urlCourseId  || course?._id  || course?.id  || lesson?.courseId || "";
  const sectionId = urlSectionId || lesson?.sectionId || lesson?.section?._id || "";
  const lessonId  = urlLessonId  || lesson?._id || lesson?.id || "new";
  const title     = queryTitle || lesson?.title || "Quiz";

  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctIndex: null, explanation: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () =>
    setQuestions(qs => [...qs, { question: "", options: ["", "", "", ""], correctIndex: null, explanation: "" }]);

  const handleQuestionChange = (i, v) =>
    setQuestions(qs => { const n=[...qs]; n[i]={...n[i], question:v}; return n; });

  const handleOptionChange = (qi, oi, v) =>
    setQuestions(qs => { const n=[...qs]; const opts=[...n[qi].options]; opts[oi]=v; n[qi]={...n[qi], options:opts}; return n; });

  const handleCorrectChange = (qi, oi) =>
    setQuestions(qs => { const n=[...qs]; n[qi]={...n[qi], correctIndex:oi}; return n; });

  const handleExplanationChange = (qi, v) =>
    setQuestions(qs => { const n=[...qs]; n[qi]={...n[qi], explanation:v}; return n; });

  const deleteQuestion = (i) =>
    setQuestions(qs => qs.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
  if (!questions.length) return alert("Add at least one question.");
  for (const [idx, q] of questions.entries()) {
    if (!q.question.trim()) return alert(`Question ${idx + 1} is empty.`);
    if (q.options.some(o => !String(o).trim())) return alert(`Fill all options for Q${idx + 1}.`);
    if (q.correctIndex == null) return alert(`Mark correct option for Q${idx + 1}.`);
  }

  if (!courseId || !sectionId) {
    alert("courseId/sectionId missing — check URL or props.");
    return;
  }

  try {
    setSaving(true);

    /* 1️⃣ CREATE LESSON FIRST (only once) */
    console.log("🧱 Creating new lesson before saving quiz...");
    const lessonRes = await API.post(`/api/courses/${courseId}/lessons`, {
      sectionId,
      title: title || "Quiz",
      type: "Quiz",
    });

    const newLessonId = lessonRes?.data?.lesson?._id;
    if (!newLessonId) {
      alert("Lesson creation failed.");
      setSaving(false);
      return;
    }
    console.log("✅ Lesson created:", newLessonId);

    /* 2️⃣ NOW SAVE QUIZ DATA */
    const quizPayload = {
      courseId,
      sectionId,
      lessonId: newLessonId,
      title: title || "Quiz",
      questions,
    };
    console.log("🧠 Quiz Payload Sent:", quizPayload);

    const quizRes = await API.post("/api/quiz", quizPayload);
    console.log("✅ Quiz saved:", quizRes.data);

    alert("✅ Quiz and Lesson saved successfully!");

    /* 3️⃣ OPTIONAL: redirect to section builder */
    window.location.href = `/course/${courseId}/section/${sectionId}`;
  } catch (err) {
    console.error("❌ Save error:", err?.response?.data || err?.message);
    alert("❌ Failed to save quiz");
  } finally {
    setSaving(false);
  }
};


  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h3 className="mb-4 fw-bold text-primary">🧠 Quiz Builder</h3>

      {/* small debug strip so you can see IDs quickly */}
      <div className="mb-3 small text-muted">
        <code>courseId: {courseId}</code> · <code>sectionId: {sectionId}</code> · <code>lessonId: {lessonId}</code>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="border rounded p-4 mb-4 bg-white shadow-sm" style={{ position: "relative" }}>
          <button className="btn btn-sm btn-outline-danger position-absolute" style={{ top: 10, right: 10 }}
                  onClick={() => deleteQuestion(qi)}>✖</button>

          <h5 className="fw-semibold">Question {qi + 1}</h5>
          <textarea className="form-control mb-3" rows={2} placeholder="Write your question…"
                    value={q.question} onChange={e => handleQuestionChange(qi, e.target.value)} />

          <h6>Options</h6>
          {q.options.map((opt, oi) => (
            <div className="input-group mb-2" key={oi}>
              <span className="input-group-text">{String.fromCharCode(65 + oi)}.</span>
              <input className="form-control" value={opt} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                     onChange={e => handleOptionChange(qi, oi, e.target.value)} />
              <div className="input-group-text">
                <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi}
                       onChange={() => handleCorrectChange(qi, oi)} />
              </div>
            </div>
          ))}

          <div className="mt-3">
            <label className="form-label fw-bold">Explanation (optional)</label>
            <textarea className="form-control" rows={2} value={q.explanation}
                      onChange={e => handleExplanationChange(qi, e.target.value)} />
          </div>
        </div>
      ))}

      <div className="d-flex justify-content-between mt-3">
        <button className="btn btn-outline-primary" onClick={addQuestion}>➕ Add New Question</button>
        <button className="btn btn-success" disabled={saving} onClick={handleSubmit}>
          {saving ? "Saving..." : "💾 Save Quiz"}
        </button>
      </div>
    </div>
  );
}
