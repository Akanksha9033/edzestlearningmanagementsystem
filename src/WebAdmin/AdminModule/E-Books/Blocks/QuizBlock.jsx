// code for creating the QuizBlock component with internal CSS styles from admin side

// import React from "react";

// export default function QuizBlock({ block, onChange }) {
//   const update = (key, value) => onChange({ ...block, [key]: value });

//   const handleOptionChange = (index, value) => {
//     const newOptions = [...(block.options || [])];
//     newOptions[index] = value;
//     update("options", newOptions);
//   };

//   // ✅ Internal CSS styles
//   const styles = {
//     container: {
//       backgroundColor: "#fffbea",
//       border: "2px solid #4748ac",
//       borderRadius: "12px",
//       padding: "20px",
//       marginTop: "15px",
//       color: "#000",
//       fontFamily: "'Inter', sans-serif",
//       boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
//     },
//     title: {
//       color: "#4748ac",
//       fontWeight: "700",
//       fontSize: "18px",
//       marginBottom: "12px",
//       display: "flex",
//       alignItems: "center",
//       gap: "6px",
//     },
//     input: {
//       width: "100%",
//       padding: "10px",
//       borderRadius: "8px",
//       border: "1px solid #ccc",
//       fontSize: "15px",
//       marginBottom: "10px",
//       outline: "none",
//       color: "#000",
//     },
//     optionInput: {
//       width: "100%",
//       padding: "10px",
//       borderRadius: "8px",
//       border: "1px solid #ccc",
//       fontSize: "14px",
//       marginBottom: "8px",
//       color: "#000",
//     },
//     label: {
//       display: "block",
//       marginTop: "10px",
//       fontWeight: "600",
//       color: "#000",
//     },
//     select: {
//       width: "100%",
//       padding: "10px",
//       borderRadius: "8px",
//       border: "1px solid #ccc",
//       fontSize: "14px",
//       marginTop: "6px",
//       color: "#000",
//       outline: "none",
//       cursor: "pointer",
//     },
//     textarea: {
//       width: "100%",
//       minHeight: "80px",
//       borderRadius: "8px",
//       border: "1px solid #ccc",
//       padding: "10px",
//       fontSize: "14px",
//       marginTop: "10px",
//       color: "#000",
//       outline: "none",
//       resize: "vertical",
//     },
//     note: {
//       fontSize: "14px",
//       marginTop: "8px",
//       color: "#4748ac",
//       fontStyle: "italic",
//     },
//   };

//   return (
//     <div style={styles.container}>
//       <h4 style={styles.title}>🧠 Quiz Question</h4>

//       <input
//         type="text"
//         placeholder="Enter your question..."
//         style={styles.input}
//         value={block.questionText || ""}
//         onChange={(e) => update("questionText", e.target.value)}
//       />

//       <div>
//         {(block.options || ["", "", "", ""]).map((opt, i) => (
//           <input
//             key={i}
//             type="text"
//             placeholder={`Option ${i + 1}`}
//             style={styles.optionInput}
//             value={opt}
//             onChange={(e) => handleOptionChange(i, e.target.value)}
//           />
//         ))}
//       </div>

//       <label style={styles.label}>
//         Correct Answer:
//         <select
//           style={styles.select}
//           value={block.correctAnswer ?? ""}
//           onChange={(e) => update("correctAnswer", parseInt(e.target.value))}
//         >
//           <option value="">Select correct option</option>
//           {(block.options || []).map((opt, i) => (
//             <option key={i} value={i}>
//               Option {i + 1}
//             </option>
//           ))}
//         </select>
//       </label>

//       <textarea
//         placeholder="Write an explanation (optional)..."
//         style={styles.textarea}
//         value={block.explanation || ""}
//         onChange={(e) => update("explanation", e.target.value)}
//       />

//       <p style={styles.note}>💡 Students will see explanation only after answering.</p>
//     </div>
//   );
// }


import React from "react";

export default function QuizBlock({ block, onChange }) {
  // 🧠 Ensure quiz list
  const questions = block.questions && Array.isArray(block.questions) && block.questions.length
    ? block.questions
    : [
        {
          questionText: block.questionText || "",
          options: block.options || ["", "", "", ""],
          correctAnswer: block.correctAnswer ?? "",
          explanation: block.explanation || "",
        },
      ];

  const updateQuestions = (newQuestions) => {
    onChange({ ...block, questions: newQuestions });
  };

  const updateSingleQuestion = (index, key, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [key]: value };
    updateQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    const opts = [...(newQuestions[qIndex].options || ["", "", "", ""])];
    opts[oIndex] = value;
    newQuestions[qIndex].options = opts;
    updateQuestions(newQuestions);
  };

  const addQuestion = () => {
    updateQuestions([
      ...questions,
      {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return; // at least one required
    const newQuestions = questions.filter((_, i) => i !== index);
    updateQuestions(newQuestions);
  };

  // ✅ Internal CSS styles
  const styles = {
    container: {
      backgroundColor: "#fffbea",
      border: "2px solid #4748ac",
      borderRadius: "12px",
      padding: "20px",
      marginTop: "15px",
      color: "#000",
      fontFamily: "'Inter', sans-serif",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    },
    title: {
      color: "#4748ac",
      fontWeight: "700",
      fontSize: "18px",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      justifyContent: "space-between",
    },
    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "15px",
      marginBottom: "10px",
      outline: "none",
      color: "#000",
    },
    optionInput: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "14px",
      marginBottom: "8px",
      color: "#000",
    },
    label: {
      display: "block",
      marginTop: "10px",
      fontWeight: "600",
      color: "#000",
    },
    select: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "14px",
      marginTop: "6px",
      color: "#000",
      outline: "none",
      cursor: "pointer",
    },
    textarea: {
      width: "100%",
      minHeight: "80px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      padding: "10px",
      fontSize: "14px",
      marginTop: "10px",
      color: "#000",
      outline: "none",
      resize: "vertical",
    },
    note: {
      fontSize: "14px",
      marginTop: "8px",
      color: "#4748ac",
      fontStyle: "italic",
    },
    subBlock: {
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "20px",
      backgroundColor: "#fff",
    },
    btnAdd: {
      backgroundColor: "#4748ac",
      color: "#fff",
      padding: "8px 14px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      marginTop: "10px",
    },
    btnRemove: {
      backgroundColor: "#dc3545",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "4px 10px",
      cursor: "pointer",
      fontSize: "13px",
      float: "right",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        🧠 Quiz Questions
        <button style={styles.btnAdd} onClick={addQuestion}>
          ➕ Add Question
        </button>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} style={styles.subBlock}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h4 style={{ color: "#4748ac", marginBottom: "10px" }}>
              Question {qi + 1}
            </h4>
            {questions.length > 1 && (
              <button style={styles.btnRemove} onClick={() => removeQuestion(qi)}>
                🗑 Remove
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Enter your question..."
            style={styles.input}
            value={q.questionText || ""}
            onChange={(e) =>
              updateSingleQuestion(qi, "questionText", e.target.value)
            }
          />

          <div>
            {(q.options || ["", "", "", ""]).map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Option ${i + 1}`}
                style={styles.optionInput}
                value={opt}
                onChange={(e) => handleOptionChange(qi, i, e.target.value)}
              />
            ))}
          </div>

          <label style={styles.label}>
            Correct Answer:
            <select
              style={styles.select}
              value={q.correctAnswer ?? ""}
              onChange={(e) =>
                updateSingleQuestion(qi, "correctAnswer", parseInt(e.target.value))
              }
            >
              <option value="">Select correct option</option>
              {(q.options || []).map((opt, i) => (
                <option key={i} value={i}>
                  Option {i + 1}
                </option>
              ))}
            </select>
          </label>

          <textarea
            placeholder="Write an explanation (optional)..."
            style={styles.textarea}
            value={q.explanation || ""}
            onChange={(e) =>
              updateSingleQuestion(qi, "explanation", e.target.value)
            }
          />

          <p style={styles.note}>
            💡 Students will see explanation only after answering.
          </p>
        </div>
      ))}
    </div>
  );
}
