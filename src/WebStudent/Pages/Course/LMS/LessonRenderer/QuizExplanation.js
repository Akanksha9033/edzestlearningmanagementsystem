// src/WebStudent/Pages/Course/LMS/LessonRenderer/QuizExplanation.js
import React, { useState } from "react";
import "./quizStudent.css";

export default function QuizExplanation({ questions, answers }) {
  const [index, setIndex] = useState(0);

  const q = questions[index];
  const userAns = answers[index];
  const correct = q.correctIndex;

  const next = () =>
    index < questions.length - 1 && setIndex(index + 1);

  const prev = () =>
    index > 0 && setIndex(index - 1);

  // SCORE
  let score = 0;
  questions.forEach((qs, i) => {
    if (answers[i] === qs.correctIndex) score++;
  });

  return (
    <div className="sol-page">

      {/* HEADER */}
      <div className="sol-header">
        <button className="sol-back" onClick={() => window.history.back()}>
          ← Back
        </button>

        <h2 className="sol-title">Solutions</h2>

        <div className="sol-info">
          <span className="info-badge">
            Question {index + 1} of {questions.length}
          </span>

          <span className="info-badge">
            Score: {score}/{questions.length}
          </span>

          {userAns === correct ? (
            <span className="tag-correct">Correct</span>
          ) : (
            <span className="tag-wrong">Wrong</span>
          )}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="sol-card">

        <h3 className="sol-question">{q.question}</h3>

        <div className="sol-options">
          {q.options.map((opt, oi) => {
            let cls = "sol-option-box";

            if (oi === correct) cls += " sol-correct"; // green
            if (oi === userAns && userAns !== correct)
              cls += " sol-wrong"; // red

            return (
              <div key={oi} className={cls}>
                <div className="sol-opt-letter">
                  {String.fromCharCode(65 + oi)}
                </div>

                <div className="sol-opt-text">{opt}</div>
              </div>
            );
          })}
        </div>

        {/* EXPLANATION */}
        <div className="sol-expl-block">
          <h4 className="expl-head">Explanation</h4>
          <p className="expl-text">
            {q.explanation || "No explanation provided."}
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="sol-nav">
          <button
            disabled={index === 0}
            className="sol-nav-btn"
            onClick={prev}
          >
            ← Previous
          </button>

          <span className="sol-page-no">{index + 1}/{questions.length}</span>

          <button
            disabled={index === questions.length - 1}
            className="sol-nav-btn"
            onClick={next}
          >
            Next →
          </button>
        </div>

      </div>
    </div>
  );
}
