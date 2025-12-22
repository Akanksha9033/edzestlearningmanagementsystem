// src/WebStudent/Pages/Course/LMS/LessonRenderer/QLesson.js
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import API from "../../../../../LoginSystem/axios";

export default function QLesson() {
  const navigate = useNavigate();

  // ---------------- URL Params ----------------
  const params = useParams();
  const location = useLocation();
  const search = new URLSearchParams(location.search);

  const courseId = params.courseId || params.cid || "";
  const sectionId = params.sectionId || params.sid || "";
  const lessonId = params.lessonId || "new";

  // Title handling (no forced "Quiz")
  const queryTitle = search.get("title");
  const [quizTitle, setQuizTitle] = useState(queryTitle || "");

  // ---------------- States ----------------
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctIndex: null, explanation: "" },
  ]);
  const [saving, setSaving] = useState(false);

  // ---------------- Load existing quiz ----------------
  useEffect(() => {
    if (!lessonId || lessonId === "new") return;

    (async () => {
      try {
        console.log("🔍 Loading existing quiz:", lessonId);

        const res = await API.get(`/api/courses/lesson/${lessonId}`);

        if (res?.data?.lesson?.questions?.length) {
          console.log("✅ Quiz loaded");
          setQuestions(res.data.lesson.questions);

          // ⭐ LOAD TITLE OF QUIZ
          if (res.data.lesson.title) {
            setQuizTitle(res.data.lesson.title);
          }
        }
      } catch (err) {
        console.warn("⚠️ Load quiz error:", err.message);
      }
    })();
  }, [lessonId]);

  // ---------------- Question Handlers ----------------
  const addQuestion = () =>
    setQuestions(qs => [
      ...qs,
      { question: "", options: ["", "", "", ""], correctIndex: null, explanation: "" },
    ]);

  const handleQuestionChange = (i, v) =>
    setQuestions(qs => {
      const n = [...qs];
      n[i].question = v;
      return n;
    });

  const handleOptionChange = (qi, oi, v) =>
    setQuestions(qs => {
      const n = [...qs];
      n[qi].options[oi] = v;
      return n;
    });

  const handleCorrectChange = (qi, oi) =>
    setQuestions(qs => {
      const n = [...qs];
      n[qi].correctIndex = oi;
      return n;
    });

  const handleExplanationChange = (qi, v) =>
    setQuestions(qs => {
      const n = [...qs];
      n[qi].explanation = v;
      return n;
    });

  const deleteQuestion = (i) =>
    setQuestions(qs => qs.filter((_, idx) => idx !== i));

  // ---------------- Submit ----------------
  const handleSubmit = async () => {
    if (!questions.length) return alert("Add at least one question.");

    for (const [idx, q] of questions.entries()) {
      if (!q.question.trim()) return alert(`Question ${idx + 1} is empty.`);
      if (q.options.some(o => !String(o).trim()))
        return alert(`Fill options for Q${idx + 1}.`);
      if (q.correctIndex === null)
        return alert(`Mark correct option for Q${idx + 1}.`);
    }

    if (!quizTitle.trim()) {
      return alert("Please enter quiz title.");
    }

    try {
      setSaving(true);

      // 1️⃣ Create lesson if new
      let finalLessonId = lessonId;

      if (lessonId === "new") {
        console.log("🧱 Creating lesson…");

        const createRes = await API.post(`/api/courses/${courseId}/lessons`, {
          sectionId,
          title: quizTitle,
          type: "quiz",
          questions,
        });

        finalLessonId = createRes?.data?.lesson?._id;

        if (!finalLessonId) {
          alert("Lesson creation failed.");
          setSaving(false);
          return;
        }

        console.log("✅ Lesson created:", finalLessonId);
      }

      // 2️⃣ Create or Update quiz
      const quizPayload = {
        courseId,
        sectionId,
        lessonId: finalLessonId,
        title: quizTitle,
        questions,
      };

      console.log("🧠 Saving quiz:", quizPayload);

      if (lessonId === "new") {
        await API.post("/api/quiz", quizPayload);
        alert("🎉 Quiz created successfully!");
      } else {
        await API.put(`/api/quiz/${lessonId}`, quizPayload);
        alert("🔄 Quiz updated successfully!");
      }

      // 3️⃣ Redirect back to Section Builder
      navigate(`/course/${courseId}/section/${sectionId}`);
    } catch (err) {
      console.error("❌ Save error:", err);

      if (lessonId === "new") {
        alert("Failed to create quiz.");
      } else {
        alert("Failed to update quiz.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h3 className="mb-4 fw-bold text-primary">🧠 Quiz Builder</h3>

      {/* QUIZ TITLE INPUT */}
      <div className="mb-3">
        <label className="form-label fw-bold">Quiz Title</label>
        <input
          className="form-control"
          placeholder="Enter quiz title…"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
        />
      </div>

      <div className="mb-3 small text-muted">
        <code>courseId: {courseId}</code> ·
        <code>sectionId: {sectionId}</code> ·
        <code>lessonId: {lessonId}</code>
      </div>

      {questions.map((q, qi) => (
        <div
          key={qi}
          className="border rounded p-4 mb-4 bg-white shadow-sm"
          style={{ position: "relative" }}
        >
          <button
            className="btn btn-sm btn-outline-danger position-absolute"
            style={{ top: 10, right: 10 }}
            onClick={() => deleteQuestion(qi)}
          >
            ✖
          </button>

          <h5 className="fw-semibold">Question {qi + 1}</h5>

          <textarea
            className="form-control mb-3"
            rows={2}
            placeholder="Write your question…"
            value={q.question}
            onChange={(e) => handleQuestionChange(qi, e.target.value)}
          />

          <h6>Options</h6>

          {q.options.map((opt, oi) => (
            <div className="input-group mb-2" key={oi}>
              <span className="input-group-text">
                {String.fromCharCode(65 + oi)}.
              </span>
              <input
                className="form-control"
                value={opt}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                onChange={(e) => handleOptionChange(qi, oi, e.target.value)}
              />
              <div className="input-group-text">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correctIndex === oi}
                  onChange={() => handleCorrectChange(qi, oi)}
                />
              </div>
            </div>
          ))}

          <div className="mt-3">
            <label className="form-label fw-bold">Explanation (optional)</label>
            <textarea
              className="form-control"
              rows={2}
              value={q.explanation}
              onChange={(e) =>
                handleExplanationChange(qi, e.target.value)
              }
            />
          </div>
        </div>
      ))}

      <div className="d-flex justify-content-between mt-3">
        <button className="btn btn-outline-primary" onClick={addQuestion}>
          ➕ Add New Question
        </button>
        <button className="btn btn-success" disabled={saving} onClick={handleSubmit}>
          {saving
            ? lessonId === "new"
              ? "Creating…"
              : "Updating…"
            : lessonId === "new"
            ? "Create Quiz"
            : "Update Quiz"}
        </button>
      </div>
    </div>
  );
}
