import React, { useState } from "react";
import "./QuizBlock.css";

export default function QuizBlockStudent({ block }) {
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswer = (index) => {
    setSelected(index);
    setTimeout(() => setShowExplanation(true), 1000);
  };

  return (
    <div className="quiz-student">
      <h4 className="quiz-title">{block.questionText}</h4>

      <div className="quiz-options-student">
        {(block.options || []).map((opt, i) => {
          let cls = "quiz-option";
          if (selected !== null) {
            if (i === block.correctAnswer) cls += " correct";
            else if (i === selected) cls += " wrong";
          }
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => handleAnswer(i)}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showExplanation && block.explanation && (
        <div className="quiz-explanation-box">
          <strong>Explanation:</strong>
          <p>{block.explanation}</p>
        </div>
      )}
    </div>
  );
}
