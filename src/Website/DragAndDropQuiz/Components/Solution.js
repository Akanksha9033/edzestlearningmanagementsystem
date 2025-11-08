// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";

// // Solution component displays the user's attempts and correct answers for the quiz
// const Solution = ({
//   solutions,
//   closeSolution,
//   totalQuestions,
//   quizData,
//   quizCompleted,
// }) => {
//   const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0); // Tracks the current question index
//   const navigate = useNavigate(); // Hook for navigation

//   // Function to move to the next solution (question)
//   const nextSolution = () => {
//     if (currentSolutionIndex < totalQuestions - 1) {
//       setCurrentSolutionIndex((prev) => prev + 1);
//       window.scrollTo(0, 0); // ✅ Scrolls to the top smoothly
//     }
//   };

//   // Function to move to the previous solution (question)
//   const prevSolution = () => {
//     if (currentSolutionIndex > 0) {
//       setCurrentSolutionIndex((prev) => prev - 1);
//       window.scrollTo({ top: 0, behavior: "smooth" }); // ✅ Scrolls to the top smoothly
//     }
//   };

//   // ✅ Scrolls to the top when the "View Solution" button is clicked
//   const handleViewSolution = () => {
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const currentQuestion = quizData?.[currentSolutionIndex]; // Retrieves the current question data

//   return (
//     <div className="solution-container">
//       {/* Section displaying the user's attempt for the current question */}
//       <div className="your-attempt-box">
//         <h2>Q{currentSolutionIndex + 1}. Your Attempt</h2>

//         {/* Checking if the user attempted the question */}
//         {Array.isArray(solutions[currentSolutionIndex]) &&
//         solutions[currentSolutionIndex].length > 0 ? (
//           <div className="your-attempt-list">
//             {solutions[currentSolutionIndex].map((sol, index) => {
//               // Finding the matched definition text
//               const matchedDefinition =
//                 currentQuestion.definitions.find(
//                   (def) => def.match === sol.correctMatch
//                 )?.text || "Unknown";

//               return (
//                 <div
//                   key={index}
//                   className={`your-attempt-row ${
//                     sol.correct ? "correct-attempt" : "incorrect-attempt"
//                   }`}
//                 >
//                   <span className="serial-number">{index + 1}.</span>
//                   <div className="term-box">{sol.term}</div>
//                   <div className="arrow">→</div>
//                   <div className="definition-box">
//                     {matchedDefinition}
//                     <span className="match-symbol">
//                       {sol.correct ? " ✅" : " ❌"}
//                     </span>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           <p>❌ Not Attempted</p> // If the user did not attempt this question
//         )}
//       </div>

//       {/* Section displaying the correct answers */}
//       {quizCompleted && currentQuestion && (
//         <div className="correct-matches-box">
//           <h3>Correct Matches:</h3>
//           <div className="correct-matches-list">
//             {currentQuestion.definitions.map((definition, index) => (
//               <div key={index} className="correct-match-row">
//                 <div className="term-box">{definition.match}</div>
//                 <div className="arrow">→</div>
//                 <div className="definition-box">{definition.text}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Navigation buttons for the solutions */}
//       <div className="solution-buttons-container">
//         <button onClick={prevSolution} disabled={currentSolutionIndex === 0}>
//           Previous
//         </button>
//         <button
//           onClick={nextSolution}
//           disabled={currentSolutionIndex === totalQuestions - 1}
//         >
//           Next
//         </button>
//         {/* Redirecting user back to the drag-and-drop quiz screen when closing the solution */}
//         <button onClick={() => navigate("/drag-and-drop")}>Close</button>
//         window.scrollTo(0, 0);
//       </div>

//       {/* Link to practice more exam-like questions */}
//       <a
//         href="https://exams.edzest.org/learn/PMP-mock-exams-by-edzest"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="mt-auto text-center text-[#4748ac] text-decoration-none font-semibold py-2 px-6 rounded mt-6 inline-block"
//       >
//         Practice more exam-like questions
//       </a>
//     </div>
//   );
// };

// export default Solution; // Exporting the Solution component for use in other parts of the application

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Solution component displays the user's attempts and correct answers for the quiz
const Solution = ({ solutions, closeSolution, totalQuestions, quizData, quizCompleted }) => {
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0); // Tracks the current question index
  const navigate = useNavigate(); // Hook for navigation

  // Function to move to the next solution (question)
  const nextSolution = () => {
    if (currentSolutionIndex < totalQuestions - 1) {
      setCurrentSolutionIndex((prev) => prev + 1);
      window.scrollTo(0, 0); // ✅ Scrolls to the top smoothly
    }
  };

  // Function to move to the previous solution (question)
  const prevSolution = () => {
    if (currentSolutionIndex > 0) {
      setCurrentSolutionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" }); // ✅ Scrolls to the top smoothly
    }
  };

  // ✅ Scrolls to the top when the "View Solution" button is clicked
  const handleViewSolution = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentQuestion = quizData?.[currentSolutionIndex]; // Retrieves the current question data

  return (
    <div className="solution-container">
      
      {/* Section displaying the user's attempt for the current question */}
      <div className="your-attempt-box">
        <h2>Q{currentSolutionIndex + 1}. Your Attempt</h2>
        
        {/* Checking if the user attempted the question */}
        {Array.isArray(solutions[currentSolutionIndex]) && solutions[currentSolutionIndex].length > 0 ? (
          <div className="your-attempt-list">
            {solutions[currentSolutionIndex].map((sol, index) => {
              
              // Finding the matched definition text
              const matchedDefinition =
                currentQuestion.definitions.find((def) => def.match === sol.correctMatch)?.text || "Unknown";

              return (
                <div
                  key={index}
                  className={`your-attempt-row ${sol.correct ? "correct-attempt" : "incorrect-attempt"}`}
                >
                  <span className="serial-number">{index + 1}.</span>
                  <div className="term-box">{sol.term}</div>
                  <div className="arrow">→</div>
                  <div className="definition-box">
                    {matchedDefinition}
                    <span className="match-symbol">{sol.correct ? " ✅" : " ❌"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>❌ Not Attempted</p> // If the user did not attempt this question
        )}
      </div>

      {/* Section displaying the correct answers */}
      {quizCompleted && currentQuestion && (
        <div className="correct-matches-box">
          <h3>Correct Matches:</h3>
          <div className="correct-matches-list">
            {currentQuestion.definitions.map((definition, index) => (
              <div key={index} className="correct-match-row">
                <div className="term-box">{definition.match}</div>
                <div className="arrow">→</div>
                <div className="definition-box">{definition.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation buttons for the solutions */}
      <div className="solution-buttons-container">
        <button onClick={prevSolution} disabled={currentSolutionIndex === 0}>
          Previous
        </button>
        <button onClick={nextSolution} disabled={currentSolutionIndex === totalQuestions - 1}>
          Next
        </button>
        {/* Redirecting user back to the drag-and-drop quiz screen when closing the solution */}
        <button onClick={() => { 
          navigate("/drag-and-drop"); // Navigate to the quiz page
          window.scrollTo(0, 0);  // Scroll to the top after navigating
        }}>
          Close
        </button>
      </div>

      {/* Link to practice more exam-like questions */}
      <a
        href="https://exams.edzest.org/learn/PMP-Mock-Exams"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto text-center text-[#4748ac] text-decoration-none font-semibold py-2 px-6 rounded mt-6 inline-block"
      >
        Practice more exam-like questions
      </a>
    </div>
  );
};

export default Solution; // Exporting the Solution component for use in other parts of the application
