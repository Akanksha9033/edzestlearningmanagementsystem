// src/WebAdmin/MockTests/AdminMockTestSettings.jsx
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
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";

// external css you already created
import "./adminMockSettings.css";

// your existing sidebar (same one used by AdminDashboard)
import AdminSidebar from "../../Dashboard/AdminSidebar";
import { useAuth } from "../../../LoginSystem/context/AuthContext";


export default function AdminMockTestSettings() {
  const { user } = useAuth();

  const { mockTestId } = useParams();
  const navigate = useNavigate();

  // ───────────────── LAYOUT STATE (same pattern as AdminDashboard) ─────────────────
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
  const contentCols = isCollapsed
    ? "col-12 col-md-11 col-lg-11"
    : "col-12 col-md-9 col-lg-10";

  // ───────────────── DATA / FORM STATE ─────────────────
  const [mock, setMock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // new states (as requested)
  const [useSections, setUseSections] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [sectionDurations, setSectionDurations] = useState([]); // minutes array

  const [tagsInput, setTagsInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // helpers (declared before first use to avoid any lint noise)
  function resolveImageUrl(raw) {
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const m = raw.match(/^s3:\/\/([^/]+)\/(.+)$/i);
    if (m) {
      const bucket = m[1];
      const key = m[2];
      return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(
        key
      ).replace(/%2F/g, "/")}`;
    }
    return "";
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(
          `/api/admin/mocktests/mock-settings/${mockTestId}`
        );
        const data = res.data || {};
        setMock({
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : [],
          duration: data.duration ?? "",
          breakMinutes: data.breakMinutes ?? 0,
          useSections: !!data.useSections,
          sectionNames: Array.isArray(data.sectionNames)
            ? data.sectionNames
            : Array.isArray(data.sections)
            ? data.sections.map((s) => s?.name || "")
            : [],
          status: data.status || "UNPUBLISHED",
          title: data.title || "",
          slug: data.slug || "",
          // ⬇️ NEW: free / paid fields coming from backend
          isFree:
            data.isFree !== undefined && data.isFree !== null
              ? !!data.isFree
              : true,
          price: data.price ?? "",
        });

        // seed new local states
        setUseSections(!!data.useSections);
        setBreakMinutes(Number(data.breakMinutes || 0));
        setSectionDurations(
          Array.isArray(data.sectionDurations) ? data.sectionDurations : []
        );

        setImagePreview(resolveImageUrl(data.imageUrl || ""));
      } catch (err) {
        console.error("Failed to fetch mocktest:", err);
        alert("❌ Unable to load mock test.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mockTestId]);

  async function saveSettings() {
    if (!mock) return;
    try {
      setSaving(true);
      const form = new FormData();

      // basic fields
      form.set("status", mock.status || "");
      form.set("instituteId", user?.instituteId || "");

      form.set("title", mock.title ?? "");
      form.set("level", mock.level ?? "");

      // durations from top-level mock (overall minutes)
      form.set(
        "duration",
        mock.duration === "" ? "" : String(mock.duration ?? "")
      );

      // NEW: section settings
      form.set("useSections", String(!!useSections));
      form.set("breakMinutes", String(Number(breakMinutes || 0)));

      // NEW: per-section minutes array
      (sectionDurations || []).forEach((m) =>
        form.append("sectionDurations[]", m === "" ? "" : String(m))
      );

      // ⬇️ NEW: free/paid fields
      form.set("isFree", String(!!mock.isFree));
      if (!mock.isFree) {
        // Only send price if paid
        form.set(
          "price",
          mock.price === "" || mock.price === null || mock.price === undefined
            ? ""
            : String(mock.price)
        );
      } else {
        // if admin toggles to free, you can choose to send empty price
        form.set("price", "");
      }

      // tags[]
      (mock.tags || []).forEach((t) => form.append("tags[]", t));

      // optional cover
      if (imageFile) form.append("image", imageFile);

      await API.patch(
        `/api/admin/mocktests/mock-settings/${mockTestId}/settings`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("✅ Settings updated successfully");
      navigate("/admin/mocktests");
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!mock) return;
    const newTag = (tagsInput || "").trim();
    if (newTag && !mock.tags.includes(newTag)) {
      setMock({ ...mock, tags: [...mock.tags, newTag] });
      setTagsInput("");
    }
  };
  const handleDeleteTag = (t) => {
    if (!mock) return;
    setMock({ ...mock, tags: (mock.tags || []).filter((x) => x !== t) });
  };

  if (loading)
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
        <Typography mt={2}>Loading mock test...</Typography>
      </Box>
    );
  if (!mock) return <Typography>Mock test not found.</Typography>;

  const isPublished = mock.status === "PUBLISHED";
  const sectionNames = Array.isArray(mock.sectionNames)
    ? mock.sectionNames
    : [];

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* ───────────── Sidebar (desktop/tablet) ───────────── */}
        <div className={`d-none d-md-block ${sidebarCols} page-sidebar`}>
          <AdminSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={() => setIsCollapsed((p) => !p)}
          />
        </div>

        {/* ───────────── Offcanvas Sidebar (mobile) ───────────── */}
        <div
          className="offcanvas offcanvas-start bg-dark text-white d-md-none"
          tabIndex="-1"
          id="mobileSidebar"
          aria-labelledby="mobileSidebarLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="mobileSidebarLabel">
              Admin
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            />
          </div>
          <div className="offcanvas-body p-0">
            <AdminSidebar isCollapsed={false} toggleSidebar={() => {}} />
          </div>
        </div>

        {/* ───────────── Content Column ───────────── */}
        <div
          className={`${contentCols} d-flex flex-column min-vh-100 content-col`}
        >
          {/* Mobile hamburger to open offcanvas */}
          <div
            className="d-md-none d-flex align-items-center justify-content-between px-3 py-2"
            style={{ background: "var(--page-bg)" }}
          >
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-controls="mobileSidebar"
            >
              ☰ Menu
            </button>
            <span className="small text-muted">
              Admin / Mock Tests / Settings
            </span>
          </div>

          {/* Your styled content area */}
          <main className="page-content">
            <div className="breadcrumb-row d-none d-md-flex">
              <h1 className="page-title">Mock Test Settings</h1>
              <div className="pill">
                {isPublished ? "Published" : "Unpublished"}
              </div>
            </div>

            <Card className="settings-card">
              <CardContent>
                {/* Top two-column (title + image) */}
                <div className="settings-grid">
                  <div>
                    <div className="label-strong">Title</div>
                    <TextField
                      fullWidth
                      placeholder="Sample Mock Test"
                      value={mock.title || ""}
                      onChange={(e) =>
                        setMock({ ...mock, title: e.target.value })
                      }
                      sx={{ mb: 1.5 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5 }}
                    >
                      Slug: {mock.slug}
                    </Typography>

                    <div className="label-strong" style={{ marginTop: 8 }}>
                      Status
                    </div>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={mock.status === "PUBLISHED"}
                          onChange={(e) =>
                            setMock({
                              ...mock,
                              status: e.target.checked
                                ? "PUBLISHED"
                                : "UNPUBLISHED",
                            })
                          }
                        />
                      }
                      label={mock.status || "UNPUBLISHED"}
                      sx={{ mb: 2 }}
                    />

                    {/* NEW: Free / Paid toggle (same idea as QBank) */}
                    <div className="label-strong" style={{ marginTop: 8 }}>
                      Access Type
                    </div>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!mock.isFree}
                          onChange={(e) =>
                            setMock({ ...mock, isFree: e.target.checked })
                          }
                        />
                      }
                      label={mock.isFree ? "Free Mock Test" : "Paid Mock Test"}
                      sx={{ mb: 1.5 }}
                    />

                    {!mock.isFree && (
                      <TextField
                        fullWidth
                        label="Price (₹)"
                        type="number"
                        value={mock.price ?? ""}
                        onChange={(e) =>
                          setMock({ ...mock, price: e.target.value })
                        }
                        sx={{ mb: 2 }}
                        inputProps={{ min: 0 }}
                      />
                    )}

                    {/* NEW: section-wise switch (local state) */}
                    <div className="label-strong">Enable section-wise mode</div>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useSections}
                          onChange={(e) => setUseSections(e.target.checked)}
                        />
                      }
                      label={useSections ? "On" : "Off"}
                      sx={{ mb: 2 }}
                    />
                  </div>

                  {/* Cover image box on the right */}
                  <div>
                    <div className="label-strong">Cover Image</div>
                    {imagePreview ? (
                      <div className="cover-box" style={{ marginBottom: 8 }}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <img
                          src={imagePreview}
                          onError={() => setImagePreview("")}
                          style={{
                            display: "block",
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="cover-empty" style={{ marginBottom: 8 }}>
                        No image
                      </div>
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
                    <span
                      className="change-link"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </span>
                  </div>
                </div>

                {/* NEW: Break & per-section durations */}
                <div className="duo" style={{ marginTop: 20 }}>
                  <div>
                    <div className="label-strong">
                      Break after each section (minutes)
                    </div>
                    <TextField
                      type="number"
                      fullWidth
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(e.target.value)}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="label-strong">
                      Mock Test Duration (minutes)
                    </div>
                    <TextField
                      type="number"
                      fullWidth
                      value={mock.duration}
                      onChange={(e) =>
                        setMock({ ...mock, duration: e.target.value })
                      }
                      size="small"
                    />
                  </div>
                </div>

                {/* Per-section minutes inputs (shown only if useSections true) */}
                {useSections && (
                  <div style={{ marginTop: 16 }}>
                    <div className="label-strong" style={{ marginBottom: 8 }}>
                      Per-section durations (minutes)
                    </div>
                    {sectionNames.length === 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        No section names found in this mock. You can still enter
                        durations; they’ll be applied by index.
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {(sectionNames.length
                        ? sectionNames
                        : ["Section 1", "Section 2", "Section 3"]
                      ).map((nm, i) => (
                        <TextField
                          key={i}
                          label={`Duration for ${nm || `Section ${i + 1}`}`}
                          type="number"
                          value={sectionDurations[i] ?? ""}
                          onChange={(e) => {
                            const v = [...sectionDurations];
                            v[i] = e.target.value;
                            setSectionDurations(v);
                          }}
                          size="small"
                          sx={{ mt: 1, mr: 1, minWidth: 220 }}
                        />
                      ))}
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      Leave blank to let the system split overall duration
                      evenly across sections.
                    </Typography>
                  </div>
                )}

                {/* Tags */}
                <div style={{ marginTop: 20 }}>
                  <div className="label-strong">Tags</div>
                  <form onSubmit={handleAddTag}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <TextField
                        size="small"
                        placeholder="Add tag and press Enter"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <Button type="submit" variant="outlined">
                        Add
                      </Button>
                    </Stack>
                  </form>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    className="tag-list"
                  >
                    {(mock.tags || []).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Stack>
                </div>

                {/* Save button */}
                <div className="save-row">
                  <Button
                    variant="contained"
                    onClick={saveSettings}
                    disabled={saving}
                    className="save-btn"
                  >
                    {saving ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
