import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

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

import EditIcon from "@mui/icons-material/Edit";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import QuestionView from "../Mocktest/QuestionView";

export default function StudentQBankSession() {
  console.log("🔵 [QBANK] MOUNTED StudentQBankSession");

  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  console.log("🟡 [QBANK] REFRESH CHECK", {
    sessionId,
    locationState: location.state,
  });

  /* ======================================================
     REFRESH-SAFE STATE RESTORE
  ====================================================== */

  const [bankId, setBankId] = useState(() => {
    if (location.state?.bankId) return location.state.bankId;
    try {
      const saved = localStorage.getItem("qbank-session-bankId");
      return saved || null;
    } catch {
      return null;
    }
  });

  const [questions, setQuestions] = useState(() => {
    if (location.state?.questions?.length) return location.state.questions;
    try {
      const raw = localStorage.getItem("qbank-session-questions");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [answers, setAnswers] = useState(() => {
  try {
    const raw = localStorage.getItem("qbank-session-answers");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
});


const [timeLeft, setTimeLeft] = useState(() => {
  try {
    // ✅ FIRST priority: saved remaining time
    const raw = localStorage.getItem("qbank-session-timeLeft");
    const v = Number(raw);
    if (Number.isFinite(v) && v > 0) {
      return v;
    }
  } catch {}

  // ✅ SECOND priority: duration from filter page (first load only)
  if (location.state?.duration) {
    return location.state.duration * 60;
  }

  // ✅ fallback
  return 600;
});


 const [currentQIndex, setCurrentQIndex] = useState(() => {
  try {
    const raw = localStorage.getItem("qbank-session-currentQIndex");
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
});

  const [result, setResult] = useState(null);

  const [session] = useState({
    sessionId,
  });

  const [showExplain, setShowExplain] = useState(false);
  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isMdUp = useMediaQuery("(min-width:900px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [timeUp, setTimeUp] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);

  const qvRef = useRef(null);
  const [scratchOpen, setScratchOpen] = useState(false);

  const [paused, setPaused] = useState(false);

  // ⬇ ADD THIS HERE ⬇
useEffect(() => {
  if (paused) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}, [paused]);


  /* ======================================================
   LOCAL STORAGE PERSIST (REFRESH-PROOF)
====================================================== */

// ✅ SAVE TIMER FOR REFRESH
useEffect(() => {
  if (result) return; // ⛔ submit ke baad save band

  try {
    localStorage.setItem(
      "qbank-session-timeLeft",
      String(timeLeft)
    );
  } catch (e) {
    console.warn("Timer save failed", e);
  }
}, [timeLeft, result]);



// Save bankId
useEffect(() => {
  if (bankId) {
    try {
      localStorage.setItem("qbank-session-bankId", bankId);
    } catch {}
  }
}, [bankId]);

// Save questions
useEffect(() => {
  if (questions?.length) {
    try {
      localStorage.setItem(
        "qbank-session-questions",
        JSON.stringify(questions)
      );
    } catch {}
  }
}, [questions]);



// Save answers
useEffect(() => {
  try {
    localStorage.setItem(
      "qbank-session-answers",
      JSON.stringify(answers)
    );
  } catch {}
}, [answers]);

// Save current question index
useEffect(() => {
  try {
    localStorage.setItem(
      "qbank-session-currentQIndex",
      String(currentQIndex)
    );
  } catch {}
}, [currentQIndex]);

/* ======================================================
   CLEAR STORAGE ON SUBMIT
====================================================== */
useEffect(() => {
  if (result) {
    // After result, clear storage so next test starts fresh
    localStorage.removeItem("qbank-session-bankId");
    localStorage.removeItem("qbank-session-questions");
    localStorage.removeItem("qbank-session-answers");
    localStorage.removeItem("qbank-session-timeLeft");
    localStorage.removeItem("qbank-session-currentQIndex");

    // ✅ clear highlight / strike markup ONLY after submit
    questions.forEach((q) => {
      localStorage.removeItem(
        `qbank-session-markup-${q.questionId}`
      );
    });
  }
}, [result]);






  /* ======================================================
     Defensive cleanup (UNCHANGED)
  ====================================================== */

  useEffect(() => {
    document.body.classList.remove("app-fs");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!questions.length) {
      console.warn(
        "⚠️ No questions found. Refresh-safe mode (staying here, no redirect)."
      );
    }
  }, [questions]);

  /* ======================================================
     TIMER (UNCHANGED)
  ====================================================== */

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

      const payloadAnswers = {};
      Object.entries(answers).forEach(([qid, val]) => {
        if (Array.isArray(val)) {
          payloadAnswers[qid] = val.map((i) =>
            String.fromCharCode(65 + Number(i))
          );
        } else if (val !== null && val !== undefined && val !== "") {
          payloadAnswers[qid] = String.fromCharCode(65 + Number(val));
        } else {
          payloadAnswers[qid] = val;
        }
      });

      const res = await API.post(`/api/student/qbank/session/${sid}/submit`, {
        answers: payloadAnswers,
      });
      setResult(res.data);
    } catch (err) {
      console.error("❌ Submit failed", err);
      if (!auto) submittedRef.current = false;
    }
  };

  const requestSubmit = () => setConfirmOpen(true);

  const currentQuestion = questions[currentQIndex];

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
  /* ======================================================
      RENDER — FULL UI BELOW (UNCHANGED)
  ====================================================== */
  console.log("🟢 [QBANK] DATA SNAPSHOT", {
    bankId,
    questionCount: questions?.length,
    timeLeft,
  });

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
      {/* 🔹 Toolbar end */}

      {/* Mobile top bar */}
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

      {/* ====================== MAIN LAYOUT ====================== */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* ------------- LEFT PANEL ------------- */}
        <Box
          sx={{
            flex: { md: 3 },
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: "100dvh", md: "auto" },
          }}
        >
          {/* Back button */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIosNewIcon />}
              onClick={() => setBackConfirmOpen(true)}
              sx={{
                color: "#4748ac",
                textTransform: "none",
                fontWeight: 600,
                px: 0,
              }}
            >
              Back to Details
            </Button>

            {currentQuestion?.questionId && (
              <Box
                sx={{
                  mt: 1,
                  px: 1.5,
                  py: 1,
                  backgroundColor: "#f7f7fb",
                  border: "1px solid #e5e5ef",
                  borderRadius: 2,
                  width: "fit-content",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "#444" }}
                >
                  Q-ID: {currentQuestion.questionId}
                </Typography>
              </Box>
            )}

            {/* Back dialog */}
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

          {/* ====================== QUESTION CONTENT ====================== */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              pb: { xs: 8, md: 0 },
            }}
          >
            {/* Result section */}
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
                  onClick={() => {
                    const orderedResults = [...(result?.results || [])].sort(
                      (a, b) => {
                        const ids = questions.map((q) => q.questionId);
                        return (
                          ids.indexOf(a.questionId) - ids.indexOf(b.questionId)
                        );
                      }
                    );

                    navigate("/student/qbank/solutions", {
                      state: {
                        results: orderedResults,
                        score: result?.score,
                        total: result?.total,
                      },
                    });
                  }}
                  sx={styles.explanationToggle}
                >
                  Show Explanation
                </Button>
              </Box>
            )}

            {/* Main questions */}
            {!result &&
              questions.map((q, idx) => (
                <Box
                  key={q.questionId || idx}
                  sx={{
                    mb: 3,
                    display: idx === currentQIndex ? "block" : "none",
                  }}
                >
                  <QuestionView
                    ref={idx === currentQIndex ? qvRef : null}
                    data={{
                      question: {
                        question: q.questionText,
                        options: q.options || [],
                        questionType: q.questionType,
                      },
                     saved: {
  answer: answers[q.questionId],
  markup: (() => {
    try {
      return localStorage.getItem(
        `qbank-session-markup-${q.questionId}`
      );
    } catch {
      return "";
    }
  })(),
},

                    }}
                    disabled={!!result}
                    enableHighlight
                    enableStrikethrough
                    hideInternalFlagButton={true}
                 onSave={(payload) => {
  if (!payload) return;

  if ("answer" in payload) {
    handleChange(q.questionId, payload.answer);
  }

  if (payload.markup !== undefined) {
    try {
      localStorage.setItem(
        `qbank-session-markup-${q.questionId}`,
        payload.markup || ""
      );
    } catch {}
  }
}}

                  />
                </Box>
              ))}

            {!result && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 3 }}
              >
                <Button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
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

        {/* ====================== RIGHT NAVIGATION PANEL ====================== */}
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
            <Box sx={{ p: 1 }}>
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
                      ...(answers[q.questionId] !== undefined
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
          </Paper>
        )}
      </Box>

      {/* ====================== MOBILE DRAWER ====================== */}
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

        <Box sx={{ p: 1 }}>
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
                  ...(answers[q.questionId] !== undefined
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
      </Drawer>

      {/* ====================== PAUSE OVERLAY ====================== */}
      
{paused && !result && (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.85)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      color: "white",
      textAlign: "center",
      px: 2,
    }}
  >
    <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
      Test Paused
    </Typography>

    <Typography variant="h6" sx={{ mb: 4 }}>
      Would you like to resume the test?
    </Typography>

    <Button
      variant="contained"
      sx={{
        backgroundColor: "#1e88e5",
        px: 4,
        py: 1.5,
        fontSize: "16px",
        borderRadius: "8px",
      }}
      onClick={() => setPaused(false)}
    >
      RESUME TEST
    </Button>
  </Box>
)}


      {/* ====================== SUBMIT DIALOG ====================== */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Submit Confirmation</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to submit your answers?</Typography>
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

      {/* ====================== TIME UP DIALOG ====================== */}
      <Dialog open={timeUp && !result} onClose={() => {}}>
        <DialogTitle>Time's Up!</DialogTitle>
        <DialogContent>
          <Typography>
            Your time has ended. Submitting your answers automatically...
          </Typography>
        </DialogContent>
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

      {/* ====================== SCRATCH PAD DIALOG ====================== */}
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
    </Box>
  );
}

/* ======================================================
   Explanation Pager (UNCHANGED)
====================================================== */

function QBankExplanationPager({ results = [] }) {
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <Typography sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
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
