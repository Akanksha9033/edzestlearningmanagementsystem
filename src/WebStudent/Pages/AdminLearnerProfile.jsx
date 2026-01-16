import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import API from "../../LoginSystem/axios";

/* ================= STYLES ================= */
const headerStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 3,
};

const userInfo = {
  display: "flex",
  alignItems: "center",
  gap: 2,
};

const avatarCircle = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "#e5f4ff",
  color: "#2563eb",
  fontWeight: 700,
  fontSize: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statsContainer = {
  p: 3,
  borderRadius: 2,
  mb: 4,
};

const statItem = {
  "& .label": {
    fontSize: 13,
    color: "#6b7280",
  },
  "& .value": {
    fontSize: 20,
    fontWeight: 600,
    mt: 0.5,
  },
};

const emptyProducts = {
  textAlign: "center",
  py: 6,
  color: "#6b7280",
};

export default function AdminLearnerProfile() {
  const { sub } = useParams();
  const navigate = useNavigate();
  const [learner, setLearner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLearner = async () => {
      try {
        const res = await API.get(`/api/admin/users/${sub}`);
        setLearner(res.data.user);
      } catch (err) {
        console.error("Learner fetch failed", err);
        setLearner(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLearner();
  }, [sub]);

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!learner) {
    return (
      <Box p={4}>
        <Typography>Learner not found</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ background: "#f5f7fa", minHeight: "100vh" }}>

      {/* ================= BACK + BREADCRUMB ================= */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            cursor: "pointer",
            color: "#2563eb",
            fontWeight: 500,
            mb: 1,
            width: "fit-content",
          }}
          onClick={() => navigate("/admin/users")}
        >
          &lt; Back
        </Typography>

        <Typography variant="body2" color="text.secondary">
          <span
            style={{ color: "#2563eb", cursor: "pointer" }}
            onClick={() => navigate("/admin/dashboard")}
          >
            DASHBOARD
          </span>
          {" / "}
          <span
            style={{ color: "#2563eb", cursor: "pointer" }}
            onClick={() => navigate("/admin/users")}
          >
            LEARNERS
          </span>
          {" / "}
          <span style={{ color: "#6b7280" }}>
            {learner.name}
          </span>
        </Typography>
      </Box>

      {/* ================= HEADER ================= */}
      <Box sx={headerStyles}>
        <Box sx={userInfo}>
          <Box sx={avatarCircle}>
            {learner.name?.charAt(0)?.toUpperCase()}
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={600}>
              {learner.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {learner.email}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Paper sx={{ px: 2, py: 1, cursor: "pointer" }}>INSIGHTS</Paper>
          <Paper sx={{ px: 2, py: 1, cursor: "pointer" }}>MORE</Paper>
          <Paper
            sx={{
              px: 2,
              py: 1,
              bgcolor: "#22c55e",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/admin/users/${sub}/add-product`)}
          >
            + ADD PRODUCT
          </Paper>
        </Box>
      </Box>

      {/* ================= STATS ================= */}
      <Paper sx={statsContainer}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Total Enrollments</Typography>
            <Typography className="value">0</Typography>
          </Grid>

          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Total Payments</Typography>
            <Typography className="value">₹ 0</Typography>
          </Grid>

          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Last Active</Typography>
            <Typography className="value">-</Typography>
          </Grid>

          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Active Devices</Typography>
            <Typography className="value">0</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= PRODUCTS ================= */}
      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={emptyProducts}>
          <Typography fontWeight={600}>
            No Products Enrolled
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
