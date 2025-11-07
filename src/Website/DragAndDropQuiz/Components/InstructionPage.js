// import React from "react";
// import { FaCheckCircle } from "react-icons/fa"; // ✅ Import icon for instructions
// import { useNavigate } from "react-router-dom";
// import "../../Styles/InstructionPage.css"; // ✅ Ensure the correct path

// const InstructionPage = ({ startQuiz }) => {
//   const navigate = useNavigate();

//   // ✅ Redirect to Set and Start Quiz Immediately
//   const redirectToSet = (setPath) => {
//     if (startQuiz) {
//       startQuiz(); // ✅ Ensuring it runs without error
//     }
//     navigate(setPath); // ✅ Navigate to selected set
//   };

//   return (
//     <div className="instruction-container">
//       {/* ✅ Title and Introduction */}
//       <h2 className="instruction-title">📘Practice Questions</h2>
//       <p className="instruction-text">
//         Practice the drag and drop questions for your upcoming PMP® certification exam.
//         There are 3 sets of 20 questions for your practice that cover almost all combinations for the exam.
//       </p>
//       <p className="instruction-text">
//         Every set of 20 questions is followed by your score and solution to show the correct match.
//       </p>
//       <p className="instruction-text">
//         If you would like to discuss any question, please note down the set and question number and send us your doubts.
//       </p>
//       <p className="instruction-text">Go ahead and practice now.</p>

//       <hr className="divider" />

//       {/* ✅ Instruction List */}
//       <h3 className="instruction-subtitle">Quiz Instructions</h3>
//       <p className="instruction-subtitle">Please read these instructions before starting the quiz:</p>

//       <div className="instruction-list">
//         <div className="instruction-item">
//           <FaCheckCircle className="icon" />
//           <span>Drag the correct term to its matching definition.</span>
//         </div>
//         <div className="instruction-item">
//           <FaCheckCircle className="icon" />
//           <span>You can move to the next question only after placing all terms.</span>
//         </div>
//         <div className="instruction-item">
//           <FaCheckCircle className="icon" />
//           <span>Your score will increase <strong>only if all matches are correct.</strong></span>
//         </div>
//         <div className="instruction-item">
//           <FaCheckCircle className="icon" />
//           <span>Use the <strong>Previous</strong> button to go back to previous questions.</span>
//         </div>
//         <div className="instruction-item">
//           <FaCheckCircle className="icon" />
//           <span>Click <strong>Submit</strong> at the end to finish the quiz.</span>
//         </div>
//       </div>

//       <hr className="divider" />

//       {/* ✅ Buttons for Selecting Quiz Sets */}
//       <div className="set-buttons-container">
//         <h3 className="set-title">Select a Quiz Set:</h3>
//         <button className="set-btn" onClick={() => redirectToSet("/drag-and-drop/set1")}>Set 1</button>
//         <button className="set-btn" onClick={() => redirectToSet("/drag-and-drop/set2")}>Set 2</button>
//         <button className="set-btn" onClick={() => redirectToSet("/drag-and-drop/set3")}>Set 3</button>
//       </div>
//     </div>
//   );
// };

// export default InstructionPage;

import React from "react";
import { FaCheckCircle } from "react-icons/fa"; // ✅ Import icon for instructions
import { useNavigate } from "react-router-dom";
import "../../Styles/InstructionPage.css"; // ✅ Ensure the correct path

const InstructionPage = ({ startQuiz }) => {
  const navigate = useNavigate();

  // ✅ Redirect to Set and Start Quiz Immediately
  const redirectToSet = (setPath) => {
    if (startQuiz) {
      startQuiz(); // ✅ Ensuring it runs without error
    }
    navigate(setPath); // ✅ Navigate to selected set
    window.scrollTo(0, 0);
  };

  return (
    <div className="instruction-container">
      {/* ✅ Title and Introduction */}
      <h2 className="instruction-title">📘Practice Questions</h2>
      <p className="instruction-text">
        Practice the drag and drop questions for your upcoming PMP®
        certification exam. There are 3 sets of 20 questions for your practice
        that cover almost all combinations for the exam.
      </p>
      <p className="instruction-text">
        Every set of 20 questions is followed by your score and solution to show
        the correct match.
      </p>
      <p className="instruction-text">
        If you would like to discuss any question, please note down the set and
        question number and send us your doubts at "contact@edzest.org".
      </p>
      <p className="instruction-text">
        Go ahead and practice now. Please try on bigger screens for seamless
        attempt.
      </p>

      <hr className="divider" />

      {/* ✅ Instruction List */}
      <h3 className="instruction-subtitle">Quiz Instructions</h3>
      <p className="instruction-subtitle">
        Please read these instructions before starting the quiz:
      </p>

      <div className="instruction-list">
        <div className="instruction-item">
          <FaCheckCircle className="icon" />
          <span>Drag the correct term to its matching definition.</span>
        </div>
        <div className="instruction-item">
          <FaCheckCircle className="icon" />
          <span>
            You can move to the next question only after placing all terms.
          </span>
        </div>
        <div className="instruction-item">
          <FaCheckCircle className="icon" />
          <span>
            Your score will increase{" "}
            <strong>only if all matches are correct.</strong>
          </span>
        </div>
        <div className="instruction-item">
          <FaCheckCircle className="icon" />
          <span>
            Click <strong>Submit</strong> at the end to finish the quiz.
          </span>
        </div>
        <div className="instruction-item">
          <FaCheckCircle className="icon" />
          <span>
            Use the <strong>Refresh</strong> icon to reset the current
            question.
            <br /> <small>(Only works if you've attempted the question.)</small>
          </span>
        </div>
      </div>

      <hr className="divider" />

      {/* ✅ Buttons for Selecting Quiz Sets */}
      <div className="set-buttons-container">
        <h3 className="set-title">Select a Quiz Set:</h3>
        <button
          className="set-btn"
          onClick={() => redirectToSet("/drag-and-drop/set1")}
        >
          Set 1
        </button>
        <button
          className="set-btn"
          onClick={() => redirectToSet("/drag-and-drop/set2")}
        >
          Set 2
        </button>
        {/* <button
          className="set-btn"
          onClick={() => redirectToSet("/drag-and-drop/set3")}
        >
          Set 3
        </button> */}
      </div>
    </div>
  );
};

export default InstructionPage;
