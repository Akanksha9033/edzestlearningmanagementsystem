


// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import API from "../../../LoginSystem/axios";

// import {
//   Box,
//   Typography,
//   TextField,
//   Select,
//   MenuItem,
//   Button,
//   RadioGroup,
//   Radio,
//   Checkbox,
//   CircularProgress,
// } from "@mui/material";
// import SettingsIcon from "@mui/icons-material/Settings";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// export default function AdminQBankEdit() {
//   const { bankId } = useParams();
//   const navigate = useNavigate();

//   const [questions, setQuestions] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [filters, setFilters] = useState({
//     difficulty: "",
//     questionType: "",
//     tags: "",
//     performanceDomain: "",
//   });

//   // 🔹 Fetch questions of this bank
//   useEffect(() => {
//     async function fetchQuestions() {
//       try {
//         const res = await API.get(`/api/admin/qbank/${bankId}/questions`, {
//           params: filters,
//         });
//         setQuestions(Array.isArray(res.data) ? res.data : []);
//         setCurrentIndex(0);
//       } catch (err) {
//         console.error("❌ Error loading questions:", err);
//       }
//     }
//     fetchQuestions();
//   }, [bankId, filters]);

//   const handleChange = (field, value) => {
//     const updated = [...questions];
//     updated[currentIndex][field] = value;
//     setQuestions(updated);
//   };

//   const handleSave = async () => {
//     try {
//       const q = questions[currentIndex];
//       await API.put(`/api/admin/qbank/${bankId}/questions/${q.questionId}`, q);
//       alert(`✅ Question ${currentIndex + 1} updated!`);
//     } catch (err) {
//       console.error("❌ Error saving question:", err);
//       alert("❌ Failed to save question");
//     }
//   };

//   const handleFilterChange = (field, value) => {
//     setFilters((prev) => ({ ...prev, [field]: value }));
//   };

//   const nextQuestion = () => {
//     if (currentIndex < questions.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     }
//   };

//   const prevQuestion = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//     }
//   };

//   // 🟢 Publish
//   const handlePublish = async () => {
//     if (
//       window.confirm(
//         "Are you sure you want to publish this Question Bank? Once published, students will be able to see it."
//       )
//     ) {
//       try {
//         await API.put(`/api/admin/qbank/publish/${bankId}`);
//         alert("✅ Question Bank published successfully!");
//       } catch (err) {
//         console.error("❌ Publish failed:", err);
//         alert("❌ Failed to publish Question Bank.");
//       }
//     }
//   };

//   // Settings page
//   const openSettings = () => {
//     navigate(`/admin/qbank/${bankId}/qbsetting`);
//   };

//   // Back to list
//   const goBackToList = () => {
//     navigate("/admin/qbank/list", { replace: true });
//   };

//   if (!questions.length) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1.5 }}>
//           <Button
//             variant="text"
//             startIcon={<ArrowBackIcon />}
//             onClick={goBackToList}
//             sx={{ textTransform: "none" }}
//           >
//             Back to List
//           </Button>
//         </Box>

//         <Box
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             minHeight: 200,
//           }}
//         >
//           <CircularProgress />
//         </Box>
//       </Box>
//     );
//   }

//   const q = questions[currentIndex];

//   // Unique options for Approach & Exam (from data / Excel)
//   const approachOptions = Array.from(
//     new Set(
//       (questions || [])
//         .map((qq) => qq.approach)
//         .filter((v) => v && String(v).trim() !== "")
//     )
//   );

//   const examOptions = Array.from(
//     new Set(
//       (questions || [])
//         .map((qq) => qq.exam)
//         .filter((v) => v && String(v).trim() !== "")
//     )
//   );

//   // ✅ NEW: Unique options for Tags & Domain (from Excel data)
//   const tagOptions = Array.from(
//     new Set(
//       (questions || [])
//         .map((qq) => qq.tags)
//         .filter((v) => v && String(v).trim() !== "")
//     )
//   );

//   const domainOptions = Array.from(
//     new Set(
//       (questions || [])
//         .map((qq) => qq.performanceDomain)
//         .filter((v) => v && String(v).trim() !== "")
//     )
//   );

//   return (
//     <Box sx={{ p: 3 }}>
//       {/* Header row */}
//       <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
//         <Button
//           variant="text"
//           startIcon={<ArrowBackIcon />}
//           onClick={goBackToList}
//           sx={{ textTransform: "none" }}
//         >
//           Back to List
//         </Button>

//         <Typography variant="h5" sx={{ fontWeight: "normal", m: 0 }}>
//           ✏️ Edit Question Bank ({currentIndex + 1}/{questions.length})
//         </Typography>

//         <Box sx={{ ml: "auto" }}>
//           <Button
//             size="small"
//             variant="outlined"
//             startIcon={<SettingsIcon />}
//             onClick={openSettings}
//           >
//             Settings
//           </Button>
//         </Box>
//       </Box>

//       {/* MAIN CONTENT (no Card wrapper) */}
//       <Box sx={{ mt: 2 }}>
//         {/* Question Text */}
//         <TextField
//           label="Question Text"
//           fullWidth
//           multiline
//           minRows={3}
//           value={q.questionText}
//           onChange={(e) => handleChange("questionText", e.target.value)}
//           sx={{
//             mb: 2,
//             "& .MuiOutlinedInput-root": {
//               fontSize: "1.05rem",
//               fontWeight: 600,
//               lineHeight: 1.6,
//               paddingY: 1.5,
//             },
//             "& .MuiInputLabel-root": {
//               fontSize: "0.9rem",
//               fontWeight: 500,
//             },
//           }}
//         />

//         {/* OPTIONS */}
//         <Typography variant="subtitle1" sx={{ fontWeight: "", mb: 1 }}>
//           Options:
//         </Typography>

//         {q.questionType === "Multi-Select" ? (
//           // ✅ MULTI-SELECT
//           q.options?.map((opt, i) => {
//             const val = String.fromCharCode(65 + i);
//             const checked = q.correctAnswer?.includes(val);
//             return (
//               <Box
//                 key={i}
//                 sx={{
//                   mb: 1.5,
//                   position: "relative",
//                   width: "100%",
//                 }}
//               >
//                 <Checkbox
//                   checked={checked}
//                   onChange={(e) => {
//                     let updatedAnswers = [...(q.correctAnswer || [])];
//                     if (e.target.checked) {
//                       if (!updatedAnswers.includes(val)) {
//                         updatedAnswers.push(val);
//                       }
//                     } else {
//                       updatedAnswers = updatedAnswers.filter(
//                         (ans) => ans !== val
//                       );
//                     }
//                     handleChange("correctAnswer", updatedAnswers);
//                   }}
//                   sx={{
//                     position: "absolute",
//                     left: 8,
//                     top: "50%",
//                     transform: "translateY(-50%)",
//                     zIndex: 1,
//                   }}
//                 />

//                 <TextField
//                   fullWidth
//                   multiline
//                   minRows={1}
//                   value={opt}
//                   onChange={(e) => {
//                     const updated = [...q.options];
//                     updated[i] = e.target.value;
//                     handleChange("options", updated);
//                   }}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       fontSize: "0.95rem",
//                       lineHeight: 1.6,
//                       minHeight: 88, // roughly 3 lines height
//                       display: "flex",
//                       alignItems: "center", // vertical center
//                     },
//                     "& .MuiOutlinedInput-inputMultiline": {
//                       padding: 0, // so flex centering works
//                     },
//                   }}
//                   InputProps={{
//                     sx: {
//                       pl: 7, // space from checkbox
//                     },
//                   }}
//                 />
//               </Box>
//             );
//           })
//         ) : (
//           // ✅ SINGLE-SELECT (Radio)
//           <RadioGroup
//             value={q.correctAnswer?.[0] || ""}
//             onChange={(e) => handleChange("correctAnswer", [e.target.value])}
//           >
//             {q.options?.map((opt, i) => {
//               const val = String.fromCharCode(65 + i);
//               return (
//                 <Box
//                   key={i}
//                   sx={{
//                     mb: 1.5,
//                     position: "relative",
//                     width: "100%",
//                   }}
//                 >
//                   <Radio
//                     value={val}
//                     sx={{
//                       position: "absolute",
//                       left: 8,
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       zIndex: 1,
//                     }}
//                   />

//                   <TextField
//                     fullWidth
//                     multiline
//                     minRows={1}
//                     value={opt}
//                     onChange={(e) => {
//                       const updated = [...q.options];
//                       updated[i] = e.target.value;
//                       handleChange("options", updated);
//                     }}
//                     sx={{
//                       "& .MuiOutlinedInput-root": {
//                         fontSize: "0.95rem",
//                         lineHeight: 1.6,
//                         minHeight: 88,
//                         display: "flex",
//                         alignItems: "center",
//                       },
//                       "& .MuiOutlinedInput-inputMultiline": {
//                         padding: 0,
//                       },
//                     }}
//                     InputProps={{
//                       sx: {
//                         pl: 7,
//                       },
//                     }}
//                   />
//                 </Box>
//               );
//             })}
//           </RadioGroup>
//         )}

//         {/* Dropdowns / Meta */}
//         <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
//           {/* Difficulty filter + edit */}
//           <Select
//             value={q.difficulty || ""}
//             onChange={(e) => {
//               handleChange("difficulty", e.target.value);
//               handleFilterChange("difficulty", e.target.value);
//             }}
//             displayEmpty
//             sx={{ minWidth: 140 }}
//           >
//             <MenuItem value="">
//               <em>Difficulty</em>
//             </MenuItem>
//             <MenuItem value="Easy">Easy</MenuItem>
//             <MenuItem value="Medium">Medium</MenuItem>
//             <MenuItem value="Difficult">Difficult</MenuItem>
//           </Select>

//           {/* Question type filter + edit */}
//           <Select
//             value={q.questionType || ""}
//             onChange={(e) => {
//               handleChange("questionType", e.target.value);
//               handleFilterChange("questionType", e.target.value);
//             }}
//             displayEmpty
//             sx={{ minWidth: 160 }}
//           >
//             <MenuItem value="">
//               <em>Question Type</em>
//             </MenuItem>
//             <MenuItem value="Single-Select">Single-Select</MenuItem>
//             <MenuItem value="Multi-Select">Multi-Select</MenuItem>
//             <MenuItem value="Fill-in-the-Blank">Fill-in-the-Blank</MenuItem>
//             <MenuItem value="True/False">True/False</MenuItem>
//           </Select>

//           {/* ✅ Tags as DROPDOWN (from Excel values) */}
//           <TextField
//             select
//             label="Tags"
//             value={q.tags || ""}
//             onChange={(e) => {
//               // only edit current question's tag
//               handleChange("tags", e.target.value);
//             }}
//             size="small"
//             sx={{ minWidth: 180 }}
//           >
//             {tagOptions.map((opt) => (
//               <MenuItem key={opt} value={opt}>
//                 {opt}
//               </MenuItem>
//             ))}
//           </TextField>

//           {/* ✅ Domain as DROPDOWN (from Excel values) */}
//           <TextField
//             select
//             label="Domain"
//             value={q.performanceDomain || ""}
//             onChange={(e) => {
//               // only edit current question's domain
//               handleChange("performanceDomain", e.target.value);
//             }}
//             size="small"
//             sx={{ minWidth: 200 }}
//           >
//             {domainOptions.map((opt) => (
//               <MenuItem key={opt} value={opt}>
//                 {opt}
//               </MenuItem>
//             ))}
//           </TextField>

//           {/* Approach dropdown (already there) */}
//           <TextField
//             select
//             label="Approach"
//             value={q.approach || ""}
//             onChange={(e) => handleChange("approach", e.target.value)}
//             size="small"
//             sx={{ minWidth: 160 }}
//           >
//             {approachOptions.map((opt) => (
//               <MenuItem key={opt} value={opt}>
//                 {opt}
//               </MenuItem>
//             ))}
//           </TextField>

//           {/* Exam dropdown (already there) */}
//           <TextField
//             select
//             label="Exam"
//             value={q.exam || ""}
//             onChange={(e) => handleChange("exam", e.target.value)}
//             size="small"
//             sx={{ minWidth: 160 }}
//           >
//             {examOptions.map((opt) => (
//               <MenuItem key={opt} value={opt}>
//                 {opt}
//               </MenuItem>
//             ))}
//           </TextField>
//         </Box>

//         {/* Explanation */}
//         <TextField
//           label="Explanation"
//           fullWidth
//           multiline
//           minRows={3}
//           value={q.explanation || ""}
//           onChange={(e) => handleChange("explanation", e.target.value)}
//           sx={{
//             mt: 2,
//             "& .MuiInputLabel-root": {
//               color: "#4748ac",
//               fontWeight: 600,
//             },
//             "& .MuiInputLabel-root.Mui-focused": {
//               color: "#4748ac",
//             },
//             "& .MuiOutlinedInput-root": {
//               fontSize: "0.95rem",
//               lineHeight: 1.6,
//               paddingY: 1.5,
//             },
//           }}
//         />

//         {/* Buttons */}
//         <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
//           <Button
//             variant="outlined"
//             disabled={currentIndex === 0}
//             onClick={prevQuestion}
//           >
//             ⬅ PREVIOUS
//           </Button>

//           <Button
//             variant="contained"
//             sx={{
//               backgroundColor: "#4748ac",
//               "&:hover": { backgroundColor: "#373885" },
//             }}
//             onClick={handleSave}
//           >
//             💾 SAVE
//           </Button>

//           <Button
//             variant="outlined"
//             disabled={currentIndex === questions.length - 1}
//             onClick={nextQuestion}
//           >
//             NEXT ➡
//           </Button>

//           <Button
//             variant="contained"
//             color="success"
//             sx={{
//               backgroundColor: "#2e7d32",
//               "&:hover": { backgroundColor: "#1b5e20" },
//               ml: "auto",
//             }}
//             onClick={handlePublish}
//           >
//             🚀 PUBLISH
//           </Button>
//         </Box>
//       </Box>
//     </Box>
//   );

 
// src/pages/Admin/QBank/AdminQBankEdit.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../LoginSystem/axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  RadioGroup,
  Radio,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";

export default function AdminQBankEdit() {
  const { bankId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ---- Autosave state ----
  const [autoSaveState, setAutoSaveState] = useState("idle"); // idle | saving | saved | error
  const dirtyRef = useRef(new Set()); // questionIds that are dirty
  const debounceTimerRef = useRef(null);
  const pendingSaveRef = useRef(false); // true while a PUT is in-flight
  const forceSaveOnLeaveRef = useRef(false); // to trigger beforeunload prompt
  const lastSavedSnapshotRef = useRef({}); // questionId -> JSON.stringify(question)

  // snack for save errors (optional)
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "error" });

  // ===================== Fetch Questions =====================
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await API.get(`/api/admin/qbank/${bankId}/questions`);
        const list = Array.isArray(res.data) ? res.data : [];
        if (!mounted) return;

        setQuestions(list);
        setCurrentIndex(0);
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Snapshot initial saved versions
        const map = {};
        for (const q of list) {
          map[q.questionId] = JSON.stringify(q);
        }
        lastSavedSnapshotRef.current = map;
        dirtyRef.current.clear();
        setAutoSaveState("idle");
      } catch (err) {
        console.error("❌ Error loading questions:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [bankId]);

  const q = questions[currentIndex];

  // ===================== Helpers =====================
  const markDirty = useCallback((questionObj) => {
    if (!questionObj?.questionId) return;
    const id = questionObj.questionId;
    const nowStr = JSON.stringify(questionObj);
    const lastStr = lastSavedSnapshotRef.current[id];

    if (nowStr !== lastStr) {
      dirtyRef.current.add(id);
      forceSaveOnLeaveRef.current = true;
    } else {
      dirtyRef.current.delete(id);
      if (dirtyRef.current.size === 0) {
        forceSaveOnLeaveRef.current = false;
      }
    }
  }, []);

  const putQuestion = useCallback(
    async (questionObj) => {
      if (!questionObj?.questionId) return;
      pendingSaveRef.current = true;
      setAutoSaveState("saving");
      try {
        await API.put(
          `/api/admin/qbank/${bankId}/questions/${questionObj.questionId}`,
          questionObj
        );
        // Update snapshots & dirty set
        lastSavedSnapshotRef.current[questionObj.questionId] = JSON.stringify(
          questionObj
        );
        dirtyRef.current.delete(questionObj.questionId);
        if (dirtyRef.current.size === 0) {
          forceSaveOnLeaveRef.current = false;
        }
        setAutoSaveState("saved");
        // brief “saved” pulse, then go idle
        setTimeout(() => {
          if (!pendingSaveRef.current) setAutoSaveState("idle");
        }, 600);
      } catch (err) {
        console.error("❌ Error autosaving question:", err);
        setAutoSaveState("error");
        setSnack({
          open: true,
          msg: "Autosave failed. Check your connection and try again.",
          severity: "error",
        });
        // keep dirty so we can retry
        throw err;
      } finally {
        pendingSaveRef.current = false;
      }
    },
    [bankId]
  );

  const saveCurrentIfDirty = useCallback(async () => {
    const current = questions[currentIndex];
    if (!current) return;

    // if question differs from its last saved snapshot → save it
    const snapshot = lastSavedSnapshotRef.current[current.questionId];
    const now = JSON.stringify(current);
    if (snapshot !== now) {
      await putQuestion(current);
    }
  }, [questions, currentIndex, putQuestion]);

  // ===================== Autosave Core =====================
  const scheduleAutosave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      const current = questions[currentIndex];
      if (!current) return;

      try {
        await saveCurrentIfDirty();
      } catch {
        // keep error state; do nothing else
      }
    }, 1200); // <-- debounce interval
  }, [questions, currentIndex, saveCurrentIfDirty]);

  // ===================== Change Handlers =====================
  const handleChange = (field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const copy = { ...updated[currentIndex], [field]: value };
      updated[currentIndex] = copy;
      // mark dirty & debounce save
      markDirty(copy);
      scheduleAutosave();
      return updated;
    });
  };

  // For options arrays
  const handleOptionChange = (i, newVal) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const qx = { ...updated[currentIndex] };
      const opts = Array.isArray(qx.options) ? [...qx.options] : [];
      opts[i] = newVal;
      qx.options = opts;
      updated[currentIndex] = qx;
      markDirty(qx);
      scheduleAutosave();
      return updated;
    });

  };

  const handleCorrectAnswerChange = (newCorrect) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const qx = { ...updated[currentIndex], correctAnswer: newCorrect };
      updated[currentIndex] = qx;
      markDirty(qx);
      scheduleAutosave();
      return updated;
    });
  };

=======
  };

  const handleCorrectAnswerChange = (newCorrect) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const qx = { ...updated[currentIndex], correctAnswer: newCorrect };
      updated[currentIndex] = qx;
      markDirty(qx);
      scheduleAutosave();
      return updated;
    });
  };
  // ===================== Manual Save (kept, but rarely needed) =====================
  const handleSave = async () => {
    try {
      await saveCurrentIfDirty();
      setSnack({ open: true, msg: "Saved.", severity: "success" });
    } catch {
      // snack already handled in putQuestion
    }
  };

  // ===================== Navigation: guard with save =====================
  const guardedGo = useCallback(
    async (fn) => {
      // Flush any debounced timer first
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      try {
        await saveCurrentIfDirty();
      } finally {
        fn();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [saveCurrentIfDirty]
  );

  const nextQuestion = async () => {
    if (currentIndex >= questions.length - 1) return;
    await guardedGo(() => setCurrentIndex((p) => p + 1));
  };

  const prevQuestion = async () => {
    if (currentIndex <= 0) return;
    await guardedGo(() => setCurrentIndex((p) => p - 1));
  };

  const openSettings = async () => {
    await guardedGo(() => navigate(`/admin/qbank/${bankId}/qbsetting`));
  };

  const goBackToList = async () => {
    await guardedGo(() => navigate("/admin/qbank/list", { replace: true }));
  };

  // ===================== Publish (unchanged behavior) =====================
  const handlePublish = async () => {
    // Ensure save before publish
    await guardedGo(async () => {});
    if (
      window.confirm(
        "Are you sure you want to publish this Question Bank? Once published, students will be able to see it."
      )
    ) {
      try {
        await API.put(`/api/admin/qbank/publish/${bankId}`);
        setSnack({ open: true, msg: "Question Bank published.", severity: "success" });
      } catch (err) {
        console.error("❌ Publish failed:", err);
        setSnack({ open: true, msg: "Publish failed.", severity: "error" });
      }
    }
  };

  // ===================== beforeunload protection =====================
  useEffect(() => {
    const handler = (e) => {
      if (forceSaveOnLeaveRef.current || pendingSaveRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ===================== Save on unmount (final flush) =====================
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      // best-effort sync (note: cannot block unmount, but we trigger anyway)
      const current = questions[currentIndex];
      const snapshot = current && lastSavedSnapshotRef.current[current?.questionId];
      if (current && JSON.stringify(current) !== snapshot) {
        // fire and forget
        API.put(
          `/api/admin/qbank/${bankId}/questions/${current.questionId}`,
          current
        ).catch(() => {});
      }
    };
  }, [questions, currentIndex, bankId]);

  if (!questions.length)
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );

  // 🔹 Extract unique dropdown values
  const uniqueValues = (key) => [
    ...new Set(questions.map((item) => item[key]).filter(Boolean)),
  ];
  const difficulties = ["Easy", "Medium", "Difficult"];
  const types = uniqueValues("questionType");
  const tags = uniqueValues("tags");
  const domains = uniqueValues("performanceDomain");
  const approaches = uniqueValues("approach");
  const exams = uniqueValues("exam");

  // Small autosave badge
  const AutoSaveBadge = () => (
    <Typography
      variant="caption"
      sx={{
        ml: 2,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor:
          autoSaveState === "saving"
            ? "warning.light"
            : autoSaveState === "saved"
            ? "success.light"
            : autoSaveState === "error"
            ? "error.light"
            : "grey.100",
      }}
    >
      {autoSaveState === "saving"
        ? "Autosaving…"
        : autoSaveState === "saved"
        ? "Saved"
        : autoSaveState === "error"
        ? "Autosave failed"
        : "Idle"}
    </Typography>
  );

  return (
    <Box sx={{ display: "flex", p: 2 }}>
      {/* ================= LEFT SIDEBAR ================= */}
      <Box
        sx={{
          width: 260,
          pr: 2,
          borderRight: "1px solid #ddd",
          height: "calc(100vh - 40px)",
          position: "sticky",
          top: 20,
          overflowY: "auto",
        }}
      >
        {/* 🔝 TOP BUTTONS: SAVE + PUBLISH */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          sx={{
            backgroundColor: "#4748ac",
            textTransform: "none",
            py: 1.1,
            mb: 1.5,
          }}
        >
          💾 Save Now
        </Button>

        {/* <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={handlePublish}
          sx={{ py: 1.1, mb: 2 }}
        >
          🚀 Publish
        </Button> */}

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Edit Filters <AutoSaveBadge />
        </Typography>

        {/* 🔹 Difficulty */}
        <Typography variant="subtitle2">Difficulty</Typography>
        <TextField
          select
          fullWidth
          value={q.difficulty || ""}
          onChange={(e) => handleChange("difficulty", e.target.value)}
          onBlur={() => scheduleAutosave()}
          sx={{ mb: 2 }}
        >
          {difficulties.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>

        {/* 🔹 Question Type */}
        <Typography variant="subtitle2">Question Type</Typography>
        <TextField
          select
          fullWidth
          value={q.questionType || ""}
          onChange={(e) => handleChange("questionType", e.target.value)}
          onBlur={() => scheduleAutosave()}
          sx={{ mb: 2 }}
        >
          {types.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        {/* 🔹 Tags */}
        <Typography variant="subtitle2">Tags</Typography>
        <TextField
          select
          fullWidth
          value={q.tags || ""}
          onChange={(e) => handleChange("tags", e.target.value)}
          onBlur={() => scheduleAutosave()}
          sx={{ mb: 2 }}
        >
          {tags.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        {/* 🔹 Domain */}
        <Typography variant="subtitle2">Domain</Typography>
        <TextField
          select
          fullWidth
          value={q.performanceDomain || ""}
          onChange={(e) => handleChange("performanceDomain", e.target.value)}
          onBlur={() => scheduleAutosave()}
          sx={{ mb: 2 }}
        >
          {domains.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>

        {/* 🔹 Approach */}
        <Typography variant="subtitle2">Approach</Typography>
        <TextField
          select
          fullWidth
          value={q.approach || ""}
          onChange={(e) => handleChange("approach", e.target.value)}
          onBlur={() => scheduleAutosave()}
          sx={{ mb: 2 }}
        >
          {approaches.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>

        {/* 🔹 Exam */}
        <Typography variant="subtitle2">Exam</Typography>
        <TextField
          select
          fullWidth
          value={q.exam || ""}
          onChange={(e) => handleChange("exam", e.target.value)}
          onBlur={() => scheduleAutosave()}
          sx={{ mb: 2 }}
        >
          {exams.map((e) => (
            <MenuItem key={e} value={e}>
              {e}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* ================= RIGHT CONTENT ================= */}
      <Box sx={{ flexGrow: 1, pl: 3 }}>
        {/* Header Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={goBackToList}
              sx={{ textTransform: "none" }}
            >
              Back
            </Button>
            <Typography variant="h6">
              ✏️ Edit Question ({currentIndex + 1}/{questions.length})
            </Typography>
            <AutoSaveBadge />
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={openSettings}
          >
            Settings
          </Button>
        </Box>

        {/* Question Editor */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            {/* Question Text */}
            <TextField
              label="Question Text"
              fullWidth
              multiline
              minRows={3}
              value={q.questionText}
              onChange={(e) => handleChange("questionText", e.target.value)}
              onBlur={() => scheduleAutosave()}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  lineHeight: 1.6,
                },
              }}
            />

            {/* Options */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Options:
            </Typography>

            {q.questionType === "Multi-Select" ? (
              q.options?.map((opt, i) => {
                const val = String.fromCharCode(65 + i);
                const checked = q.correctAnswer?.includes(val);
                return (
                  <Box key={i} sx={{ mb: 1.5, position: "relative" }}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => {
                        let updatedAnswers = [...(q.correctAnswer || [])];
                        if (e.target.checked) {
                          if (!updatedAnswers.includes(val)) {
                            updatedAnswers.push(val);
                          }
                        } else {
                          updatedAnswers = updatedAnswers.filter(
                            (ans) => ans !== val
                          );
                        }
                        handleCorrectAnswerChange(updatedAnswers);
                      }}
                      sx={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 1,
                      }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      onBlur={() => scheduleAutosave()}
                      InputProps={{ sx: { pl: 7 } }}
                    />
                  </Box>
                );
              })
            ) : (
              <RadioGroup
                value={q.correctAnswer?.[0] || ""}
                onChange={(e) => handleCorrectAnswerChange([e.target.value])}
              >
                {q.options?.map((opt, i) => {
                  const val = String.fromCharCode(65 + i);
                  return (
                    <Box key={i} sx={{ mb: 1.5, position: "relative" }}>
                      <Radio
                        value={val}
                        sx={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 1,
                        }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={1}
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        onBlur={() => scheduleAutosave()}
                        InputProps={{ sx: { pl: 7 } }}
                      />
                    </Box>
                  );
                })}
              </RadioGroup>
            )}

            {/* Explanation */}
            <TextField
              label="Explanation"
              fullWidth
              multiline
              minRows={3}
              value={q.explanation || ""}
              onChange={(e) => handleChange("explanation", e.target.value)}
              onBlur={() => scheduleAutosave()}
              sx={{
                mt: 2,
                "& .MuiInputLabel-root": {
                  color: "#4748ac",
                  fontWeight: 600,
                },
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={prevQuestion}
            disabled={currentIndex === 0}
          >
            ⬅ PREVIOUS
          </Button>
          <Button
            variant="outlined"
            onClick={nextQuestion}
            disabled={currentIndex === questions.length - 1}
          >
            NEXT ➡
          </Button>
        </Box>
      </Box>

      {/* Save/Error snack */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
