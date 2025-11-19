import React from "react";
import "./quizStudent.css";

export default function QuizResult({ questions, answers, onShowExplanation }) {
  // ---- SCORE ----
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) score++;
  });

  return (
    <div className="qr-page">

      <div className="qr-card">
        {/* Title */}
        <div className="qr-title-row">
          <span className="qr-tick">✔</span>
          <h2 className="qr-title">Test Completed</h2>
        </div>

        {/* Score */}
        <div className="qr-score-text">
          Your Score: <b>{score}</b> / {questions.length}
        </div>

        {/* Button Row */}
        <div className="qr-btn-row">
          <button className="qr-btn-blue" onClick={onShowExplanation}>
            Show Explanation
          </button>

          <button className="qr-btn-outline">
            Mark as complete
          </button>
        </div>
      </div>

    </div>
  );
}
