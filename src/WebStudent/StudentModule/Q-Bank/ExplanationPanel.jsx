// import React from "react";

// export default function ExplanationPanel({ results = [] }) {
//   const normalizeArray = (v) => {
//     if (Array.isArray(v)) {
//       if (v.length === 1 && typeof v[0] === "string" && v[0].includes(",")) {
//         return v[0].split(",").map((s) => s.trim());
//       }
//       return v.map(String);
//     }
//     if (typeof v === "string" && v.includes(",")) {
//       return v.split(",").map((s) => s.trim());
//     }
//     return v != null ? [String(v)] : [];
//   };

//   const getOptionStyle = (label, selectedArr, correctArr) => {
//     const base = { ...styles.optionRow };
//     const isSelected = selectedArr.includes(label);
//     const isCorrect = correctArr.includes(label);
//     if (isSelected && isCorrect) return { ...base, ...styles.optionRowCorrect };
//     if (isSelected && !isCorrect) return { ...base, ...styles.optionRowIncorrect };
//     if (!isSelected && isCorrect) return { ...base, ...styles.optionRowHighlightCorrect };
//     return base;
//   };

//   return (
//     <div style={styles.panelWrap}>
//       <div style={styles.panelHeader}>
//         <h5 style={styles.panelHeading}>Answer Explanation</h5>
//       </div>

//       {results.map((r, idx) => {
//         const options = Array.isArray(r.options) ? r.options : [];
//         const selected = normalizeArray(r.submitted).map((x) => String(x).toUpperCase());
//         const correct  = normalizeArray(r.correct).map((x) => String(x).toUpperCase());

//         return (
//           <div key={r.questionId || idx} style={styles.card}>
//             {r.questionText && (
//               <div style={styles.qTitle}>
//                 <span style={styles.qIndex}>Q{idx + 1}:</span>{" "}
//                 <span>{r.questionText}</span>
//               </div>
//             )}

//             {!!options.length && (
//               <div>
//                 {options.map((opt, i) => {
//                   const label = String.fromCharCode(65 + i);
//                   const rowStyle = getOptionStyle(label, selected, correct);
//                   return (
//                     <div key={i} style={rowStyle}>
//                       <div style={styles.optionLabel}>{label}.</div>
//                       <div style={styles.optionText}>{opt}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}

//             {!!r.explanation && (
//               <div style={styles.explainBox}>
//                 <strong>Explanation:&nbsp;</strong>
//                 <span>{r.explanation}</span>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// const styles = {
//   panelWrap: { maxWidth: 900, margin: "16px auto 0", padding: "0 8px", textAlign: "left" },
//   panelHeader: { display: "flex", justifyContent: "center", marginBottom: 8 },
//   panelHeading: { margin: 0, fontWeight: 700 },
//   card: {
//     backgroundColor: "#eaf3ff",
//     border: "1px solid #d6e2ff",
//     borderRadius: 12,
//     padding: "14px 16px",
//     marginBottom: 16,
//     boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
//   },
//   qTitle: { fontSize: "1rem", marginBottom: 12, lineHeight: 1.4 },
//   qIndex: { fontWeight: 700, marginRight: 6 },
//   optionRow: {
//     display: "grid",
//     gridTemplateColumns: "32px 1fr",
//     alignItems: "center",
//     gap: 8,
//     border: "1px solid #ccc",
//     borderRadius: 8,
//     padding: "10px 12px",
//     marginBottom: 8,
//     backgroundColor: "#f9f9f9",
//     fontWeight: 600,
//   },
//   optionLabel: { width: 32, textAlign: "center" },
//   optionText: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
//   optionRowCorrect: { backgroundColor: "#4CAF50", borderColor: "#4CAF50", color: "#fff" },
//   optionRowIncorrect: { backgroundColor: "#f44336", borderColor: "#f44336", color: "#fff" },
//   optionRowHighlightCorrect: { backgroundColor: "#d4edda", borderColor: "#28a745", color: "#155724" },
//   explainBox: {
//     marginTop: 12, padding: "10px 12px", background: "#ffffff",
//     border: "1px solid #cddafc", borderLeft: "4px solid #4748ac",
//     borderRadius: 8, color: "#333",
//   },
// };

import React from "react";

export default function ExplanationPanel({ results = [] }) {
  const normalizeArray = (v) => {
    if (Array.isArray(v)) {
      if (v.length === 1 && typeof v[0] === "string" && v[0].includes(",")) {
        return v[0].split(",").map((s) => s.trim());
      }
      return v.map(String);
    }
    if (typeof v === "string" && v.includes(",")) {
      return v.split(",").map((s) => s.trim());
    }
    return v != null ? [String(v)] : [];
  };

  const getOptionStyle = (label, selectedArr, correctArr) => {
    const base = { ...styles.optionRow };
    const isSelected = selectedArr.includes(label);
    const isCorrect = correctArr.includes(label);
    if (isSelected && isCorrect) return { ...base, ...styles.optionRowCorrect };
    if (isSelected && !isCorrect) return { ...base, ...styles.optionRowIncorrect };
    if (!isSelected && isCorrect) return { ...base, ...styles.optionRowHighlightCorrect };
    return base;
  };

  return (
    <div style={styles.panelWrap}>
      <div style={styles.panelHeader}>
        <h5 style={styles.panelHeading}>Answer Explanation</h5>
      </div>

      {results.map((r, idx) => {
        const options = Array.isArray(r.options) ? r.options : [];
        const selected = normalizeArray(r.submitted).map((x) => String(x).toUpperCase());
        const correct  = normalizeArray(r.correct).map((x) => String(x).toUpperCase());

        return (
          <div key={r.questionId || idx} style={styles.card}>
            {r.questionText && (
              <div style={styles.qTitle}>
                <span style={styles.qIndex}>Q{idx + 1}:</span>{" "}
                <span>{r.questionText}</span>
              </div>
            )}

            {!!options.length && (
              <div>
                {options.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const rowStyle = getOptionStyle(label, selected, correct);
                  return (
                    <div key={i} style={rowStyle}>
                      <div style={styles.optionLabel}>{label}.</div>
                      <div style={styles.optionText}>{opt}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {!!r.explanation && (
              <div style={styles.explainBox}>
                <strong>Explanation:&nbsp;</strong>
                <span>{r.explanation}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  panelWrap: { maxWidth: 900, margin: "16px auto 0", padding: "0 8px", textAlign: "left" },
  panelHeader: { display: "flex", justifyContent: "center", marginBottom: 8 },
  panelHeading: { margin: 0, fontWeight: 700 },
  card: {
    backgroundColor: "#eaf3ff",
    border: "1px solid #d6e2ff",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 16,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  },
  qTitle: { fontSize: "1rem", marginBottom: 12, lineHeight: 1.4 },
  qIndex: { fontWeight: 700, marginRight: 6 },
  optionRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr",
    alignItems: "center",
    gap: 8,
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    fontWeight: 600,
  },
  optionLabel: { width: 32, textAlign: "center" },
  optionText: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  optionRowCorrect: { backgroundColor: "#4CAF50", borderColor: "#4CAF50", color: "#fff" },
  optionRowIncorrect: { backgroundColor: "#f44336", borderColor: "#f44336", color: "#fff" },
  optionRowHighlightCorrect: { backgroundColor: "#d4edda", borderColor: "#28a745", color: "#155724" },
  explainBox: {
    marginTop: 12, padding: "10px 12px", background: "#ffffff",
    border: "1px solid #cddafc", borderLeft: "4px solid #4748ac",
    borderRadius: 8, color: "#333",
  },
};