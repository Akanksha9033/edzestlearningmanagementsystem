// src/components/student/StudentQBankList.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../../../LoginSystem/axios";
import PayNowButton from "../../../Shared/PayNowButton";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function StudentQBankList() {
  const [banks, setBanks] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [accessMap, setAccessMap] = useState({}); // ✅ per-bank access state
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const fetchBanks = async () => {
    try {
      const res = await API.get("/api/admin/qbank");
      setBanks(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching banks:", err);
    }
  };

  const fetchAttempts = async () => {
    try {
      const studentId = user?.sub || user?.id || user?.userId;
      if (!studentId) return;
      const res = await API.get(`/api/student/qbank/student/attempts/${studentId}`);
      setAttempts(res.data?.attempts || {});
    } catch (err) {
      console.error("❌ Error fetching attempts:", err);
    }
  };

  // ✅ Per-bank access check (updated)
  const checkAccess = async () => {
    try {
      const studentId = user?.sub || user?.id || user?.userId;
      if (!studentId || !banks?.length) return;

      const newAccessMap = {};
      for (const bank of banks) {
        const bankId = bank.bankId || bank._id || bank.id;
        try {
          const res = await API.get(`/api/payments/has-access`, {
            params: { userId: studentId, productId: bankId },
          });
          newAccessMap[bankId] = res.data?.allowed || false;
        } catch (e) {
          console.warn(`⚠️ Access check failed for ${bankId}`, e);
          newAccessMap[bankId] = false;
        }
      }
      setAccessMap(newAccessMap);
    } catch (err) {
      console.error("❌ Error checking access:", err);
    }
  };

  const goFilter = (bank) => {
    const bankId = bank.bankId || bank._id || bank.id;
    navigate(`/student/qbank/filter?bankId=${encodeURIComponent(bankId)}`, {
      state: { bankId, bankName: bank.name },
    });
  };

  const visibleBanks = (banks || []).filter((b) => b?.status === "PUBLISHED");
  const studentId = user?.sub || user?.id || user?.userId;

  useEffect(() => {
    if (banks.length > 0 && user) {
      checkAccess(); // ✅ call after banks loaded
    }
  }, [banks, user]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Back to Dashboard */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => navigate("/student/dashboard")}
          sx={{
            color: "#4748ac",
            textTransform: "none",
            fontWeight: 600,
            px: 0,
            "&:hover": {
              textDecoration: "underline",
              backgroundColor: "transparent",
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          fontSize: { xs: "1.05rem", md: "1.2rem" },
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span role="img" aria-label="books">
          📚
        </span>
        <span>Available Question Banks</span>
      </Typography>

      <Grid container spacing={2}>
        {visibleBanks.map((bank) => {
          const bankId = bank.bankId || bank._id || bank.id;
          const prev = attempts[bankId] || attempts[bank.bankId] || attempts[bank._id];
          const lastAttemptTime = prev?.startTime
            ? new Date(prev.startTime).toLocaleString("en-IN")
            : "—";

          const thumbSrc =
            (bank.thumbnailUrl && bank.thumbnailUrl.trim() !== ""
              ? bank.thumbnailUrl
              : null) ||
            "https://via.placeholder.com/400x200.png?text=Question+Bank";

          const isFree = !bank.isPaid || bank.isPaid === false;
          const hasPaidAccess = accessMap[bankId] || false;
          const canOpen = isFree || hasPaidAccess;

          return (
            <Grid item xs={12} sm={6} md={4} key={bankId}>
              <Card
                sx={{
                  borderRadius: "12px",
                  boxShadow:
                    "0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* ✅ Thumbnail clickable only if allowed */}
                <Box
                  component="img"
                  src={thumbSrc}
                  alt={bank.name || "Question Bank"}
                  sx={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    backgroundColor: "#f5f5f5",
                    borderBottom: "1px solid #e5e7eb",
                    cursor: canOpen ? "pointer" : "not-allowed",
                    opacity: canOpen ? 1 : 0.6,
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: canOpen ? "scale(1.02)" : "none",
                    },
                  }}
                  onClick={() => {
                    if (canOpen) goFilter(bank);
                    else alert("Please complete payment to unlock this QBank.");
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x200.png?text=Question+Bank";
                  }}
                />

                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#111827",
                      userSelect: "none",
                    }}
                  >
                    {bank.name || "Untitled Q-Bank"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", fontSize: "0.8rem" }}
                  >
                    Last used: {lastAttemptTime}
                  </Typography>

                  {/* Price display for paid banks */}
                  {bank.isPaid && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#4748ac",
                        fontWeight: 600,
                        mt: 0.5,
                      }}
                    >
                      ₹{(bank.pricePaise || 0) / 100} / access
                    </Typography>
                  )}
                </CardContent>

                {/* ✅ Action Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    px: 2,
                    pb: 2,
                    pt: 0.5,
                  }}
                >
                  {canOpen ? (
                    <>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          goFilter(bank);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          backgroundColor: "#4748ac",
                          borderRadius: "8px",
                          "&:hover": { backgroundColor: "#3a3b8e" },
                        }}
                      >
                        Practice
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/qbank/details/${bankId}`);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          borderColor: "#4748ac",
                          color: "#4748ac",
                          borderRadius: "8px",
                          "&:hover": {
                            backgroundColor: "rgba(71,72,172,0.08)",
                            borderColor: "#4748ac",
                          },
                        }}
                      >
                        Review
                      </Button>
                    </>
                  ) : (
                    <PayNowButton
                      userId={studentId}
                      productId={bankId}
                      productType="QBANK"   
                      onSuccess={checkAccess}
                      label={`Pay ₹${(bank.pricePaise || 0) / 100} to Unlock`}
                    />
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}