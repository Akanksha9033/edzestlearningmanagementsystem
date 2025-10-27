// src/WebStudent/StudentModule/Q-Bank/StudentQBankDetailsPage.js
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import API from "../../../LoginSystem/axios";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Stack,
  useMediaQuery,
  Divider,
  Grid, // ✅ classic Grid
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

export default function StudentQBankDetailsPage() {
  const { bankId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSmDown = useMediaQuery("(max-width:600px)");
  const isMdUp   = useMediaQuery("(min-width:900px)");

  const [attemptsMap, setAttemptsMap] = useState({});
  const [bankMeta, setBankMeta] = useState(null);

  // Explanation dialog state
  const [expOpen, setExpOpen] = useState(false);
  const [loadingExp, setLoadingExp] = useState(false);
  const [expData, setExpData] = useState(null); // { attemptId, review: [...] }

  // fetch qbank meta
  useEffect(() => {
    API.get("/api/admin/qbank")
      .then((res) => {
        const list = res.data || [];
        const b = list.find((x) => (x.bankId || x._id || x.id) === bankId);
        setBankMeta(b || null);
      })
      .catch(() => {});
  }, [bankId]);

  // fetch attempts
  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const studentId = user?.sub || user?.id || user?.userId;
        if (!studentId) return;
        const res = await API.get(`/api/student/qbank/student/attempts/${studentId}`);
        setAttemptsMap(res.data?.attempts || {});
      } catch (e) {
        console.error(e);
      }
    };
    fetchAttempts();
  }, [user]);

  const latest = attemptsMap[bankId];
  const denom = latest?.filters?.questionCount || 1;

  // timeline (ascending by date)
  const timeline = useMemo(() => {
    let arr = latest?.allAttempts || [];
    arr = arr.slice().sort((a, b) => new Date(a.attemptDate) - new Date(b.attemptDate));
    if (!arr.length && latest) {
      return [
        {
          score: latest.score || 0,
          attemptDate: latest.startTime,
          total: latest.filters?.questionCount || denom,
        },
      ];
    }
    return arr;
  }, [latest, denom]);

  // chart data
  const chartData = useMemo(() => {
    return (timeline || []).map((a, i) => {
      const total = a.total || denom || 1;
      const percent = Math.round(((a.score || 0) / total) * 100);
      return {
        idx: i + 1,
        attempt: `Attempt ${i + 1}`,
        percent,
        date: a.attemptDate ? new Date(a.attemptDate).toLocaleString("en-IN") : "",
      };
    });
  }, [timeline, denom]);

  const startSession = () =>
    navigate(`/student/qbank/filter?bankId=${encodeURIComponent(bankId)}`);

  const hasAnyAttempt = Boolean((timeline && timeline.length) || latest);

  const openExplanation = async () => {
    setExpOpen(true);
    setLoadingExp(true);
    setExpData(null);
    try {
      const studentId = user?.sub || user?.id || user?.userId;
      const res = await API.get(
        `/api/student/qbank/${encodeURIComponent(bankId)}/latest-explanation`,
        { params: { studentId } }
      );
      setExpData(res.data || { attemptId: null, review: [] });
    } catch (err) {
      console.error("Explanation load failed:", err);
      setExpData({ error: "Failed to load explanation." });
    } finally {
      setLoadingExp(false);
    }
  };

  const chartHeight = isMdUp ? 420 : isSmDown ? 280 : 340;

  return (
    <Box sx={{ px: { xs: 1.25, sm: 2 }, py: { xs: 1.25, sm: 2 }, maxWidth: 1200, mx: "auto" }}>
      {/* Back to list */}
      <Box sx={{ mb: 1.5 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => navigate("/student/qbank")}
          sx={{ color: "#4748ac", textTransform: "none", fontWeight: 600, px: 0 }}
        >
          Back to Banks
        </Button>
      </Box>

      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontSize: { xs: 18, sm: 20, md: 22 }, fontWeight: 700, lineHeight: 1.3 }}
      >
        {bankMeta?.name || "Question Bank"} — Details
      </Typography>

      {/* TOP SECTION */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
              🧾 Summary
            </Typography>

            <Stack spacing={0.5} sx={{ fontSize: { xs: 13, sm: 14 } }}>
              <Typography variant="body2">Total Questions (last): <b>{denom}</b></Typography>
              <Typography variant="body2">Total Attempts: <b>{chartData.length}</b></Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Last Attempt:{" "}
                <b>
                  {latest?.startTime
                    ? new Date(latest.startTime).toLocaleString("en-IN")
                    : (timeline?.length
                        ? (timeline[timeline.length - 1]?.attemptDate
                            ? new Date(timeline[timeline.length - 1].attemptDate).toLocaleString("en-IN")
                            : "—")
                        : "—")}
                </b>
              </Typography>
            </Stack>

            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ background: "#4748ac" }}
                  onClick={startSession}
                >
                  Start Practice
                </Button>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={openExplanation}
                  disabled={!hasAnyAttempt}
                  sx={{
                    borderColor: "#4748ac",
                    color: "#4748ac",
                    "&:hover": { borderColor: "#3c3da0", color: "#3c3da0" },
                  }}
                >
                  Explanation (Latest Attempt)
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
              ℹ️ Info
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              View your complete attempt history and analyze progress.
            </Typography>
            <Typography variant="body2">
              Each bar below represents one attempt, with color indicating improvement (🟩 up, 🟥 down).
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* CHART */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
          📊 Performance Trend (All Attempts)
        </Typography>
        <Box sx={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              margin={{
                top: isSmDown ? 20 : 40,
                right: isSmDown ? 10 : 20,
                left: isSmDown ? 0 : 10,
                bottom: isSmDown ? 40 : 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="idx"
                tick={{ fontSize: isSmDown ? 10 : 12 }}
                label={{
                  value: "Attempt #",
                  position: "insideBottom",
                  dy: isSmDown ? 30 : 45,
                  fontSize: isSmDown ? 11 : 12,
                }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: isSmDown ? 10 : 12 }}
                label={{
                  value: "Score (%)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: isSmDown ? 11 : 12,
                }}
              />
              <Legend
                verticalAlign="top"
                height={30}
                wrapperStyle={{ fontSize: isSmDown ? 11 : 12 }}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, "Score"]}
                labelFormatter={(_, p) => p?.[0]?.payload?.attempt || ""}
                contentStyle={{ fontSize: isSmDown ? 12 : 13 }}
              />
              <Bar dataKey="percent" name="Score (%)" maxBarSize={isSmDown ? 22 : 30}>
                {chartData.map((d, i, arr) => {
                  const prev = i > 0 ? arr[i - 1].percent : d.percent;
                  let color = "#B0BEC5";
                  if (d.percent > prev) color = "#4CAF50";
                  else if (d.percent < prev) color = "#E53935";
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
              <Line
                type="monotone"
                dataKey="percent"
                name="Trend"
                stroke="#1976D2"
                strokeWidth={2}
                dot={{ r: isSmDown ? 2.5 : 3 }}
                activeDot={{ r: isSmDown ? 4 : 5 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* TABLE */}
      <Paper sx={{ p: { xs: 1, sm: 1.5 } }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
          📋 Attempts Table
        </Typography>

        <Divider sx={{ mb: 1 }} />

        <TableContainer
          sx={{
            overflowX: "auto",            // horizontal scroll on mobile
            borderRadius: 2,
          }}
        >
          <Table size="small" sx={{ minWidth: 520 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Score</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Percent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timeline.map((a, idx) => {
                const total = a.total || denom || 1;
                const pct = Math.round(((a.score || 0) / total) * 100);
                return (
                  <TableRow key={idx} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {a.attemptDate ? new Date(a.attemptDate).toLocaleString("en-IN") : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {a.score || 0} / {total}
                    </TableCell>
                    <TableCell align="right">{pct}%</TableCell>
                  </TableRow>
                );
              })}
              {!timeline.length && (
                <TableRow>
                  <TableCell colSpan={4}>No attempts yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Explanation Modal */}
      {/* full screen on small devices */}
      <Dialog
        open={expOpen}
        onClose={() => setExpOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isSmDown}
        PaperProps={{ sx: { m: { xs: 0, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Latest Attempt Explanation
        </DialogTitle>

        <DialogContent dividers>
          {loadingExp && (
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={24} />
              <Typography>Loading…</Typography>
            </Stack>
          )}

          {!loadingExp && expData?.error && (
            <Typography color="error">{expData.error}</Typography>
          )}

          {!loadingExp && expData?.review?.length > 0 && (
            <Box sx={{ display: "grid", gap: 2 }}>
              {expData.review.map((r, idx) => {
                const isCorrect =
                  String(r.selected ?? "").trim().toUpperCase() ===
                  String(r.correct ?? "").trim().toUpperCase();
                return (
                  <Paper
                    key={r.questionId || idx}
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: "12px",
                      border: "1px solid #eee",
                      background: isCorrect ? "#f5fff7" : "#fff6f6",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, mb: 1, fontSize: { xs: 14, sm: 16 } }}>
                      Q{idx + 1}. {r.questionText || "Question"}
                    </Typography>

                    {/* Options */}
                    <Box sx={{ mb: 1 }}>
                      {(r.options || []).map((opt, i) => {
                        const label = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i] || `${i + 1}`;
                        return (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                              mb: 0.5,
                              fontSize: { xs: 13, sm: 14 },
                            }}
                          >
                            <Box
                              sx={{
                                width: 26, height: 26, borderRadius: "6px",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, border: "1px solid #ddd",
                                flex: "0 0 auto",
                              }}
                            >
                              {label}
                            </Box>
                            <Typography>{opt}</Typography>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Selected vs Correct */}
                    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                      <Tag label="Selected" value={r.selected} />
                      <Tag label="Correct" value={r.correct} highlight />
                    </Stack>

                    {/* Explanation */}
                    {(r.explanation ?? "") !== "" && (
                      <Box
                        sx={{
                          p: 1.5, borderRadius: "10px", background: "#f8f9ff",
                          border: "1px solid #e6e8ff",
                        }}
                      >
                        <Typography sx={{ fontWeight: 600, mb: 0.5, color: "#4748ac" }}>
                          Explanation
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{r.explanation}</Typography>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}

          {!loadingExp && !expData?.review?.length && !expData?.error && (
            <Typography>No explanation available for the latest attempt.</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 1.5 } }}>
          <Button onClick={() => setExpOpen(false)} fullWidth={isSmDown}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/** Small pill tag used in the modal */
function Tag({ label, value, highlight }) {
  return (
    <Box
      sx={{
        px: 1.2, py: 0.6, borderRadius: "999px",
        background: highlight ? "#e8fff0" : "#f2f2f2",
        border: "1px solid", borderColor: highlight ? "#bff3cf" : "#e0e0e0",
        display: "inline-flex", alignItems: "center", gap: 1,
      }}
    >
      <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{label}:</Typography>
      <Typography sx={{ fontWeight: 600 }}>{String(value ?? "").toUpperCase()}</Typography>
    </Box>
  );
}
