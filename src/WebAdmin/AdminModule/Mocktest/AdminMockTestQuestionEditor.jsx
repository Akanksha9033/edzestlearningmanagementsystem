import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../../../LoginSystem/axios";



import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Stack,
  Chip,
  Divider,
  MenuItem,
  Paper,
  RadioGroup,
  Radio,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Delete,
  Save,
  ContentCopy,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { Checkbox } from "@mui/material";
import { useAuth } from "../../../LoginSystem/context/AuthContext"; // ← use auth context

const DEBOUNCE_MS = 1000;

// ⭐ Dropdown options for new fields
const TASK_OPTIONS = [
  "Initiate project",
  "Plan project",
  "Manage stakeholders",
  "Monitor work",
  "Control risks",
  "Close project",
];

const APPROACH_OPTIONS = [
  "Predictive",
  "Agile",
  "Hybrid",
];

const DOMAIN_OPTIONS = [
  "People",
  "Process",
  "Business Environment",
];


const prettyType = (t) => {
  if (!t) return "Question";
  const s = String(t).replace(/_/g, " ").trim();
  return s.replace(
    /\w\S*/g,
    (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()
  );
};

export default function AdminMockTestQuestionEditor() {
  const { mockTestId } = useParams();
  const navigate = useNavigate();

  // const [searchParams] = useSearchParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { ready, user } = useAuth(); // ← wait for auth bootstrap

  const [outline, setOutline] = useState([]); // [{i,id,title,options}]
  const [summary, setSummary] = useState({ totalQuestions: 0, totalMarks: 0 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [question, setQuestion] = useState(null); // single question object
  const [loading, setLoading] = useState(true);
  const [qLoading, setQLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [filterText, setFilterText] = useState("");

  // dynamic difficulties (unique, trimmed, non-empty)
  const [difficultyOptions, setDifficultyOptions] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);
const [approachOptions, setApproachOptions] = useState([]);
const [domainOptions, setDomainOptions] = useState([]);
const [sections, setSections] = useState([]);
// ⭐ toggle for question navigator
const [showNavigator, setShowNavigator] = useState(false);


// ⭐ derive current section from activeIndex
const currentSection = useMemo(() => {
  if (!sections.length) return null;

  return sections.find((sec) => {
    const start = (sec.startSerial ?? 1) - 1;
    const end = start + (sec.count ?? 0);
    return activeIndex >= start && activeIndex < end;
  });
}, [sections, activeIndex]);


  const saveTimer = useRef(null);

  // computed flag per render
  const isMulti = /multi_choice/i.test(question?.questionType || "");

  // NEW: whenever ?idx= changes, move the cursor
  useEffect(() => {
    const raw = searchParams.get("idx");
    const n = Number.parseInt(raw ?? "", 10);
    if (!Number.isNaN(n) && n >= 0) {
      setActiveIndex(n);
    } else {
      setActiveIndex(0);
    }
  }, [searchParams]);

  function toggleCorrect(zeroBasedIndex) {
  const curr = Array.isArray(question?.correct)
    ? [...question.correct]
    : [];
  const i = curr.indexOf(zeroBasedIndex);
  if (i >= 0) curr.splice(i, 1);
  else curr.push(zeroBasedIndex);
  curr.sort((a, b) => a - b);
  patch({ correct: curr });
}


  // ⭐ Load sections for jump buttons
useEffect(() => {
  if (!ready || !mockTestId) return;

  (async () => {
    try {
      const res = await API.get(
        `/api/admin/mocktests/${mockTestId}/sections`
      );
      setSections(Array.isArray(res.data?.sections) ? res.data.sections : []);
    } catch (e) {
      console.error("Failed to load sections", e);
    }
  })();
}, [ready, mockTestId]);

  // load outline (lightweight)
  useEffect(() => {
    // ← guard: need auth ready + mockTestId
    if (!ready || !mockTestId) return;
    (async () => {
      try {
        const r = await API.get(
          `/api/admin/mocktests/fetch/${mockTestId}/questions/outline`
        );
        setOutline(r.data?.outline || []);
        setSummary(r.data?.summary || {});
        // pick idx from query string if provided
        const raw = searchParams.get("idx");
        const wanted = Number.isInteger(parseInt(raw, 10))
          ? Math.max(0, parseInt(raw, 10))
          : 0;
        setActiveIndex(wanted);
      } catch (e) {
        console.error("outline failed:", e);
        alert("❌ Unable to load questions");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, mockTestId]);

  // after outline: fetch the full questions blob once to derive all difficulties
  useEffect(() => {
    if (!ready || loading || !mockTestId) return; // ← guard auth/route
    (async () => {
      try {
        const r = await API.get(
          `/api/admin/mocktests/fetch/${mockTestId}/questions`
        );
        const rows = Array.isArray(r.data?.rows) ? r.data.rows : [];
        const uniq = Array.from(
          new Set(
            rows
              .map((q) => (q?.difficulty ?? "").toString().trim())
              .filter(Boolean)
          )
        );
        if (uniq.length) setDifficultyOptions(uniq);

        // ⭐ NEW: Task options
const uniqTask = Array.from(
  new Set(
    rows
      .map((q) => (q?.task ?? "").toString().trim())
      .filter(Boolean)
  )
);
setTaskOptions(uniqTask);

// ⭐ NEW: Approach options
const uniqApproach = Array.from(
  new Set(
    rows
      .map((q) => (q?.approach ?? "").toString().trim())
      .filter(Boolean)
  )
);
setApproachOptions(uniqApproach);

// ⭐ NEW: Domain options
const uniqDomain = Array.from(
  new Set(
    rows
      .map((q) => (q?.domain ?? "").toString().trim())
      .filter(Boolean)
  )
);
setDomainOptions(uniqDomain);

      } catch (e) {
        // non-fatal
      }
    })();
  }, [ready, loading, mockTestId]);

  // load a single question whenever index changes
  useEffect(() => {
    if (!ready || loading || !mockTestId) return; // ← guard auth/route
    if (outline.length === 0) {
      setQuestion(null);
      return;
    }
    (async () => {
      try {
        setQLoading(true);
        const r = await API.get(
          `/api/admin/mocktests/fetch/${mockTestId}/questions/${activeIndex}`
        );
        const q = normalize(r.data?.question || {});
        setQuestion(q);
        setSummary(r.data?.summary || {});
        setDirty(false);

        // lazily merge difficulty into options
        const d = (q.difficulty ?? "").toString().trim();
        if (d)
          setDifficultyOptions((prev) =>
            prev.includes(d) ? prev : [...prev, d]
          );
      } catch (e) {
        console.error("load question failed:", e);
        alert("❌ Failed to load question");
      } finally {
        setQLoading(false);
      }
    })();
  }, [ready, activeIndex, outline.length, loading, mockTestId]);

  // cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    }; // ← cleanup
  }, []);

  // guard on unload
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const filtered = useMemo(() => {
    const s = (filterText || "").toLowerCase();
    if (!s) return outline;
    return outline.filter((o) => {
      const t = (o.title || "").toLowerCase();
      const opts = (o.options || []).join(" ").toLowerCase();
      return t.includes(s) || opts.includes(s);
    });
  }, [outline, filterText]);

  function normalize(q) {
  return {
    id: q.id || `q_${Date.now()}`,
    instruction: q.instruction || "",
    question: q.question || q.text || q.Question || "",
    questionType: q.questionType || q.QuestionType || "Single_Choice",
    options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
    answer: Number.isInteger(q.answer) ? q.answer : null,
    correct: Array.isArray(q.correct) ? q.correct.slice() : [],
    explanation: q.explanation || "",

    // ⭐ NEW FIELDS FROM BACKEND / EXCEL
    task: q.task || "",
    approach: q.approach || "",
    domain: q.domain || "",

    tags: Array.isArray(q.tags)
      ? q.tags
      : typeof q.tags === "string"
      ? q.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    section: q.section || q.Section || "",
    difficulty: (q.difficulty ?? q.Difficulty ?? q.level ?? q.Level ?? "")
      .toString()
      .trim(),
    marks: typeof q.marks === "number" ? q.marks : 1,
  };
}


  const patch = (p) => {
    setQuestion((prev) => ({ ...prev, ...p }));
    setDirty(true);
    scheduleAutosave();
  };

  const updateOption = (idx, val) => {
    const opts = [...(question?.options || [])];
    opts[idx] = val;
    patch({ options: opts });
  };
  const addOption = () =>
    patch({ options: [...(question?.options || []), ""] });

  const removeOption = (idx) => {
    const opts = (question?.options || []).filter((_, i) => i !== idx);

    let ans = question?.answer;
    if (Number.isInteger(ans)) {
      if (ans === idx) ans = null;
      else if (idx < ans) ans = ans - 1;
    }

    let corr = Array.isArray(question?.correct) ? [...question.correct] : [];

// MULTI: remove & shift 0-based
corr = corr
  .filter((i) => i !== idx)
  .map((i) => (i > idx ? i - 1 : i));

// SINGLE: backend will derive correct from answer
if (!isMulti) {
  corr = [];
}

patch({ options: opts, answer: ans, correct: corr });
  }

  const scheduleAutosave = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveOne(true), DEBOUNCE_MS);
  };

  async function saveOne(silent = false) {
    try {
      if (!question) return;
      setSaving(true);

      const payload = { ...question };
     if (isMulti) {
  payload.answer = null;
  payload.correct = Array.isArray(question.correct)
    ? [...new Set(question.correct.map(Number))]
    : [];
} else {
  // SINGLE CHOICE
  payload.answer = Number.isInteger(question.answer)
    ? question.answer
    : null;

  // ❌ DO NOT send payload.correct for single choice
  delete payload.correct;
}


      const r = await API.patch(
        `/api/admin/mocktests/update-mock/${mockTestId}/questions/${activeIndex}`,
        payload
      );
      setSummary(r.data?.summary || {});
      setDirty(false);

      // refresh outline title for this row
      setOutline((prev) => {
        const next = [...prev];
        if (next[activeIndex])
          next[activeIndex] = {
            ...next[activeIndex],
            title: (question.question || "").slice(0, 140),
            options: question.options?.slice(0, 4) || [],
          };
        return next;
      });

      // ensure difficulty options contains the saved value
      const d = (question.difficulty ?? "").toString().trim();
      if (d)
        setDifficultyOptions((prev) =>
          prev.includes(d) ? prev : [...prev, d]
        );

      if (!silent) alert("✅ Saved");
    } catch (e) {
      console.error("save failed:", e);
      if (!silent) alert("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function createNew(after = true) {
    try {
      const body = {
        question: normalize({}),
        at: after ? activeIndex + 1 : activeIndex,
      };
      const r = await API.post(
        `/api/admin/mocktests/update-mock/${mockTestId}/questions`,
        body
      );
      const ol = await API.get(
        `/api/admin/mocktests/fetch/${mockTestId}/questions/outline`
      );
      setOutline(ol.data?.outline || []);
      setSummary(ol.data?.summary || {});
      setActiveIndex(r.data?.index ?? (after ? activeIndex + 1 : activeIndex));
    } catch (e) {
      console.error("create failed:", e);
      alert("❌ Failed to add question");
    }
  }

  async function duplicateCurrent() {
    try {
      if (!question) return;
      const body = {
        question: { ...question, id: `q_${Date.now()}` },
        at: activeIndex + 1,
      };
      const r = await API.post(
        `/api/admin/mocktests/update-mock/${mockTestId}/questions`,
        body
      );
      const ol = await API.get(
        `/api/admin/mocktests/fetch/${mockTestId}/questions/outline`
      );
      setOutline(ol.data?.outline || []);
      setSummary(ol.data?.summary || {});
      setActiveIndex(r.data?.index ?? activeIndex + 1);
    } catch (e) {
      console.error("duplicate failed:", e);
      alert("❌ Failed to duplicate");
    }
  }

  async function deleteCurrent() {
    if (!outline.length) return;
    if (!window.confirm("Delete this question?")) return;
    try {
      await API.delete(
        `/api/admin/mocktests/update-mock/${mockTestId}/questions/${activeIndex}`
      );
      const ol = await API.get(
        `/api/admin/mocktests/fetch/${mockTestId}/questions/outline`
      );
      setOutline(ol.data?.outline || []);
      setSummary(ol.data?.summary || {});
      setActiveIndex((i) => Math.max(0, i - 1));
      setQuestion(null);
    } catch (e) {
      console.error("delete failed:", e);
      alert("❌ Failed to delete");
    }
  }

  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(outline.length - 1, i + 1));
  // ⭐ question indices for current section (0-based)
const sectionQuestionIndices = useMemo(() => {
  if (!currentSection) return [];

  const start = (currentSection.startSerial ?? 1) - 1;
  const count = currentSection.count ?? 0;

  return Array.from({ length: count }, (_, i) => start + i);
}, [currentSection]);

  // ⭐ Jump to section start question
function goToSection(secIndex) {
  if (!sections[secIndex]) return;

  const start = Math.max(
    0,
    (sections[secIndex].startSerial ?? 1) - 1
  );

  navigate(
    `/admin/mocktests/editor/${mockTestId}/questions?idx=${start}`
  );
}


  if (!ready) {
    // ← wait for auth bootstrap
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
        <Typography mt={2}>Preparing your session…</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
        <Typography mt={2}>Loading questions…</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth="1100px" mx="auto" mt={3} mb={6}>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        📝 Question Editor
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {outline.length
          ? `${activeIndex + 1}/${outline.length} Questions • ${
              summary?.totalMarks ?? ""
            } Marks`
          : "No questions"}
        {dirty ? " • unsaved" : ""}
      </Typography>
      {/* ⭐ SECTION JUMP BUTTONS */}
{sections.length > 0 && (
  <Stack
    direction="row"
    spacing={1}
    sx={{ mb: 2, flexWrap: "wrap" }}
  >
    {sections.map((sec, idx) => (
      <Button
        key={idx}
        variant="outlined"
        sx={{
          textTransform: "none",
          borderColor:
            activeIndex >= ((sec.startSerial ?? 1) - 1) &&
            activeIndex <
              (((sec.startSerial ?? 1) - 1) + (sec.count ?? 0))
              ? "#1976d2"
              : "rgba(0,0,0,0.23)",
        }}
        onClick={() => goToSection(idx)}
      >
        {sec.name || `Section ${idx + 1}`}
      </Button>
    ))}
  </Stack>
)}


      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", md: "center" }}
        
        mb={1}
      >

        <Button
  variant="outlined"
  startIcon={<ArrowBack />}
  onClick={() => navigate(`/admin/mocktests/editor/${mockTestId}/sections`)}
>
  Back
</Button>

        <TextField
          fullWidth
          size="small"
          placeholder="Search (question / options)"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Previous">
            <span>
              <IconButton onClick={prev} disabled={activeIndex === 0}>
                <ArrowBack />
              </IconButton>
            </span>
          </Tooltip>
          <Button
  variant={showNavigator ? "contained" : "outlined"}
  onClick={() => setShowNavigator((v) => !v)}
  sx={{
    textTransform: "none",
    borderRadius: "10px",
    fontWeight: 700,
  }}
>
  🧭 Navigator
</Button>

          <Tooltip title="Next">
            <span>
              <IconButton
                onClick={next}
                disabled={activeIndex >= outline.length - 1}
              >
                <ArrowForward />
              </IconButton>
            </span>
          </Tooltip>
          {/* <Button variant="outlined" startIcon={<ContentCopy />} onClick={duplicateCurrent}>Duplicate</Button> */}
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={deleteCurrent}
          >
            Delete
          </Button>
          {/* <Button variant="contained" style={{ backgroundColor: "#4748ac" }} startIcon={<Add />} onClick={() => createNew(true)}>New Question</Button> */}
          <Button
            variant="contained"
            color="success"
            startIcon={<Save />}
            onClick={() => saveOne(false)}
            disabled={saving || !question}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </Stack>

      {/* Editor */}
      {qLoading ? (
        <Box textAlign="center" my={4}>
          <CircularProgress />
        </Box>
      ) : question ? (
        <Paper sx={{ p: 2 }}>

          {/* ⭐ SECTION QUESTION NAVIGATOR */}
{/* ⭐ SECTION QUESTION NAVIGATOR (STICKY & POLISHED) */}
{showNavigator && currentSection && sectionQuestionIndices.length > 0 && (

  <Box
    sx={{
      position: "sticky",
      top: 92, // navbar + page header ke niche
      zIndex: 10,

      display: "flex",
      flexWrap: "wrap",
      gap: 1,

      mb: 2,
      p: 1.5,

      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(6px)",
      borderRadius: "12px",

      border: "1px solid #e5e7eb",
      boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    }}
  >

    {sectionQuestionIndices.map((qIdx, i) => (
      <Button
  key={qIdx}
  size="small"
  onClick={() => setSearchParams({ idx: qIdx })}
  sx={{
    minWidth: 38,
    height: 38,
    fontWeight: 700,
    borderRadius: "10px",
    transition: "all 0.15s ease",

    ...(qIdx === activeIndex
      ? {
          background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
          color: "#fff",
          boxShadow: "0 4px 10px rgba(37,99,235,0.35)",
        }
      : {
          backgroundColor: "#f8fafc",
          border: "1px solid #c7d2fe",
          color: "#1e3a8a",
          "&:hover": {
            backgroundColor: "#eef2ff",
          },
        }),
  }}
>
  {i + 1}
</Button>

    ))}
  </Box>
)}

          <Typography variant="subtitle1" fontWeight="bold" mb={3}>
            {prettyType(question?.questionType)}
          </Typography>

          <TextField
            label="Question*"
            fullWidth
            multiline
            minRows={3}
            value={question.question}
            onChange={(e) => patch({ question: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Typography fontWeight="600" mb={1}>
            Options*
          </Typography>
          {isMulti ? (
            <>
              {(question.options || []).map((opt, idx) => {
                const oneBased = idx + 1;
                const checked =
                  Array.isArray(question.correct) &&
  question.correct.includes(idx); // ✅ 0-based
                return (
                  <Stack
                    key={idx}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Checkbox
                      checked={!!checked}
                      onChange={() => toggleCorrect(idx)}
                    />
                    <TextField
                      fullWidth
                      label={`${String.fromCharCode(65 + idx)}.`}
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                    />
                    <IconButton color="error" onClick={() => removeOption(idx)}>
                      <Delete />
                    </IconButton>
                  </Stack>
                );
              })}
            </>
          ) : (
            <RadioGroup
              value={Number.isInteger(question.answer) ? question.answer : -1}
              onChange={(e) => patch({ answer: Number(e.target.value) })}
            >
              {(question.options || []).map((opt, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel
                    value={idx}
                    control={<Radio />}
                    label=""
                    sx={{ mr: 0 }}
                  />
                  <TextField
                    fullWidth
                    label={`${String.fromCharCode(65 + idx)}.`}
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                  />
                  <IconButton color="error" onClick={() => removeOption(idx)}>
                    <Delete />
                  </IconButton>
                </Stack>
              ))}
            </RadioGroup>
          )}
          <Button startIcon={<Add />} onClick={addOption} sx={{ mb: 2 }}>
            Add choice
          </Button>

          <TextField
            label="Explanation"
            fullWidth
            multiline
            minRows={2}
            value={question.explanation}
            onChange={(e) => patch({ explanation: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />
       
{/* ⭐ New row for Task / Approach / Domain (dropdowns) */}
{/* ⭐ New row for Task / Approach / Domain (Dynamic dropdown) */}
<Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  sx={{ mb: 2 }}
>
  {/* TASK */}
  <TextField
    select
    fullWidth
    label="Task"
    value={question.task || ""}
    onChange={(e) => patch({ task: e.target.value })}
  >
    <MenuItem value="">(None)</MenuItem>
    {taskOptions.map((t) => (
      <MenuItem key={t} value={t}>
        {t}
      </MenuItem>
    ))}
  </TextField>

  {/* APPROACH */}
  <TextField
    select
    fullWidth
    label="Approach"
    value={question.approach || ""}
    onChange={(e) => patch({ approach: e.target.value })}
  >
    <MenuItem value="">(None)</MenuItem>
    {approachOptions.map((a) => (
      <MenuItem key={a} value={a}>
        {a}
      </MenuItem>
    ))}
  </TextField>

  {/* DOMAIN */}
  <TextField
    select
    fullWidth
    label="Domain"
    value={question.domain || ""}
    onChange={(e) => patch({ domain: e.target.value })}
  >
    <MenuItem value="">(None)</MenuItem>
    {domainOptions.map((d) => (
      <MenuItem key={d} value={d}>
        {d}
      </MenuItem>
    ))}
  </TextField>
</Stack>




          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Section"
              fullWidth
              value={question.section}
              onChange={(e) => patch({ section: e.target.value })}
            />
            <TextField
              select
              fullWidth
              label="Difficulty"
              value={question.difficulty}
              onChange={(e) => patch({ difficulty: e.target.value })}
            >
              <MenuItem value="">(None)</MenuItem>
              {difficultyOptions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Marks"
              type="number"
              fullWidth
              value={question.marks}
              onChange={(e) => patch({ marks: Number(e.target.value || 1) })}
            />
          </Stack>

          <Typography fontWeight="600" mb={1}>
            Tags
          </Typography>
          <TagEditor
            value={Array.isArray(question.tags) ? question.tags : []}
            onAdd={(t) => patch({ tags: [...(question.tags || []), t] })}
            onDelete={(t) =>
              patch({ tags: (question.tags || []).filter((x) => x !== t) })
            }
          />
        </Paper>
      ) : (
        <Typography color="text.secondary">
          Select a question to edit.
        </Typography>
      )}
    </Box>
  );
}

function TagEditor({ value, onAdd, onDelete }) {
  const [input, setInput] = useState("");
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small"
          label="Add tag"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const t = input.trim();
              if (t) onAdd(t);
              setInput("");
            }
          }}
        />
        <Button
          variant="outlined"
          onClick={() => {
            const t = input.trim();
            if (t) onAdd(t);
            setInput("");
          }}
        >
          Add
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {value.map((t) => (
          <Chip key={t} label={t} onDelete={() => onDelete(t)} />
        ))}
      </Stack>
    </Box>
  );
}



// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useParams, useSearchParams } from "react-router-dom";
// import API from "../../../LoginSystem/axios";



// import {
//   Box,
//   Typography,
//   CircularProgress,
//   TextField,
//   Button,
//   List,
//   ListItemButton,
//   ListItemText,
//   IconButton,
//   Stack,
//   Chip,
//   Divider,
//   MenuItem,
//   Paper,
//   RadioGroup,
//   Radio,
//   FormControlLabel,
//   Tooltip,
// } from "@mui/material";
// import {
//   Add,
//   Delete,
//   Save,
//   ContentCopy,
//   ArrowBack,
//   ArrowForward,
// } from "@mui/icons-material";
// import { Checkbox } from "@mui/material";
// import { useAuth } from "../../../LoginSystem/context/AuthContext"; // ← use auth context

// const DEBOUNCE_MS = 1000;

// // ⭐ Dropdown options for new fields
// const TASK_OPTIONS = [
//   "Initiate project",
//   "Plan project",
//   "Manage stakeholders",
//   "Monitor work",
//   "Control risks",
//   "Close project",
// ];

// const APPROACH_OPTIONS = [
//   "Predictive",
//   "Agile",
//   "Hybrid",
// ];

// const DOMAIN_OPTIONS = [
//   "People",
//   "Process",
//   "Business Environment",
// ];

// // ✅ Excel multi-choice correct ko 0-based banane ke liye
// function normalizeMultiCorrect(v) {
//   if (!Array.isArray(v)) return [];

//   const nums = v
//     .map((x) => Number(x))
//     .filter((n) => Number.isFinite(n));

//   // Excel: 1=A, 2=B, 3=C
//   // UI:    0=A, 1=B, 2=C
//   const looksOneBased = nums.length && nums.every((n) => n >= 1);

//   return looksOneBased
//     ? nums.map((n) => n - 1)
//     : nums;
// }

// const prettyType = (t) => {

//   // ✅ Excel multi-choice correct ko 0-based banane ke liy
//   if (!t) return "Question";
//   const s = String(t).replace(/_/g, " ").trim();
//   return s.replace(
//     /\w\S*/g,
//     (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()
//   );
// };

// export default function AdminMockTestQuestionEditor() {
//   const { mockTestId } = useParams();
//   const navigate = useNavigate();

//   const [searchParams] = useSearchParams();
//   const { ready, user } = useAuth(); // ← wait for auth bootstrap

//   const [outline, setOutline] = useState([]); // [{i,id,title,options}]
//   const [summary, setSummary] = useState({ totalQuestions: 0, totalMarks: 0 });

//   const [activeIndex, setActiveIndex] = useState(0);
//   const [question, setQuestion] = useState(null); // single question object
//   const [loading, setLoading] = useState(true);
//   const [qLoading, setQLoading] = useState(false);

//   const [saving, setSaving] = useState(false);
//   const [dirty, setDirty] = useState(false);
//   const [filterText, setFilterText] = useState("");

//   // dynamic difficulties (unique, trimmed, non-empty)
//   const [difficultyOptions, setDifficultyOptions] = useState([]);
//   const [taskOptions, setTaskOptions] = useState([]);
// const [approachOptions, setApproachOptions] = useState([]);
// const [domainOptions, setDomainOptions] = useState([]);
// const [sections, setSections] = useState([]);



//   const saveTimer = useRef(null);

//   // computed flag per render
//   const isMulti = /multi_choice/i.test(question?.questionType || "");

//   // NEW: whenever ?idx= changes, move the cursor
//   useEffect(() => {
//     const raw = searchParams.get("idx");
//     const n = Number.parseInt(raw ?? "", 10);
//     if (!Number.isNaN(n) && n >= 0) {
//       setActiveIndex(n);
//     } else {
//       setActiveIndex(0);
//     }
//   }, [searchParams]);

//   function toggleCorrect(zeroBasedIndex) {
//   const curr = Array.isArray(question?.correct)
//     ? [...question.correct]
//     : [];
//   const i = curr.indexOf(zeroBasedIndex);
//   if (i >= 0) curr.splice(i, 1);
//   else curr.push(zeroBasedIndex);
//   curr.sort((a, b) => a - b);
//   patch({ correct: curr });
// }


//   // ⭐ Load sections for jump buttons
// useEffect(() => {
//   if (!ready || !mockTestId) return;

//   (async () => {
//     try {
//       console.log("🧪 FRONTEND fetching questions…");
//       const res = await API.get(
//         `/api/admin/mocktests/${mockTestId}/sections`
//       );
      
//       setSections(Array.isArray(res.data?.sections) ? res.data.sections : []);
//     } catch (e) {
//       console.error("Failed to load sections", e);
//     }
//   })();
// }, [ready, mockTestId]);

//   // load outline (lightweight)
//   useEffect(() => {
//     // ← guard: need auth ready + mockTestId
//     if (!ready || !mockTestId) return;
//     (async () => {
//       try {
//         const r = await API.get(
//           `/api/admin/mocktests/${mockTestId}/questions/outline`
//         );
//         setOutline(r.data?.outline || []);
//         setSummary(r.data?.summary || {});
//         // pick idx from query string if provided
//         const raw = searchParams.get("idx");
//         const wanted = Number.isInteger(parseInt(raw, 10))
//           ? Math.max(0, parseInt(raw, 10))
//           : 0;
//         setActiveIndex(wanted);
//       } catch (e) {
//         console.error("outline failed:", e);
//         alert("❌ Unable to load questions");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [ready, mockTestId]);

//   // after outline: fetch the full questions blob once to derive all difficulties
//   useEffect(() => {
//     if (!ready || loading || !mockTestId) return; // ← guard auth/route
//     (async () => {
//       try {
//         const r = await API.get(
//           `/api/admin/mocktests/${mockTestId}/questions`
//         );
//         const rows = Array.isArray(r.data?.rows) ? r.data.rows : [];
//         const uniq = Array.from(
//           new Set(
//             rows
//               .map((q) => (q?.difficulty ?? "").toString().trim())
//               .filter(Boolean)
//           )
//         );
//         if (uniq.length) setDifficultyOptions(uniq);

//         // ⭐ NEW: Task options
// const uniqTask = Array.from(
//   new Set(
//     rows
//       .map((q) => (q?.task ?? "").toString().trim())
//       .filter(Boolean)
//   )
// );
// setTaskOptions(uniqTask);

// // ⭐ NEW: Approach options
// const uniqApproach = Array.from(
//   new Set(
//     rows
//       .map((q) => (q?.approach ?? "").toString().trim())
//       .filter(Boolean)
//   )
// );
// setApproachOptions(uniqApproach);

// // ⭐ NEW: Domain options
// const uniqDomain = Array.from(
//   new Set(
//     rows
//       .map((q) => (q?.domain ?? "").toString().trim())
//       .filter(Boolean)
//   )
// );
// setDomainOptions(uniqDomain);

//       } catch (e) {
//         // non-fatal
//       }
//     })();
//   }, [ready, loading, mockTestId]);

//   // load a single question whenever index changes
//   useEffect(() => {
//     if (!ready || loading || !mockTestId) return; // ← guard auth/route
//     if (outline.length === 0) {
//       setQuestion(null);
//       return;
//     }
//     (async () => {
//       try {
//         setQLoading(true);
//         const r = await API.get(
//            `/api/admin/mocktests/${mockTestId}/questions/${activeIndex}`
//         );
//         const q = normalize(r.data?.question || {});
//         setQuestion(q);
//         setSummary(r.data?.summary || {});
//         setDirty(false);

//         // lazily merge difficulty into options
//         const d = (q.difficulty ?? "").toString().trim();
//         if (d)
//           setDifficultyOptions((prev) =>
//             prev.includes(d) ? prev : [...prev, d]
//           );
//       } catch (e) {
//         console.error("load question failed:", e);
//         alert("❌ Failed to load question");
//       } finally {
//         setQLoading(false);
//       }
//     })();
//   }, [ready, activeIndex, outline.length, loading, mockTestId]);

//   // cleanup autosave timer on unmount
//   useEffect(() => {
//     return () => {
//       if (saveTimer.current) clearTimeout(saveTimer.current);
//     }; // ← cleanup
//   }, []);

//   // guard on unload
//   useEffect(() => {
//     const onBeforeUnload = (e) => {
//       if (dirty) {
//         e.preventDefault();
//         e.returnValue = "";
//       }
//     };
//     window.addEventListener("beforeunload", onBeforeUnload);
//     return () => window.removeEventListener("beforeunload", onBeforeUnload);
//   }, [dirty]);

//   const filtered = useMemo(() => {

//     const s = (filterText || "").toLowerCase();
//     if (!s) return outline;
//     return outline.filter((o) => {
//       const t = (o.title || "").toLowerCase();
//       const opts = (o.options || []).join(" ").toLowerCase();
//       return t.includes(s) || opts.includes(s);
//     });
//   }, [outline, filterText]);

//   function normalize(q) {
//     console.log("🧪 RAW QUESTION FROM API =", q);

//   const isMulti = /multi_choice/i.test(
//     q.questionType || q.QuestionType || ""
//   );

//  const rawMultiCorrect =
//   q.correct ?? q.answer ?? [];

//   console.log("🧪 RAW MULTI SOURCE =", {
//   correct: q.correct,
//   answer: q.answer,
//   rawMultiCorrect,
// });


  

// const correctArr = isMulti
//   ? normalizeMultiCorrect(rawMultiCorrect)
//   : [];
// console.log("🧪 NORMALIZED MULTI (0-based) =", correctArr);


//   return {
//     id: q.id || `q_${Date.now()}`,
//     instruction: q.instruction || "",
//     question: q.question || q.text || q.Question || "",
//     questionType: q.questionType || q.QuestionType || "Single_Choice",
//     options: Array.isArray(q.options) ? q.options : ["", "", "", ""],

//     // ✅ MAIN FIX (YAHI RADIO TICK PROBLEM SOLVE KAREGA)
//     answer:
//       !isMulti && Number.isInteger(q.answer)
//         ? q.answer
//         : !isMulti && correctArr.length === 1
//         ? correctArr[0]
//         : null,

//     // ✅ Multi choice ke liye checkbox
//     correct: isMulti ? correctArr : [],

//     explanation: q.explanation || "",

//     task: q.task || "",
//     approach: q.approach || "",
//     domain: q.domain || "",

//     tags: Array.isArray(q.tags)
//       ? q.tags
//       : typeof q.tags === "string"
//       ? q.tags.split(",").map((s) => s.trim()).filter(Boolean)
//       : [],

//     section: q.section || q.Section || "",
//     difficulty: (q.difficulty ?? q.Difficulty ?? q.level ?? q.Level ?? "")
//       .toString()
//       .trim(),

//     marks: typeof q.marks === "number" ? q.marks : 1,
//   };
// }


//   const patch = (p) => {
//     setQuestion((prev) => ({ ...prev, ...p }));
//     setDirty(true);
//     scheduleAutosave();
//   };

//   const updateOption = (idx, val) => {
//     const opts = [...(question?.options || [])];
//     opts[idx] = val;
//     patch({ options: opts });
//   };
//   const addOption = () =>
//     patch({ options: [...(question?.options || []), ""] });

//   const removeOption = (idx) => {
//     const opts = (question?.options || []).filter((_, i) => i !== idx);

//     let ans = question?.answer;
//     if (Number.isInteger(ans)) {
//       if (ans === idx) ans = null;
//       else if (idx < ans) ans = ans - 1;
//     }

//     let corr = Array.isArray(question?.correct) ? [...question.correct] : [];

// // MULTI: remove & shift 0-based
// corr = corr
//   .filter((i) => i !== idx)
//   .map((i) => (i > idx ? i - 1 : i));

// // SINGLE: backend will derive correct from answer
// if (!isMulti) {
//   corr = [];
// }

// patch({ options: opts, answer: ans, correct: corr });
//   }

//   const scheduleAutosave = () => {
//     clearTimeout(saveTimer.current);
//     saveTimer.current = setTimeout(() => saveOne(true), DEBOUNCE_MS);
//   };

//   async function saveOne(silent = false) {
//     try {
//       if (!question) return;
//       setSaving(true);

//       const payload = { ...question };
//      if (isMulti) {
//   payload.answer = null;
//   payload.correct = Array.isArray(question.correct)
//     ? [...new Set(question.correct.map(Number))]
//     : [];
// } else {
//   // SINGLE CHOICE
//   payload.answer = Number.isInteger(question.answer)
//     ? question.answer
//     : null;

//   // ❌ DO NOT send payload.correct for single choice
//   delete payload.correct;
// }


//       const r = await API.patch(
//         `/api/admin/mocktests/update-mock/${mockTestId}/questions/${activeIndex}`,
//         payload
//       );
//       setSummary(r.data?.summary || {});
//       setDirty(false);

//       // refresh outline title for this row
//       setOutline((prev) => {
//         const next = [...prev];
//         if (next[activeIndex])
//           next[activeIndex] = {
//             ...next[activeIndex],
//             title: (question.question || "").slice(0, 140),
//             options: question.options?.slice(0, 4) || [],
//           };
//         return next;
//       });

//       // ensure difficulty options contains the saved value
//       const d = (question.difficulty ?? "").toString().trim();
//       if (d)
//         setDifficultyOptions((prev) =>
//           prev.includes(d) ? prev : [...prev, d]
//         );

//       if (!silent) alert("✅ Saved");
//     } catch (e) {
//       console.error("save failed:", e);
//       if (!silent) alert("❌ Failed to save");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function createNew(after = true) {
//     try {
//       const body = {
//         question: normalize({}),
//         at: after ? activeIndex + 1 : activeIndex,
//       };
//       const r = await API.post(
//         `/api/admin/mocktests/update-mock/${mockTestId}/questions`,
//         body
//       );
//       const ol = await API.get(
//         `/api/admin/mocktests/fetch/${mockTestId}/questions/outline`
//       );
//       setOutline(ol.data?.outline || []);
//       setSummary(ol.data?.summary || {});
//       setActiveIndex(r.data?.index ?? (after ? activeIndex + 1 : activeIndex));
//     } catch (e) {
//       console.error("create failed:", e);
//       alert("❌ Failed to add question");
//     }
//   }

//   async function duplicateCurrent() {
//     try {
//       if (!question) return;
//       const body = {
//         question: { ...question, id: `q_${Date.now()}` },
//         at: activeIndex + 1,
//       };
//       const r = await API.post(
//         `/api/admin/mocktests/update-mock/${mockTestId}/questions`,
//         body
//       );
//       const ol = await API.get(
//         `/api/admin/mocktests/fetch/${mockTestId}/questions/outline`
//       );
//       setOutline(ol.data?.outline || []);
//       setSummary(ol.data?.summary || {});
//       setActiveIndex(r.data?.index ?? activeIndex + 1);
//     } catch (e) {
//       console.error("duplicate failed:", e);
//       alert("❌ Failed to duplicate");
//     }
//   }

//   async function deleteCurrent() {
//     if (!outline.length) return;
//     if (!window.confirm("Delete this question?")) return;
//     try {
//       await API.delete(
//         `/api/admin/mocktests/update-mock/${mockTestId}/questions/${activeIndex}`
//       );
//       const ol = await API.get(
//         `/api/admin/mocktests/${mockTestId}/questions/outline`
//       );
//       setOutline(ol.data?.outline || []);
//       setSummary(ol.data?.summary || {});
//       setActiveIndex((i) => Math.max(0, i - 1));
//       setQuestion(null);
//     } catch (e) {
//       console.error("delete failed:", e);
//       alert("❌ Failed to delete");
//     }
//   }

//   const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
//   const next = () => setActiveIndex((i) => Math.min(outline.length - 1, i + 1));
//   // ⭐ Jump to section start question
// function goToSection(secIndex) {
//   if (!sections[secIndex]) return;

//   const start = Math.max(
//     0,
//     (sections[secIndex].startSerial ?? 1) - 1
//   );

//   navigate(
//     `/admin/mocktests/editor/${mockTestId}/questions?idx=${start}`
//   );
// }


//   if (!ready) {
//     // ← wait for auth bootstrap
//     return (
//       <Box textAlign="center" mt={10}>
//         <CircularProgress />
//         <Typography mt={2}>Preparing your session…</Typography>
//       </Box>
//     );
//   }

//   if (loading) {
//     return (
//       <Box textAlign="center" mt={10}>
//         <CircularProgress />
//         <Typography mt={2}>Loading questions…</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box maxWidth="1100px" mx="auto" mt={3} mb={6}>
//       <Typography variant="h5" fontWeight="bold" mb={1}>
//         📝 Question Editor
//       </Typography>
//       <Typography variant="body2" color="text.secondary" mb={2}>
//         {outline.length
//           ? `${activeIndex + 1}/${outline.length} Questions • ${
//               summary?.totalMarks ?? ""
//             } Marks`
//           : "No questions"}
//         {dirty ? " • unsaved" : ""}
//       </Typography>
//       {/* ⭐ SECTION JUMP BUTTONS */}
// {sections.length > 0 && (
//   <Stack
//     direction="row"
//     spacing={1}
//     sx={{ mb: 2, flexWrap: "wrap" }}
//   >
//     {sections.map((sec, idx) => (
//       <Button
//         key={idx}
//         variant="outlined"
//         sx={{
//           textTransform: "none",
//           borderColor:
//             activeIndex >= ((sec.startSerial ?? 1) - 1) &&
//             activeIndex <
//               (((sec.startSerial ?? 1) - 1) + (sec.count ?? 0))
//               ? "#1976d2"
//               : "rgba(0,0,0,0.23)",
//         }}
//         onClick={() => goToSection(idx)}
//       >
//         {sec.name || `Section ${idx + 1}`}
//       </Button>
//     ))}
//   </Stack>
// )}


//       {/* Toolbar */}
//       <Stack
//         direction={{ xs: "column", md: "row" }}
//         spacing={1}
//         alignItems={{ xs: "stretch", md: "center" }}
        
//         mb={1}
//       >

//         <Button
//   variant="outlined"
//   startIcon={<ArrowBack />}
//   onClick={() => navigate(`/admin/mocktests/editor/${mockTestId}/sections`)}
// >
//   Back
// </Button>

//         <TextField
//           fullWidth
//           size="small"
//           placeholder="Search (question / options)"
//           value={filterText}
//           onChange={(e) => setFilterText(e.target.value)}
//         />
//         <Stack direction="row" spacing={1} justifyContent="flex-end">
//           <Tooltip title="Previous">
//             <span>
//               <IconButton onClick={prev} disabled={activeIndex === 0}>
//                 <ArrowBack />
//               </IconButton>
//             </span>
//           </Tooltip>
//           <Tooltip title="Next">
//             <span>
//               <IconButton
//                 onClick={next}
//                 disabled={activeIndex >= outline.length - 1}
//               >
//                 <ArrowForward />
//               </IconButton>
//             </span>
//           </Tooltip>
//           {/* <Button variant="outlined" startIcon={<ContentCopy />} onClick={duplicateCurrent}>Duplicate</Button> */}
//           <Button
//             variant="outlined"
//             color="error"
//             startIcon={<Delete />}
//             onClick={deleteCurrent}
//           >
//             Delete
//           </Button>
//           {/* <Button variant="contained" style={{ backgroundColor: "#4748ac" }} startIcon={<Add />} onClick={() => createNew(true)}>New Question</Button> */}
//           <Button
//             variant="contained"
//             color="success"
//             startIcon={<Save />}
//             onClick={() => saveOne(false)}
//             disabled={saving || !question}
//           >
//             {saving ? "Saving…" : "Save"}
//           </Button>
//         </Stack>
//       </Stack>

//       {/* Editor */}
//       {qLoading ? (
//         <Box textAlign="center" my={4}>
//           <CircularProgress />
//         </Box>
//       ) : question ? (
//         <Paper sx={{ p: 2 }}>
//           <Typography variant="subtitle1" fontWeight="bold" mb={3}>
//             {prettyType(question?.questionType)}
//           </Typography>

//           <TextField
//             label="Question*"
//             fullWidth
//             multiline
//             minRows={3}
//             value={question.question}
//             onChange={(e) => patch({ question: e.target.value })}
//             sx={{ mb: 2 }}
//           />

//           <Typography fontWeight="600" mb={1}>
//             Options*
//           </Typography>
//           {isMulti ? (
//             <>
//               {(question.options || []).map((opt, idx) => {
//                 const oneBased = idx + 1;

//                 console.log("🧪 RENDER CHECKBOX", {
//   idx,
//   correctArray: question.correct,
//   checked: Array.isArray(question.correct)
//     ? question.correct.includes(idx)
//     : false,
// });

//                 const checked =
//                   Array.isArray(question.correct) &&
//   question.correct.includes(idx); // ✅ 0-based
//                 return (
//                   <Stack
//                     key={idx}
//                     direction="row"
//                     alignItems="center"
//                     spacing={1}
//                     sx={{ mb: 1 }}
//                   >
//                     <Checkbox
//                       checked={!!checked}
//                       onChange={() => toggleCorrect(idx)}
//                     />
//                     <TextField
//                       fullWidth
//                       label={`${String.fromCharCode(65 + idx)}.`}
//                       value={opt}
//                       onChange={(e) => updateOption(idx, e.target.value)}
//                     />
//                     <IconButton color="error" onClick={() => removeOption(idx)}>
//                       <Delete />
//                     </IconButton>
//                   </Stack>
//                 );
//               })}
//             </>
//           ) : (
//             <RadioGroup
//               value={Number.isInteger(question.answer) ? question.answer : -1}
//               onChange={(e) => patch({ answer: Number(e.target.value) })}
//             >
//               {(question.options || []).map((opt, idx) => (
//                 <Stack
//                   key={idx}
//                   direction="row"
//                   alignItems="center"
//                   spacing={1}
//                   sx={{ mb: 1 }}
//                 >
//                   <FormControlLabel
//                     value={idx}
//                     control={<Radio />}
//                     label=""
//                     sx={{ mr: 0 }}
//                   />
//                   <TextField
//                     fullWidth
//                     label={`${String.fromCharCode(65 + idx)}.`}
//                     value={opt}
//                     onChange={(e) => updateOption(idx, e.target.value)}
//                   />
//                   <IconButton color="error" onClick={() => removeOption(idx)}>
//                     <Delete />
//                   </IconButton>
//                 </Stack>
//               ))}
//             </RadioGroup>
//           )}
//           <Button startIcon={<Add />} onClick={addOption} sx={{ mb: 2 }}>
//             Add choice
//           </Button>

//           <TextField
//             label="Explanation"
//             fullWidth
//             multiline
//             minRows={2}
//             value={question.explanation}
//             onChange={(e) => patch({ explanation: e.target.value })}
//             sx={{ mb: 2 }}
//           />

//           <Divider sx={{ my: 2 }} />
       
// {/* ⭐ New row for Task / Approach / Domain (dropdowns) */}
// {/* ⭐ New row for Task / Approach / Domain (Dynamic dropdown) */}
// <Stack
//   direction={{ xs: "column", sm: "row" }}
//   spacing={2}
//   sx={{ mb: 2 }}
// >
//   {/* TASK */}
//   <TextField
//     select
//     fullWidth
//     label="Task"
//     value={question.task || ""}
//     onChange={(e) => patch({ task: e.target.value })}
//   >
//     <MenuItem value="">(None)</MenuItem>
//     {taskOptions.map((t) => (
//       <MenuItem key={t} value={t}>
//         {t}
//       </MenuItem>
//     ))}
//   </TextField>

//   {/* APPROACH */}
//   <TextField
//     select
//     fullWidth
//     label="Approach"
//     value={question.approach || ""}
//     onChange={(e) => patch({ approach: e.target.value })}
//   >
//     <MenuItem value="">(None)</MenuItem>
//     {approachOptions.map((a) => (
//       <MenuItem key={a} value={a}>
//         {a}
//       </MenuItem>
//     ))}
//   </TextField>

//   {/* DOMAIN */}
//   <TextField
//     select
//     fullWidth
//     label="Domain"
//     value={question.domain || ""}
//     onChange={(e) => patch({ domain: e.target.value })}
//   >
//     <MenuItem value="">(None)</MenuItem>
//     {domainOptions.map((d) => (
//       <MenuItem key={d} value={d}>
//         {d}
//       </MenuItem>
//     ))}
//   </TextField>
// </Stack>




//           <Stack
//             direction={{ xs: "column", sm: "row" }}
//             spacing={2}
//             sx={{ mb: 2 }}
//           >
//             <TextField
//               label="Section"
//               fullWidth
//               value={question.section}
//               onChange={(e) => patch({ section: e.target.value })}
//             />
//             <TextField
//               select
//               fullWidth
//               label="Difficulty"
//               value={question.difficulty}
//               onChange={(e) => patch({ difficulty: e.target.value })}
//             >
//               <MenuItem value="">(None)</MenuItem>
//               {difficultyOptions.map((d) => (
//                 <MenuItem key={d} value={d}>
//                   {d}
//                 </MenuItem>
//               ))}
//             </TextField>
//             <TextField
//               label="Marks"
//               type="number"
//               fullWidth
//               value={question.marks}
//               onChange={(e) => patch({ marks: Number(e.target.value || 1) })}
//             />
//           </Stack>

//           <Typography fontWeight="600" mb={1}>
//             Tags
//           </Typography>
//           <TagEditor
//             value={Array.isArray(question.tags) ? question.tags : []}
//             onAdd={(t) => patch({ tags: [...(question.tags || []), t] })}
//             onDelete={(t) =>
//               patch({ tags: (question.tags || []).filter((x) => x !== t) })
//             }
//           />
//         </Paper>
//       ) : (
//         <Typography color="text.secondary">
//           Select a question to edit.
//         </Typography>
//       )}
//     </Box>
//   );
// }

// function TagEditor({ value, onAdd, onDelete }) {
//   const [input, setInput] = useState("");
//   return (
//     <Box>
//       <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
//         <TextField
//           size="small"
//           label="Add tag"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               e.preventDefault();
//               const t = input.trim();
//               if (t) onAdd(t);
//               setInput("");
//             }
//           }}
//         />
//         <Button
//           variant="outlined"
//           onClick={() => {
//             const t = input.trim();
//             if (t) onAdd(t);
//             setInput("");
//           }}
//         >
//           Add
//         </Button>
//       </Stack>
//       <Stack direction="row" spacing={1} flexWrap="wrap">
//         {value.map((t) => (
//           <Chip key={t} label={t} onDelete={() => onDelete(t)} />
//         ))}
//       </Stack>
//     </Box>
//   );
// }


