// src/components/NotesPad.jsx
import React, { useEffect, useRef, useState } from "react";
import { saveNote, getNotesByBookChapter } from "../api/ebooksApi";

const PAD_CHAPTER_ID = "_pad"; // special chapter to store the freeform pad
const PAD_NOTE_ID = "pad";     // stable id so we overwrite same note each save

export default function NotesPad({ userId, ebookId }) {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [status, setStatus] = useState("");

  /* ========= ADDED: pretty stats & extras ========= */
  const [autoSave, setAutoSave] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showTopGlow, setShowTopGlow] = useState(false);

  const recalcStats = () => {
    const text = editorRef.current?.innerText || "";
    const words = text.trim().length ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  // Load existing pad note (if any)
  useEffect(() => {
    (async () => {
      if (!userId || !ebookId) return;
      try {
        setLoading(true);
        const res = await getNotesByBookChapter({
          userId,
          bookId: ebookId,
          chapterId: PAD_CHAPTER_ID,
        });
        const notes = res?.data?.notes || [];
        // Prefer the fixed id if present; else use the latest
        const existing =
          notes.find((n) => n.id === PAD_NOTE_ID) ||
          notes[0] ||
          null;

        if (existing && editorRef.current) {
          // If you stored HTML in `text` you can set textContent; we’ll assume HTML in `text` or `meta.html`
          // Prefer meta.html if you once saved HTML there; otherwise use text as plain
          if (existing.meta?.html) {
            editorRef.current.innerHTML = existing.meta.html;
          } else {
            editorRef.current.innerText = existing.text || "";
          }
          setLastSaved(existing.updatedAt || existing.createdAt || null);
        } else if (editorRef.current) {
          editorRef.current.innerHTML = "";
          setLastSaved(null);
        }
        recalcStats(); // ADDED
      } catch (e) {
        // fine if none yet
        console.warn("NotesPad load error:", e?.response?.data || e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, ebookId]);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const highlight = () => {
    try { document.execCommand("hiliteColor", false, "#fff59d"); } catch {}
    try { document.execCommand("backColor", false, "#fff59d"); } catch {}
    editorRef.current?.focus();
  };

  const markImportant = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const mark = document.createElement("mark");
    mark.className = "np-important";
    mark.style.background = "#fde047";
    mark.style.padding = "0 .12em";
    mark.style.borderRadius = "4px";
    mark.style.boxShadow = "0 0 0 2px rgba(234,179,8,.25)";
    mark.appendChild(range.extractContents());

    const star = document.createElement("span");
    star.textContent = " ⭐";
    star.style.userSelect = "none";
    star.style.fontWeight = "800";
    star.style.color = "#a16207";
    mark.appendChild(star);

    range.insertNode(mark);
    sel.removeAllRanges();
    editorRef.current?.focus();
  };

  const clearFormat = () => {
    exec("removeFormat");
    const marks =
      editorRef.current?.querySelectorAll("mark.np-important") || [];
    marks.forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
    });
  };

  const handleSave = async () => {
    if (!userId || !ebookId) return;
    try {
      setSaving(true);
      setStatus("");

      const html = editorRef.current?.innerHTML || "";
      const text = editorRef.current?.innerText || "";
      const importantCount =
        editorRef.current?.querySelectorAll("mark.np-important").length || 0;

      // We save the HTML in meta.html (and plain text in text) so it round-trips nicely.
      await saveNote({
        userId,
        bookId: ebookId,
        chapterId: PAD_CHAPTER_ID,
        id: PAD_NOTE_ID,
        title: "Notebook",
        text,
        selection: "",
        meta: { html, importantCount },
      });

      const now = new Date().toISOString();
      setLastSaved(now);
      setStatus("Saved ✓");
    } catch (e) {
      console.error("Save failed", e?.response?.data || e?.message);
      setStatus("Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(""), 2200);
    }
  };

  // Client-side download (.doc with HTML content; opens in Word)
  const handleDownloadDoc = () => {
    const html = editorRef.current?.innerHTML || "";
    const fileName = `Notes_${ebookId || "book"}.doc`;
    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"><title>${fileName}</title></head><body>${html}</body></html>`,
      ],
      { type: "application/msword" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ========= ADDED: events & helpers ========= */
  // Live stats
  const handleInput = () => {
    recalcStats();
  };

  // Sticky glow when editor scrolled
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const onScroll = () => setShowTopGlow(ed.scrollTop > 6);
    ed.addEventListener("scroll", onScroll);
    return () => ed.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-save every 10s if enabled
  useEffect(() => {
    if (!autoSave) return;
    const t = setInterval(() => {
      if (!saving) handleSave();
    }, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSave, saving, userId, ebookId]);

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-ok

  return (
    <div className="np">
      <style>{`
        :root{
          --np-brand: #4748ac;
          --np-ink: #0f172a;
          --np-ink-soft:#344054;
          --np-muted:#6b7280;
          --np-border:#e6e7eb;
          --np-bg:#ffffff;
          --np-panel:#f8fafc;
          --np-grad: radial-gradient(1200px 420px at -10% -40%, rgba(71,72,172,.10), transparent 40%),
                     radial-gradient(1000px 420px at 110% -60%, rgba(71,72,172,.08), transparent 40%);
        }

        /* ===== Card shell (existing) + ADDED glow background ===== */
        .np{
          position: relative;
          background: var(--np-bg);
          border: 1px solid var(--np-border);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(16,24,40,.10);
          overflow: hidden;
          animation: cardIn .22s ease both;
          background-image: var(--np-grad);
          backdrop-filter: saturate(1.02);
        }
        .np:before{
          content:"";
          position:absolute; inset:-1px;
          background: linear-gradient(180deg, rgba(71,72,172,.06), transparent 40%);
          pointer-events:none;
        }

        .np__accent{
          height: 4px;
          background:
            linear-gradient(90deg, transparent, rgba(71,72,172,.42), transparent),
            linear-gradient(90deg, var(--np-brand), rgba(71,72,172,.5), var(--np-brand));
        }

        .np__head{
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 16px 18px;
          background: var(--np-panel);
          border-bottom: 1px solid var(--np-border);
        }

        .np__title{
          display:flex; align-items:center; gap:10px;
          font-weight: 900; font-size: 18px; color: var(--np-ink);
          letter-spacing:.2px;
        }
        .np__title-dot{
          width: 10px; height: 10px; border-radius: 999px;
          background: var(--np-brand);
          box-shadow: 0 0 0 3px rgba(71,72,172,.22);
          animation: breathe 3s ease-in-out infinite;
        }

        .np__status{
          justify-self: end;
          font-size: 12px; color: var(--np-muted);
          display:flex; align-items:center; gap:12px;
          white-space: nowrap;
        }
        .np__status-row{
          display:flex; align-items:center; gap:10px; color: #6b7280;
          font-weight: 700;
        }
        .np__status-dot{
          width:8px; height:8px; border-radius:999px; display:inline-block;
          background:#22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.18);
        }
        .np__status-dot.warn{
          background:#f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.16);
        }

        /* ===== Toolbar ===== */
        .np__toolbar{
          padding: 10px 16px 8px;
          border-bottom: 1px solid var(--np-border);
          background: #fff;
          position: sticky; top: 0; z-index: 5;
        }
        .np__groups{
          display:flex; flex-wrap: wrap; gap: 10px 14px; align-items:center;
        }
        .np__group{
          display:flex; gap: 8px; align-items:center;
          padding: 6px;
          border: 1px solid #eef0f3;
          background:#fff;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0,0,0,.02);
        }
        .np__sep{
          width:1px; height:24px; background:#eef0f3; align-self:stretch;
        }

        .np__btn{
          appearance: none;
          border: 1px solid #e7e7ef;
          background: linear-gradient(#fff, #fafbff);
          color: var(--np-ink);
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: transform .06s ease, box-shadow .18s ease, border-color .16s ease, background .16s ease;
          position: relative;
          overflow: hidden;
        }
        .np__btn:hover{
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(16,24,40,.08);
          border-color: #d7daf0;
          background:#fafbff;
        }
        .np__btn:active{ transform: translateY(0); }
        .np__btn:focus-visible{ outline: none; box-shadow: 0 0 0 3px rgba(71,72,172,.25); }
        .np__btn--ghost{
          border: 1px dashed #cfd6e4;
          background:#fff;
          color: var(--np-ink-soft);
        }
        .np__btn--primary{
          background: radial-gradient(140% 180% at 0% 0%, #6b6cf0, #4748ac);
          color: #fff;
          border-color: #4748ac;
          box-shadow: 0 10px 22px rgba(71,72,172,.22);
        }
        .np__btn:disabled{ opacity: .65; cursor: not-allowed; }

        .np__icon{
          width: 18px; height: 18px; border-radius: 8px;
          background: #eef2ff; color: var(--np-brand);
          display:inline-flex; align-items:center; justify-content:center;
          font-weight: 900; font-size: 12px;
          box-shadow: 0 1px 0 rgba(71,72,172,.15) inset;
        }

        /* ===== Editor ===== */
        .np__body{ padding: 14px 16px 12px; background:#fff; position: relative; }
        .np__glow{
          position:absolute; left:18px; right:18px; top:14px;
          height: 12px; border-radius: 12px;
          background: linear-gradient(180deg, rgba(71,72,172,.08), transparent);
          opacity: ${showTopGlow ? 1 : 0};
          transition: opacity .18s ease;
          pointer-events:none;
        }
        .np__editor{
          min-height: 260px; max-height: 52vh; overflow: auto;
          padding: 18px 20px;
          border: 1px solid var(--np-border);
          border-radius: 14px;
          line-height: 1.72; color: var(--np-ink); font-size: 15px;
          background:
            linear-gradient(180deg, rgba(71,72,172,.04), transparent 12%),
            radial-gradient(700px 140px at 50% -60px, rgba(71,72,172,.06), transparent 70%);
          transition: border-color .15s ease, box-shadow .2s ease, background .2s ease;
          outline: none;
        }
        .np__editor:focus{
          border-color: #c7d2fe;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(71,72,172,.22) inset, 0 16px 32px rgba(16,24,40,.06);
          animation: focusGlow .22s ease both;
        }
        .np__editor:empty:before{
          content: attr(data-placeholder);
          color: #98a2b3;
        }

        /* Skeleton while loading (ADDED) */
        .np__skeleton{
          --shine: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.6), rgba(255,255,255,0));
          background:
            linear-gradient(#f1f5f9, #edf2f7);
          position: relative;
          overflow: hidden;
          border-radius: 10px;
          height: 140px;
          border: 1px solid #e5e7eb;
        }
        .np__skeleton:after{
          content:""; position:absolute; inset:0;
          background-image: var(--shine);
          transform: translateX(-100%);
          animation: loading 1.2s ease-in-out infinite;
        }
        @keyframes loading { to { transform: translateX(100%); } }

        .np__help{
          margin-top: 8px;
          font-size: 12px; color: #6b7280;
          display:flex; justify-content: space-between; align-items:center;
        }
        .np__chip{
          display:inline-flex; align-items:center; gap:8px;
          background:#eef2ff; border: 1px solid #e0e7ff;
          padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 800;
          color: #1f2937;
          box-shadow: 0 6px 14px rgba(71,72,172,.14);
          animation: chipIn .22s ease both;
        }

        /* ===== Footer ===== */
        .np__foot{
          padding: 12px 16px;
          border-top: 1px solid var(--np-border);
          background: linear-gradient(180deg, #fff, #fafafa);
          display:flex; gap: 10px; justify-content: space-between; align-items:center; flex-wrap:wrap;
        }
        .np__foot-right{ display:flex; gap:10px; align-items:center; }

        /* ===== Micro animations ===== */
        @keyframes cardIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes breathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
        @keyframes focusGlow { from { box-shadow: 0 0 0 0 rgba(71,72,172,0) inset } to { box-shadow: 0 0 0 3px rgba(71,72,172,.22) inset } }
        @keyframes chipIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg); } }
        mark.np-important{ animation: markPop .18s ease both; }
        @keyframes markPop { from { transform: scale(.98); } to { transform: scale(1); } }
      `}</style>

      <div className="np__accent" />

      <div className="np__head">
        <div className="np__title">
          <span className="np__title-dot" />
          My Notes
        </div>

        <div className="np__status" aria-live="polite">
          {/* ADDED: stats row */}
          <div className="np__status-row" title="Live word/char count">
            <span>Words: {wordCount}</span>
            <span>•</span>
            <span>Chars: {charCount}</span>
          </div>
          {loading ? (
            <>
              <span className="np__status-dot warn" />
              Loading…
            </>
          ) : lastSaved ? (
            <>Last saved: {new Date(lastSaved).toLocaleString()}</>
          ) : (
            "No saves yet"
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="np__toolbar">
        <div className="np__groups" role="toolbar" aria-label="Formatting">
          <div className="np__group" aria-label="Basic styles">
            <button className="np__btn" onClick={() => exec("bold")} title="Bold (Ctrl/Cmd + B)">
              <span className="np__icon">B</span> Bold
            </button>
            <button className="np__btn" onClick={() => exec("italic")} title="Italic (Ctrl/Cmd + I)">
              <span className="np__icon">I</span> Italic
            </button>
            <button className="np__btn" onClick={() => exec("underline")} title="Underline (Ctrl/Cmd + U)">
              <span className="np__icon">U</span> Underline
            </button>
          </div>

          <span className="np__sep" />

          <div className="np__group" aria-label="Structure">
            <button className="np__btn" onClick={() => exec("insertUnorderedList")} title="Bulleted list">
              <span className="np__icon">•</span> List
            </button>
            <button className="np__btn" onClick={() => exec("formatBlock", "<h3>")} title="Heading 3">
              <span className="np__icon">H</span> H3
            </button>
          </div>

          <span className="np__sep" />

          <div className="np__group" aria-label="Emphasis">
            <button className="np__btn" onClick={highlight} title="Highlight selection">
              <span className="np__icon">✦</span> Highlight
            </button>
            <button className="np__btn" onClick={markImportant} title="Mark important">
              <span className="np__icon">★</span> Important
            </button>
            <button className="np__btn np__btn--ghost" onClick={clearFormat} title="Clear formatting">
              Clear
            </button>
          </div>

          {/* ADDED: more actions */}
          <span className="np__sep" />
          <div className="np__group" aria-label="More">
            <button className="np__btn" onClick={() => exec("undo")} title="Undo (Ctrl/Cmd + Z)">↶ Undo</button>
            <button className="np__btn" onClick={() => exec("redo")} title="Redo (Ctrl/Cmd + Shift + Z)">↷ Redo</button>
            <button className="np__btn" onClick={() => exec("formatBlock", "<blockquote>")} title="Quote">❝ Quote</button>
            <button className="np__btn" onClick={() => exec("formatBlock", "<pre>")} title="Code block">{"</>"} Code</button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="np__body">
        <div className="np__glow" />
        {loading ? (
          <div className="np__skeleton" />
        ) : (
          <div
            className="np__editor"
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}               
            data-placeholder="Type your notes here… Use the toolbar to format, highlight, or star key points."
          />
        )}
        <div className="np__help">
          <span>
            Tip: Select text and click <strong>★ Important</strong> to star key ideas.
            &nbsp;•&nbsp; Press <strong>Ctrl/Cmd + S</strong> to save.
          </span>
          <span className="np__chip" title="Toggle auto-save every 10s">
            <label style={{display:"inline-flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e)=> setAutoSave(e.target.checked)}
                style={{ accentColor: "#4748ac" }}
              />
              Auto-save
            </label>
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="np__foot">
        <div style={{fontSize:12, color:"#64748b"}}>
          {status ? (
            <span className="np__status" role="status">
              <span className={`np__status-dot ${status.includes("fail") ? "warn" : ""}`} />
              {status}
            </span>
          ) : (
            <span>Keep typing — your ideas look great ✨</span>
          )}
        </div>

        <div className="np__foot-right">
          <button className="np__btn" onClick={handleDownloadDoc} title="Download Word (.doc)">
            ⤓ Download .doc
          </button>

          <button
            className="np__btn np__btn--primary"
            disabled={saving}
            onClick={handleSave}
            title="Save to cloud"
          >
            {saving ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,.6)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin .75s linear infinite",
                  }}
                />
                &nbsp;Saving…
              </>
            ) : (
              "Save to cloud"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
