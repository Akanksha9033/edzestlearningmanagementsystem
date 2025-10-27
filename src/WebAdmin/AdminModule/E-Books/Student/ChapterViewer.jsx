// src/components/ChapterViewer.jsx
import React, { useMemo, useRef, useState, useEffect, memo } from "react";
// import useReadingTracker from "../../hooks/useReadingTracker";
import { summarizeSelection as summarizeAPI, getGoogleSuggestions } from "../api/ebooksApi";
import NotesPad from "../Blocks/NotesPad";

/* ---------------------------------- */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE) ||
  (typeof window !== "undefined" && window.location?.hostname === "localhost"
    ? "http://localhost:5000"
    : "");

/* utils */
const deepClone = (obj) =>
  typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function getSelectionRectSafe(sel) {
  if (!sel || !sel.rangeCount) return null;
  try {
    const range = sel.getRangeAt(0);
    const rects = range.getClientRects?.();
    if (rects && rects.length) {
      const r0 = Array.from(rects).find((r) => r.width > 0 || r.height > 0);
      if (r0) return r0;
    }
    const r = range.getBoundingClientRect?.();
    if (r && (r.width > 0 || r.height > 0)) return r;

    const marker = document.createElement("span");
    marker.style.display = "inline-block";
    marker.style.width = "1px";
    marker.style.height = "1em";
    marker.style.background = "transparent";
    range.collapse(false);
    range.insertNode(marker);
    const mr = marker.getBoundingClientRect();
    const out = mr && (mr.width > 0 || mr.height > 0) ? mr : null;
    marker.remove();
    return out;
  } catch {
    return null;
  }
}

async function summarizeViaAPI(text, maxBullets = 6) {
  const data = await summarizeAPI(text, maxBullets);
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];
  return bullets;
}

function pick(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      if (typeof v === "string") {
        if (v.trim() !== "") return v;
      } else if (Array.isArray(v)) {
        if (v.length) return v;
      } else {
        return v;
      }
    }
  }
  return undefined;
}

function normalizeQuizBlock(block) {
  const source = block.data || block;
  if (Array.isArray(source.questions) && source.questions.length > 0) {
    return source.questions.map((q, i) => ({
      questionText: pick(q.questionText, q.question, `Question ${i + 1}`),
      options: pick(q.options, q.choices, []),
      correctAnswer:
        typeof q.correctAnswer === "number"
          ? q.correctAnswer
          : Number.parseInt(pick(q.correctAnswer, q.answerIndex, 0), 10) || 0,
      explanation: pick(q.explanation, q.reason, ""),
    }));
  }
  const questionText = pick(source.questionText, source.question, source.text, "Quiz Question");
  const options = pick(source.options, []);
  let correctAnswer = pick(source.correctAnswer, 0);
  const explanation = pick(source.explanation, "");
  if (typeof correctAnswer !== "number") {
    const n = parseInt(correctAnswer, 10);
    correctAnswer = Number.isNaN(n) ? 0 : n;
  }
  return [{ questionText, options, correctAnswer, explanation }];
}

/* ---------------- Quiz ---------------- */
function QuizCarousel({ questions }) {
  const total = questions.length;
  const [results, setResults] = useState(() => questions.map(() => ({ selected: null, correct: null })));
  const [idx, setIdx] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const current = questions[idx];
  const currentResult = results[idx];
  const score = useMemo(() => results.reduce((s, r) => (r.correct ? s + 1 : s), 0), [results]);
  const progressPct = Math.round(((idx + 1) / total) * 100);

  const chooseOption = (optIndex) => {
    if (currentResult.correct !== null) return;
    const next = deepClone(results);
    next[idx].selected = optIndex;
    setResults(next);
  };

  const checkAnswer = () => {
    if (currentResult.selected === null) return;
    const isCorrect = currentResult.selected === current.correctAnswer;
    const next = deepClone(results);
    next[idx].correct = isCorrect;
    setResults(next);
  };

  const goNext = () => {
    if (idx === total - 1) {
      setShowSummary(true);
      return;
    }
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const goPrev = () => setIdx((i) => Math.max(0, i - 1));

  return (
    <div className="quiz-wrap">
      <style>{`
        .quiz-wrap{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,.06);overflow:hidden}
        .quiz-head{padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:12px;justify-content:space-between}
        .quiz-title{font-weight:700;color:#111827;font-size:15px;letter-spacing:.2px}
        .quiz-progress{width:180px;height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden}
        .quiz-progress>span{display:block;height:100%;background:#4748ac;width:${progressPct}%}
        .quiz-body{padding:18px 18px 8px}
        .quiz-qno{font-size:12px;color:#6b7280;letter-spacing:.4px;text-transform:uppercase}
        .quiz-question{margin-top:6px;font-size:18px;font-weight:700;color:#0f172a}
        .quiz-options{margin-top:14px;display:grid;gap:10px}
        .quiz-option{border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;cursor:pointer;background:#ffffff;transition:transform .06s ease, box-shadow .12s ease, border-color .15s ease}
        .quiz-option:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(2,6,23,.06)}
        .quiz-option.selected{border-color:#818cf8;box-shadow:0 0 0 3px #c7d2fe inset}
        .quiz-option.correct{background:#ecfdf5;border-color:#22c55e}
        .quiz-option.wrong{background:#fef2f2;border-color:#ef4444}
        .quiz-cta{display:flex;gap:10px;flex-wrap:wrap;padding:14px 18px 18px}
        .btn{border:none;border-radius:12px;padding:10px 16px;font-weight:700;color:#fff;cursor:pointer;transition:transform .06s ease, box-shadow .15s ease, filter .15s ease}
        .btn:disabled{opacity:.6;cursor:not-allowed}
        .btn:hover{transform:translateY(-1px);filter:brightness(1.03)}
        .btn:active{transform:translateY(0)}
        .btn-primary{background:#4748ac;box-shadow:0 8px 22px rgba(71,72,172,.25)}
        .btn-secondary{background:#6b7280}
        .btn-outline{background:#fff;color:#111827;border:1px solid #e5e7eb}
        .pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700}
        .pill-correct{background:#ecfdf5;color:#166534}
        .pill-wrong{background:#fef2f2;color:#991b1b}
        .explanation{margin:10px 18px 6px;border:1px dashed #d1d5db;background:#fafafa;border-radius:12px;padding:12px 14px;color:#374151;font-size:14px}
        .summary{padding:22px;text-align:center;background:#ffffff}
        .summary h4{font-size:20px;font-weight:800;color:#111827;margin:4px 0 10px}
        .score{display:inline-block;padding:10px 16px;border-radius:12px;font-weight:800;color:#111827;background:#eef2ff;border:1px solid #e0e7ff}
      `}</style>

      <div className="quiz-head">
        <div className="quiz-title">Quiz</div>
        <div className="quiz-progress" aria-label="progress">
          <span />
        </div>
      </div>

      {!showSummary ? (
        <>
          <div className="quiz-body">
            <div className="quiz-qno">Question {idx + 1} of {total}</div>
            <div className="quiz-question">{current.questionText}</div>

            <div className="quiz-options">
              {current.options.map((opt, i) => {
                const isSelected = currentResult.selected === i;
                const isChecked = currentResult.correct !== null;
                const isCorrectChoice = isChecked && i === current.correctAnswer;
                const markWrong = isChecked && isSelected && i !== current.correctAnswer;

                return (
                  <div
                    key={i}
                    className={[
                      "quiz-option",
                      isSelected ? "selected" : "",
                      isCorrectChoice ? "correct" : "",
                      markWrong ? "wrong" : "",
                    ].join(" ").trim()}
                    onClick={() => chooseOption(i)}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>

          {currentResult.correct !== null && (
            <div className="explanation">
              <div className={`pill ${currentResult.correct ? "pill-correct" : "pill-wrong"}`}>
                {currentResult.correct ? "Correct" : "Wrong"}
              </div>
              {current.explanation && <div style={{ marginTop: 8 }}>{current.explanation}</div>}
            </div>
          )}

          <div className="quiz-cta">
            <button className="btn btn-outline" onClick={goPrev} disabled={idx === 0}>← Previous</button>
            {currentResult.correct === null ? (
              <button className="btn btn-primary" onClick={checkAnswer} disabled={currentResult.selected === null}>
                Check Answer
              </button>
            ) : idx < total - 1 ? (
              <button className="btn btn-primary" onClick={goNext}>Next →</button>
            ) : (
              <button className="btn btn-primary" onClick={goNext}>Submit</button>
            )}
          </div>
        </>
      ) : (
        <div className="summary">
          <div className="score">Score: {score} / {total}</div>
          <div style={{ marginTop: 12, color: "#6b7280" }}>
            Great job! You can review your answers using Previous/Next.
          </div>
          <div className="quiz-cta" style={{ justifyContent: "center" }}>
            <button className="btn btn-secondary" onClick={() => setShowSummary(false)}>Review Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Summarizer helpers ---------------- */
function stripHtmlToText(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("script, style").forEach((n) => n.remove());
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

function summarizeToBullets(text, maxBullets = 6) {
  if (!text) return [];
  const sentences = text.replace(/\n+/g, " ").match(/[^.!?。！？]*[.!?。！？]+|\S+$/g) || [];
  if (sentences.length <= maxBullets) return sentences.map((s) => condenseSentence(s));

  const stop = new Set(["the","a","an","and","or","but","if","on","in","to","for","of","by","with","as","is","are","was","were","be","been","being","that","this","it","at","from","into","than","then","so","such","its","their","there","these","those","about","over","under","between","also","you","your","we","our","i"]);
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).filter((w) => !stop.has(w));
  const freq = Object.create(null);
  tokens.forEach((w) => (freq[w] = (freq[w] || 0) + 1));

  const scored = sentences.map((s, i) => {
    const t = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    const score = t.reduce((acc, w) => acc + (freq[w] || 0), 0) / (t.length || 1);
    const posBonus = 1 + (i < 3 ? 0.12 : 0) + (s.length > 160 ? 0.04 : 0);
    return { s, score: score * posBonus, i };
  });

  const top = scored.sort((a, b) => b.score - a.score).slice(0, maxBullets).sort((a, b) => a.i - b.i).map((t) => condenseSentence(t.s));
  const seen = new Set();
  const bullets = [];
  for (const b of top) {
    const key = b.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seen.has(key)) {
      bullets.push(b);
      seen.add(key);
    }
  }
  return bullets;
}

function condenseSentence(s) {
  let out = s.replace(/\s*\([^)]*\)\s*/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  if (out.length > 140) {
    const cut = out.split(/[;–—,]/)[0];
    out = cut.length > 40 ? cut.trim() : out.slice(0, 140).trim();
  }
  out = out.replace(/[:;,.]?\s*$/, "");
  return out;
}

/* --------------- Chapter Viewer --------------- */
export default function ChapterViewer({ chapter, onEndVisible }) {
  const userId = localStorage.getItem("userId") || "guest";
  const ebookId = chapter?.ebookId || "unknown";
  // const { timeSpent, isCompleted } = useReadingTracker({ userId, ebookId, chapterId: chapter?.chapterId });

  const containerRef = useRef(null);

  // live selection chip
  const [selBox, setSelBox] = useState({ top: 0, left: 0, visible: false });
  const [selText, setSelText] = useState("");
  const [showSelChip, setShowSelChip] = useState(false);
  const persistedSel = useRef({ text: "", top: 0, left: 0 });

  // anchored popover
  const [anchorPanel, setAnchorPanel] = useState({ visible: false, mode: null, top: 0, left: 0 });

  // selection summary
  const [selBullets, setSelBullets] = useState([]);
  const [selSummarizing, setSelSummarizing] = useState(false);
  const [selError, setSelError] = useState("");

  // google preview
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState("");
  const [gSuggestions, setGSuggestions] = useState([]);

  // chapter summary
  const [showSummary, setShowSummary] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState([]);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummaryChoice, setShowSummaryChoice] = useState(false);

  // notes
  const [showNotes, setShowNotes] = useState(false);
  const [notesMode, setNotesMode] = useState(() => localStorage.getItem("notesMode") || ""); // '' | 'split' | 'overlay'
  const [showNotesChooser, setShowNotesChooser] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [overlayPos, setOverlayPos] = useState(() => {
    const saved = localStorage.getItem("notesOverlayPos");
    return saved ? JSON.parse(saved) : { top: 80, left: 60, width: 520, height: 520 };
  });
  const overlayRef = useRef(null);

  const endRef = useRef(null);
  const selTimer = useRef(null);

  // Info open map for InfoBoxes
  const [infoOpen, setInfoOpen] = useState({});
  const openInfo = (id) => setInfoOpen((s) => (s[id] ? s : { ...s, [id]: true }));
  const closeInfo = (id) => setInfoOpen((s) => ({ ...s, [id]: false }));

  useEffect(() => {
    if (!onEndVisible || !endRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const v = entries.some((e) => e.isIntersecting);
        onEndVisible(v);
      },
      { root: null, threshold: 0.1 }
    );
    obs.observe(endRef.current);
    return () => obs.disconnect();
  }, [onEndVisible]);

  useEffect(() => {
    // hide only the small chip on scroll/selection change; never auto-close anchored panel
    const hideChipOnly = () => {
      setSelBox((s) => ({ ...s, visible: false }));
      setShowSelChip(false);
    };

    const handleSelectionChange = () => {
      if (selTimer.current) clearTimeout(selTimer.current);
      selTimer.current = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection) return hideChipOnly();

        const txt = (selection.toString() || "").trim();
        if (!txt) return hideChipOnly();

        const root = containerRef.current;
        const anchorNode = selection.anchorNode;
        if (root && anchorNode) {
          const anchorEl = anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode;
          if (anchorEl && !root.contains(anchorEl)) return hideChipOnly();
        }

        const clipped = txt.length > 600 ? txt.slice(0, 600) + "…" : txt;

        let rect = getSelectionRectSafe(selection);
        if (!rect || (rect.width === 0 && rect.height === 0)) return hideChipOnly();

        const rawTop = rect.top + window.scrollY - 44;
        const rawLeft = rect.left + window.scrollX + Math.min(140, rect.width / 2);
        const vpW = document.documentElement.clientWidth;
        const left = clamp(rawLeft, 16, vpW - 16);
        const top = Math.max(8, rawTop);

        setSelText(clipped);
        setSelBox({ top, left, visible: true });
        setShowSelChip(true);
        persistedSel.current = { text: clipped, top, left };
      }, 60);
    };

    const onUp = () => setTimeout(handleSelectionChange, 0);
    const onKey = () => setTimeout(handleSelectionChange, 0);
    const onScroll = () => hideChipOnly();

    document.addEventListener("mouseup", onUp);
    document.addEventListener("keyup", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keyup", onKey);
      window.removeEventListener("scroll", onScroll);
      if (selTimer.current) clearTimeout(selTimer.current);
    };
  }, []);

  // notes shortcuts
  useEffect(() => {
    const isTyping = (el) => el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;
    const onKey = (e) => {
      if (!e.ctrlKey) return;
      const tgt = e.target;
      if (isTyping(tgt)) return;
      const key = (e.key || "").toLowerCase();
      if (key === "i") {
        e.preventDefault();
        if (!notesMode) setShowNotesChooser(true);
        setShowNotes(true);
      } else if (key === "m") {
        e.preventDefault();
        setShowNotes(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [notesMode]);

  useEffect(() => {
    if (notesMode) localStorage.setItem("notesMode", notesMode);
  }, [notesMode]);
  useEffect(() => {
    localStorage.setItem("notesOverlayPos", JSON.stringify(overlayPos));
  }, [overlayPos]);

  const startDrag = (e) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setDragging(true);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.preventDefault();
  };
  const onDrag = (e) => {
    if (!dragging) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const newLeft = clamp(e.clientX - dragOffset.x, 8, vw - 100);
    const newTop = clamp(e.clientY - dragOffset.y, 60, vh - 80);
    setOverlayPos((p) => ({ ...p, left: newLeft, top: newTop }));
  };
  const endDrag = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => onDrag(e);
    const mu = () => endDrag();
    document.addEventListener("mousemove", mm);
    document.addEventListener("mouseup", mu);
    return () => {
      document.removeEventListener("mousemove", mm);
      document.removeEventListener("mouseup", mu);
    };
  }, [dragging]);

  const openGooglePreview = async () => {
    const baseText = selText || persistedSel.current.text;
    const baseTop = selBox.top || persistedSel.current.top;
    const baseLeft = selBox.left || persistedSel.current.left;
    if (!baseText) return;

    setAnchorPanel({ visible: true, mode: "google", top: baseTop, left: baseLeft });
    setGLoading(true);
    setGError("");
    setGSuggestions([]);
    try {
      const suggestions = await getGoogleSuggestions(baseText);
      setGSuggestions(suggestions.slice(0, 6));
    } catch (e) {
      setGError("Select shorter text for better suggestions, or click 'More on Google'.");
    } finally {
      setGLoading(false);
    }
  };

  const openSelectionSummary = async () => {
    const baseText = selText || persistedSel.current.text;
    const baseTop = selBox.top || persistedSel.current.top;
    const baseLeft = selBox.left || persistedSel.current.left;
    if (!baseText) return;

    setAnchorPanel({ visible: true, mode: "summary", top: baseTop, left: baseLeft });
    setSelSummarizing(true);
    setSelError("");
    try {
      let bullets = [];
      try {
        bullets = await summarizeViaAPI(baseText, 5);
      } catch (e) {
        const msg = String(e?.message || "");
        const is5xx = /HTTP\s+5\d{2}/i.test(msg);
        if (is5xx) setSelError("Summarize API failed, showing offline summary.");
        bullets = summarizeToBullets(baseText, 5);
      }
      setSelBullets(bullets.length ? bullets : ["No content to summarize."]);
    } finally {
      setSelSummarizing(false);
    }
  };

  const bulletsFromAuthorSummary = (text) => {
    if (!text) return [];
    const normalized = String(text).replace(/\r/g, "").trim();
    const explicitLines = normalized.split("\n").map((s) => s.trim()).filter(Boolean);
    if (explicitLines.length >= 2) {
      return explicitLines.slice(0, 10).map((l) => l.replace(/^[-•\s]+/, "").trim());
    }
    return summarizeToBullets(normalized, 8);
  };

  const runAutoSummary = async () => {
    if (!chapter) return;
    setSummarizing(true);
    const texts = [];
    if (chapter.content) texts.push(stripHtmlToText(chapter.content));
    if (Array.isArray(chapter.blocks)) {
      for (const b of chapter.blocks) {
        const src = b.data || b;
        const type = String(b.type || src?.type || "").toLowerCase();
        if (type.includes("text") || type.includes("paragraph")) {
          const t = pick(src.html, src.content, src.text, b.content, b.text);
          if (t) texts.push(stripHtmlToText(t));
        } else if (type.includes("quiz")) {
          if (Array.isArray(src.questions)) {
            src.questions.forEach((q) => {
              const qt = pick(q.questionText, q.question, "");
              if (qt) texts.push(String(qt));
            });
          } else {
            const qt = pick(src.questionText, src.question, "");
            if (qt) texts.push(String(qt));
          }
        } else if (type.includes("image")) {
          const cap = pick(src.caption, "");
          if (cap) texts.push(String(cap));
        }
      }
    }
    const full = texts.join(" ").replace(/\s+/g, " ").trim();
    try {
      let bullets = [];
      try {
        bullets = await summarizeViaAPI(full, 6);
      } catch {
        bullets = summarizeToBullets(full, 6);
      }
      setSummaryBullets(bullets.length ? bullets : ["No content to summarize or API error."]);
    } finally {
      setShowSummary(true);
      setSummarizing(false);
    }
  };

  const runSummarize = async () => {
    if (chapter?.authorSummary && String(chapter.authorSummary).trim().length) {
      setShowSummaryChoice(true);
      return;
    }
    await runAutoSummary();
  };

  /* ---------- Render helpers ---------- */

  const isBoldMarked = (val) => typeof val === "string" && /^\s*\*\*(.*)\*\*\s*$/.test(val);
  const unwrapBold = (val) => {
    if (typeof val !== "string") return val ?? "";
    const m = /^\s*\*\*(.*)\*\*\s*$/.exec(val);
    return m ? m[1] : val;
  };

  // center markers [[C]]...[[/C]] — match the editor
  const isCenteredMarked = (val) => typeof val === "string" && /^\s*\[\[C\]\](.*)\[\[\/C\]\]\s*$/.test(val);
  const unwrapCenter = (val) => {
    if (typeof val !== "string") return val ?? "";
    const m = /^\s*\[\[C\]\](.*)\[\[\/C\]\]\s*$/.exec(val);
    return m ? m[1] : val;
  };

  const renderText = (block, key) => {
    const source = block.data || block;
    
    const html = pick(source.html, source.content, source.text, block.content, block.text);
    if (typeof html === "string" && /<.+>/.test(html)) {
      return <div key={key} className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <p key={key} className="text-gray-800 leading-relaxed">{html || ""}</p>;
  };

  const renderTable = (block, key) => {
    const src = block.data || block;
    const rows = Number.isFinite(src.rows) ? src.rows : 2;
    const cols = Number.isFinite(src.cols) ? src.cols : 2;
    const heading = typeof src.heading === "string" ? src.heading : (src.title || "");
    const cells = Array.isArray(src.cells) ? src.cells : [];
    const normalized = [];
    for (let r = 0; r < rows; r++) {
      const row = Array.isArray(cells[r]) ? cells[r].slice(0, cols) : [];
      while (row.length < cols) row.push("");
      normalized.push(row);
    }
    return (
      <div key={key} className="overflow-auto">
        {heading ? <div className="table-heading">{heading}</div> : null}
        <table className="student-table">
          <tbody>
            {normalized.map((row, r) => (
              <tr key={r}>
                {row.map((val, c) => {
                  const centered = isCenteredMarked(val);
                  let inner = centered ? unwrapCenter(val) : val;

                  const bold = isBoldMarked(inner);
                  const txt = unwrapBold(inner);

                  return (
                    <td key={c}>
                      <div
                        className="whitespace-pre-wrap text-sm"
                        style={{ fontWeight: bold ? 700 : 400, textAlign: centered ? "center" : "left" }}
                      >
                        {txt}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /**
   * InfoBox view
   * — Single primary button that toggles between "Read" and "Close".
   * — When open, the same button now closes the box. No separate close below.
   */
  const InfoBoxView = memo(function InfoBoxView({ id, title, info, open, onOpen, onClose }) {
    const toggle = (e) => {
      e.stopPropagation();
      if (open) onClose();
      else onOpen();
    };
    return (
      <div className="ibx-wrap">
        <div className="ibx-card">
          <div>
            <div className="ibx-title">{title || "Info"}</div>
            <div className="ibx-sub">{open ? "Reading…" : "Click to read more"}</div>
          </div>

        {/* SAME button; label & aria state change based on `open` */}
          <button
            className={`ibx-btn ${open ? "is-close" : ""}`}
            aria-expanded={open}
            aria-controls={`${id}-panel`}
            onClick={toggle}
          >
            {open ? "Close" : "Read"}
          </button>
        </div>

        {open && (
          <div
            id={`${id}-panel`}
            className="ibx-pop"
            role="region"
            aria-labelledby={`${id}-title`}
          >
            <div id={`${id}-title`} className="ibx-pop-title">
              {title || "Info"}
            </div>
            <div className="ibx-pop-body">
              {info || "No information provided."}
            </div>
            {/* ⛔ Removed extra bottom close button as requested */}
          </div>
        )}
      </div>
    );
  });

  const renderInfoBox = (block, key) => {
    const src = block.data || block;
    const title = pick(src.title, src.heading, "Info");
    const info = pick(src.info, "");
    const persistKey = String(src.id || block.id || src._id || `idx-${key}`);
    return (
      <InfoBoxView
        key={persistKey}
        id={persistKey}
        title={title}
        info={info}
        open={!!infoOpen[persistKey]}
        onOpen={() => openInfo(persistKey)}
        onClose={() => closeInfo(persistKey)}
      />
    );
  };

  const renderImage = (block, key) => {
    const source = block.data || block;
    const src = pick(source.url, source.src, source.s3Url);
    const caption = pick(source.caption, "");
    const alt = caption || "image";
    if (!src) return <div key={key} className="text-gray-400 italic">Image not found</div>;
    return (
      <figure key={key} className="flex flex-col items-center">
        <img src={src} alt={alt} className="rounded-md shadow-md max-w-full" loading="lazy" />
        {caption && <figcaption className="text-sm text-gray-500 mt-1">{caption}</figcaption>}
      </figure>
    );
  };

  const renderQuiz = (block, key) => {
    const quizList = normalizeQuizBlock(block);
    if (!Array.isArray(quizList) || quizList.length === 0) {
      console.warn("[QuizBlock Warning] Empty quiz block:", block);
      return <div key={key} className="text-gray-500 italic">⚠️ Quiz data incomplete or missing questions.</div>;
    }
    return <QuizCarousel key={key} questions={quizList} />;
  };

  const renderDivider = (key) => <hr key={key} className="student-divider" aria-label="Page divider" />;

  const renderBlock = (block, idx) => {
    const type = String(block.type || block.data?.type || "").toLowerCase();
    if (type.includes("divider") || type.includes("page-divider")) return renderDivider(idx);
    if (type.includes("quiz")) return renderQuiz(block, idx);
    if (type.includes("image")) return renderImage(block, idx);
    if (type.includes("table")) return renderTable(block, idx);
    if (type.includes("infobox")) return renderInfoBox(block, idx);
    if (type.includes("text") || type.includes("paragraph")) return renderText(block, idx);
    if (block.data?.cells) return renderTable(block, idx);
    if (block.data?.title && block.data?.info !== undefined) return renderInfoBox(block, idx);
    if (block.data?.question || block.data?.options) return renderQuiz(block, idx);
    if (block.data?.url) return renderImage(block, idx);
    if (block.data?.text || block.data?.content) return renderText(block, idx);
    return <div key={idx} className="text-gray-400 italic border p-3 rounded">Unknown block type: {block.type}</div>;
  };

  if (!chapter) {
    return <div className="p-6 text-gray-500">Select a chapter to begin reading.</div>;
  }

  return (
    <div className={`relative min-h-screen bg-white text-black ${showNotes && notesMode === "split" ? "notes-open" : ""}`} ref={containerRef}>
      {/* GLOBAL styles (single injection, no re-mount animations) */}
      <style>{`
        :root{ --brand:#4748ac; --ink:#0f172a; --muted:#6b7280; --ring:#c7d2fe; }
        .student-divider{border:none;height:1px;background:linear-gradient(90deg, rgba(0,0,0,.06), rgba(0,0,0,.18), rgba(0,0,0,.06));margin:18px 0}
        .table-heading{font-weight:800;color:#0f172a;font-size:1rem;margin:.25rem 0 .5rem 0}
        .student-table{border-collapse:collapse;width:100%;min-width:320px;background:#fff}
        .student-table td,.student-table th{border:1px solid #1f2937;padding:.5rem;vertical-align:top;min-width:80px}
        .student-table tr:nth-child(even) td{background:#fbfbff}

        .sum-btn{border:none;border-radius:12px;background:var(--brand);color:#fff;padding:10px 14px;font-weight:800;cursor:pointer}
        .sum-btn:hover{filter:brightness(1.04)}

        .sum-panel{border:1px solid #e5e7eb;background:#fff;border-radius:14px;box-shadow:0 12px 30px rgba(2,6,23,.08);padding:14px 16px;margin:14px 0 10px}
        .sum-title{font-weight:800;color:var(--ink);font-size:16px;margin-bottom:6px;letter-spacing:.2px}
        .sum-list{color:#374151;line-height:1.65;padding-left:1.1rem}
        .sum-list li{margin:6px 0}
        .sum-actions{display:flex;gap:8px;margin-top:10px}
        .sum-secondary{border:1px solid #e5e7eb;background:#fff;color:#111827;border-radius:10px;padding:8px 12px;font-weight:700;cursor:pointer}
        .sum-secondary:hover{filter:brightness(1.05)}

        .anchored-card{position:absolute;z-index:70;transform:translate(-50%, 8px);width:min(520px, 92vw);background:#fff;border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.14);border:1px solid #e5e7eb}
        .anchored-head{padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:8px}
        .anchored-title{font-weight:800;color:var(--ink);letter-spacing:.2px}
        .anchored-body{padding:12px;max-height:50vh;overflow:auto}
        .anchored-actions{padding:10px 12px;border-top:1px solid #e5e7eb;display:flex;gap:8px;justify-content:flex-end}
        .btn-close{border:1px solid #e5e7eb;background:#fff;color:#111827;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer}
        .btn-primary{border:none;background:var(--brand);color:#fff;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer}

        .reader-main{transition:margin-right .18s ease}
        .notes-open .reader-main{margin-right:min(560px, 42vw)}
        .notes-panel{position:fixed;top:48px;right:0;bottom:0;width:min(560px,42vw);background:#ffffff;border-left:1px solid #e5e7eb;box-shadow:-8px 0 28px rgba(2,6,23,.1);display:none;z-index:55}
        .notes-panel.visible{display:block}
        .notes-toolbar{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;cursor:default;user-select:none}
        .notes-title{font-weight:800;color:#0f172a;letter-spacing:.2px}
        .notes-actions{display:flex;gap:8px;align-items:center}
        .notes-btn{border:1px solid #e5e7eb;background:#fff;color:#111827;border-radius:10px;padding:6px 10px;font-weight:700;cursor:pointer}
        .notes-hint{position:fixed;right:2px;top:10px;z-index:60;font-size:12px;color:#6b7280;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px;box-shadow:0 10px 22px rgba(2,6,23,.08)}
        .notes-overlay{position:fixed;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 18px 36px rgba(2,6,23,.18);z-index:75;overflow:hidden}
        .notes-overlay .notes-toolbar{border-bottom:1px solid #e5e7eb;background:#f8fafc;cursor:move}
        .notes-overlay .notes-body{height:calc(100% - 44px);overflow:auto}
        .notes-chooser{position:fixed;right:16px;bottom:60px;z-index:80;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 18px 36px rgba(2,6,23,.14);padding:12px;width:260px}
        .notes-chooser h4{margin:0 0 8px;font-size:14px;font-weight:800;color:#0f172a}
        .chooser-actions{display:flex;gap:8px}
        .chooser-btn{flex:1;border:1px solid #e5e7eb;background:#fff;color:#111827;border-radius:10px;padding:8px 10px;font-weight:700;cursor:pointer}
        .chooser-btn.primary{border:none;background:var(--brand);color:#fff}

        /* InfoBox styles — LIGHTER */
        .ibx-wrap{--btn:#818cf8}
        .ibx-card{border:1px solid #e5e7eb;border-radius:14px;background:#f9fafb;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:10px}
        .ibx-title{font-weight:800;color:#334155;margin:0}
        .ibx-sub{font-size:13px;color:#94a3b8}
        .ibx-btn{appearance:none;border:none;border-radius:12px;padding:8px 12px;color:#fff;font-weight:800;cursor:pointer;background:var(--btn);box-shadow:0 6px 16px rgba(129,140,248,.25)}
        .ibx-btn.is-close{background:#475569}
        .ibx-pop{position:relative;margin-top:10px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;box-shadow:0 12px 28px rgba(2,6,23,.10);padding:12px}
        .ibx-pop-title{font-weight:800;color:#334155;margin:0 0 8px 0}
        .ibx-pop-body{white-space:pre-wrap;line-height:1.65;color:#475569}

        /* Selection chip clean */
        .sel-chip{position:absolute;z-index:60;transform:translate(-50%, -120%);background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border:1px solid #E7E9EE;border-radius:14px;padding:6px 8px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(16,24,40,.10),0 2px 8px rgba(16,24,40,.06)}
        .sel-chip__btn{appearance:none;border:1px solid #E7E9EE;border-radius:10px;padding:6px 10px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
        .sel-chip__btn--dark{background:#0B1220;color:#fff;border-color:#0B1220}
      `}</style>

      <div className="reader-main">
        <div className="p-6 pt-6 max-w-4xl mx-auto">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 className="text-2xl font-bold">{chapter.title}</h2>
            <button type="button" className="sum-btn" onClick={runSummarize} disabled={summarizing} title="Summarize this chapter">
              {summarizing ? "Summarizing…" : "Summarize chapter"}
            </button>
          </div>

          <hr />

          {showSummaryChoice && (
            <div className="sum-panel" role="dialog" aria-label="Choose summary type">
              <div className="sum-title">How would you like the summary?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="sum-secondary"
                  onClick={() => {
                    const bullets = bulletsFromAuthorSummary(chapter.authorSummary);
                    setSummaryBullets(bullets.length ? bullets : ["(No author summary provided.)"]);
                    setShowSummary(true);
                    setShowSummaryChoice(false);
                  }}
                  title="Show the author's own summary"
                >
                  Summary by Author
                </button>
                <button
                  className="sum-secondary"
                  onClick={async () => {
                    setShowSummaryChoice(false);
                    await runAutoSummary();
                  }}
                  title="Generate a short summary automatically"
                >
                  Short summary (By AI)
                </button>
                <button className="sum-secondary" onClick={() => setShowSummaryChoice(false)} title="Cancel">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showNotes && (
            <div className="notes-hint" aria-hidden>
              Press <strong>Ctrl+I</strong> to open Notes
            </div>
          )}

          {showNotes && notesMode === "split" && (
            <div className="notes-panel visible" aria-hidden={false}>
              <div className="notes-toolbar">
                <div className="notes-title">My Notes</div>
                <div className="notes-actions">
                  <button className="notes-btn" onClick={() => setNotesMode("overlay")} title="Switch to overlay (floating)">
                    Switch to Overlay
                  </button>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Ctrl+M to close</span>
                  <button className="notes-btn" onClick={() => setShowNotes(false)} title="Close notes (Ctrl+M)">Close</button>
                </div>
              </div>
              <NotesPad userId={userId} ebookId={ebookId} />
            </div>
          )}

          {showSummary && (
            <div className="sum-panel" role="region" aria-label="Chapter summary">
              <div className="sum-title">Key points</div>
              <ul className="sum-list">
                {summaryBullets.map((b, i) => (<li key={i}>• {b}</li>))}
              </ul>
              <div className="sum-actions">
                <button className="sum-secondary" onClick={() => setShowSummary(false)}>Close</button>
                <button
                  className="sum-secondary"
                  onClick={() => {
                    const text = summaryBullets.map((b) => `• ${b}`).join("\n");
                    navigator.clipboard?.writeText(text).catch(() => {});
                  }}
                  title="Copy summary"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {chapter.content && (
            <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: chapter.content }} />
          )}

          {Array.isArray(chapter.blocks) && chapter.blocks.length > 0 ? (
            <div className="space-y-6">
              {chapter.blocks.map((block, idx) => renderBlock(block, idx))}
            </div>
          ) : (
            !chapter.content && <div className="text-gray-400 italic">No content in this chapter.</div>
          )}

          <div ref={endRef} style={{ height: 1, marginTop: 24 }} />
        </div>
      </div>

      {/* Selection chip (no pulse animation) */}
      {selBox.visible && (selText || persistedSel.current.text) && (
        <div
          id="sel-chip"
          className="sel-chip"
          style={{ top: selBox.top || persistedSel.current.top, left: selBox.left || persistedSel.current.left }}
          onMouseDown={(e) => e.preventDefault()}
          role="toolbar"
          aria-label="Selection actions"
        >
          <button className="sel-chip__btn" onClick={openGooglePreview} title="Search selected text in Google">
            <span aria-hidden style={{ width: 18, height: 18, display: "inline-grid", placeItems: "center", borderRadius: 8, background: "#EEF1FF", color: "#3451FF", fontSize: 11, fontWeight: 900 }}>
              🔎
            </span>
            Google
          </button>
          <div aria-hidden style={{ width: 1, height: 20, background: "linear-gradient(180deg, transparent, #E7E9EE 20%, #E7E9EE 80%, transparent)" }} />
          <button className="sel-chip__btn sel-chip__btn--dark" onClick={openSelectionSummary} title="Summarize selected text">
            <span aria-hidden style={{ width: 18, height: 18, display: "inline-grid", placeItems: "center", borderRadius: 8, background: "#1E293B", color: "#FFD84D", fontSize: 11, fontWeight: 900 }}>
              ✨
            </span>
            Points
          </button>
        </div>
      )}

      {/* Anchored panel (no entrance animation) */}
      {anchorPanel.visible && (
        <div
          id="anchored-card"
          className="anchored-card"
          style={{ top: anchorPanel.top, left: anchorPanel.left }}
          role="dialog"
          aria-modal="false"
          aria-label={anchorPanel.mode === "summary" ? "Summary of selection" : "Google preview"}
        >
          <div className="anchored-head">
            <div className="anchored-title" title={anchorPanel.mode === "summary" ? "Summary of selection" : "Google preview"}>
              {anchorPanel.mode === "summary" ? "Summary of selection" : "Google preview"}
            </div>
            <button className="btn-close" onClick={() => setAnchorPanel({ visible: false, mode: null, top: 0, left: 0 })} title="Close">
              ×
            </button>
          </div>

          <div className="anchored-body" style={{ lineHeight: 1.6 }}>
            {anchorPanel.mode === "summary" && (
              <>
                {selSummarizing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#475569", fontSize: 13, padding: "10px 0" }}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(59,130,246,.35)", borderTopColor: "#3B82F6", display: "inline-block" }} />
                    Summarizing…
                  </div>
                ) : (
                  <>
                    {!!selError && (
                      <div style={{ color: "#b91c1c", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 12, padding: "8px 10px", marginBottom: 10 }}>
                        {selError}
                      </div>
                    )}
                    <ul style={{ margin: 0, padding: "0 0 0 1.1rem", listStyle: "disc", color: "#0B1220" }}>
                      {selBullets.map((b, i) => (
                        <li key={i} style={{ margin: "6px 0", padding: "2px 0", fontSize: 14 }}>{b}</li>
                      ))}
                      {!selBullets?.length && <li style={{ color: "#64748B", fontSize: 13 }}>No points.</li>}
                    </ul>
                  </>
                )}
              </>
            )}

            {anchorPanel.mode === "google" && (
              <>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                  Showing Google suggestions for: <strong>{(selText || persistedSel.current.text || "").slice(0, 80)}</strong>
                </div>

                {gLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#475569", fontSize: 13, padding: "10px 0" }}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(59,130,246,.35)", borderTopColor: "#3B82F6", display: "inline-block" }} />
                    Loading suggestions…
                  </div>
                )}

                {!!gError && (
                  <div style={{ color: "#b91c1c", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 12, padding: "8px 10px", marginBottom: 10 }}>
                    {gError}
                  </div>
                )}

                {!gLoading && !gError && (
                  <ul style={{ paddingLeft: "1.1rem", lineHeight: 1.6, margin: 0 }}>
                    {gSuggestions.length ? (
                      gSuggestions.map((s, i) => {
                        const link = `https://www.google.com/search?q=${encodeURIComponent(s)}`;
                        return (
                          <li key={i} style={{ margin: "6px 0", padding: "2px 0" }}>
                            <a href={link} target="_blank" rel="noreferrer" style={{ color: "#1D4ED8", textDecoration: "none", fontWeight: 600 }}>
                              {s}
                            </a>
                          </li>
                        );
                      })
                    ) : (
                      <li style={{ color: "#64748B", fontSize: 13 }}>No suggestions.</li>
                    )}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="anchored-actions">
            {anchorPanel.mode === "summary" && (
              <button
                className="btn-primary"
                onClick={() => {
                  const text = selBullets.map((b) => `• ${b}`).join("\n");
                  navigator.clipboard?.writeText(text).catch(() => {});
                }}
              >
                Copy
              </button>
            )}
            {anchorPanel.mode === "google" && (
              <a
                className="btn-primary"
                href={`https://www.google.com/search?q=${encodeURIComponent(selText || persistedSel.current.text || "")}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
              >
                More on Google →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Overlay notes */}
      {showNotes && notesMode === "overlay" && (
        <div
          ref={overlayRef}
          className="notes-overlay"
          style={{ top: overlayPos.top, left: overlayPos.left, width: overlayPos.width, height: overlayPos.height }}
        >
          <div className="notes-toolbar" onMouseDown={startDrag} title="Drag to move">
            <div className="notes-title">My Notes (Floating)</div>
            <div className="notes-actions" style={{ cursor: "default" }}>
              <button className="notes-btn" onClick={() => setNotesMode("split")} title="Switch to split (right panel)">Switch to Split</button>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Ctrl+M to close</span>
              <button className="notes-btn" onClick={() => setShowNotes(false)} title="Close notes (Ctrl+M)">Close</button>
            </div>
          </div>
          <div className="notes-body">
            <NotesPad userId={userId} ebookId={ebookId} />
          </div>
        </div>
      )}

      {/* Mode chooser */}
      {showNotes && showNotesChooser && !notesMode && (
        <div className="notes-chooser" role="dialog" aria-label="Choose notes layout">
          <h4>How do you want to show Notes?</h4>
          <div className="chooser-actions">
            <button className="chooser-btn" onClick={() => { setNotesMode("overlay"); setShowNotesChooser(false); }}>Overlay (Floating)</button>
            <button className="chooser-btn primary" onClick={() => { setNotesMode("split"); setShowNotesChooser(false); }}>Split Screen (Right)</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            You can switch modes later from the Notes toolbar.
          </div>
        </div>
      )}

      {/* Scroll-to-top on chapter change */}
      <ScrollToTopOnChapterChange
        chapter={chapter}
        containerRef={containerRef}
        clearUI={() => {
          setSelBox((s) => ({ ...s, visible: false }));
          setShowSelChip(false);
          setAnchorPanel({ visible: false, mode: null, top: 0, left: 0 });
        }}
      />
    </div>
  );
}

/* helper */
function ScrollToTopOnChapterChange({ chapter, containerRef, clearUI }) {
  const prevIdRef = useRef(null);
  useEffect(() => {
    const currentId = chapter?.chapterId ?? chapter?.id ?? chapter?.slug ?? chapter?.title ?? "__unknown__";
    if (prevIdRef.current !== currentId) {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { window.scrollTo(0, 0); }
      const el = containerRef?.current;
      if (el && typeof el.scrollTo === "function") { try { el.scrollTo({ top: 0, behavior: "smooth" }); } catch { el.scrollTop = 0; } }
      clearUI?.();
      prevIdRef.current = currentId;
    }
  }, [chapter, containerRef, clearUI]);
  return null;
}
