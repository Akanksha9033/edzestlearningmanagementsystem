import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import {
  Box, Stack, Typography, IconButton, Tooltip, Button, Paper, Chip,
  Divider, Dialog, DialogTitle, DialogContent, TextField, DialogActions
} from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import FlagIcon from "@mui/icons-material/Flag";
import MapIcon from "@mui/icons-material/Map";

import API from "../../../LoginSystem/axios";
import useAttemptTimer from "../../hooks/useAttemptTimer";
import QuestionView from "../Mocktest/QuestionView";
import QuestionNavigator from "../Mocktest/QuestionNavigator";
import { useNavigate } from "react-router-dom";


// keepalive via Axios so it inherits auth
async function keepalivePatchAttempt(attemptId, payload) {
  try {
    await API.patch(`/api/student/attempts/${attemptId}`, payload, { withCredentials: true });
  } catch { }
}

// active window helper
function getActiveWindow(meta) {
  if (!meta?.useSections || !Array.isArray(meta.sections) || meta.sections.length === 0) {
    return { minIdx: 0, maxIdx: (meta?.totalQuestions ?? 0) - 1, hasSections: false, sec: null };
  }
  const sec = Number.isInteger(meta.currentSection) ? meta.currentSection : 0;
  const start = Number(meta.sections?.[sec]?.start ?? 0);
  const count = Number(meta.sections?.[sec]?.count ?? 0);
  return { minIdx: start, maxIdx: start + count - 1, hasSections: true, sec };
}

export default function ExamRunner({
  attemptId,
  meta,
  seedSec,
  onMetaUpdate,
  onExit,
  formatHMS,
}) {
    const navigate = useNavigate(); // <-- ADD THIS

  // local meta mirror to avoid stale section window after submit-section
  const [metaState, setMetaState] = useState(meta);
  useEffect(() => { setMetaState(meta); }, [meta]);

  const [index, setIndex] = useState(Number(meta?.currentIndex || 0));
  const [q, setQ] = useState(null);
  const qvRef = useRef(null);
  const [scratchOpen, setScratchOpen] = useState(false);
  const [scratchText, setScratchText] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  // maps
  const [answeredMap, setAnsweredMap] = useState({});
  const [markedMap, setMarkedMap] = useState({});
  const [notesMap, setNotesMap] = useState({});
  const [visitedMap, setVisitedMap] = useState({}); // ✅ derive from server + local open
  const SECTION_CACHE_TTL = 0; // 0 = never expires
  const sectionStateCache = new Map();

  // dialogs / break state
  const [sectionEndOpen, setSectionEndOpen] = useState(false);
  const [breakOpen, setBreakOpen] = useState(false);
  const [breakLeft, setBreakLeft] = useState(0);

  // timer
  const timeLeftRef = useRef(seedSec);
  const pausedRef = useRef(!!meta?.paused);
  const { timeLeft, paused, togglePause } = useAttemptTimer({
    attemptId,
    initialTimeLeft: seedSec,
    pausedInitial: !!meta?.paused,
  });
  useEffect(() => { timeLeftRef.current = Math.max(0, Math.floor(timeLeft)); }, [timeLeft]);
  useEffect(() => { pausedRef.current = !!paused; }, [paused]);

  // ✅ Preserve paused state when normalizing time
  useEffect(() => {
    const serverSec = Number(meta.timeLeftSec || 0);
    if (seedSec > 0 && serverSec !== seedSec) {
      keepalivePatchAttempt(attemptId, {
        timeLeftSec: seedSec,
        paused: !!meta?.paused,
      });
    }
  }, [attemptId, seedSec, meta.timeLeftSec, meta?.paused]);

  // keep server in sync whenever pause flips
  useEffect(() => {
    keepalivePatchAttempt(attemptId, {
      timeLeftSec: Math.max(0, Math.floor(timeLeftRef.current)),
      paused,
      currentIndex: index,
    });
  }, [attemptId, paused, index]);



  // heartbeat
  useEffect(() => {
    const id = setInterval(() => {
      keepalivePatchAttempt(attemptId, {
        timeLeftSec: timeLeftRef.current,
        paused: pausedRef.current,
      });
    }, 15000);
    return () => clearInterval(id);
  }, [attemptId]);

  // ✅ Hard-stop timer on unmount (covers SPA route changes)
  useEffect(() => {
    return () => {
      keepalivePatchAttempt(attemptId, {
        timeLeftSec: Math.max(0, Math.floor(timeLeftRef.current)),
        paused: true,
        currentIndex: index,
      });
    };
  }, [attemptId, index]);

  // unload/visibility best-effort
  useEffect(() => {
    const handler = () => {
      keepalivePatchAttempt(attemptId, {
        timeLeftSec: timeLeftRef.current,
        paused: true,
        currentIndex: index,
      });
    };
    const visHandler = () => { if (document.visibilityState === "hidden") handler(); };
    document.addEventListener("visibilitychange", visHandler);
    window.addEventListener("pagehide", handler);
    window.addEventListener("beforeunload", handler);
    return () => {
      document.removeEventListener("visibilitychange", visHandler);
      window.removeEventListener("pagehide", handler);
      window.removeEventListener("beforeunload", handler);
    };
  }, [attemptId, index]);

  // load question, with local pre-clamp and abort of stale calls
  useEffect(() => {
    const { minIdx, maxIdx } = getActiveWindow(metaState);
    // pre-clamp to avoid guaranteed 403
    if (index < minIdx || index > maxIdx) {
      setIndex(Math.max(minIdx, Math.min(maxIdx, index)));
      return;
    }

    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await API.get(
          `/api/student/attempts/${attemptId}/questions/${index}`,
          { signal: ctrl.signal }
        );
        setQ(r.data || null);

        // ✅ mark visited & sync saved state (your existing logic)
        setVisitedMap(prev => (prev[index] ? prev : { ...prev, [index]: true }));
        const saved = r.data?.saved || {};
        if ("answer" in saved) {
          const ans = saved.answer;
          const answered = Array.isArray(ans) ? ans.length > 0 : (ans != null && String(ans).trim() !== "");
          if (answered) setAnsweredMap(prev => (prev[index] ? prev : { ...prev, [index]: true }));
        }
        if ("flagged" in saved) {
          const flagged = !!saved.flagged;
          if (flagged) setMarkedMap(prev => (prev[index] ? prev : { ...prev, [index]: true }));
        }
        if ("note" in saved) {
          const note = String(saved.note || "");
          if (note !== "") setNotesMap(prev => (prev[index] === note ? prev : { ...prev, [index]: note }));
        }
      } catch (e) {
        if (ctrl.signal.aborted) return; // ignore canceled
        if (e?.response?.status === 403) {
          // server says index out of window → snap to window start
          const { minIdx: clampMin } = getActiveWindow(metaState);
          setIndex(clampMin);
          return;
        }
        setQ(null);
      }
    })();
    return () => ctrl.abort();
  }, [attemptId, index, metaState]);

  useLayoutEffect(() => {
    // If a previous Modal/Drawer left the page locked, unlock it before first paint
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    if (
      getComputedStyle(body).overflow === "hidden" ||
      body.classList.contains("MuiModal-scrollLock")
    ) {
      html.style.overflow = "";
      body.style.overflow = "";
      body.classList.remove("MuiModal-scrollLock");
      // clear any leftover full-height lock styles
      if (body.style.position === "fixed") body.style.position = "";
      if (body.style.height === "100vh" || body.style.height === "100%") body.style.height = "";
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // ✅ Tiny concurrency pool to avoid bursting the API
  async function runWithConcurrency(limit, tasks) {
    const results = new Array(tasks.length);
    let i = 0;
    let active = 0;

    return await new Promise((resolve) => {
      const kick = () => {
        while (active < limit && i < tasks.length) {
          const cur = i++;
          active++;
          tasks[cur]()
            .then((r) => { results[cur] = r; })
            .catch((e) => { results[cur] = e; })
            .finally(() => {
              active--;
              if (i >= tasks.length && active === 0) resolve(results);
              else kick();
            });
        }
      };
      kick();
    });
  }

  // ✅ SERVER-BACKED HYDRATION for the whole current section
  const { minIdx, maxIdx, hasSections, sec } = useMemo(
    () => getActiveWindow(metaState),
    [metaState]
  );



  const hydrateSectionState = useCallback(async () => {
    if (minIdx == null || maxIdx == null || maxIdx < minIdx) return;

    const cacheKey = `${attemptId}:${minIdx}-${maxIdx}`;
    const cached = sectionStateCache.get(cacheKey);
    const now = Date.now();

    // ⚡ Instant paint from cache if present
    if (cached && (SECTION_CACHE_TTL === 0 || now - cached.at <= SECTION_CACHE_TTL)) {
      setAnsweredMap(prev => ({ ...cached.answered, ...prev }));
      setMarkedMap(prev => ({ ...cached.marked, ...prev }));
      setNotesMap(prev => ({ ...cached.notes, ...prev }));
      setVisitedMap(prev => ({ ...cached.visited, ...prev }));
    }

    // Compute which indices are not already known (neither cached nor in current maps)
    const missing = [];
    for (let i = minIdx; i <= maxIdx; i++) {
      const inCache = !!(cached &&
        (cached.answered?.[i] ||
          cached.marked?.[i] ||
          (cached.notes?.[i] != null && cached.notes[i] !== "") ||
          cached.visited?.[i]));

      const inMemory =
        answeredMap[i] ||
        markedMap[i] ||
        (notesMap[i] != null && notesMap[i] !== "") ||
        visitedMap[i];

      if (!inCache && !inMemory) missing.push(i);
    }
    if (missing.length === 0) return;

    try {
      const tasks = missing.map((i) => () =>
        API.get(`/api/student/attempts/${attemptId}/questions/${i}`)
          .then((r) => ({ i, saved: r.data?.saved || {} }))
          .catch(() => ({ i, saved: {} }))
      );
      const results = await runWithConcurrency(8, tasks);

      const deltaAnswered = {};
      const deltaMarked = {};
      const deltaNotes = {};
      const deltaVisited = {};

      results.forEach(({ i, saved }) => {
        const ans = saved?.answer;
        const hasAnswer = Array.isArray(ans) ? ans.length > 0 : (ans != null && String(ans).trim() !== "");
        const flagged = !!saved?.flagged;
        const note = String(saved?.note ?? "");

        if (hasAnswer) deltaAnswered[i] = true;
        if (flagged) deltaMarked[i] = true;
        if (note !== "") deltaNotes[i] = note;
        if (hasAnswer || flagged || note !== "") deltaVisited[i] = true;
      });

      // Merge to state (batched by React)
      setAnsweredMap(prev => ({ ...prev, ...deltaAnswered }));
      setMarkedMap(prev => ({ ...prev, ...deltaMarked }));
      setNotesMap(prev => ({ ...prev, ...deltaNotes }));
      setVisitedMap(prev => ({ ...prev, ...deltaVisited }));

      // Update cache for instant reuse
      const nextCached = {
        answered: { ...(cached?.answered || {}), ...deltaAnswered },
        marked: { ...(cached?.marked || {}), ...deltaMarked },
        notes: { ...(cached?.notes || {}), ...deltaNotes },
        visited: { ...(cached?.visited || {}), ...deltaVisited },
        at: now,
      };
      sectionStateCache.set(cacheKey, nextCached);
    } catch {
      // ignore; per-question loads still keep UI usable
    }
  }, [attemptId, minIdx, maxIdx, answeredMap, markedMap, notesMap, visitedMap]);


  // hydrate when section changes or on first mount
  useEffect(() => {
    if (navOpen) {
      hydrateSectionState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navOpen, hydrateSectionState]);

  // answered/marked re-sync when q changes (kept from your logic)
  const isAnswered = (ans) => {
    if (ans == null) return false;
    if (typeof ans === "string") return ans.trim() !== "";
    if (Array.isArray(ans)) return ans.length > 0;
    return true;
    // NOTE: maps are already handled above; we keep this for single-question refreshes
  };
  useEffect(() => {
    if (!q) return;
    const ans = q?.saved?.answer;
    const flagged = !!q?.saved?.flagged;
    const answered = isAnswered(ans);

    setAnsweredMap(prev => prev[index] === answered ? prev : { ...prev, [index]: answered });
    setMarkedMap(prev => prev[index] === flagged ? prev : { ...prev, [index]: flagged });

    // If server has note, keep it
    const note = String(q?.saved?.note || "");
    if (note !== "") {
      setNotesMap(prev => prev[index] === note ? prev : { ...prev, [index]: note });
    }
  }, [q, index]);

  const localCurrent = Math.max(1, (index - minIdx) + 1);
  const localTotal = Math.max(0, (maxIdx - minIdx + 1));

  // last/last helpers for submit buttons
  const isLastSection = hasSections && sec === (metaState.sections.length - 1);
  const isLastQuestionOfSection = index === maxIdx;
  const canFinalSubmit = !hasSections || (isLastSection && isLastQuestionOfSection);

  // navigator items: only the current section range
  const items = useMemo(() => {
    const arr = [];
    for (let i = minIdx; i <= maxIdx; i++) {
      const answered = !!answeredMap[i];
      const marked = !!markedMap[i];
      const visited = !!visitedMap[i];

      let status;
      if (answered) status = "Answered";
      else if (visited || marked) status = "Incomplete";
      else status = "Unseen";

      arr.push({ index: i, disabled: false, status, marked, notes: notesMap[i] || "" });
    }
    return arr;
  }, [answeredMap, markedMap, notesMap, visitedMap, minIdx, maxIdx]);

  // save
  const persistAnswer = async (payload) => {
    try {
      await API.patch(`/api/student/attempts/${attemptId}/answers/${index}`, {
        ...payload,
        currentIndex: index,
      });

      setQ(prev => prev ? { ...prev, saved: { ...(prev.saved || {}), ...payload } } : prev);

      if ("answer" in payload) {
        const answered = payload.answer != null && payload.answer !== "" &&
          !(Array.isArray(payload.answer) && payload.answer.length === 0);
        setAnsweredMap(prev => ({ ...prev, [index]: answered }));
        // any interaction implies visited
        setVisitedMap(prev => (prev[index] ? prev : { ...prev, [index]: true }));
      }
      if ("flagged" in payload) {
        setMarkedMap(prev => ({ ...prev, [index]: !!payload.flagged }));
        setVisitedMap(prev => (prev[index] ? prev : { ...prev, [index]: true }));
      }
      if ("note" in payload) {
        const v = String(payload.note || "");
        setNotesMap(prev => ({ ...prev, [index]: v }));
        if (v !== "") setVisitedMap(prev => (prev[index] ? prev : { ...prev, [index]: true }));
      }
    } catch { }
  };

  // navigation with end-of-section dialog
  const go = async (delta) => {
    const { minIdx, maxIdx } = getActiveWindow(metaState);
    let nextIndex = Math.max(minIdx, Math.min(maxIdx, index + delta));
    const tryingForwardOut = delta > 0 && index === maxIdx;

    await keepalivePatchAttempt(attemptId, {
      currentIndex: nextIndex,
      timeLeftSec: Math.max(0, Math.floor(timeLeftRef.current)),
      paused: pausedRef.current,
    });

    setIndex(nextIndex);

    if (tryingForwardOut && hasSections) {
      setSectionEndOpen(true);
    }
  };

  // final submit
const submit = async () => {
  if (!window.confirm("Submit test? You cannot change answers after submit.")) return;
  try {
    await keepalivePatchAttempt(attemptId, {
      timeLeftSec: Math.max(0, Math.floor(timeLeftRef.current)),
      paused: pausedRef.current,
    });

    await API.patch(`/api/student/attempts/${attemptId}/submit-final`);

    alert("Submitted!");

    // 🔥 Redirect to result page
    navigate(`/student/results/${attemptId}`);

  } catch {
    alert("Failed to submit");
  }
};


  // submit current section
const submitCurrentSection = async () => {
  try {
    setSectionEndOpen(false);
    await API.patch(`/api/student/attempts/${attemptId}/submit-section`, { sectionIndex: sec });

    const r = await API.get(`/api/student/attempts/${attemptId}`);
    const updated = r.data;

    setMetaState(updated);
    onMetaUpdate?.(updated);
    setIndex(Number(updated.currentIndex || 0));

    if (updated.currentSection !== null && updated.useSections) {
      const mins = Number(updated.breakMinutes || 0);
      if (mins > 0) {
        setBreakLeft(mins * 60);
        setBreakOpen(true);
        await keepalivePatchAttempt(attemptId, {
          paused: true,
          timeLeftSec: Math.floor(timeLeftRef.current),
        });
      }
    } else {
      await API.patch(`/api/student/attempts/${attemptId}/submit-final`);
      alert("All sections submitted. Test complete.");

      // ⭐ Redirect after completion
      navigate(`/student/results/${attemptId}`);
    }
  } catch {
    alert("Failed to submit section");
  }
};


  // break countdown (section timer)
  useEffect(() => {
    if (!breakOpen) return;
    if (breakLeft <= 0) { endBreakNow(); return; }
    const t = setTimeout(() => setBreakLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [breakOpen, breakLeft]);

  const endBreakNow = async () => {
    setBreakOpen(false);
    await keepalivePatchAttempt(attemptId, {
      paused: false,
      timeLeftSec: Math.max(0, Math.floor(timeLeftRef.current)),
    });
  };

  const resumeNow = async () => {
    if (!paused) return;
    togglePause();
    await keepalivePatchAttempt(attemptId, {
      paused: false,
      timeLeftSec: Math.max(0, Math.floor(timeLeftRef.current)),
      currentIndex: index,
    });
  };

  const isUIBlocked = breakOpen || paused;
  const fmt = formatHMS || ((s) => s);

  return (
    <Box
      sx={{
        // Use small-viewport unit for iOS; upgrade to dynamic when supported
        minHeight: "100svh",
        "@supports (height: 100dvh)": { minHeight: "100dvh" },
        maxWidth: 1900,
        mx: "auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "clip",
        overflowX: "hidden",
      }}
    >
      <Paper sx={{
        p: 1, position: "sticky",
        top: 0,
        zIndex: 10,
        filter: isUIBlocked ? "blur(2px)" : "none",
        flex: "0 0 auto"
      }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, width: '100%' }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, px: 1, py: 1, borderRadius: 1, backgroundColor: '#4748ac' }}>
            <Tooltip title="Highlight selected text">
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon fontSize="small" />}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => qvRef.current?.highlightSelection?.()}
                disabled={paused || breakOpen}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: "#4748ac",
                  '&:hover': { borderColor: '#fff', backgroundColor: '#3d3ea2' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.3)' },
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
                disabled={paused || breakOpen}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: "#4748ac",
                  '&:hover': { borderColor: '#fff', backgroundColor: '#3d3ea2' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.3)' },
                }}
              >
                Strikethrough
              </Button>
            </Tooltip>

            <Tooltip title="Scratch Pad">
              <Button size="small" variant="outlined" sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.7)",
                backgroundColor: "#4748ac",
                '&:hover': { borderColor: '#fff', backgroundColor: '#3d3ea2' },
                '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.3)' },
              }} onClick={() => setScratchOpen(true)} startIcon={<StickyNote2Icon fontSize="small" />} disabled={paused || breakOpen}>
                Scratch Pad
              </Button>
            </Tooltip>

            <Box sx={{ flexGrow: 1 }} />

            {hasSections && (
              <Chip
                size="small"
                color="default"
                label={`Section ${Number(sec) + 1} of ${metaState.sections.length} (${minIdx + 1}–${maxIdx + 1})`}
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}
              />
            )}

            <Tooltip title={!!q?.saved?.flagged ? "Unmark for Review" : "Mark for Review"}>
              <Button
                size="small"
                color={!!q?.saved?.flagged ? "warning" : "primary"}
                style={{ color: "white" }}
                variant={!!q?.saved?.flagged ? "contained" : "outlined"}
                startIcon={<FlagIcon fontSize="small" />}
                onClick={() => persistAnswer({ flagged: !q?.saved?.flagged })}
                sx={{ ml: 'auto' }}
                disabled={paused || breakOpen}
              >
                {!!q?.saved?.flagged ? "Marked for Review" : "Mark for Review"}
              </Button>
            </Tooltip>
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={800}>{metaState?.title || "Mock Test"}</Typography>
            <Chip size="small" label={
              hasSections ? `${localCurrent}/${localTotal}` : `${index + 1}/${metaState?.totalQuestions ?? 0}`
            } />
          </Stack>

          {/* TIMER AREA */}
          {!breakOpen ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon fontSize="small" />
              <Typography fontWeight={700}>{fmt(timeLeft)}</Typography>
              <Tooltip title={paused ? "Resume" : "Pause"}>
                <IconButton onClick={togglePause}>
                  {paused ? <PlayArrowIcon /> : <PauseIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon fontSize="small" />
              <Typography fontWeight={800}>Break: {fmt(breakLeft)}</Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.5}
        alignItems="stretch"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          filter: isUIBlocked ? "blur(3px)" : "none",
          pointerEvents: isUIBlocked ? "none" : "auto",
        }}
      >
        {/* LEFT COLUMN: question area (scrolls) + footer (fixed) */}
        <Box
          flex={1}
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden"
          }}
        >
          {/* Scrollable question content */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorY: "contain",
              touchAction: "pan-y",
            }}
          >
            <Box sx={{ flex: "0 0 auto" }}>
              <QuestionView
                ref={qvRef}
                key={`q-${attemptId}-${index}`}
                data={q}
                disabled={!q || paused || breakOpen}
                onSave={persistAnswer}
                enableHighlight
                enableStrikethrough
                hideInternalFlagButton
              />
            </Box>

            {/* STICKY FOOTER — stays in view */}
            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 3,
                width: "100%",
                backgroundColor: "#4748ac",
                borderRadius: 1,
                px: 1.5,
                py: 1,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                // Optional subtle divider effect against scrolling content
                boxShadow: "0 -1px 0 rgba(0,0,0,0.08)",
              }}
            >
              <Button
                startIcon={<NavigateBeforeIcon />}
                variant="outlined"
                onClick={() => go(-1)}
                disabled={index <= minIdx || paused || breakOpen}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.7)",
                  "&:hover": { borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.08)" },
                  "&.Mui-disabled": { color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.3)" },
                }}
              >
                Previous
              </Button>

              <Button
                variant="outlined"
                startIcon={<MapIcon />}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: "#4748ac",
                  '&:hover': { borderColor: '#fff', backgroundColor: '#3d3ea2' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.3)' },
                }}
                onClick={() => setNavOpen(true)}
                disabled={paused || breakOpen}
              >
                Navigator
              </Button>

              <Button
                endIcon={<NavigateNextIcon />}
                variant="contained"
                onClick={() => go(1)}
                disabled={index >= maxIdx || paused || breakOpen || isLastQuestionOfSection}
                sx={{
                  backgroundColor: "#ffffff",
                  color: "#4748ac",
                  "&:hover": { backgroundColor: "#ffffff", color: "black" },
                  "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.6)", color: "#4748ac" },
                }}
              >
                Next
              </Button>

              {hasSections ? (
                canFinalSubmit ? (
                  <Button variant="text" onClick={submit} disabled={paused || breakOpen} sx={{ ml: 1, color: "#fff", textDecoration: "underline" }}>
                    Submit
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSectionEndOpen(true)}
                    disabled={paused || breakOpen}
                    sx={{ ml: 1, color: "#fff", textDecoration: "underline", backgroundColor: "transparent" }}
                  >
                    Submit section
                  </Button>
                )
              ) : (
                <Button variant="text" onClick={submit} disabled={paused || breakOpen} sx={{ ml: 1, color: "#fff", textDecoration: "underline" }}>
                  Submit
                </Button>
              )}
            </Box>
          </Box>
          </Box>

          <QuestionNavigator
            open={navOpen}
            onClose={() => setNavOpen(false)}
            current={index}
            items={items}
            onJump={(i) => {
              if (i < minIdx || i > maxIdx || breakOpen || paused) return; // safety
              setNavOpen(false);
              go(i - index);
            }}
          />
      </Stack>

      {/* Scratch pad */}
      <Dialog open={scratchOpen} onClose={() => setScratchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Scratch Pad</DialogTitle>
        <DialogContent>
          <TextField
            value={scratchText}
            onChange={(e) => setScratchText(e.target.value)}
            placeholder="Type notes…"
            fullWidth
            multiline
            minRows={8}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScratchOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* End-of-section dialog */}
      <Dialog open={sectionEndOpen} onClose={() => setSectionEndOpen(false)}>
        <DialogTitle>Section complete</DialogTitle>
        <DialogContent>
          <Typography>You’ve reached the end of this section. Submit this section?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionEndOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitCurrentSection}>Submit section</Button>
        </DialogActions>
      </Dialog>

      {/* 🔳 Full-screen BLACKOUT overlay during break */}
      {breakOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.92)",
            color: "#fff",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            p: 2,
          }}
        >
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Section Break
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Resumes automatically in {fmt(breakLeft)}
          </Typography>
          <Button variant="contained" onClick={endBreakNow}>
            Continue Now
          </Button>
        </Box>
      )}

      {/* 🛑 Full-screen overlay when PAUSED (shown only if NOT on break) */}
      {!breakOpen && paused && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.92)",
            color: "#fff",
            zIndex: 1999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            p: 2,
          }}
          role="dialog"
          aria-modal="true"
        >
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Test Paused
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Would you like to resume the test?
          </Typography>
          <Button variant="contained" onClick={resumeNow}>
            Resume Test
          </Button>
        </Box>
      )}
    </Box>
  );
}



