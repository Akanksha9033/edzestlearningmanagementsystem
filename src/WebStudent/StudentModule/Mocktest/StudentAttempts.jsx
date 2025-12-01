

import React, { useEffect, useMemo, useState, useCallback, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import API from "../../../LoginSystem/axios";
import {
  Box, Paper, Stack, Typography, Button, Chip, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Tooltip, Divider
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import PayNowButton from "../../../Shared/PayNowButton";

/* ---------------- utils (unchanged) ---------------- */
function fmtEpoch(ts) {
  if (!ts) return "-";
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString();
}
function fmtHMS(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h, m, r].map(v => String(v).padStart(2, "0")).join(":");
}

export default function StudentAttempts() {
  const { mockTestId } = useParams();
  const nav = useNavigate();
  const { ready, user } = useAuth();

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [mockIndex, setMockIndex] = useState({});
  const [selectedMock, setSelectedMock] = useState(null);

  /* --------------------------------------------------------- */
  /*      ⭐ NEW: MOCK TEST ACCESS CHECK (NO LOGIC CHANGE)      */
  /* --------------------------------------------------------- */
  const [hasAccess, setHasAccess] = useState(false);

  const checkMockAccess = useCallback(async () => {
    try {
      const studentId = user?.sub || user?.id || user?.userId;
      if (!studentId || !mockTestId) return;

      const productId = `MOCK_${mockTestId}`;

      const res = await API.get("/api/payments/has-access", {
        params: { userId: studentId, productId },
      });

      setHasAccess(res.data?.allowed || false);
    } catch (err) {
      console.error("❌ Access check failed", err);
      setHasAccess(false);
    }
  }, [user, mockTestId]);

  /* --------------------------------------------------------- */
  /* -------------------- DEFAULT FETCHES -------------------- */
  /* --------------------------------------------------------- */

  useEffect(() => {
    if (!ready || !user) return;
    let mounted = true;
    (async () => {
      try {
        const r = await API.get("/api/student/mocktests");
        const items = Array.isArray(r.data?.items) ? r.data.items : [];
        const map = {};
        for (const it of items) {
          map[it.mockTestId] = { title: it.title || "Mock Test", duration: it.duration };
        }
        if (mounted) {
          setMockIndex(map);
          if (mockTestId && map[mockTestId]) setSelectedMock(map[mockTestId]);
        }
      } catch (e) {
        console.error("Load mock list failed:", e);
      }
    })();
    return () => { mounted = false; };
  }, [ready, user, mockTestId]);

  useLayoutEffect(() => {
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
    }

    if (body.style.position === "fixed") body.style.position = "";
    if (body.style.height === "100vh" || body.style.height === "100%") body.style.height = "";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const loadAttempts = useCallback(async () => {
    if (!ready || !user) return;
    setLoading(true);
    try {
      const url = `/api/student/attempts/list${mockTestId ? `?mockTestId=${encodeURIComponent(mockTestId)}` : ""}`;
      const r = await API.get(url);
      const items = Array.isArray(r.data?.items) ? r.data.items : [];
          // 🔒 Filter attempts so a student sees ONLY their own attempts
const studentId = user?.id;   // 🔥 Always use user.id only (backend stores this)
const mine = items.filter(a => a.userId === studentId);


    setRows(mine);

    } catch (e) {
      console.error("Load attempts failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [ready, user, mockTestId]);

  useEffect(() => { loadAttempts(); }, [loadAttempts]);

  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && loadAttempts();
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [loadAttempts]);

  /* -------------------- ⭐ NEW ACCESS CHECK -------------------- */
  useEffect(() => {
    if (user && mockTestId) checkMockAccess();
  }, [user, mockTestId, checkMockAccess]);

  /* -------------------- processing rows (unchanged) -------------------- */
  const tableRows = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => Number(b.createdAtEpoch || 0) - Number(a.createdAtEpoch || 0))
      .map((r) => {
        const fallback = mockIndex[r.mockTestId];
        return {
          ...r,
          displayTitle: r.title || fallback?.title || "Mock Test",
          adminMinutes: fallback?.duration ?? null,
        };
      });
  }, [rows, mockIndex]);

  const hasInProgress = useMemo(
    () => Array.isArray(rows) && rows.some(r => r.status === "IN_PROGRESS"),
    [rows]
  );

  /* -------------------- start/resume helpers (unchanged) -------------------- */
  const continueAttempt = async (mId) => {
    try {
      const { data } = await API.post("/api/student/attempts", { mockTestId: mId });
      const attemptId = data?.attemptId;
      if (attemptId) nav(`/student/attempt/${attemptId}`);
      else alert("Could not start/resume the attempt.");
    } catch (e) {
      console.error(e);
      alert("Failed to start/resume the attempt.");
    }
  };

  const createNewAttempt = async (mId) => {
    try {
      const { data } = await API.post("/api/student/attempts", {
        mockTestId: mId,
        forceNew: true,
        cancelPrevious: false,
      });
      const attemptId = data?.attemptId;
      if (attemptId) nav(`/student/attempt/${attemptId}`);
      else alert("Could not start a new attempt.");
    } catch (e) {
      console.error(e);
      alert("Failed to start a new attempt.");
    }
  };

  const clearAttempts = async () => {
    const scopeText = mockTestId ? "this mock" : "ALL your attempts";
    if (!window.confirm(`Are you sure?`)) return;
    try {
      const url = `/api/student/attempts/clear${mockTestId ? `?mockTestId=${encodeURIComponent(mockTestId)}` : ""}`;
      await API.delete(url);
      await loadAttempts();
    } catch (e) {
      console.error("Clear attempts failed:", e);
      alert("Failed to clear attempts.");
    }
  };

  /* -------------------- states (unchanged) -------------------- */
  if (!ready) {
    return (
      <Box textAlign="center" mt={10} px={2}>
        <CircularProgress />
        <Typography mt={2}>Preparing your session…</Typography>
      </Box>
    );
  }
  if (ready && !user) {
    return (
      <Box textAlign="center" mt={10} px={2}>
        <Typography>You need to log in to view attempts.</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => nav("/login")}>Go to Login</Button>
      </Box>
    );
  }
  if (loading) {
    return (
      <Box textAlign="center" mt={10} px={2}>
        <CircularProgress />
        <Typography mt={2}>Loading your attempts…</Typography>
      </Box>
    );
  }

  /* ------------------------------------------------ */
  /* --------------------- RENDER ------------------- */
  /* ------------------------------------------------ */
  return (
    <Box maxWidth={1200} mx="auto" my={3} px={2}>

      {/* HEADER (unchanged) */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" alignItems="center">
          <IconButton onClick={() => nav(-1)} size="small" sx={{ mr: 0.25 }}>
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h6" fontWeight={800}>
            {mockTestId ? (selectedMock?.title || "Your Attempts") : "Your Attempts"}
          </Typography>

          {mockTestId && selectedMock?.duration != null && (
            <Chip size="small" label={`Duration: ${selectedMock.duration} min`} sx={{ ml: 1 }} />
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          {mockTestId && !hasInProgress && (
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={() => createNewAttempt(mockTestId)}
              size="small"
            >
              Start New Attempt
            </Button>
          )}
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteSweepIcon />}
            onClick={clearAttempts}
            size="small"
          >
            {mockTestId ? "Clear This Mock" : "Clear All"}
          </Button>
        </Stack>
      </Stack>

      {/* ---------------- DESKTOP TABLE VIEW ---------------- */}
      {isMdUp ? (
        <Paper elevation={1}>
          <TableContainer sx={{ maxHeight: "70vh", overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {!mockTestId && (
                    <TableCell><b>Test</b></TableCell>
                  )}
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>Created</b></TableCell>
                  <TableCell><b>Submitted</b></TableCell>
                  <TableCell align="right"><b>Duration</b></TableCell>
                  <TableCell align="center"><b>Action</b></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {tableRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No attempts found.</Typography>
                    </TableCell>
                  </TableRow>
                )}

                {tableRows.map((row) => {
                  const isInProgress = row.status === "IN_PROGRESS";
                  const isSubmitted = row.status === "SUBMITTED";

                  return (
                    <TableRow key={row.attemptId} hover>

                      {!mockTestId && (
                        <TableCell>
                          <Typography
                            fontWeight={700}
                            noWrap
                            sx={{ cursor: "pointer" }}
                            onClick={() => nav(`/student/attempts/${row.mockTestId}`)}
                          >
                            {row.displayTitle}
                          </Typography>
                        </TableCell>
                      )}

                      <TableCell>
                        {row.status}
                        {isInProgress && <Chip size="small" label="In Progress" color="warning" sx={{ ml: 1 }} />}
                        {isSubmitted && <Chip size="small" label="Completed" color="success" sx={{ ml: 1 }} />}
                      </TableCell>

                      <TableCell>{fmtEpoch(row.createdAtEpoch)}</TableCell>
                      <TableCell>{fmtEpoch(row.submittedAtEpoch)}</TableCell>

                      <TableCell align="right">{fmtHMS(row.durationSec)}</TableCell>

                      {/* --------------- ⭐ ACTION COLUMN ⭐ ---------------- */}
                      <TableCell align="center">
                        {isSubmitted ? (
                          <Tooltip title="View Result">
                            <IconButton onClick={() => nav(`/student/results/${row.attemptId}`)} size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : hasAccess ? (
                          <Button
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => continueAttempt(mockTestId)}
                            size="small"
                            sx={{ backgroundColor: "#4748ac" }}
                          >
                            Resume
                          </Button>
                        ) : (
                          <PayNowButton
                            userId={user?.sub || user?.id || user?.userId}
                            productId={`MOCK_${mockTestId}`}
                            onSuccess={checkMockAccess}
                            label="Pay ₹1 to Unlock"
                          />
                        )}
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>

            </Table>
          </TableContainer>
        </Paper>
      ) : (
        /* ---------------- MOBILE CARD VIEW ---------------- */
        <Stack spacing={1}>
          {tableRows.map((row) => {
            const isSubmitted = row.status === "SUBMITTED";
            const isInProgress = row.status === "IN_PROGRESS";

            return (
              <Paper key={row.attemptId} sx={{ p: 2 }}>

                {!mockTestId && (
                  <Typography fontWeight={700}>{row.displayTitle}</Typography>
                )}

                <Divider sx={{ my: 1 }} />

                <Typography variant="body2">Created: {fmtEpoch(row.createdAtEpoch)}</Typography>
                <Typography variant="body2">Submitted: {fmtEpoch(row.submittedAtEpoch)}</Typography>
                <Typography variant="body2">Duration: {fmtHMS(row.durationSec)}</Typography>

                <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>

                  {/* -------- ⭐ ACTION (MOBILE) ⭐ -------- */}
                  {isSubmitted ? (
                    <Button size="small" variant="outlined" startIcon={<VisibilityIcon />}
                      onClick={() => nav(`/student/results/${row.attemptId}`)}
                    >
                      View
                    </Button>
                  ) : hasAccess ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      sx={{ backgroundColor: "#4748ac" }}
                      onClick={() => continueAttempt(mockTestId)}
                    >
                      Resume
                    </Button>
                  ) : (
                    <PayNowButton
                      userId={user?.sub || user?.id || user?.userId}
                      productId={`MOCK_${mockTestId}`}
                      onSuccess={checkMockAccess}
                      label="Pay ₹1 to Unlock"
                    />
                  )}

                </Stack>

              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
