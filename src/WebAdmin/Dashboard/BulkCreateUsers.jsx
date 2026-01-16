import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import API from "../../LoginSystem/axios";

export default function BulkCreateUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const users = XLSX.utils.sheet_to_json(sheet);

      if (!users.length) {
        alert("Excel file is empty");
        setLoading(false);
        return;
      }

      await API.post("/api/admin/users/bulk-create", {
        users,
      });

      alert("✅ Users created successfully");
      navigate("/admin/users");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to upload users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/admin/users")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={{ p: 4 }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Bulk Create Learners
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Upload Excel file (.xlsx / .csv)
          </Typography>

          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={loading}
          >
            Upload Excel
            <input
              type="file"
              hidden
              accept=".xlsx,.csv"
              onChange={handleFileUpload}
            />
          </Button>

          {fileName && (
            <Typography variant="caption">
              Selected file: {fileName}
            </Typography>
          )}

          {loading && <CircularProgress size={28} />}
        </Stack>
      </Paper>
    </Box>
  );
}
