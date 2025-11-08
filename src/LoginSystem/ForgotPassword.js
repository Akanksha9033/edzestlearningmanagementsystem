import React, { useState } from "react";
import { Box, Paper, TextField, Button, Typography, Stack, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";              // ⬅️ added
import API from "./axios";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();                            // ⬅️ added

  // inline API call (unchanged logic)
  const forgotPasswordStart = (u) =>
    API.post("/api/auth/forgot/start", { username: u });

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;            // prevent double submit
    setErr("");
    setSubmitting(true);
    const u = username.trim();

    try {
      await forgotPasswordStart(u);
      setSent(true);                   // generic success (don’t reveal existence)
      navigate(`/reset-password?u=${encodeURIComponent(u)}`);   // ⬅️ added
    } catch {
      setSent(true);                   // keep generic even on error
      navigate(`/reset-password?u=${encodeURIComponent(u)}`);   // ⬅️ added
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={420} mx="auto" my={6} px={2}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Forgot password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Enter your registered email / username. We’ll send a verification code.
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {sent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            If the account exists, a code has been sent.
          </Alert>
        )}

        <form onSubmit={submit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email / Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoComplete="username"
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ background: "#4748ac" }}
              disabled={!username.trim() || submitting}
            >
              {submitting ? "Sending…" : "Send code"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
