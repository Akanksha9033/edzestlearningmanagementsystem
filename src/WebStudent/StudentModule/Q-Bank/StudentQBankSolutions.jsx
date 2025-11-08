// // src/WebStudent/StudentModule/Q-Bank/StudentQBankSolutions.jsx
// import React, { useState } from "react";

// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   Box,
//   Paper,
//   Stack,
//   Typography,
//   Button,
//   Chip,
//   Divider,
// } from "@mui/material";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
// import NavigateNextIcon from "@mui/icons-material/NavigateNext";

// const BRAND = "#4748ac";
// const GREEN = "#22c55e";
// const RED = "#ef4444";

// // helpers (same idea as StudentSolutions)
// function toIndexArray(v) {
//   if (Array.isArray(v)) return v.map(Number).filter((x) => Number.isFinite(x));
//   if (v === null || v === undefined || v === "") return [];
//   return [Number(v)].filter((x) => Number.isFinite(x));
// }
// function inAns(ansArr, i) {
//   return ansArr.includes(i);
// }
// function isCorrectIndex(correctArr, i) {
//   return correctArr.includes(i);
// }

// export default function StudentQBankSolutions() {
//   const nav = useNavigate();
//   const location = useLocation();

//   // 🟣 Q-Bank result yahi se aa raha hai (StudentQBankSession se)
//   const results = location.state?.results || [];
//   const score = location.state?.score;
//   const totalScore = location.state?.total;

//   const [idx, setIdx] = useState(0);
//   const total = Array.isArray(results) ? results.length : 0;

//   // Agar koi data nahi mila (direct URL se aaye) – safe message
//   if (!total) {
//     return (
//       <Box p={4} textAlign="center">
//         <Typography variant="h6" sx={{ mb: 1 }}>
//           No explanation data found
//         </Typography>
//         <Typography color="text.secondary" sx={{ mb: 2 }}>
//           Please open this page from your Question Bank result screen.
//         </Typography>
//         <Button variant="contained" onClick={() => nav(-1)}>
//           Go Back
//         </Button>
//       </Box>
//     );
//   }

//   // safe index
//   const safeIdx = Math.min(Math.max(idx, 0), total - 1);
//   const item = results[safeIdx] || {};

//   // 🔹 Question object & normalisation
//   const qObj = item.question || {};
//   const questionText =
//     item.questionText ||
//     qObj.questionText ||
//     qObj.question ||
//     qObj.text ||
//     "—";

//   const optionsRaw = item.options || qObj.options || [];
//   const options = Array.isArray(optionsRaw) ? optionsRaw : [];

//   const correctRaw =
//     item.correct ??
//     item.correctAnswer ??
//     qObj.correct ??
//     qObj.correctAnswer;

//   const userRaw =
//     item.userAnswer ??
//     item.submitted ??
//     qObj.userAnswer ??
//     qObj.submitted;

//   const explanation =
//     item.explanation ??
//     qObj.explanation ??
//     "";

//   const correctArr = toIndexArray(correctRaw);
//   const userArr = toIndexArray(userRaw);

//   let status = item.status;
//   if (!status) {
//     if (!userArr.length) status = "skipped";
//     else {
//       const a = [...correctArr].sort();
//       const b = [...userArr].sort();
//       const same =
//         a.length === b.length && a.every((v, i) => v === b[i]);
//       status = same ? "correct" : "wrong";
//     }
//   }

//   const header = {
//   title: `Question ${safeIdx + 1} of ${total}`,
//   status,
// };


//   function prev() {
//     setIdx((i) => Math.max(0, i - 1));
//   }
//   function next() {
//     setIdx((i) => Math.min(total - 1, i + 1));
//   }

//   return (
//     <Box maxWidth={1300} mx="auto" my={3} px={2}>
//       {/* Top bar + back + score (StudentSolutions style) */}
//       <Stack direction="row" alignItems="center" spacing={1} mb={2}>
//         <Button
//           startIcon={<ArrowBackIcon />}
//           onClick={() => nav(-1)}
//           sx={{ textTransform: "none" }}
//         >
//           Back
//         </Button>

//         <Typography variant="h5" fontWeight={800}>
//           Solutions
//         </Typography>

//         <Chip
//           size="small"
//           label={header.title}
//           sx={{ ml: 1 }}
//         />

//         {typeof score === "number" && typeof totalScore === "number" && (
//           <Chip
//             size="small"
//             sx={{ ml: 1 }}
//             label={`Score: ${score}/${totalScore}`}
//           />
//         )}

//         {header.status === "correct" && (
//           <Chip size="small" color="success" label="Correct" />
//         )}
//         {header.status === "wrong" && (
//           <Chip size="small" color="error" label="Wrong" />
//         )}
//         {header.status === "skipped" && (
//           <Chip size="small" label="Skipped" />
//         )}
//       </Stack>

//       <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
//         {/* Question text */}
//         <Typography
//           variant="h6"
//           fontWeight={600}
//           fontFamily={"sans-serif"}
//           sx={{ mb: 2 }}
//         >
//           {questionText}
//         </Typography>

//         {/* Options list – same green/red styling as StudentSolutions */}
//         <Stack spacing={1.25}>
//           {options.map((opt, i) => {
//             const picked = inAns(userArr, i);
//             const correct = isCorrectIndex(correctArr, i);

//             let border = "1px solid rgba(0,0,0,0.12)";
//             let bg = "transparent";
//             let color = "inherit";

//             if (correct) {
//               border = `1px solid ${GREEN}`;
//               bg = "rgba(34,197,94,0.08)";
//             }
//             if (picked && !correct) {
//               border = `1px solid ${RED}`;
//               bg = "rgba(239,68,68,0.08)";
//               color = RED;
//             }

//             return (
//               <Box
//                 key={i}
//                 sx={{
//                   p: 1.25,
//                   borderRadius: 1,
//                   border,
//                   backgroundColor: bg,
//                   color,
//                   transition: "all .15s ease",
//                 }}
//               >
//                 <Stack direction="row" spacing={1.5} alignItems="baseline">
//                   <Box
//                     sx={{
//                       minWidth: 28,
//                       height: 28,
//                       borderRadius: "50%",
//                       border: "1px solid rgba(0,0,0,0.2)",
//                       display: "grid",
//                       placeItems: "center",
//                       fontSize: 14,
//                       fontWeight: 700,
//                       backgroundColor: picked
//                         ? "rgba(0,0,0,0.05)"
//                         : "transparent",
//                     }}
//                   >
//                     {String.fromCharCode(65 + i)}
//                   </Box>
//                   <Typography
//                     variant="body1"
//                     sx={{ whiteSpace: "pre-wrap" }}
//                   >
//                     {opt}
//                   </Typography>
//                 </Stack>
//               </Box>
//             );
//           })}
//         </Stack>

//         {/* Explanation */}
//         {explanation && (
//           <>
//             <Divider sx={{ my: 2 }} />
//             <Typography
//               variant="subtitle2"
//               sx={{ color: BRAND, fontWeight: 800, mb: 0.75 }}
//             >
//               Explanation
//             </Typography>
//             <Typography
//               variant="body2"
//               sx={{ whiteSpace: "pre-wrap" }}
//             >
//               {explanation}
//             </Typography>
//           </>
//         )}

//         {/* Prev / Next */}
//         <Stack
//           direction="row"
//           justifyContent="space-between"
//           alignItems="center"
//           sx={{ mt: 3 }}
//         >
//           <Button
//             variant="outlined"
//             startIcon={<NavigateBeforeIcon />}
//             onClick={prev}
//             disabled={safeIdx === 0}
//           >
//             Previous
//           </Button>
//           <Typography color="text.secondary">
//             {safeIdx + 1}/{total}
//           </Typography>
//           <Button
//             variant="contained"
//             endIcon={<NavigateNextIcon />}
//             onClick={next}
//             disabled={safeIdx + 1 >= total}
//             sx={{ backgroundColor: BRAND }}
//           >
//             Next
//           </Button>
//         </Stack>
//       </Paper>
//     </Box>
//   );
// }

// // src/WebStudent/StudentModule/Q-Bank/StudentQBankSolutions.jsx
// import React, { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   Box,
//   Paper,
//   Stack,
//   Typography,
//   Button,
//   Chip,
//   Divider,
// } from "@mui/material";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
// import NavigateNextIcon from "@mui/icons-material/NavigateNext";

// const BRAND = "#4748ac";
// const GREEN = "#22c55e";
// const RED = "#ef4444";

// // helpers (same idea as StudentSolutions)
// function toIndexArray(v) {
//   if (Array.isArray(v)) return v.map(Number).filter((x) => Number.isFinite(x));
//   if (v === null || v === undefined || v === "") return [];
//   return [Number(v)].filter((x) => Number.isFinite(x));
// }
// function inAns(ansArr, i) {
//   return ansArr.includes(i);
// }
// function isCorrectIndex(correctArr, i) {
//   return correctArr.includes(i);
// }

// export default function StudentQBankSolutions() {
//   const nav = useNavigate();
//   const location = useLocation();

//   // 🟣 Q-Bank result yahi se aa raha hai (StudentQBankSession se)
//   const results = location.state?.results || [];
//   const score = location.state?.score;
//   const totalScore = location.state?.total;

//   const [idx, setIdx] = useState(0);
//   const total = Array.isArray(results) ? results.length : 0;

//   // Agar koi data nahi mila (direct URL se aaye) – safe message
//   if (!total) {
//     return (
//       <Box p={4} textAlign="center">
//         <Typography variant="h6" sx={{ mb: 1 }}>
//           No explanation data found
//         </Typography>
//         <Typography color="text.secondary" sx={{ mb: 2 }}>
//           Please open this page from your Question Bank result screen.
//         </Typography>
//         <Button variant="contained" onClick={() => nav(-1)}>
//           Go Back
//         </Button>
//       </Box>
//     );
//   }

//   // safe index
//   const safeIdx = Math.min(Math.max(idx, 0), total - 1);
//   const item = results[safeIdx] || {};

//   // 🔹 Question object & normalisation
//   const qObj = item.question || {};
//   const questionText =
//     item.questionText ||
//     qObj.questionText ||
//     qObj.question ||
//     qObj.text ||
//     "—";

//   const optionsRaw = item.options || qObj.options || [];
//   const options = Array.isArray(optionsRaw) ? optionsRaw : [];

//   const correctRaw =
//     item.correct ??
//     item.correctAnswer ??
//     qObj.correct ??
//     qObj.correctAnswer;

//   const userRaw =
//     item.userAnswer ??
//     item.submitted ??
//     qObj.userAnswer ??
//     qObj.submitted;

//   const explanation =
//     item.explanation ??
//     qObj.explanation ??
//     "";

//   const correctArr = toIndexArray(correctRaw);
//   const userArr = toIndexArray(userRaw);

//   let status = item.status;
//   if (!status) {
//     if (!userArr.length) status = "skipped";
//     else {
//       const a = [...correctArr].sort();
//       const b = [...userArr].sort();
//       const same =
//         a.length === b.length && a.every((v, i) => v === b[i]);
//       status = same ? "correct" : "wrong";
//     }
//   }

//   const header = {
//     title: `Question ${safeIdx + 1} of ${total}`,
//     status,
//   };

//   function prev() {
//     setIdx((i) => Math.max(0, i - 1));
//   }
//   function next() {
//     setIdx((i) => Math.min(total - 1, i + 1));
//   }

//   return (
//     <Box maxWidth={1300} mx="auto" my={3} px={2}>
//       {/* Top bar + back + score (StudentSolutions style) */}
//       <Stack direction="row" alignItems="center" spacing={1} mb={2}>
//         <Button
//           startIcon={<ArrowBackIcon />}
//           onClick={() => nav(-1)}
//           sx={{ textTransform: "none" }}
//         >
//           Back
//         </Button>

//         <Typography variant="h5" fontWeight={800}>
//           Solutions
//         </Typography>

//         <Chip size="small" label={header.title} sx={{ ml: 1 }} />

//         {typeof score === "number" && typeof totalScore === "number" && (
//           <Chip
//             size="small"
//             sx={{ ml: 1 }}
//             label={`Score: ${score}/${totalScore}`}
//           />
//         )}

//         {header.status === "correct" && (
//           <Chip size="small" color="success" label="Correct" />
//         )}
//         {header.status === "wrong" && (
//           <Chip size="small" color="error" label="Wrong" />
//         )}
//         {header.status === "skipped" && (
//           <Chip size="small" label="Skipped" />
//         )}
//       </Stack>

//       <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
//         {/* Question text */}
//         <Typography
//           variant="h6"
//           fontWeight={600}
//           fontFamily={"sans-serif"}
//           sx={{ mb: 2 }}
//         >
//           {questionText}
//         </Typography>

//         {/* Options list – green for correct, red for wrong chosen */}
//         <Stack spacing={1.25}>
//           {options.map((opt, i) => {
//             const picked = inAns(userArr, i);            // student ne ye tick kiya?
//             const correct = isCorrectIndex(correctArr, i); // ye correct option hai?

//             let border = "1px solid rgba(0,0,0,0.12)";
//             let bg = "transparent";
//             let color = "inherit";

//             // ✅ Correct option hamesha green
//             if (correct) {
//               border = `1px solid ${GREEN}`;
//               bg = "rgba(34,197,94,0.08)";
//             }

//             // ✅ Agar student ne galat option pick kiya -> wo red
//             if (picked && !correct) {
//               border = `1px solid ${RED}`;
//               bg = "rgba(239,68,68,0.08)";
//               color = RED;
//             }

//             return (
//               <Box
//                 key={i}
//                 sx={{
//                   p: 1.25,
//                   borderRadius: 1,
//                   border,
//                   backgroundColor: bg,
//                   color,
//                   transition: "all .15s ease",
//                 }}
//               >
//                 <Stack direction="row" spacing={1.5} alignItems="baseline">
//                   <Box
//                     sx={{
//                       minWidth: 28,
//                       height: 28,
//                       borderRadius: "50%",
//                       border: "1px solid rgba(0,0,0,0.2)",
//                       display: "grid",
//                       placeItems: "center",
//                       fontSize: 14,
//                       fontWeight: 700,
//                       backgroundColor: picked
//                         ? "rgba(0,0,0,0.05)"
//                         : "transparent",
//                     }}
//                   >
//                     {String.fromCharCode(65 + i)}
//                   </Box>
//                   <Typography
//                     variant="body1"
//                     sx={{ whiteSpace: "pre-wrap" }}
//                   >
//                     {opt}
//                   </Typography>
//                 </Stack>
//               </Box>
//             );
//           })}
//         </Stack>

//         {/* Explanation */}
//         {explanation && (
//           <>
//             <Divider sx={{ my: 2 }} />
//             <Typography
//               variant="subtitle2"
//               sx={{ color: BRAND, fontWeight: 800, mb: 0.75 }}
//             >
//               Explanation
//             </Typography>
//             <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
//               {explanation}
//             </Typography>
//           </>
//         )}

//         {/* Prev / Next */}
//         <Stack
//           direction="row"
//           justifyContent="space-between"
//           alignItems="center"
//           sx={{ mt: 3 }}
//         >
//           <Button
//             variant="outlined"
//             startIcon={<NavigateBeforeIcon />}
//             onClick={prev}
//             disabled={safeIdx === 0}
//           >
//             Previous
//           </Button>
//           <Typography color="text.secondary">
//             {safeIdx + 1}/{total}
//           </Typography>
//           <Button
//             variant="contained"
//             endIcon={<NavigateNextIcon />}
//             onClick={next}
//             disabled={safeIdx + 1 >= total}
//             sx={{ backgroundColor: BRAND }}
//           >
//             Next
//           </Button>
//         </Stack>
//       </Paper>
//     </Box>
//   );
// }


// src/WebStudent/StudentModule/Q-Bank/StudentQBankSolutions.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const BRAND = "#4748ac";
const GREEN = "#22c55e";
const RED = "#ef4444";

/* ------------------------------------------------------------------ */
/* 🔹 Helpers: ABCD ya index ko option index me convert karna         */
/* ------------------------------------------------------------------ */

// ek value ko (string/number) -> index (0-based) me convert karo
function normalizeOneToIndex(v, optionsLength) {
  if (v === null || v === undefined || v === "") return null;

  // number
  if (typeof v === "number") {
    const n = v;
    // 0-based
    if (n >= 0 && n < optionsLength) return n;
    // 1-based
    if (n >= 1 && n <= optionsLength) return n - 1;
    return null;
  }

  // string
  if (typeof v === "string") {
    let s = v.trim();
    if (!s) return null;

    // agar string comma se separated hai, yaha nahi handle karenge
    // ye kaam outer function karega
    // yaha sirf single token handle hoga

    // numeric string
    if (/^[0-9]+$/.test(s)) {
      const n = Number(s);
      if (n >= 0 && n < optionsLength) return n;      // 0-based
      if (n >= 1 && n <= optionsLength) return n - 1; // 1-based
      return null;
    }

    // single letter: A/B/C/D...
    if (/^[A-Za-z]$/.test(s)) {
      s = s.toUpperCase();
      const n = s.charCodeAt(0) - 65; // A=0, B=1...
      if (n >= 0 && n < optionsLength) return n;
      return null;
    }

    return null;
  }

  return null;
}

// value (single, array, "A,B") ko index array me convert karo
function toIndexArrayABCD(value, optionsLength) {
  if (Array.isArray(value)) {
    return value
      .map((v) => normalizeOneToIndex(v, optionsLength))
      .filter((n) => Number.isFinite(n));
  }

  if (typeof value === "string" && value.includes(",")) {
    return value
      .split(",")
      .map((s) => normalizeOneToIndex(s, optionsLength))
      .filter((n) => Number.isFinite(n));
  }

  const one = normalizeOneToIndex(value, optionsLength);
  return Number.isFinite(one) ? [one] : [];
}

function inAns(ansArr, i) {
  return ansArr.includes(i);
}

function isCorrectIndex(correctArr, i) {
  return correctArr.includes(i);
}

/* ------------------------------------------------------------------ */

export default function StudentQBankSolutions() {
  const nav = useNavigate();
  const location = useLocation();

  // 🟣 Q-Bank result yahi se aa raha hai (StudentQBankSession se)
  const results = location.state?.results || [];
  const score = location.state?.score;
  const totalScore = location.state?.total;

  const [idx, setIdx] = useState(0);
  const total = Array.isArray(results) ? results.length : 0;

  // Agar koi data nahi mila (direct URL se aaye) – safe message
  if (!total) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" sx={{ mb: 1 }}>
          No explanation data found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Please open this page from your Question Bank result screen.
        </Typography>
        <Button variant="contained" onClick={() => nav(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // safe index
  const safeIdx = Math.min(Math.max(idx, 0), total - 1);
  const item = results[safeIdx] || {};

  // 🔹 Question object & normalisation
  const qObj = item.question || {};
  const questionText =
    item.questionText ||
    qObj.questionText ||
    qObj.question ||
    qObj.text ||
    "—";

  const optionsRaw = item.options || qObj.options || [];
  const options = Array.isArray(optionsRaw) ? optionsRaw : [];

  // correct + user answers (ABCD / indices dono handle)
  const correctRaw =
    item.correct ??
    item.correctAnswer ??
    qObj.correct ??
    qObj.correctAnswer;

  const userRaw =
    item.userAnswer ??
    item.submitted ??
    qObj.userAnswer ??
    qObj.submitted;

  const explanation =
    item.explanation ??
    qObj.explanation ??
    "";

  // Yaha se actual index arrays milte hain (0-based)
  const correctArr = toIndexArrayABCD(correctRaw, options.length);
  const userArr = toIndexArrayABCD(userRaw, options.length);

  // status derive karo agar backend ne nahi diya
  let status = item.status;
  if (!status) {
    if (!userArr.length) status = "skipped";
    else {
      const a = [...correctArr].sort();
      const b = [...userArr].sort();
      const same =
        a.length === b.length && a.every((v, i) => v === b[i]);
      status = same ? "correct" : "wrong";
    }
  }

  const header = {
    title: `Question ${safeIdx + 1} of ${total}`,
    status,
  };

  function prev() {
    setIdx((i) => Math.max(0, i - 1));
  }
  function next() {
    setIdx((i) => Math.min(total - 1, i + 1));
  }

  return (
    <Box maxWidth={1300} mx="auto" my={3} px={2}>
      {/* Top bar + back + score (StudentSolutions style) */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => nav("/student/qbank")}

          sx={{ textTransform: "none" }}
        >
          Back
        </Button>

        <Typography variant="h5" fontWeight={800}>
          Solutions
        </Typography>

        <Chip size="small" label={header.title} sx={{ ml: 1 }} />

        {typeof score === "number" && typeof totalScore === "number" && (
          <Chip
            size="small"
            sx={{ ml: 1 }}
            label={`Score: ${score}/${totalScore}`}
          />
        )}

        {header.status === "correct" && (
          <Chip size="small" color="success" label="Correct" />
        )}
        {header.status === "wrong" && (
          <Chip size="small" color="error" label="Wrong" />
        )}
        {header.status === "skipped" && (
          <Chip size="small" label="Skipped" />
        )}
      </Stack>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        {/* Question text */}
        <Typography
          variant="h6"
          fontWeight={600}
          fontFamily={"sans-serif"}
          sx={{ mb: 2 }}
        >
          {questionText}
        </Typography>

        {/* Options list – A/B/C/D + green/red styling */}
        <Stack spacing={1.25}>
          {options.map((opt, i) => {
            const picked = inAns(userArr, i);             // student ne ye tick kiya?
            const correct = isCorrectIndex(correctArr, i); // ye correct option hai?

            let border = "1px solid rgba(0,0,0,0.12)";
            let bg = "transparent";
            let color = "inherit";

            // ✅ Correct option hamesha green
            if (correct) {
              border = `1px solid ${GREEN}`;
              bg = "rgba(34,197,94,0.08)";
            }

            // ✅ Agar student ne galat option pick kiya -> wo red
            if (picked && !correct) {
              border = `1px solid ${RED}`;
              bg = "rgba(239,68,68,0.08)";
              color = RED;
            }

            const displayText =
              typeof opt === "string" ? opt : opt?.text ?? opt?.label ?? String(opt);

            return (
              <Box
                key={i}
                sx={{
                  p: 1.25,
                  borderRadius: 1,
                  border,
                  backgroundColor: bg,
                  color,
                  transition: "all .15s ease",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="baseline">
                  {/* A / B / C / D circle */}
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "1px solid rgba(0,0,0,0.2)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      backgroundColor: picked
                        ? "rgba(0,0,0,0.05)"
                        : "transparent",
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {displayText}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>

        {/* Explanation */}
        {explanation && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              sx={{ color: BRAND, fontWeight: 800, mb: 0.75 }}
            >
              Explanation
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {explanation}
            </Typography>
          </>
        )}

        {/* Prev / Next */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 3 }}
        >
          <Button
            variant="outlined"
            startIcon={<NavigateBeforeIcon />}
            onClick={prev}
            disabled={safeIdx === 0}
          >
            Previous
          </Button>
          <Typography color="text.secondary">
            {safeIdx + 1}/{total}
          </Typography>
          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            onClick={next}
            disabled={safeIdx + 1 >= total}
            sx={{ backgroundColor: BRAND }}
          >
            Next
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
