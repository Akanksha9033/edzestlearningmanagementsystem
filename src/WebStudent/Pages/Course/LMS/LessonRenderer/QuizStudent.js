// src/WebStudent/Pages/Course/LMS/LessonRenderer/QuizStudent.js
import React, { useState, useRef } from "react";
import "./quizStudent.css";

import QuizResult from "./QuizResult";
import QuizExplanation from "./QuizExplanation";

// ⭐ NEW — Progress Updater
import { putLessonProgress } from "../../../../../utils/ProgressApi";

export default function QuizStudent({ lesson, course }) {
  const questions = lesson?.questions || [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Confirmation popup
  const [showConfirm, setShowConfirm] = useState(false);

  const qvRef = useRef(null);
  const q = questions[index];

  /* -------------------------- Highlight --------------------------- */
  const toggleHighlight = () => {
    const sel = window.getSelection().toString();
    if (!sel.trim()) return;

    if (qvRef.current) {
      qvRef.current.innerHTML = qvRef.current.innerHTML.replace(
        sel,
        `<mark class="hl">${sel}</mark>`
      );
    }
  };

  /* ------------------------ Strikethrough ------------------------- */
  const toggleStrike = () => {
    const sel = window.getSelection().toString();
    if (!sel.trim()) return;

    if (qvRef.current) {
      qvRef.current.innerHTML = qvRef.current.innerHTML.replace(
        sel,
        `<span class="st">${sel}</span>`
      );
    }
  };

  /* ---------------------------- Select ---------------------------- */
  const onSelect = (optIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: optIndex,
    }));
  };

  /* ------------------------- PROGRESS SAVE ------------------------ */
  const saveQuizProgress = async () => {
    try {
      await putLessonProgress({
        lessonId: lesson._id,
        courseSlug: course?.slug || lesson.courseSlug,
        percent: 100,
        completed: true,
        type: "quiz",
      });

      console.log("🎉 Quiz marked completed!");
    } catch (err) {
      console.error("❌ Failed to update quiz progress:", err);
    }
  };

  /* -------------------------- SUBMIT QUIZ -------------------------- */
  const submitQuiz = async () => {
    setSubmitted(true);
    await saveQuizProgress(); // ⭐ IMPORTANT — PROGRESS UPDATE CALL
  };

  /* ---------------------- Navigation ------------------------------ */
  const next = () => index < questions.length - 1 && setIndex(index + 1);
  const prev = () => index > 0 && setIndex(index - 1);

  /* ------------------ RESULT + EXPLANATION PAGES ------------------ */
  if (submitted && !showExplanation)
    return (
      <QuizResult
        answers={answers}
        questions={questions}
        onShowExplanation={() => setShowExplanation(true)}
      />
    );

  if (submitted && showExplanation)
    return <QuizExplanation answers={answers} questions={questions} />;

  /* *****************************************************************
   *                       MAIN QUIZ UI
   ******************************************************************/
  return (
    <div className="quiz-page">

      {/* HEADER BUTTONS */}
      <div className="quiz-header">
        <button className="qh-btn" onClick={toggleHighlight}>Highlight</button>
        <button className="qh-btn" onClick={toggleStrike}>Strikethrough</button>
      </div>

      <h2 className="quiz-title">{lesson?.title}</h2>

      <div className="quiz-layout">

        {/* LEFT SIDE */}
        <div className="quiz-left">
          <div className="question-card">
            <div
              className="question-text"
              ref={qvRef}
              dangerouslySetInnerHTML={{
                __html: `<b>Q${index + 1}.</b> ${q.question}`,
              }}
            />

            {/* OPTIONS */}
            <div className="options-list">
              {q.options.map((opt, oi) => {
                const selected = answers[index] === oi;
                return (
                  <label key={oi} className="option-row">
                    <input
                      type="radio"
                      name={`opt-${index}`}
                      checked={selected}
                      onChange={() => onSelect(oi)}
                      className="option-radio-left"
                    />
                    <span className="option-text">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* QUESTION NAVIGATION */}
          <div className="nav-row">
            <button className="nav-btn" disabled={index === 0} onClick={prev}>
              Previous
            </button>

            {index === questions.length - 1 ? (
              <button
                className="submit-btn"
                onClick={() => setShowConfirm(true)}
              >
                Submit
              </button>
            ) : (
              <button className="nav-btn" onClick={next}>Next</button>
            )}
          </div>
        </div>

        {/* RIGHT SIDE NAVIGATOR */}
        {/* <div className="quiz-right">
          <div className="qn-box">
            <h4 className="qn-title">Question Navigator</h4>

            <div className="qn-grid">
              {questions.map((_, qi) => (
                <button
                  key={qi}
                  className={`qn-item ${qi === index ? "active" : ""}`}
                  onClick={() => setIndex(qi)}
                >
                  {qi + 1}
                </button>
              ))}
            </div>
          </div>
        </div> */}
      </div>

      {/* SUBMIT CONFIRMATION POPUP */}
      {showConfirm && (
        <div className="popup-overlay">
          <div className="popup-box">

            <h3 className="popup-title">Submit Confirmation</h3>
            <p>Are you sure you want to submit your answers?</p>

            <div className="popup-actions">
              <button
                className="popup-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>

              <button
                className="popup-submit"
                onClick={() => {
                  setShowConfirm(false);
                  submitQuiz(); // ⭐ Final call
                }}
              >
                Submit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
