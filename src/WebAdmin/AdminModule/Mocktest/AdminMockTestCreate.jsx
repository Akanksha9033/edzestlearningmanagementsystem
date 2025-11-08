import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import API from "../../../LoginSystem/axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";

export default function AdminMockTestCreate() {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Cognito user (includes role, email, instituteId)

  // ---------------- State ----------------
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(true);

  // ---------------- Auto-Slugify ----------------
  useEffect(() => {
    if (title) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");
      setSlug(generated);
    }
  }, [title]);

  // ---------------- Check Slug Availability ----------------
  useEffect(() => {
    if (!slug) return;
    const delay = setTimeout(async () => {
      try {
        const res = await API.get(
          `/api/admin/mocktests/create-mock/check-slug`,
          {
            params: { slug },
          }
        );
        setSlugAvailable(res.data.available);
      } catch (err) {
        console.error("Slug check failed:", err);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [slug]);

  // ---------------- Handle Create ----------------
  const handleCreate = async () => {
    if (!title || !file) {
      alert("⚠️ Title and Excel file are required.");
      return;
    }
    if (!slugAvailable) {
      alert("❌ Slug already exists. Choose another.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("instituteId", user?.instituteId || "unknown");
      if (duration) formData.append("duration", duration);
      formData.append("isFree", isFree);
      if (!isFree) formData.append("price", price || 0);
      if (image) formData.append("image", image);
      formData.append("file", file);

      // ✅ POST to /api/admin/mocktests/create-mock (backend route)
      await API.post("/api/admin/mocktests/create-mock", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ MockTest created successfully (Draft)");
      // ⭐ Navigate to the LIST page (not the editor)
      navigate("/admin/mocktests");
    } catch (err) {
      console.error("Create error:", err);
      alert("❌ Failed to create mocktest. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" mb={2} fontWeight="bold">
            🧠 Create New Mock Test
          </Typography>

          {/* Title Input */}
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Slug Input */}
          <TextField
            fullWidth
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            sx={{ mb: 2 }}
            helperText={
              slug
                ? slugAvailable
                  ? "✅ Slug available"
                  : "❌ Slug already in use"
                : ""
            }
            error={!!slug && !slugAvailable}
          />

          {/* Duration */}
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Free/Paid Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
              />
            }
            label="This is a Free Mock Test"
          />

          {/* Price field (if Paid) */}
          {!isFree && (
            <TextField
              fullWidth
              label="Price (₹)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          {/* Image Upload */}
          <Box sx={{ mb: 2 }}>
            <Typography fontWeight="500" mb={1}>
              Upload Cover Image
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </Box>

          {/* Excel Upload */}
          <Box sx={{ mb: 2 }}>
            <Typography fontWeight="500" mb={1}>
              Upload Excel (.xlsx)
            </Typography>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreate}
            disabled={loading}
            fullWidth
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Mock Test"
            )}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
