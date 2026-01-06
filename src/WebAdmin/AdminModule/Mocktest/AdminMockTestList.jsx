// src/WebAdmin/MockTests/AdminMockTestList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import API from "../../../LoginSystem/axios";
import {
  Box, Typography, Card, CardContent, CardActionArea, CardMedia,
  TextField, MenuItem, Stack, Chip, CircularProgress, Button, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";   // ✅ ADDED

/** s3://bucket/key -> https://bucket.s3.amazonaws.com/key */
const resolveImageUrl = (raw) => {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const m = String(raw).match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (!m) return raw;
  const [, bucket, key] = m;
  return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
};

/** creation time in ms (for newest-first sort) */
const getCreatedMs = (m) => {
  const c1 = Number(m?.createdAtEpoch);
  if (Number.isFinite(c1)) return c1 * 1000;
  const c2 = Number(m?.createdAtMs);
  if (Number.isFinite(c2)) return c2;
  const c3 = Date.parse(m?.createdAt);
  if (Number.isFinite(c3)) return c3;
  const c4 = Date.parse(m?.createdAtISO);
  if (Number.isFinite(c4)) return c4;
  return 0;
};

export default function AdminMockTestList() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  const [mockTests, setMockTests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMockId, setSelectedMockId] = useState("");

  // ⭐⭐⭐ BACK BUTTON HANDLER — ADDED
  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  // DELETE HANDLER
  const handleDelete = async (mockTestId) => {
    if (!window.confirm("Are you sure you want to delete this mock test?")) {
      return;
    }

    try {
      const res = await API.delete(`/api/admin/mocktests/${mockTestId}`);

      if (res.data.success) {
        alert("Mock test deleted successfully");

        // remove from UI
        setMockTests((prev) => prev.filter(m => m.mockTestId !== mockTestId));
        setFiltered((prev) => prev.filter(m => m.mockTestId !== mockTestId));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete mock test");
    }
  };

  // FETCH LIST
  useEffect(() => {
    if (!ready) return;
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const res = await API.get("/api/admin/mocktests/fetch", {
          params: { instituteId: user?.instituteId },
        });
        const items = Array.isArray(res.data) ? res.data : [];
        const sorted = items.slice().sort((a, b) => getCreatedMs(b) - getCreatedMs(a)); 
        setMockTests(sorted);
        setFiltered(sorted);
      } catch (err) {
        console.error("Error fetching mocktests:", err);
        alert("❌ Failed to load mocktests");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, user]);

  // FILTER LOGIC
  useEffect(() => {
    let data = mockTests.slice();
    if (statusFilter) data = data.filter((m) => m.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((m) => (m.title || "").toLowerCase().includes(q));
    }
    data.sort((a, b) => getCreatedMs(b) - getCreatedMs(a));
    setFiltered(data);
  }, [statusFilter, search, mockTests]);

  // SELECTION FIX
  useEffect(() => {
    if (filtered.length === 0) setSelectedMockId("");
    else if (!selectedMockId || !filtered.find(m => m.mockTestId === selectedMockId)) {
      setSelectedMockId(filtered[0].mockTestId);
    }
  }, [filtered, selectedMockId]);

  const goToSettings = () => {
    if (!selectedMockId) return alert("Select a mock test first.");
    navigate(`/admin/mocktests/editor/${selectedMockId}/settings`);
  };

  if (!ready || loading) {
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
        <Typography mt={2}>
          {!ready ? "Preparing your session..." : "Loading mocktests..."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      maxWidth={1400}
      mx="auto"
      mt={4}
      px={{ xs: 1.25, sm: 2, md: 3 }}
    >

      {/* ⭐⭐⭐ BACK BUTTON UI — ADDED HERE */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBack}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          ⬅ Back to Dashboard
        </Button>
      </Box>

      {/* Header row */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Section-wise Breakdown
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <TextField
            select
            size="small"
            sx={{ minWidth: { xs: "100%", sm: 240 } }}
            label="Select Mock"
            value={selectedMockId}
            onChange={(e) => setSelectedMockId(e.target.value)}
          >
            {filtered.map(m => (
              <MenuItem key={m.mockTestId} value={m.mockTestId}>
                {m.title}
              </MenuItem>
            ))}
          </TextField>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="outlined"
              onClick={goToSettings}
              disabled={!selectedMockId}
              fullWidth={{ xs: true, sm: false }}
            >
              Settings
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/admin/mocktests/create")}
              fullWidth={{ xs: true, sm: false }}
            >
              Create New Mock Test
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Filters card */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 1.25, display: "flex", alignItems: "center", gap: 1 }}
          >
            <span
              style={{
                width: 10, height: 10, borderRadius: 2,
                background: "#7c3aed", display: "inline-block"
              }}
            />
            All Mock Tests
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            {/* <TextField
              label="Search Title"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              inputProps={{ maxLength: 100 }}
            /> */}
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: { xs: "100%", md: 220 } }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="UNPUBLISHED">Unpublished</MenuItem>
              <MenuItem value="DELETED">Deleted</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Responsive GRID */}
      {filtered.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={5}>
          No mock tests found.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, sm: 2.5, md: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
              xl: "repeat(5, minmax(0, 1fr))",
            },
            alignItems: "stretch",
          }}
        >
          {filtered.map((m) => {
            const img = resolveImageUrl(m.imageUrl || "");

            return (
              <Card
                key={m.mockTestId}
                sx={{
                  borderRadius: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: 1,
                  transition: "box-shadow .18s ease, transform .12s ease",
                  "&:hover": { boxShadow: 4, transform: "translateY(-1px)" },
                }}
              >
                <CardActionArea
                  onClick={() =>
                    navigate(`/admin/mocktests/editor/${m.mockTestId}/sections`)
                  }
                  sx={{ alignSelf: "stretch" }}
                >
                  {img ? (
                    <CardMedia
                      component="img"
                      image={img}
                      alt={m.title}
                      sx={{ aspectRatio: "16 / 9", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        aspectRatio: "16 / 9",
                        bgcolor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                        fontSize: 14,
                      }}
                    >
                      No cover image
                    </Box>
                  )}

                  <CardContent sx={{ pb: 1 }}>
                    <Typography
                      variant={isSmUp ? "h6" : "subtitle1"}
                      sx={{
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        mb: 1,
                      }}
                      title={m.title}
                    >
                      {m.title}
                    </Typography>

                    {/* NEW ROW: Chips + Delete Inline */}
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mt: 1 }}
                    >
                      {/* Chips Left */}
                      <Stack direction="row" spacing={1}>
                        <Chip
                          size="small"
                          label={m.status}
                          color={
                            m.status === "PUBLISHED"
                              ? "success"
                              : m.status === "DRAFT"
                              ? "warning"
                              : "default"
                          }
                          variant={
                            m.status === "UNPUBLISHED" || m.status === "DELETED"
                              ? "outlined"
                              : "filled"
                          }
                        />

                        <Chip
                          size="small"
                          label={m.isFree ? "Free" : `₹${m.price}`}
                          color={m.isFree ? "default" : "primary"}
                          variant={m.isFree ? "outlined" : "filled"}
                        />
                      </Stack>

                      {/* Delete Button */}
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(m.mockTestId);
                        }}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
