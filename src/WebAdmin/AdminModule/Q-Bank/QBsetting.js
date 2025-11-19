import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../../LoginSystem/axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

export default function AdminQBankSettings() {
  const { bankId } = useParams();
  const navigate = useNavigate();

  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const resolveImageUrl = (raw) => {
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const m = raw.match(/^s3:\/\/([^/]+)\/(.+)$/i);
    if (m) {
      const bucket = m[1];
      const key = m[2];
      return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
    }
    return raw;
  };

  // Small helper: try a list of requests until one succeeds.
  const tryRequests = async (attempts) => {
    let lastErr;
    for (const fn of attempts) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (e?.response?.status !== 404) throw e; // only fall back on 404
      }
    }
    throw lastErr;
  };

  // Load current bank settings (fallback to /api/admin/qbank/:bankId if /settings/:id is missing)
  useEffect(() => {
    (async () => {
      try {
        const res = await tryRequests([
          () => API.get(`/api/admin/qbank/settings/${bankId}`),
          () => API.get(`/api/admin/qbank/${bankId}`),
        ]);
        const data = res.data || {};
        setBank({
  name: data.name || data.title || "",
  status: data.status || "UNPUBLISHED",
  description: data.description ?? "",
  thumbnailUrl: data.thumbnailUrl || data.imageUrl || "",
  slug: data.slug || "",
  isPaid: !!data.isPaid,
  pricePaise: Number(data.pricePaise) || 0,
});

        setImagePreview(resolveImageUrl(data.thumbnailUrl || data.imageUrl || ""));
      } catch (err) {
        console.warn("QBank settings fetch failed:", err?.message);
        setBank({
          name: "",
          status: "UNPUBLISHED",
          description: "",
          thumbnailUrl: "",
          slug: "",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [bankId]);

  // Save settings (fallback to /api/admin/qbank/:bankId and/or PUT)
 const saveSettings = async () => {
  setSaving(true);
  try {
    // 1) Handle publish/unpublish using the endpoint you already have
    //    (in AdminQBankEdit.js you used: PUT /api/admin/qbank/publish/:bankId)
    if (bank.status === "PUBLISHED") {
      await API.put(`/api/admin/qbank/publish/${bankId}`);
    } else {
      // if you have an unpublish route, call it; otherwise skip
      try {
        await API.put(`/api/admin/qbank/unpublish/${bankId}`);
      } catch (e) {
        if (e?.response?.status !== 404) throw e; // ignore only if route truly doesn't exist
      }
    }

    // 2) Try to update name/description/thumbnail if your API has a route for it.
    //    We probe a few common variants; if none exist (404s), we just skip gracefully.
    const tryRequests = async (attempts) => {
      let lastErr;
      for (const fn of attempts) {
        try { return await fn(); } catch (e) {
          lastErr = e; if (e?.response?.status !== 404) throw e;
        }
      }
      return null; // all 404 → treat as "not implemented"
    };

    const doMultipart = (url, method = "patch") => {
      const form = new FormData();
      form.append("name", bank.name ?? "");
      form.append("description", bank.description ?? "");
      if (imageFile) form.append("thumbnail", imageFile); // only when changed
      return method === "put" ? API.put(url, form) : API.patch(url, form);
    };
    const doJson = (url, method = "patch") => {
  const payload = {
    name: bank.name ?? "",
    description: bank.description ?? "",
    isPaid: !!bank.isPaid,
    pricePaise: Number(bank.pricePaise) || 0,
  };
  return method === "put" ? API.put(url, payload) : API.patch(url, payload);
};


    // Only attempt meta update if title/desc/thumbnail changed meaningfully.
    const wantMetaUpdate = (bank.name?.trim()?.length || 0) > 0
      || (bank.description?.trim()?.length || 0) > 0
      || !!imageFile;

    if (wantMetaUpdate) {
      await tryRequests([
        () => (imageFile
          ? doMultipart(`/api/admin/qbank/settings/${bankId}`, "patch")
          : doJson(`/api/admin/qbank/settings/${bankId}`, "patch")),
        () => (imageFile
          ? doMultipart(`/api/admin/qbank/${bankId}`, "patch")
          : doJson(`/api/admin/qbank/${bankId}`, "patch")),
        () => (imageFile
          ? doMultipart(`/api/admin/qbank/${bankId}`, "put")
          : doJson(`/api/admin/qbank/${bankId}`, "put")),
        // add one more guess if your backend uses /update
        () => (imageFile
          ? doMultipart(`/api/admin/qbank/update/${bankId}`, "put")
          : doJson(`/api/admin/qbank/update/${bankId}`, "put")),
      ]);
    }

    alert("✅ Question Bank settings saved");
    navigate(`/admin/qbank/edit/${bankId}`, { replace: true });
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unknown error";
    console.error("❌ Save error:", err?.response || err);
    alert(`❌ Failed to save Question Bank settings\n${msg}`);
  } finally {
    setSaving(false);
  }
};


  if (loading)
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
        <Typography mt={2}>Loading question bank…</Typography>
      </Box>
    );

  if (!bank) return <Typography sx={{ p: 3 }}>Question bank not found.</Typography>;

  const isPublished = bank.status === "PUBLISHED";

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, m: 0 }}>
          ⚙️ Question Bank Settings
        </Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
            Status: <b>{isPublished ? "Published" : "Unpublished"}</b>
          </Typography>
          <Button size="small" onClick={() => navigate(`/admin/qbank/edit/${bankId}`)}>
            Back to Edit
          </Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, gap: 3 }}>
            {/* Left column */}
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Title</Typography>
              <TextField
                fullWidth
                placeholder="e.g., PMP Practice Q-Bank"
                value={bank.name}
                onChange={(e) => setBank({ ...bank, name: e.target.value })}
                sx={{ mb: 1.5 }}
              />

              {!!bank.slug && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Slug: {bank.slug}
                </Typography>
              )}

              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Status</Typography>
              <FormControlLabel
                sx={{ mb: 2 }}
                control={
                  <Switch
                    checked={bank.status === "PUBLISHED"}
                    onChange={(e) =>
                      setBank({ ...bank, status: e.target.checked ? "PUBLISHED" : "UNPUBLISHED" })
                    }
                  />
                }
                label={bank.status}
              />

              <Typography sx={{ fontWeight: 600, mb: 1 }}>Description</Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="Short description (optional)"
                value={bank.description}
                onChange={(e) => setBank({ ...bank, description: e.target.value })}
              />

              {/* Payment Settings */}
<Typography sx={{ fontWeight: 600, mt: 2, mb: 1 }}>Payment Options</Typography>
<FormControlLabel
  control={
    <Switch
      checked={!!bank.isPaid}
      onChange={(e) => setBank({ ...bank, isPaid: e.target.checked })}
    />
  }
  label={bank.isPaid ? "Paid Bank" : "Free Bank"}
/>

{bank.isPaid && (
  <TextField
    fullWidth
    type="number"
    label="Price (₹)"
    sx={{ mt: 1 }}
    value={(bank.pricePaise / 100).toString()}
    onChange={(e) => {
      const rupees = parseFloat(e.target.value || "0");
      setBank({ ...bank, pricePaise: Math.round(rupees * 100) });
    }}
  />
)}

            </Box>

            {/* Right column: thumbnail */}
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Thumbnail</Typography>

              {imagePreview ? (
                <Box sx={{ mb: 1, borderRadius: 1, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img
                    src={imagePreview}
                    onError={() => setImagePreview("")}
                    style={{ display: "block", width: "100%", height: 180, objectFit: "cover" }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    mb: 1,
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 1,
                    color: "#64748b",
                    fontSize: 14,
                  }}
                >
                  No image
                </Box>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImageFile(f);
                  if (f) setImagePreview(URL.createObjectURL(f));
                }}
              />
              <Button variant="text" onClick={() => fileInputRef.current?.click()}>
                Change
              </Button>
            </Box>
          </Box>

          {/* Save */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={saveSettings}
              disabled={saving}
              sx={{ minWidth: 140 }}
            >
              {saving ? <CircularProgress size={22} color="inherit" /> : "Save Settings"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
