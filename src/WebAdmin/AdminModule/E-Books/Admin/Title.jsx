// src/components/Title.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as ebooksApiModule from "../api/ebooksApi";
import { toast } from "react-toastify";

const api = ebooksApiModule.default || ebooksApiModule;

export default function Title() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState(""); // kept
  const [coverImageUrl, setCoverImageUrl] = useState(""); // ← text instead of image
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and Slug are required");
      return;
    }

    // Optional: light URL validation if user provided something
    if (coverImageUrl && !/^https?:\/\/.+/i.test(coverImageUrl.trim())) {
      toast.error("Cover Image URL must start with http(s)://");
      return;
    }

    try {
      setSaving(true);

      // No upload — we just pass the URL as text
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        instituteId: "0z2w1ep",
        coverImage: coverImageUrl.trim() || undefined, // ← saved as text
        chapters: [{ chapterId: "ch1", title: "Main Chapter", blocks: [] }],
        status: "DRAFT",
      };

      const res = await api.createEBook(payload);
      const newId =
        res?.data?.ebook?.ebookid || res?.data?.ebookid || res?.data?.id;
      if (!newId) throw new Error("Could not read new ebook id from server");

      toast.success("E-Book created!");
      navigate(`/admin/ebooks/edit/${newId}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log("[Create EBook] create error payload:", err?.response?.data);
      const msg =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";
      toast.error("Failed to create e-book: " + msg);
      // eslint-disable-next-line no-console
      console.error("[Create EBook] error:", err?.response || err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="title-page">
      <style>
        {`
          :root{
            --bg:#ffffff;
            --text:#0f172a;
            --muted:#6b7280;
            --muted-2:#94a3b8;
            --card:#ffffff;
            --border:#e5e7eb;
            --ring:#c7d2fe;
            --accent1:#6366f1;
            --accent2:#22c55e;
            --accent3:#a855f7;
          }

          @keyframes floatUp {
            from { opacity:0; transform: translateY(16px) scale(.98); }
            to   { opacity:1; transform: translateY(0)    scale(1);   }
          }
          @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50%{ background-position: 100% 50%; }
            100%{background-position: 0% 50%; }
          }

          .title-page{
            min-height:100vh;
            background: var(--bg);
            color:var(--text);
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue";
            padding: 24px 16px 40px;
            display:block;
          }

          .center-wrap{
            max-width: 920px;
            margin: 0 auto;
            min-height: calc(100vh - 160px);
            display:flex;
            flex-direction: column;
            align-items:center;
            justify-content:center;
            gap: 16px;
            animation: floatUp .4s ease both;
          }

          .hero{
            width:100%;
            text-align:center;
          }
          .hero-title{
            font-size: clamp(26px, 4vw, 34px);
            font-weight: 800;
            line-height:1.1;
            display:inline-block;
            background: linear-gradient(90deg, #4748ac, #4748ac, #4748ac);
            background-size: 200% 200%;
            -webkit-background-clip:text;
            background-clip:text;
            color: transparent;
            animation: gradientFlow 8s ease infinite;
          }
          .hero-sub{
            margin-top:10px;
            font-size:14px;
            color: var(--muted);
          }

          .card{
            width:100%;
            background: var(--card);
            border:1px solid var(--border);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(2,6,23,.06);
            padding: 22px;
          }

          .form-grid{
            display:grid;
            grid-template-columns: 1fr;
            gap:18px;
          }
          @media(min-width: 860px){
            .form-grid{ grid-template-columns: 1fr 1fr; }
          }

          .field{ display:flex; flex-direction:column; gap:8px; }
          .label{ font-size:12px; letter-spacing:.4px; color: var(--muted); text-transform: uppercase; }
          .input, .textarea{
            background: #ffffff;
            border:1px solid var(--border);
            color: var(--text);
            border-radius: 12px;
            padding: 12px 14px;
            outline:none;
            transition: border .15s ease, box-shadow .15s ease, transform .05s ease;
          }
          .textarea{ min-height: 110px; resize: vertical; }
          .input:hover, .textarea:hover{ border-color: #d1d5db; }
          .input:focus, .textarea:focus{
            border-color: #818cf8;
            box-shadow: 0 0 0 3px var(--ring);
          }
          .help{ font-size:12px; color: var(--muted-2); margin-top:2px; }

          .actions{
            max-width: 920px;
            margin: 16px auto 0;
            display:flex;
            justify-content:center;
          }
          .btn-create{
            border:none;
            padding: 12px 22px;
            border-radius: 12px;
            color: #fff;
            font-weight: 700;
            letter-spacing:.2px;
            cursor: pointer;
            background: #4748ac;
            transition: transform .08s ease, filter .15s ease, box-shadow .15s ease;
            box-shadow: 0 8px 22px rgba(71,72,172,.25);
          }
          .btn-create:hover{
            transform: translateY(-1px);
            filter: brightness(1.05);
            box-shadow: 0 12px 28px rgba(71,72,172,.30);
          }
          .btn-create:active{
            transform: translateY(0);
            box-shadow: 0 6px 16px rgba(71,72,172,.22);
          }
          .btn-create:disabled{ opacity:.6; cursor:not-allowed; }
        `}
      </style>

      {/* Centered content */}
      <div className="center-wrap">
        <div className="hero">
          <div className="hero-title">Create a New E-Book</div>
          <div className="hero-sub">
            Add basic details, then jump into the editor to build chapters and blocks.
          </div>
        </div>

        <div className="card">
          <div className="form-grid">
            {/* Title */}
            <div className="field">
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="Awesome E-Book Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="help">Visible to learners and on your admin list.</div>
            </div>

            {/* Slug */}
            <div className="field">
              <label className="label">Slug</label>
              <input
                className="input"
                placeholder="awesome-ebook-title"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <div className="help">Must be unique. Used in shareable URLs.</div>
            </div>

            {/* Description */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="label">Short Description</label>
              <textarea
                className="textarea"
                placeholder="What’s this e-book about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Cover Image URL (text instead of file upload) */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="label">Cover Image URL</label>
              <input
                className="input"
                placeholder="https://.../your-cover.jpg"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
              />
              <div className="help">
                Paste a full URL (e.g., S3/CloudFront). This value will be saved as
                <code> coverImage</code>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Normal button that moves with the page */}
      <div className="actions">
        <button
          disabled={saving}
          onClick={handleCreate}
          className="btn-create"
          title="Create and continue to editor"
        >
          {saving ? "Creating…" : "Create E-Book"}
        </button>
      </div>
    </div>
  );
}
