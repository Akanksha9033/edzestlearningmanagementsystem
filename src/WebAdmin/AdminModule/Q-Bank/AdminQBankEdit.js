

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

  // ===================== Autosave State =====================
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const dirtyRef = useRef(new Set());
  const debounceTimerRef = useRef(null);
  const pendingSaveRef = useRef(false);
  const forceSaveOnLeaveRef = useRef(false);
  const lastSavedSnapshotRef = useRef({});


  

  // ⭐ Q-ID / Question # search input
  const [searchInput, setSearchInput] = useState("");
  // Snack for errors / saved
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "error",
  });

  // ⭐⭐⭐ NEW SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);


  

  // ⭐⭐⭐ SEARCH HANDLER
  const handleSearch = (value) => {
    setSearchQuery(value);

    // Jump to question #
    if (/^\d+$/.test(value)) {
      const num = parseInt(value);
      if (num >= 1 && num <= questions.length) {
        setCurrentIndex(num - 1);
        setSearchResults([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // Keyword search
    if (value.trim().length >= 2) {
      const lower = value.toLowerCase();
      const results = questions
        .map((q, i) => ({ index: i, text: q.questionText }))
        .filter((item) => item.text?.toLowerCase().includes(lower));

      setSearchResults(results.slice(0, 25));
    } else {
      setSearchResults([]);
    }
  };

  // ===================== FETCH QUESTIONS =====================
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

        // Snapshot initial versions
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

  // ===================== HELPERS =====================
  const markDirty = useCallback((questionObj) => {
    if (!questionObj?.questionId) return;

    const id = questionObj.questionId;
    const now = JSON.stringify(questionObj);
    const saved = lastSavedSnapshotRef.current[id];

    if (now !== saved) {
      dirtyRef.current.add(id);
      forceSaveOnLeaveRef.current = true;
    } else {
      dirtyRef.current.delete(id);
      if (dirtyRef.current.size === 0) forceSaveOnLeaveRef.current = false;
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

        lastSavedSnapshotRef.current[questionObj.questionId] =
          JSON.stringify(questionObj);

        dirtyRef.current.delete(questionObj.questionId);
        if (dirtyRef.current.size === 0) forceSaveOnLeaveRef.current = false;

        setAutoSaveState("saved");
        setTimeout(() => {
          if (!pendingSaveRef.current) setAutoSaveState("idle");
        }, 600);
      } catch (err) {
        console.error("❌ Autosave failed:", err);
        setAutoSaveState("error");
        setSnack({
          open: true,
          msg: "Autosave failed.",
          severity: "error",
        });
      } finally {
        pendingSaveRef.current = false;
      }
    },
    [bankId]
  );

  const saveCurrentIfDirty = useCallback(async () => {
    const current = questions[currentIndex];
    if (!current) return;

    const saved = lastSavedSnapshotRef.current[current.questionId];
    if (saved !== JSON.stringify(current)) {
      await putQuestion(current);
    }
  }, [questions, currentIndex, putQuestion]);

  // ===================== AUTOSAVE =====================
  const scheduleAutosave = useCallback(() => {
    if (debounceTimerRef.current)
      clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      await saveCurrentIfDirty();
    }, 1200);
  }, [saveCurrentIfDirty]);

  // ===================== CHANGE HANDLERS =====================
  const handleChange = (field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const copy = { ...updated[currentIndex], [field]: value };
      updated[currentIndex] = copy;
      markDirty(copy);
      scheduleAutosave();
      return updated;
    });
  };

  const handleOptionChange = (i, newVal) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const qx = { ...updated[currentIndex] };
      const opts = [...qx.options];
      opts[i] = newVal;
      qx.options = opts;
      updated[currentIndex] = qx;


      markDirty(qx);
      scheduleAutosave();
      return updated;
    });
  };


      markDirty(qx);
      scheduleAutosave();
      return updated;
    });
  };


  const handleCorrectAnswerChange = (newVal) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const qx = { ...updated[currentIndex], correctAnswer: newVal };
      updated[currentIndex] = qx;
      markDirty(qx);
      scheduleAutosave();
      return updated;
    });
  };

  // ===================== MANUAL SAVE =====================

  // ===================== Manual Save (kept, but rarely needed) =====================

  const handleSave = async () => {
    try {
      await saveCurrentIfDirty();
      setSnack({ open: true, msg: "Saved.", severity: "success" });
    } catch {}
  };

  // ===================== NAVIGATION =====================
  const guardedGo = useCallback(
    async (fn) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

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


  // ===================== before unload =====================


  // ===================== JUMP TO QUESTION (By Number or Q-ID) =====================
  const jumpToQuestion = useCallback(
    (rawValue) => {
      const value = String(rawValue || "").trim();
      if (!value) return;

      // 1) If user enters number → jump to that index
      if (/^\d+$/.test(value)) {
        const num = parseInt(value, 10);
        if (num >= 1 && num <= questions.length) {
          setCurrentIndex(num - 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      // 2) If user enters questionId → jump by ID
      const idx = questions.findIndex((q) => {
        const id = String(q.questionId || "").trim().toLowerCase();
        return id === value.toLowerCase();
      });

      if (idx !== -1) {
        setCurrentIndex(idx);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSnack({
          open: true,
          msg: `No question found for "${value}"`,
          severity: "error",
        });
      }
    },
    [questions]
  );
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

  // ===================== FINAL FLUSH =====================
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current)
        clearTimeout(debounceTimerRef.current);

      const current = questions[currentIndex];
      if (!current) return;

      const saved = lastSavedSnapshotRef.current[current.questionId];
      if (JSON.stringify(current) !== saved) {
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

  // ================== UNIQUE FILTER VALUES ==================
  const uniqueValues = (key) =>
    [...new Set(questions.map((item) => item[key]).filter(Boolean))];

  const difficulties = ["Easy", "Medium", "Difficult"];
  const types = uniqueValues("questionType");
  const tags = uniqueValues("tags");
  const domains = uniqueValues("performanceDomain");
  const approaches = uniqueValues("approach");
  const exams = uniqueValues("exam");

  // ===================== AUTOSAVE BADGE =====================
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

  // ==========================================================
  //                     RETURN JSX START
  // ==========================================================
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
        {/* SAVE BUTTON */}
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

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Edit Filters <AutoSaveBadge />
        </Typography>

        {/* Difficulty */}
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

        {/* Question Type */}
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

        {/* Tags */}
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

        {/* Domain */}
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

        {/* Approach */}
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

        {/* Exam */}
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

              {/* ⭐ Q-ID / Question # Search */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Question # or Q-ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                jumpToQuestion(searchInput);
              }
            }}
          />
        </Box>

        {/* Header Row */}


      {/* ================= RIGHT CONTENT ================= */}
      <Box sx={{ flexGrow: 1, pl: 3 }}>

        {/* ⭐⭐⭐ SEARCH BAR ADDED HERE ⭐⭐⭐ */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search or Jump to Question #"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              style: { fontSize: "15px", padding: "10px" },
            }}
          />
        </Box>

        {/* SEARCH RESULTS DROPDOWN */}
        {searchResults.length > 0 && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              border: "1px solid #ccc",
              borderRadius: "6px",
              maxHeight: 200,
              overflowY: "auto",
              background: "#fff",
            }}
          >
            {searchResults.map((item) => (
              <Box
                key={item.index}
                sx={{
                  p: 1,
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  "&:hover": { background: "#f5f5f5" },
                }}
                onClick={() => {
                  setCurrentIndex(item.index);
                  setSearchResults([]);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <strong>#{item.index + 1}</strong> —{" "}
                {item.text?.slice(0, 70) || "Untitled"}...
              </Box>
            ))}
          </Box>
        )}

        {/* HEADER ROW */}
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

        {/* QUESTION EDITOR */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
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

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Options:
            </Typography>

            {/* ================= MULTI-SELECT ================= */}
            {q.questionType === "Multi-Select" ? (
              q.options?.map((opt, i) => {
                const val = String.fromCharCode(65 + i);
                const checked = q.correctAnswer?.includes(val);

                return (
                  <Box key={i} sx={{ mb: 1.5, position: "relative" }}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => {
                        let updated = [...(q.correctAnswer || [])];
                        if (e.target.checked) {
                          if (!updated.includes(val)) updated.push(val);
                        } else {
                          updated = updated.filter((ans) => ans !== val);
                        }
                        handleCorrectAnswerChange(updated);
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
                      onChange={(e) =>
                        handleOptionChange(i, e.target.value)
                      }
                      onBlur={() => scheduleAutosave()}
                      InputProps={{ sx: { pl: 7 } }}
                    />
                  </Box>
                );
              })
            ) : (
              // ================= SINGLE-SELECT =================
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
                        onChange={(e) =>
                          handleOptionChange(i, e.target.value)
                        }
                        onBlur={() => scheduleAutosave()}
                        InputProps={{ sx: { pl: 7 } }}
                      />
                    </Box>
                  );
                })}
              </RadioGroup>
            )}

            {/* EXPLANATION */}
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

        {/* NAV BUTTONS */}
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

      {/* SNACKBAR */}
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
