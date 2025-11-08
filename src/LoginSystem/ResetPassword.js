// import React, { useState, useEffect } from "react";
// import { Box, Paper, TextField, Button, Typography, Stack, Alert } from "@mui/material";
// import { useSearchParams } from "react-router-dom";          // ⬅️ added
// import API from "./axios";

// const strongEnough = (pwd) =>
//   /[A-Z]/.test(pwd) &&
//   /[a-z]/.test(pwd) &&
//   /\d/.test(pwd) &&
//   /[^A-Za-z0-9]/.test(pwd) &&
//   pwd.length >= 8;

// export default function ResetPassword() {
//   const [username, setUsername] = useState("");
//   const [code, setCode] = useState("");
//   const [password, setPassword] = useState("");
//   const [ok, setOk] = useState(false);
//   const [err, setErr] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [search] = useSearchParams();                        // ⬅️ added

//   // ⬇️ Prefill from ?u=...
//   useEffect(() => {
//     const pre = search.get("u");
//     if (pre && !username) setUsername(pre);
//   }, [search, username]);

//   // inline API call (unchanged logic)
//   const forgotPasswordConfirm = ({ username, code, newPassword }) =>
//     API.post("/api/auth/forgot/confirm", { username, code, newPassword });

//   const submit = async (e) => {
//     e.preventDefault();
//     if (submitting) return;            // prevent double submit
//     setErr("");

//     if (!strongEnough(password)) {
//       setErr("Password must meet complexity requirements.");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       await forgotPasswordConfirm({
//         username: username.trim(),
//         code: code.trim(),
//         newPassword: password,
//       });
//       setOk(true);
//     } catch (e) {
//       const msg = e?.response?.data?.error || "RESET_FAILED";
//       const map = {
//         INVALID_CODE: "Invalid code.",
//         EXPIRED_CODE: "Code expired.",
//         WEAK_PASSWORD: "Password does not meet policy.",
//         TRY_LATER: "Too many attempts. Try again later.",
//         RESET_FAILED: "Reset failed. Check details and try again.",
//       };
//       setErr(map[msg] || "Reset failed.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Box maxWidth={420} mx="auto" my={6} px={2}>
//       <Paper sx={{ p: 3 }}>
//         <Typography variant="h5" fontWeight={800} gutterBottom>
//           Reset password
//         </Typography>
//         <Typography variant="body2" color="text.secondary" mb={2}>
//           Enter the verification code you received and set your new password.
//         </Typography>

//         {ok && (
//           <Alert severity="success" sx={{ mb: 2 }}>
//             Password updated. You can now log in.
//           </Alert>
//         )}
//         {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

//         <form onSubmit={submit} noValidate>
//           <Stack spacing={2}>
//             <TextField
//               label="Email / Username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               required
//               autoComplete="username"
//             />
//             <TextField
//               label="Verification Code"
//               value={code}
//               onChange={(e) => setCode(e.target.value)}
//               required
//               autoComplete="one-time-code"
//             />
//             <TextField
//               label="New Password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               helperText="Min 8, uppercase, lowercase, number, special"
//               autoComplete="new-password"
//             />
//             <Button
//               type="submit"
//               variant="contained"
//               sx={{ background: "#4748ac" }}
//               disabled={!username.trim() || !code.trim() || !password || submitting}
//             >
//               {submitting ? "Saving…" : "Set new password"}
//             </Button>
//           </Stack>
//         </form>
//       </Paper>
//     </Box>
//   );
// }


import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";          // ⬅️ added
import { FiEye, FiEyeOff } from "react-icons/fi";            // 👁️ icons
import API from "./axios";

const strongEnough = (pwd) =>
  /[A-Z]/.test(pwd) &&
  /[a-z]/.test(pwd) &&
  /\d/.test(pwd) &&
  /[^A-Za-z0-9]/.test(pwd) &&
  pwd.length >= 8;

export default function ResetPassword() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search] = useSearchParams();                        // ⬅️ added

  // 👁️ show/hide state for password field (UI-only)
  const [showPwd, setShowPwd] = useState(false);

  // ⬇️ Prefill from ?u=...
  useEffect(() => {
    const pre = search.get("u");
    if (pre && !username) setUsername(pre);
  }, [search, username]);

  // inline API call (unchanged logic)
  const forgotPasswordConfirm = ({ username, code, newPassword }) =>
    API.post("/api/auth/forgot/confirm", { username, code, newPassword });

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;            // prevent double submit
    setErr("");

    if (!strongEnough(password)) {
      setErr("Password must meet complexity requirements.");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPasswordConfirm({
        username: username.trim(),
        code: code.trim(),
        newPassword: password,
      });
      setOk(true);
    } catch (e) {
      const msg = e?.response?.data?.error || "RESET_FAILED";
      const map = {
        INVALID_CODE: "Invalid code.",
        EXPIRED_CODE: "Code expired.",
        WEAK_PASSWORD: "Password does not meet policy.",
        TRY_LATER: "Too many attempts. Try again later.",
        RESET_FAILED: "Reset failed. Check details and try again.",
      };
      setErr(map[msg] || "Reset failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={420} mx="auto" my={6} px={2}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Reset password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Enter the verification code you received and set your new password.
        </Typography>

        {ok && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password updated. You can now log in.
          </Alert>
        )}
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <form onSubmit={submit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email / Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <TextField
              label="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoComplete="one-time-code"
            />
            <TextField
              label="New Password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="Min 8, uppercase, lowercase, number, special"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      edge="end"
                      tabIndex={-1} // don't steal form tab flow
                    >
                      {showPwd ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ background: "#4748ac" }}
              disabled={!username.trim() || !code.trim() || !password || submitting}
            >
              {submitting ? "Saving…" : "Set new password"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
