import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import QBToolbarMockLike from "./QBToolbarMockLike"; // path adjust if folder different


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
} from "@mui/material";

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

  useEffect(() => {
    if (result || submittedRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
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
  }, [result]);

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

      const res = await API.post(`/api/student/qbank/session/${sid}/submit`, {
        answers,
      });
      setResult(res.data);
    } catch (err) {
      console.error("❌ Submit failed", err);
      if (!auto) submittedRef.current = false;
    }
  };

  const requestSubmit = () => setConfirmOpen(true);

  const currentQuestion = questions[currentQIndex];

  // --- Navigator panel (used both in sidebar and Drawer) ---
  const NavigatorPanel = (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
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

      <Divider sx={{ my: 1.25 }} />

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

  return (
    <Box
      sx={{
        px: { xs: 1.25, sm: 2 },
        py: { xs: 1.25, sm: 2 },
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      {/* Mobile top bar: menu + time */}
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

      {/* Main layout */}
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
          {/* Back */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIosNewIcon />}
              onClick={() => {
                if (bankId) navigate(`/student/qbank/details/${bankId}`);
                else navigate("/student/qbank");
              }}
              sx={{
                color: "#4748ac",
                textTransform: "none",
                fontWeight: 600,
                px: 0,
              }}
            >
              Back to Details
            </Button>
          </Box>

          {/* ===== Scrollable content (now includes Prev/Next right under question) ===== */}
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
                  onClick={() => setShowExplain((v) => !v)}
                  sx={styles.explanationToggle}
                >
                  {showExplain ? "Hide Explanation" : "Show Explanation"}
                </Button>

                {showExplain && (
                  <ExplanationPager results={result?.results || []} />
                )}
              </Box>
            )}

            {/* Question */}
            {!result && currentQuestion && (
              <>
                <Box
                  sx={{
                    mb: 1.25, // ↓ smaller gap below the card
                    p: { xs: 2, md: 3 },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      fontSize: { xs: 16, sm: 18, md: 20 },
                      lineHeight: 1.45,
                    }}
                  >
                    {currentQIndex + 1}. {currentQuestion.questionText}
                  </Typography>

                  {/* Single Select */}
                  {currentQuestion.questionType === "Single-Select" && (
                    <RadioGroup
                      value={answers[currentQuestion.questionId] || ""}
                      onChange={(e) =>
                        handleChange(currentQuestion.questionId, [
                          e.target.value,
                        ])
                      }
                      sx={{
                        gap: 1,
                        "& .MuiFormControlLabel-root": {
                          alignItems: "flex-start",
                          m: 0,
                        },
                        "& .MuiFormControlLabel-label": {
                          whiteSpace: "pre-wrap",
                          textAlign: "left",
                        },
                      }}
                    >
                      {currentQuestion.options.map((opt, i) => (
                        <FormControlLabel
                          key={i}
                          value={String.fromCharCode(65 + i)}
                          control={<Radio />}
                          label={`${String.fromCharCode(65 + i)}. ${opt}`}
                        />
                      ))}
                    </RadioGroup>
                  )}

                  {/* Multi Select */}
                  {currentQuestion.questionType === "Multi-Select" && (
                    <FormGroup
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        "& .MuiFormControlLabel-root": {
                          alignItems: "flex-start",
                          m: 0,
                        },
                        "& .MuiFormControlLabel-label": {
                          whiteSpace: "pre-wrap",
                          textAlign: "left",
                        },
                      }}
                    >
                      {currentQuestion.options.map((opt, i) => {
                        const label = String.fromCharCode(65 + i);
                        const qid = currentQuestion.questionId;
                        const prev = answers[qid] || [];
                        const checked = prev.includes(label);

                        return (
                          <FormControlLabel
                            key={i}
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...prev, label]
                                    : prev.filter((x) => x !== label);
                                  handleChange(qid, next);
                                }}
                              />
                            }
                            label={`${label}. ${opt}`}
                          />
                        );
                      })}
                    </FormGroup>
                  )}

                  {/* True/False */}
                  {currentQuestion.questionType === "True/False" && (
                    <RadioGroup
                      value={answers[currentQuestion.questionId] || ""}
                      onChange={(e) =>
                        handleChange(currentQuestion.questionId, [
                          e.target.value,
                        ])
                      }
                      sx={{
                        gap: 1,
                        "& .MuiFormControlLabel-root": {
                          alignItems: "flex-start",
                          m: 0,
                        },
                      }}
                    >
                      <FormControlLabel
                        value="A"
                        control={<Radio />}
                        label="True"
                      />
                      <FormControlLabel
                        value="B"
                        control={<Radio />}
                        label="False"
                      />
                    </RadioGroup>
                  )}
                </Box>

                {/* ✅ Prev/Next placed IMMEDIATELY under the question card */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mt: 0.5 }}
                >
                  <Button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((i) => i - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={currentQIndex === questions.length - 1}
                    onClick={() => setCurrentQIndex((i) => i + 1)}
                  >
                    Next
                  </Button>
                </Stack>
              </>
            )}
          </Box>
          {/* ===== end scrollable content ===== */}

          {/* Sticky bottom: Navigator + Submit (unchanged) */}
          {!result && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              sx={{
                position: { xs: "sticky", md: "static" },
                bottom: { xs: 12, md: "auto" },
                zIndex: 1301,
                mt: 2,
                backgroundColor: { xs: "background.paper", md: "transparent" },
                borderTop: {
                  xs: (t) => `1px solid ${t.palette.divider}`,
                  md: "none",
                },
                py: { xs: 1, md: 0 },
                boxShadow: { xs: "0 -4px 14px rgba(0,0,0,0.08)", md: "none" },
              }}
            >
              {!isMdUp && (
                <Button variant="outlined" onClick={() => setDrawerOpen(true)}>
                  Navigator
                </Button>
              )}
              <Button
                variant="contained"
                onClick={requestSubmit}
                sx={{ bgcolor: "#4748ac" }}
              >
                Submit
              </Button>
            </Stack>
          )}
        </Box>

        {/* Right column (hidden on mobile) */}
        {!result && isMdUp && (
          <Box
            sx={{
              flex: 1,
              borderLeft: { md: "1px solid #e5e7eb" },
              pl: { md: 2 },
              minWidth: 0,
            }}
          >
            {NavigatorPanel}
          </Box>
        )}
      </Box>

      {/* Drawer for mobile Navigator */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: "86%", maxWidth: 360 } }}
        ModalProps={{ keepMounted: true, disableScrollLock: true }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Navigator
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          {NavigatorPanel}
        </Box>
      </Drawer>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to submit your answers?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              handleSubmit(false);
            }}
          >
            Yes, Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ==========================================================
   ✅ Explanation pager (unchanged logic)
========================================================== */
function ExplanationPager({ results = [] }) {
  const [idx, setIdx] = useState(0);
  const total = Array.isArray(results) ? results.length : 0;
  const item = total ? results[idx] : null;
  const BRAND = "#4748ac";

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

  const selected = normalizeArray(item?.submitted).map((x) =>
    String(x).toUpperCase()
  );
  const correct = normalizeArray(item?.correct).map((x) =>
    String(x).toUpperCase()
  );
  const options = Array.isArray(item?.options) ? item.options : [];

  const optionStyle = (label) => {
    const base = {
      ...styles.optionRow,
      textAlign: "left",
      alignItems: "flex-start",
    };
    const isSel = selected.includes(label);
    const isCor = correct.includes(label);
    if (isSel && isCor) return { ...base, ...styles.optionRowCorrect };
    if (isSel && !isCor) return { ...base, ...styles.optionRowIncorrect };
    if (!isSel && isCor)
      return { ...base, ...styles.optionRowHighlightCorrect };
    return base;
  };

  if (!total)
    return <Typography sx={{ mt: 2 }}>No explanations found.</Typography>;

  return (
    <Box sx={{ mt: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Chip
          label={`Question ${idx + 1} of ${total}`}
          sx={{
            bgcolor: "rgba(71,72,172,0.08)",
            color: BRAND,
            fontWeight: 700,
          }}
        />
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            sx={{ textTransform: "none", borderColor: BRAND, color: BRAND }}
          >
            Prev
          </Button>
          <Button
            variant="contained"
            disabled={idx >= total - 1}
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            sx={{
              textTransform: "none",
              bgcolor: BRAND,
              "&:hover": { bgcolor: "#3e40a5" },
            }}
          >
            {idx < total - 1 ? "Next" : "Done"}
          </Button>
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={((idx + 1) / total) * 100}
        sx={{
          height: 8,
          borderRadius: 999,
          mb: 2,
          "& .MuiLinearProgress-bar": { backgroundColor: BRAND },
        }}
      />

      <div style={styles.card}>
        {!!item?.questionText && (
          <div style={{ ...styles.qTitle, fontWeight: 500 }}>
            <span style={styles.qIndex}>Q{idx + 1}:</span> {item.questionText}
          </div>
        )}

        {options.length > 0 && (
          <div>
            {options.map((opt, i) => {
              const label = String.fromCharCode(65 + i);
              return (
                <div key={i} style={optionStyle(label)}>
                  <div style={{ ...styles.optionLabel, textAlign: "center" }}>
                    {label}.
                  </div>
                  <div style={{ ...styles.optionText, textAlign: "left" }}>
                    {opt}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!!item?.explanation && (
          <div style={styles.explainBox}>
            <span style={{ color: "#000", fontWeight: 500 }}>
              Explanation:&nbsp;{item.explanation}
            </span>
          </div>
        )}
      </div>
    </Box>
  );
}

/* =========================
   🎨 Styles
========================= */
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

  card: {
    backgroundColor: "#eaf3ff",
    border: "1px solid #d6e2ff",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 16,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  },

  qTitle: { fontSize: "1.15rem", marginBottom: 12, lineHeight: 1.4 },
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

  optionRowCorrect: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
    color: "#fff",
  },
  optionRowIncorrect: {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
    color: "#fff",
  },
  optionRowHighlightCorrect: {
    backgroundColor: "#d4edda",
    borderColor: "#28a745",
    color: "#155724",
  },

  explainBox: {
    marginTop: 12,
    padding: "10px 12px",
    background: "#ffffff",
    border: "1px solid #cddafc",
    borderLeft: "4px solid #4748ac",
    borderRadius: 8,
    color: "#333",
  },
};
