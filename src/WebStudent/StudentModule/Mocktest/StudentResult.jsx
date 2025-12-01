import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../../LoginSystem/axios";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import {
  Box, Paper, Stack, Typography, Button, Chip, CircularProgress, Divider
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
// import { useNavigate } from "react-router-dom";


function safeAgg(result) {
  const all = result?.sectionAgg?.all || {};
  const total = Number(all.total || 0);
  const correct = Number(all.correct || 0);
  const wrong = Number(all.incorrect || 0);
  const skipped = Number(all.skipped || 0);
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return { total, correct, wrong, skipped, pct };
}

export default function StudentResult() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const { ready, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [authErr, setAuthErr] = useState(false);

  useEffect(() => {
    if (!ready) return; // wait for AuthProvider bootstrap
    if (!user) {
      setLoading(false);
      return; // signed out; show sign-in prompt below
    }

    const ac = new AbortController();
    (async () => {
      try {
        setAuthErr(false);
        setLoading(true);
        const r = await API.get(`/api/student/attempts/${attemptId}/summary`, { signal: ac.signal });
        if (!ac.signal.aborted) {
          setAttempt(r.data?.attempt || null);
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        const status = e?.response?.status;
        if (status === 401) setAuthErr(true);
        console.error(e);
        alert("Failed to load result");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, attemptId]);

  // ✅ Hooks must be before any return:
  const agg = useMemo(() => safeAgg(attempt?.result), [attempt]);

  if (!ready || loading) {
    return (
      <Box p={4} display="grid" placeItems="center"><CircularProgress /></Box>
    );
  }

  if (ready && !user) {
  return (
    <Box p={4} textAlign="center">
      <Typography variant="h6" sx={{ mb: 1 }}>Sign in required</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Please log in to view your test result.
      </Typography>

      <Button 
        variant="contained" 
        onClick={() => nav("/login")} 
        sx={{ mr: 1 }}
      >
        Go to Login
      </Button>

      <Button 
        variant="text" 
        onClick={() => nav("/student/mocktests")} 
        startIcon={<ArrowBackIcon />}
      >
        Back
      </Button>

    </Box>
  );
}

  if (authErr) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" sx={{ mb: 1 }}>Session expired</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Please log in again to continue.
        </Typography>
        <Button variant="contained" onClick={() => nav("/login")} sx={{ mr: 1 }}>
          Go to Login
        </Button>
        <Button variant="text" onClick={() => nav(-1)} startIcon={<ArrowBackIcon />}>
          Back
        </Button>
      </Box>
    );
  }

  if (!attempt) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6">Attempt not found</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => nav(-1)}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={720} mx="auto" my={3} px={2}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => nav(-1)} sx={{ textTransform: "none" }}>
          Back
        </Button>
        <Typography variant="h5" fontWeight={800}>Result</Typography>
        <Chip size="small" label={attempt?.title || "Mock Test"} sx={{ ml: 1 }} />
      </Stack>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          Score: {agg.correct}/{agg.total} ({agg.pct}%)
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={`Correct: ${agg.correct}`} color="success" />
          <Chip label={`Wrong: ${agg.wrong}`} color="error" />
          <Chip label={`Skipped: ${agg.skipped}`} />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={() => nav(`/student/solutions/${attemptId}`)}
            sx={{ backgroundColor: "#4748ac" }}
          >
            View Solutions
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
