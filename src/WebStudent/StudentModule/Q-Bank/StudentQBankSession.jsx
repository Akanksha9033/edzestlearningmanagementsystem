// import React, { useState, useEffect, useRef } from "react";
// import { useLocation, useParams, useNavigate } from "react-router-dom";
// import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
// import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
// import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
// import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
// // import StudentQBankSolutions from "./StudentQBankSolutions"; // not used here

// import API from "../../../LoginSystem/axios";

// import {
//   Box,
//   Button,
//   RadioGroup,
//   FormControlLabel,
//   Radio,
//   Checkbox,
//   Typography,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Chip,
//   LinearProgress,
//   FormGroup,
//   Stack,
//   Drawer,
//   Divider,
//   IconButton,
//   useMediaQuery,
//   TextField,
//   Paper,
//   Tooltip,
// } from "@mui/material";

// // 🔹 Added for Mocktest-style toolbar (imports)
// import EditIcon from "@mui/icons-material/Edit";
// import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
// import StickyNote2Icon from "@mui/icons-material/StickyNote2";
// import QuestionView from "../Mocktest/QuestionView";
// // 🔹 End added imports

// export default function StudentQBankSession() {
//   const { sessionId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const bankId = location.state?.bankId || null;

//   const [questions, setQuestions] = useState(location.state?.questions || []);
//   const [answers, setAnswers] = useState({});
//   const [timeLeft, setTimeLeft] = useState(
//     location.state?.duration * 60 || 600
//   );
//   const [currentQIndex, setCurrentQIndex] = useState(0);
//   const [result, setResult] = useState(null);
//   const [session] = useState({
//     sessionId: sessionId || location.state?.sessionId || null,
//   });

//   const [showExplain, setShowExplain] = useState(false);
//   const timerRef = useRef(null);
//   const submittedRef = useRef(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);

//   const isMdUp = useMediaQuery("(min-width:900px)");
//   const [drawerOpen, setDrawerOpen] = useState(false);

//   // ✅ ADDED: local state for "time over" popup (from your file)
//   const [timeUp, setTimeUp] = useState(false);

//   // 🔹 Added for Mocktest-style toolbar (refs)
//   const qvRef = useRef(null);
//   const [scratchOpen, setScratchOpen] = useState(false);
//   // 🔹 End added refs

//   // ⭐ NEW: local saved state for QuestionView (for mark-as-review flag etc.)
//   const [qvSavedMap, setQvSavedMap] = useState({});

//   // defensive cleanup
//   useEffect(() => {
//     document.body.classList.remove("app-fs");
//     document.documentElement.style.overflow = "";
//     document.body.style.overflow = "";
//   }, []);

//   useEffect(() => {
//     if (!questions.length) {
//       console.warn(
//         "⚠️ No questions found in state. If page was refreshed, implement GET /session/:id to reload."
//       );
//     }
//   }, [questions]);

//   useEffect(() => {
//     if (result || submittedRef.current) return;
//     if (timerRef.current) clearInterval(timerRef.current);

//     timerRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           if (timerRef.current) clearInterval(timerRef.current);
//           setTimeUp(true);
//           if (!submittedRef.current) {
//             submittedRef.current = true;
//             handleSubmit(true);
//           }
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => timerRef.current && clearInterval(timerRef.current);
//   }, [result]);

//   const formatTime = (secs) => {
//     const m = Math.floor(secs / 60);
//     const s = secs % 60;
//     return `${m}:${s < 10 ? "0" : ""}${s}`;
//   };

//   const handleChange = (qid, val) => {
//     if (result) return;
//     setAnswers({ ...answers, [qid]: val });
//   };

//   const handleSubmit = async (auto = false) => {
//     try {
//       if (submittedRef.current) return;
//       submittedRef.current = true;
//       if (timerRef.current) clearInterval(timerRef.current);

//       const sid =
//         session?.sessionId || location.state?.sessionId || sessionId || null;
//       if (!sid) {
//         console.error("❌ Missing sessionId — cannot submit");
//         return;
//       }

//       // 🔹 YAHAN pe hum index -> A/B/C/D convert kar rahe hain
//       const payloadAnswers = {};
//       Object.entries(answers).forEach(([qid, val]) => {
//         if (Array.isArray(val)) {
//           // multi-select: [0,2] -> ["A","C"]
//           payloadAnswers[qid] = val.map((i) =>
//             String.fromCharCode(65 + Number(i))
//           );
//         } else if (val !== null && val !== undefined && val !== "") {
//           // single-select: 3 -> "D"
//           payloadAnswers[qid] = String.fromCharCode(65 + Number(val));
//         } else {
//           payloadAnswers[qid] = val;
//         }
//       });

//       const res = await API.post(`/api/student/qbank/session/${sid}/submit`, {
//         answers: payloadAnswers,
//       });
//       setResult(res.data);
//     } catch (err) {
//       console.error("❌ Submit failed", err);
//       if (!auto) submittedRef.current = false;
//     }
//   };

//   const requestSubmit = () => setConfirmOpen(true);

//   const currentQuestion = questions[currentQIndex];

//   // --- Navigator panel (used both in sidebar and Drawer) ---
//   const NavigatorPanel = (
//     <Box sx={{ p: 1 }}>
//       {/* ⭐ Timer removed from navigator as per request */}
//       {/* <Stack direction="row" alignItems="center" gap={1} mb={1}>
//         <AccessTimeRoundedIcon fontSize="small" />
//         <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
//           Time Left:
//         </Typography>
//         <Typography
//           variant="subtitle2"
//           color={timeLeft < 60 ? "error.main" : "success.main"}
//           sx={{ fontWeight: 700 }}
//         >
//           {formatTime(timeLeft)}
//         </Typography>
//       </Stack>

//       <Divider sx={{ my: 1.25 }} /> */}

//       <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
//         Question Navigator
//       </Typography>

//       <Box
//         sx={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
//           gap: 1,
//         }}
//       >
//         {questions.map((q, idx) => (
//           <Button
//             key={idx}
//             variant={currentQIndex === idx ? "contained" : "outlined"}
//             onClick={() => {
//               setCurrentQIndex(idx);
//               setDrawerOpen(false);
//             }}
//             sx={{
//               minWidth: 0,
//               py: 1,
//               ...(answers[q.questionId]
//                 ? {
//                     bgcolor: "#4748ac",
//                     color: "white",
//                     ":hover": { bgcolor: "#3e40a5" },
//                   }
//                 : {}),
//             }}
//           >
//             {idx + 1}
//           </Button>
//         ))}
//       </Box>
//     </Box>
//   );

//   // ===========================================================
//   // ✅ RENDER
//   // ===========================================================
//   return (
//     <Box
//       sx={{
//         px: { xs: 1.25, sm: 2 },
//         py: { xs: 1.25, sm: 2 },
//         maxWidth: 1200,
//         mx: "auto",
//       }}
//     >
//       {/* 🔹 Added for Mocktest-style toolbar (start) */}
//       {!result && (
//         <Paper
//           sx={{
//             p: 1,
//             position: "sticky",
//             top: 0,
//             zIndex: 10,
//             flex: "0 0 auto",
//             backgroundColor: "#4748ac",
//             color: "#fff",
//             mb: 2,
//           }}
//         >
//           <Stack
//             direction="row"
//             alignItems="center"
//             spacing={1}
//             sx={{ width: "100%" }}
//           >
//             <Tooltip title="Highlight selected text">
//               <Button
//                 size="small"
//                 variant="outlined"
//                 startIcon={<EditIcon fontSize="small" />}
//                 onMouseDown={(e) => e.preventDefault()}
//                 onClick={() => qvRef.current?.highlightSelection?.()}
//                 sx={{
//                   color: "white",
//                   borderColor: "rgba(255,255,255,0.7)",
//                   backgroundColor: "#4748ac",
//                   "&:hover": {
//                     borderColor: "#fff",
//                     backgroundColor: "#3d3ea2",
//                   },
//                 }}
//               >
//                 Highlight
//               </Button>
//             </Tooltip>

//             <Tooltip title="Strikethrough selected text">
//               <Button
//                 size="small"
//                 variant="outlined"
//                 startIcon={<StrikethroughSIcon fontSize="small" />}
//                 onMouseDown={(e) => e.preventDefault()}
//                 onClick={() => qvRef.current?.strikeSelection?.()}
//                 sx={{
//                   color: "white",
//                   borderColor: "rgba(255,255,255,0.7)",
//                   backgroundColor: "#4748ac",
//                   "&:hover": {
//                     borderColor: "#fff",
//                     backgroundColor: "#3d3ea2",
//                   },
//                 }}
//               >
//                 Strikethrough
//               </Button>
//             </Tooltip>

//             {/* <Tooltip title="Scratch Pad">
//               <Button
//                 size="small"
//                 variant="outlined"
//                 startIcon={<StickyNote2Icon fontSize="small" />}
//                 onClick={() => setScratchOpen(true)}
//                 sx={{
//                   color: "white",
//                   borderColor: "rgba(255,255,255,0.7)",
//                   backgroundColor: "#4748ac",
//                   "&:hover": { borderColor: "#fff", backgroundColor: "#3d3ea2" },
//                 }}
//               >
//                 Scratch Pad
//               </Button>
//             </Tooltip> */}

//             <Box sx={{ flexGrow: 1 }} />

//             <Stack direction="row" alignItems="center" gap={1}>
//               <AccessTimeRoundedIcon fontSize="small" />
//               <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                 {formatTime(timeLeft)}
//               </Typography>
//             </Stack>
//           </Stack>
//         </Paper>
//       )}
//       {/* 🔹 Added for Mocktest-style toolbar (end) */}

//       {/* Mobile top bar: menu + time (unchanged original) */}
//       {!isMdUp && !result && (
//         <Box
//           sx={{
//             mb: 1.25,
//             px: 1,
//             py: 0.75,
//             borderRadius: 3,
//             border: "1px solid",
//             borderColor: "divider",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 1,
//             bgcolor: "background.paper",
//           }}
//         >
//           <IconButton
//             aria-label="open navigator"
//             onClick={() => setDrawerOpen(true)}
//           >
//             <MenuRoundedIcon />
//           </IconButton>
//           <Stack direction="row" alignItems="center" gap={1}>
//             <AccessTimeRoundedIcon fontSize="small" />
//             <Typography
//               variant="body2"
//               color={timeLeft < 60 ? "error.main" : "success.main"}
//               sx={{ fontWeight: 700 }}
//             >
//               {formatTime(timeLeft)}
//             </Typography>
//           </Stack>
//         </Box>
//       )}

//       {/* ====================================================== */}
//       {/* Main Layout (Unchanged original logic below)           */}
//       {/* ====================================================== */}
//       <Box
//         sx={{
//           display: "flex",
//           flexDirection: { xs: "column", md: "row" },
//           alignItems: "stretch",
//           gap: { xs: 2, md: 3 },
//         }}
//       >
//         {/* Left column */}
//         <Box
//           sx={{
//             flex: { md: 3 },
//             minWidth: 0,
//             display: "flex",
//             flexDirection: "column",
//             minHeight: { xs: "100dvh", md: "auto" },
//           }}
//         >
//           {/* Back button (unchanged) */}
//           <Box sx={{ mb: 2 }}>
//             <Button
//               variant="text"
//               startIcon={<ArrowBackIosNewIcon />}
//               onClick={() => {
//                 if (bankId) navigate(`/student/qbank/details/${bankId}`);
//                 else navigate("/student/qbank");
//               }}
//               sx={{
//                 color: "#4748ac",
//                 textTransform: "none",
//                 fontWeight: 600,
//                 px: 0,
//               }}
//             >
//               Back to Details
//             </Button>
//           </Box>

//           {/* ===== Scrollable content (now includes QuestionView) ===== */}
//           <Box
//             sx={{
//               flex: 1,
//               overflowY: "auto",
//               WebkitOverflowScrolling: "touch",
//               pb: { xs: 8, md: 0 },
//             }}
//           >
//             {/* Result header + Explanation */}
//             {result && (
//               <Box sx={{ mb: 3, textAlign: "center" }}>
//                 <Typography
//                   variant="h5"
//                   sx={{ color: "green", fontWeight: "bold" }}
//                 >
//                   ✅ Test Completed
//                 </Typography>
//                 <Typography variant="h6" sx={{ mb: 2 }}>
//                   Your Score: <b>{result.score}</b> / <b>{result.total}</b>
//                 </Typography>
//                 <Button
//                   variant="contained"
//                   onClick={() =>
//                     navigate("/student/qbank/solutions", {
//                       state: {
//                         results: result?.results || [],
//                         score: result?.score,
//                         total: result?.total,
//                       },
//                     })
//                   }
//                   sx={styles.explanationToggle}
//                 >
//                   Show Explanation
//                 </Button>
//               </Box>
//             )}

//             {/* Render current question */}
//             {!result && currentQuestion && (
//               <Box sx={{ mb: 3 }}>
//                 {/* 🔹 Added for Mocktest-style highlight/strike functionality (start) */}
//                 <QuestionView
//                   ref={qvRef}
//                   data={{
//                     question: {
//                       question: currentQuestion.questionText,
//                       options: [], // only text; options neeche render ho rahe
//                       questionType: currentQuestion.questionType,
//                     },
//                     // ⭐ use per-question saved state so mark-as-review works
//                     saved: qvSavedMap[currentQuestion.questionId] || {},
//                   }}
//                   disabled={!!result}
//                   onSave={(payload) => {
//                     // ⭐ local merge of saved state (flag, highlights, etc.)
//                     const qid = currentQuestion?.questionId;
//                     if (!qid) return;
//                     setQvSavedMap((prev) => ({
//                       ...prev,
//                       [qid]: {
//                         ...(prev[qid] || {}),
//                         ...payload,
//                       },
//                     }));
//                   }}
//                   enableHighlight
//                   enableStrikethrough
//                 />
//                 {/* 🔹 Added for Mocktest-style highlight/strike functionality (end) */}

//                 {/* Original answer rendering (unchanged logic) */}
//                 <Box sx={{ mt: 2 }}>
//                   {Array.isArray(currentQuestion.options) &&
//                     currentQuestion.options.map((opt, idx) => {
//                       const selected =
//                         answers[currentQuestion.questionId] === idx;
//                       const isMulti =
//                         currentQuestion.questionType &&
//                         /multi/i.test(currentQuestion.questionType);

//                       return (
//                         <FormGroup key={idx}>
//                           <FormControlLabel
//                             control={
//                               isMulti ? (
//                                 <Checkbox
//                                   checked={
//                                     Array.isArray(
//                                       answers[currentQuestion.questionId]
//                                     )
//                                       ? answers[
//                                           currentQuestion.questionId
//                                         ].includes(idx)
//                                       : false
//                                   }
//                                   onChange={(e) => {
//                                     if (result) return;
//                                     const old =
//                                       answers[currentQuestion.questionId] || [];
//                                     let next = [...old];
//                                     if (e.target.checked) next.push(idx);
//                                     else next = next.filter((x) => x !== idx);
//                                     handleChange(
//                                       currentQuestion.questionId,
//                                       next
//                                     );
//                                   }}
//                                 />
//                               ) : (
//                                 <Radio
//                                   checked={selected}
//                                   onChange={() =>
//                                     handleChange(
//                                       currentQuestion.questionId,
//                                       idx
//                                     )
//                                   }
//                                 />
//                               )
//                             }
//                             label={opt}
//                           />
//                         </FormGroup>
//                       );
//                     })}
//                 </Box>
//               </Box>
//             )}

//             {/* Navigation buttons */}
//             {!result && (
//               <Stack
//                 direction="row"
//                 alignItems="center"
//                 justifyContent="space-between"
//                 sx={{ mt: 3 }}
//               >
//                 <Button
//                   disabled={currentQIndex === 0}
//                   onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
//                   variant="outlined"
//                   sx={{ textTransform: "none", borderRadius: 2 }}
//                 >
//                   Previous
//                 </Button>

//                 {currentQIndex === questions.length - 1 ? (
//                   <Button
//                     onClick={requestSubmit}
//                     variant="contained"
//                     sx={{
//                       backgroundColor: "#4748ac",
//                       color: "white",
//                       borderRadius: 2,
//                       textTransform: "none",
//                       "&:hover": { backgroundColor: "#3e40a5" },
//                     }}
//                   >
//                     Submit
//                   </Button>
//                 ) : (
//                   <Button
//                     onClick={() =>
//                       setCurrentQIndex((i) =>
//                         Math.min(questions.length - 1, i + 1)
//                       )
//                     }
//                     variant="contained"
//                     sx={{
//                       backgroundColor: "#4748ac",
//                       color: "white",
//                       borderRadius: 2,
//                       textTransform: "none",
//                       "&:hover": { backgroundColor: "#3e40a5" },
//                     }}
//                   >
//                     Next
//                   </Button>
//                 )}
//               </Stack>
//             )}
//           </Box>
//         </Box>

//         {/* Right column: question navigator (unchanged except timer removed) */}
//         {isMdUp && !result && (
//           <Paper
//             elevation={1}
//             sx={{
//               flex: { md: 1 },
//               maxWidth: 300,
//               p: 2,
//               borderRadius: 2,
//               border: "1px solid",
//               borderColor: "divider",
//               bgcolor: "background.paper",
//               position: "sticky",
//               top: 90,
//               height: "fit-content",
//             }}
//           >
//             {NavigatorPanel}
//           </Paper>
//         )}
//       </Box>

//       {/* Drawer for mobile view */}
//       <Drawer
//         anchor="left"
//         open={drawerOpen}
//         onClose={() => setDrawerOpen(false)}
//         PaperProps={{
//           sx: {
//             width: 280,
//             borderRadius: "0 16px 16px 0",
//             borderRight: "none",
//             boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
//           },
//         }}
//       >
//         <Stack
//           direction="row"
//           alignItems="center"
//           justifyContent="space-between"
//           sx={{
//             px: 1.5,
//             py: 1,
//             borderBottom: "1px solid",
//             borderColor: "divider",
//           }}
//         >
//           <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//             Navigator
//           </Typography>
//           <IconButton onClick={() => setDrawerOpen(false)}>
//             <CloseRoundedIcon />
//           </IconButton>
//         </Stack>
//         {NavigatorPanel}
//       </Drawer>

//       {/* Submit confirmation dialog */}
//       <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
//         <DialogTitle>Submit Confirmation</DialogTitle>
//         <DialogContent>
//           <Typography>Are you sure you want to submit your answers?</Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
//           <Button
//             variant="contained"
//             sx={{ backgroundColor: "#4748ac", color: "white" }}
//             onClick={() => {
//               setConfirmOpen(false);
//               handleSubmit();
//             }}
//           >
//             Submit
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Time up dialog */}
//       <Dialog open={timeUp && !result} onClose={() => {}}>
//         <DialogTitle>Time's Up!</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Your time has ended. Submitting your answers automatically...
//           </Typography>
//         </DialogContent>
//         {/* ⭐ New: button to go back to Q-Bank list */}
//         <DialogActions>
//           <Button
//             variant="contained"
//             sx={{ backgroundColor: "#4748ac", color: "white" }}
//             onClick={() => {
//               if (bankId) navigate(`/student/qbank/details/${bankId}`);
//               else navigate("/student/qbank");
//             }}
//           >
//             Back to Q-Bank
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* 🔹 Added for Mocktest-style Scratch Pad Dialog (start) */}
//       <Dialog
//         open={scratchOpen}
//         onClose={() => setScratchOpen(false)}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>Scratch Pad</DialogTitle>
//         <DialogContent dividers>
//           <TextField
//             multiline
//             fullWidth
//             minRows={8}
//             placeholder="Write your rough notes here..."
//             variant="outlined"
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setScratchOpen(false)}>Close</Button>
//         </DialogActions>
//       </Dialog>
//       {/* 🔹 Added for Mocktest-style Scratch Pad Dialog (end) */}
//     </Box>
//   );
// }

// // 🔹 Added: QBank Explanation Pager (for showing explanations in QBank result)
// function QBankExplanationPager({ results = [] }) {
//   if (!Array.isArray(results) || results.length === 0) {
//     return (
//       <Typography sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
//         No explanations available.
//       </Typography>
//     );
//   }

//   return (
//     <Box sx={{ mt: 3 }}>
//       {results.map((item, idx) => {
//         const q = item.question || {};
//         const options = Array.isArray(q.options) ? q.options : [];
//         const correct = q.correctAnswer;
//         const student = item.userAnswer;
//         const explanation = q.explanation || item.explanation;

//         return (
//           <Paper
//             key={idx}
//             sx={{
//               mb: 3,
//               p: 2,
//               borderRadius: 2,
//               border: "1px solid",
//               borderColor: "divider",
//             }}
//           >
//             <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
//               Q{idx + 1}. {q.question || q.text}
//             </Typography>

//             <Stack spacing={0.5} sx={{ mb: 1 }}>
//               {options.map((opt, i) => {
//                 const isCorrect = i === correct;
//                 const isChosen = Array.isArray(student)
//                   ? student.includes(i)
//                   : student === i;

//                 return (
//                   <Box
//                     key={i}
//                     sx={{
//                       p: 1,
//                       borderRadius: 1,
//                       bgcolor: isCorrect
//                         ? "rgba(76,175,80,0.15)"
//                         : isChosen
//                         ? "rgba(244,67,54,0.15)"
//                         : "transparent",
//                       color: isCorrect
//                         ? "green"
//                         : isChosen
//                         ? "error.main"
//                         : "text.primary",
//                       border: isCorrect
//                         ? "1px solid rgba(76,175,80,0.4)"
//                         : isChosen
//                         ? "1px solid rgba(244,67,54,0.4)"
//                         : "1px solid rgba(0,0,0,0.08)",
//                     }}
//                   >
//                     {String.fromCharCode(65 + i)}. {opt}
//                   </Box>
//                 );
//               })}
//             </Stack>

//             {explanation && (
//               <Typography
//                 variant="body2"
//                 sx={{
//                   mt: 1,
//                   p: 1.5,
//                   borderRadius: 1,
//                   bgcolor: "#f7f7fb",
//                   color: "text.secondary",
//                   border: "1px solid rgba(0,0,0,0.08)",
//                   whiteSpace: "pre-wrap",
//                 }}
//               >
//                 💡 <b>Explanation:</b> {explanation}
//               </Typography>
//             )}
//           </Paper>
//         );
//       })}
//     </Box>
//   );
// }

// // 🔹 styles used in StudentQBankSession (for Show Explanation button etc.)
// const styles = {
//   explanationToggle: {
//     mt: 1.5,
//     backgroundColor: "#4748ac",
//     color: "white",
//     borderRadius: "8px",
//     px: 2.5,
//     py: 1,
//     textTransform: "none",
//     boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
//     "&:hover": { backgroundColor: "#3f41a0", color: "white" },
//   },
// };

// // ✅ END OF FILE

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
// import StudentQBankSolutions from "./StudentQBankSolutions"; // not used here

import API from "../../../LoginSystem/axios";

import {
  Box,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  FormGroup,
  Stack,
  Drawer,
  Divider,
  IconButton,
  useMediaQuery,
  TextField,
  Paper,
  Tooltip,
} from "@mui/material";

// 🔹 Added for Mocktest-style toolbar (imports)
import EditIcon from "@mui/icons-material/Edit";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import QuestionView from "../Mocktest/QuestionView";
// 🔹 End added imports

export default function StudentQBankSession() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const bankId = location.state?.bankId || null;

  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(
    location.state?.duration * 60 || 600
  );
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [session] = useState({
    sessionId: sessionId || location.state?.sessionId || null,
  });

  const [showExplain, setShowExplain] = useState(false);
  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isMdUp = useMediaQuery("(min-width:900px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ ADDED: local state for "time over" popup (from your file)
  const [timeUp, setTimeUp] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);

  // 🔹 Added for Mocktest-style toolbar (refs)
  const qvRef = useRef(null);
  const [scratchOpen, setScratchOpen] = useState(false);
  // 🔹 End added refs

  // ⏸️ NEW: pause/resume state for timer
  const [paused, setPaused] = useState(false);

  // defensive cleanup
  useEffect(() => {
    document.body.classList.remove("app-fs");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!questions.length) {
      console.warn(
        "⚠️ No questions found in state. If page was refreshed, implement GET /session/:id to reload."
      );
    }
  }, [questions]);

  // ⏱️ Timer effect (now respects `paused`)
  useEffect(() => {
    if (result || submittedRef.current || paused) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeUp(true);
          if (!submittedRef.current) {
            submittedRef.current = true;
            handleSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [result, paused]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleChange = (qid, val) => {
    if (result) return;
    setAnswers({ ...answers, [qid]: val });
  };

  const handleSubmit = async (auto = false) => {
    try {
      if (submittedRef.current) return;
      submittedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const sid =
        session?.sessionId || location.state?.sessionId || sessionId || null;
      if (!sid) {
        console.error("❌ Missing sessionId — cannot submit");
        return;
      }

      // 🔹 YAHAN pe hum index -> A/B/C/D convert kar rahe hain
      const payloadAnswers = {};
      Object.entries(answers).forEach(([qid, val]) => {
        if (Array.isArray(val)) {
          // multi-select: [0,2] -> ["A","C"]
          payloadAnswers[qid] = val.map((i) =>
            String.fromCharCode(65 + Number(i))
          );
        } else if (val !== null && val !== undefined && val !== "") {
          // single-select: 3 -> "D"
          payloadAnswers[qid] = String.fromCharCode(65 + Number(val));
        } else {
          payloadAnswers[qid] = val;
        }
      });

      const res = await API.post(
        `/api/student/qbank/session/${sid}/submit`,
        { answers: payloadAnswers }
      );
      setResult(res.data);
    } catch (err) {
      console.error("❌ Submit failed", err);
      if (!auto) submittedRef.current = false;
    }
  };

  const requestSubmit = () => setConfirmOpen(true);

  const currentQuestion = questions[currentQIndex];

  // ⏸️ Pause / Resume handler
  const handlePauseToggle = () => {
    setPaused((prev) => {
      const next = !prev;
      if (next && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return next;
    });
  };

  // --- Navigator panel (used both in sidebar and Drawer) ---
  const NavigatorPanel = (
    <Box sx={{ p: 1 }}>
      {/* ⭐ Timer removed from navigator as per request */}
      {/* <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <AccessTimeRoundedIcon fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Time Left:
        </Typography>
        <Typography
          variant="subtitle2"
          color={timeLeft < 60 ? "error.main" : "success.main"}
          sx={{ fontWeight: 700 }}
        >
          {formatTime(timeLeft)}
        </Typography>
      </Stack>

      <Divider sx={{ my: 1.25 }} /> */}

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
        Question Navigator
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
          gap: 1,
        }}
      >
        {questions.map((q, idx) => (
          <Button
            key={idx}
            variant={currentQIndex === idx ? "contained" : "outlined"}
            onClick={() => {
              setCurrentQIndex(idx);
              setDrawerOpen(false);
            }}
            sx={{
              minWidth: 0,
              py: 1,
              ...(answers[q.questionId]
                ? {
                    bgcolor: "#4748ac",
                    color: "white",
                    ":hover": { bgcolor: "#3e40a5" },
                  }
                : {}),
            }}
          >
            {idx + 1}
          </Button>
        ))}
      </Box>
    </Box>
  );

  // ===========================================================
  // ✅ RENDER
  // ===========================================================
  return (
    <Box
      sx={{
        px: { xs: 1.25, sm: 2 },
        py: { xs: 1.25, sm: 2 },
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      {/* 🔹 Added for Mocktest-style toolbar (start) */}
      {!result && (
        <Paper
          sx={{
            p: 1,
            position: "sticky",
            top: 0,
            zIndex: 10,
            flex: "0 0 auto",
            backgroundColor: "#4748ac",
            color: "#fff",
            mb: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ width: "100%" }}
          >
            <Tooltip title="Highlight selected text">
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon fontSize="small" />}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => qvRef.current?.highlightSelection?.()}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: "#4748ac",
                  "&:hover": {
                    borderColor: "#fff",
                    backgroundColor: "#3d3ea2",
                  },
                }}
              >
                Highlight
              </Button>
            </Tooltip>

            <Tooltip title="Strikethrough selected text">
              <Button
                size="small"
                variant="outlined"
                startIcon={<StrikethroughSIcon fontSize="small" />}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => qvRef.current?.strikeSelection?.()}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: "#4748ac",
                  "&:hover": {
                    borderColor: "#fff",
                    backgroundColor: "#3d3ea2",
                  },
                }}
              >
                Strikethrough
              </Button>
            </Tooltip>

            {/* <Tooltip title="Scratch Pad">
              <Button
                size="small"
                variant="outlined"
                startIcon={<StickyNote2Icon fontSize="small" />}
                onClick={() => setScratchOpen(true)}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: "#4748ac",
                  "&:hover": { borderColor: "#fff", backgroundColor: "#3d3ea2" },
                }}
              >
                Scratch Pad
              </Button>
            </Tooltip> */}

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" alignItems="center" gap={1}>
              <AccessTimeRoundedIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatTime(timeLeft)}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handlePauseToggle}
                sx={{
                  textTransform: "none",
                  borderColor: "rgba(255,255,255,0.7)",
                  color: "white",
                  "&:hover": {
                    borderColor: "#fff",
                    backgroundColor: "#3d3ea2",
                  },
                }}
              >
                {paused ? "Resume" : "Pause"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
      {/* 🔹 Added for Mocktest-style toolbar (end) */}

      {/* Mobile top bar: menu + time (unchanged original) */}
      {!isMdUp && !result && (
        <Box
          sx={{
            mb: 1.25,
            px: 1,
            py: 0.75,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            bgcolor: "background.paper",
          }}
        >
          <IconButton
            aria-label="open navigator"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Stack direction="row" alignItems="center" gap={1}>
            <AccessTimeRoundedIcon fontSize="small" />
            <Typography
              variant="body2"
              color={timeLeft < 60 ? "error.main" : "success.main"}
              sx={{ fontWeight: 700 }}
            >
              {formatTime(timeLeft)}
            </Typography>
          </Stack>
        </Box>
      )}

      {/* ====================================================== */}
      {/* Main Layout (Unchanged original logic below)           */}
      {/* ====================================================== */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* Left column */}
        <Box
          sx={{
            flex: { md: 3 },
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: "100dvh", md: "auto" },
          }}
        >
          {/* Back button (updated with confirmation dialog) */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIosNewIcon />}
              onClick={() => setBackConfirmOpen(true)} // 🔹 Open confirmation dialog
              sx={{
                color: "#4748ac",
                textTransform: "none",
                fontWeight: 600,
                px: 0,
              }}
            >
              Back to Details
            </Button>

            {/* 🔹 Back confirmation dialog */}
            <Dialog
              open={backConfirmOpen}
              onClose={() => setBackConfirmOpen(false)}
            >
              <DialogTitle>Are you sure you want to go back?</DialogTitle>
              <DialogContent>
                <Typography>
                  If you go back now, your current progress in this test will be
                  lost.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setBackConfirmOpen(false)}
                  sx={{ textTransform: "none" }}
                >
                  Continue Test
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#4748ac",
                    color: "white",
                    textTransform: "none",
                  }}
                  onClick={() => {
                    setBackConfirmOpen(false);
                    if (bankId) navigate(`/student/qbank/details/${bankId}`);
                    else navigate("/student/qbank");
                  }}
                >
                  Yes
                </Button>
              </DialogActions>
            </Dialog>
          </Box>

          {/* ===== Scrollable content (now includes QuestionView) ===== */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              pb: { xs: 8, md: 0 },
            }}
          >
            {/* Result header + Explanation */}
            {result && (
              <Box sx={{ mb: 3, textAlign: "center" }}>
                <Typography
                  variant="h5"
                  sx={{ color: "green", fontWeight: "bold" }}
                >
                  ✅ Test Completed
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Your Score: <b>{result.score}</b> / <b>{result.total}</b>
                </Typography>
                <Button
                  variant="contained"
                  onClick={() =>
                    navigate("/student/qbank/solutions", {
                      state: {
                        results: result?.results || [],
                        score: result?.score,
                        total: result?.total,
                      },
                    })
                  }
                  sx={styles.explanationToggle}
                >
                  Show Explanation
                </Button>
              </Box>
            )}

            {/* Render ALL questions, but show only current one */}
            {!result &&
              questions.map((q, idx) => (
                <Box
                  key={q.questionId || idx}
                  sx={{
                    mb: 3,
                    display: idx === currentQIndex ? "block" : "none",
                  }}
                >
                  {/* 🔹 Highlight/Strikethrough question text via QuestionView (with options) */}
<QuestionView
  ref={idx === currentQIndex ? qvRef : null}
  data={{
    question: {
      question: q.questionText,
      options: q.options || [], // ✅ now real options are inside
      questionType: q.questionType,
    },
    saved: {
      answer: answers[q.questionId], // ✅ pass current selected answer
    },
  }}
  disabled={!!result}
  enableHighlight
  enableStrikethrough
  hideInternalFlagButton={true}
  onSave={(payload) => {
    // ✅ sync back to existing logic
    if (!payload) return;
    if ("answer" in payload) {
      handleChange(q.questionId, payload.answer);
    }
  }}
/>


                  {/* Original answer rendering (unchanged logic) */}
                  {/* <Box sx={{ mt: 2 }}>
                    {Array.isArray(q.options) &&
                      q.options.map((opt, optIndex) => {
                        const selected =
                          answers[q.questionId] === optIndex;
                        const isMulti =
                          q.questionType &&
                          /multi/i.test(q.questionType);

                        return (
                          <FormGroup key={optIndex}>
                            <FormControlLabel
                              control={
                                isMulti ? (
                                  <Checkbox
                                    checked={
                                      Array.isArray(
                                        answers[q.questionId]
                                      )
                                        ? answers[q.questionId].includes(
                                            optIndex
                                          )
                                        : false
                                    }
                                    onChange={(e) => {
                                      if (result) return;
                                      const old =
                                        answers[q.questionId] || [];
                                      let next = [...old];
                                      if (e.target.checked)
                                        next.push(optIndex);
                                      else
                                        next = next.filter(
                                          (x) => x !== optIndex
                                        );
                                      handleChange(q.questionId, next);
                                    }}
                                  />
                                ) : (
                                  <Radio
                                    checked={selected}
                                    onChange={() =>
                                      handleChange(q.questionId, optIndex)
                                    }
                                  />
                                )
                              }
                              label={opt}
                            />
                          </FormGroup>
                        );
                      })}
                  </Box> */}
                </Box>
              ))}

            {/* Navigation buttons */}
            {!result && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 3 }}
              >
                <Button
                  disabled={currentQIndex === 0}
                  onClick={() =>
                    setCurrentQIndex((i) => Math.max(0, i - 1))
                  }
                  variant="outlined"
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Previous
                </Button>

                {currentQIndex === questions.length - 1 ? (
                  <Button
                    onClick={requestSubmit}
                    variant="contained"
                    sx={{
                      backgroundColor: "#4748ac",
                      color: "white",
                      borderRadius: 2,
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#3e40a5" },
                    }}
                  >
                    Submit
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      setCurrentQIndex((i) =>
                        Math.min(questions.length - 1, i + 1)
                      )
                    }
                    variant="contained"
                    sx={{
                      backgroundColor: "#4748ac",
                      color: "white",
                      borderRadius: 2,
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#3e40a5" },
                    }}
                  >
                    Next
                  </Button>
                )}
              </Stack>
            )}
          </Box>
        </Box>

        {/* Right column: question navigator (unchanged except timer removed) */}
        {isMdUp && !result && (
          <Paper
            elevation={1}
            sx={{
              flex: { md: 1 },
              maxWidth: 300,
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              position: "sticky",
              top: 90,
              height: "fit-content",
            }}
          >
            {NavigatorPanel}
          </Paper>
        )}
      </Box>

      {/* Drawer for mobile view */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            borderRadius: "0 16px 16px 0",
            borderRight: "none",
            boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.5,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Navigator
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        {NavigatorPanel}
      </Drawer>

      {/* Submit confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Submit Confirmation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your answers?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4748ac", color: "white" }}
            onClick={() => {
              setConfirmOpen(false);
              handleSubmit();
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time up dialog */}
      <Dialog open={timeUp && !result} onClose={() => {}}>
        <DialogTitle>Time's Up!</DialogTitle>
        <DialogContent>
          <Typography>
            Your time has ended. Submitting your answers automatically...
          </Typography>
        </DialogContent>
        {/* ⭐ New: button to go back to Q-Bank list */}
        <DialogActions>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4748ac", color: "white" }}
            onClick={() => {
              if (bankId) navigate(`/student/qbank/details/${bankId}`);
              else navigate("/student/qbank");
            }}
          >
            Back to Q-Bank
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔹 Added for Mocktest-style Scratch Pad Dialog (start) */}
      <Dialog
        open={scratchOpen}
        onClose={() => setScratchOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Scratch Pad</DialogTitle>
        <DialogContent dividers>
          <TextField
            multiline
            fullWidth
            minRows={8}
            placeholder="Write your rough notes here..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScratchOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* 🔹 Added for Mocktest-style Scratch Pad Dialog (end) */}
    </Box>
  );
}

// 🔹 Added: QBank Explanation Pager (for showing explanations in QBank result)
function QBankExplanationPager({ results = [] }) {
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <Typography
        sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}
      >
        No explanations available.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {results.map((item, idx) => {
        const q = item.question || {};
        const options = Array.isArray(q.options) ? q.options : [];
        const correct = q.correctAnswer;
        const student = item.userAnswer;
        const explanation = q.explanation || item.explanation;

        return (
          <Paper
            key={idx}
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Q{idx + 1}. {q.question || q.text}
            </Typography>

            <Stack spacing={0.5} sx={{ mb: 1 }}>
              {options.map((opt, i) => {
                const isCorrect = i === correct;
                const isChosen = Array.isArray(student)
                  ? student.includes(i)
                  : student === i;

                return (
                  <Box
                    key={i}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: isCorrect
                        ? "rgba(76,175,80,0.15)"
                        : isChosen
                        ? "rgba(244,67,54,0.15)"
                        : "transparent",
                      color: isCorrect
                        ? "green"
                        : isChosen
                        ? "error.main"
                        : "text.primary",
                      border: isCorrect
                        ? "1px solid rgba(76,175,80,0.4)"
                        : isChosen
                        ? "1px solid rgba(244,67,54,0.4)"
                        : "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </Box>
                );
              })}
            </Stack>

            {explanation && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "#f7f7fb",
                  color: "text.secondary",
                  border: "1px solid rgba(0,0,0,0.08)",
                  whiteSpace: "pre-wrap",
                }}
              >
                💡 <b>Explanation:</b> {explanation}
              </Typography>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}

// 🔹 styles used in StudentQBankSession (for Show Explanation button etc.)
const styles = {
  explanationToggle: {
    mt: 1.5,
    backgroundColor: "#4748ac",
    color: "white",
    borderRadius: "8px",
    px: 2.5,
    py: 1,
    textTransform: "none",
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    "&:hover": { backgroundColor: "#3f41a0", color: "white" },
  },
};

// ✅ END OF FILE
