// QuestionView.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";

const DEBOUNCE_MS = 700;

function QuestionViewInner(
  {
    data,
    disabled,
    onSave,
    enableHighlight = false,
    enableStrikethrough = false,
    hideInternalFlagButton = false,
  },
  ref
) {
  const [answer, setAnswer] = useState(null);
  const [flagged, setFlagged] = useState(false);
  const [strikes, setStrikes] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);

  const rootRef = useRef(null); // selectable content root
  const lastRangeRef = useRef(null); // last valid selection range within root
  const tickRef = useRef(null);
  const saveTimer = useRef(null);

  const isMulti = useMemo(
    () => /multi/i.test(data?.question?.questionType || ""),
    [data?.question?.questionType]
  );

  useEffect(() => {
    setAnswer(data?.saved?.answer ?? (isMulti ? [] : null));
    setFlagged(!!data?.saved?.flagged);
    setStrikes(Array.isArray(data?.saved?.strikes) ? data.saved.strikes : []);
    setHighlights(
      Array.isArray(data?.saved?.highlights) ? data.saved.highlights : []
    );
    setTimeSpent(Number(data?.saved?.timeSpentSec || 0));
  }, [data, isMulti]);

  useEffect(() => {
    if (disabled) return;
    tickRef.current = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, [disabled]);

  const debouncedSave = (extra = {}) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave?.({
        answer,
        flagged,
        strikes,
        highlights,
        timeSpentSec: timeSpent,
        ...extra,
      });
    }, DEBOUNCE_MS);
  };

  const toggleFlag = () => {
    const next = !flagged;
    setFlagged(next);
    debouncedSave({ flagged: next });
  };

  // --- Track / validate selection inside root
  const captureSelectionIfInside = useCallback(() => {
    const root = rootRef.current;
    const sel = window.getSelection?.();
    if (!root || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const a = range.startContainer,
      b = range.endContainer;
    const text = String(sel.toString() || "").trim();
    if (text && root.contains(a) && root.contains(b)) {
      // store a clone so later clicks (that clear selection) still have a range
      lastRangeRef.current = range.cloneRange();
    }
  }, []);

  useEffect(() => {
    // Keep last selection up-to-date
    const root = rootRef.current;
    if (!root) return;

    const handleMouseUp = () => captureSelectionIfInside();
    const handleKeyUp = () => captureSelectionIfInside();
    const handleSelectionChange = () => captureSelectionIfInside();

    root.addEventListener("mouseup", handleMouseUp);
    root.addEventListener("keyup", handleKeyUp);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      root.removeEventListener("mouseup", handleMouseUp);
      root.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [captureSelectionIfInside]);

  const getValidRange = () => {
    const root = rootRef.current;
    if (!root) return null;

    const sel = window.getSelection?.();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (
        root.contains(r.startContainer) &&
        root.contains(r.endContainer) &&
        String(sel.toString() || "").trim()
      ) {
        return r;
      }
    }
    // fall back to stored range
    const saved = lastRangeRef.current;
    if (
      saved &&
      root.contains(saved.startContainer) &&
      root.contains(saved.endContainer)
    ) {
      return saved;
    }
    return null;
  };

  const wrapRange = (range, nodeName, style = {}) => {
    const wrapper = document.createElement(nodeName);
    Object.assign(wrapper.style, style);
    try {
      range.surroundContents(wrapper);
    } catch {
      const frag = range.cloneContents();
      wrapper.appendChild(frag);
      range.deleteContents();
      range.insertNode(wrapper);
    }
  };

  const applyHighlightFromSelection = () => {
    if (disabled || !enableHighlight) return;
    const range = getValidRange();
    if (!range) return;
    wrapRange(range, "mark");
    // optional lightweight persistence (no chips shown)
    const next = [...highlights, { t: Date.now() }];
    setHighlights(next);
    debouncedSave({ highlights: next });
  };

  const applyStrikeFromSelection = () => {
    if (disabled || !enableStrikethrough) return;
    const range = getValidRange();
    if (!range) return;
    wrapRange(range, "span", { textDecoration: "line-through" });
    const next = [...strikes]; // metadata only; visuals already in DOM
    setStrikes(next);
    debouncedSave();
  };

  // For options (MCQ) we still support double-click strike by index
  const toggleStrikeOption = (i) => {
    if (!enableStrikethrough) return;
    setStrikes((prev) => {
      const has = prev.includes(i);
      const next = has ? prev.filter((x) => x !== i) : [...prev, i];
      setTimeout(() => debouncedSave(), 0);
      return next;
    });
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    highlightSelection: applyHighlightFromSelection,
    strikeSelection: applyStrikeFromSelection,
  }));

  const q = data?.question || {};
  const options = Array.isArray(q.options) ? q.options : [];

  return (
    <Paper sx={{ p: 2 }}>
      {/* Root: everything selectable lives here */}
      <div ref={rootRef}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Typography
            component="div"
            variant="subtitle1"
            fontWeight={500}
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {q.instruction ? `${q.instruction}\n` : ""}
            {q.question || q.text}
          </Typography>

          {!hideInternalFlagButton && (
            <Tooltip title={flagged ? "Unmark for Review" : "Mark for Review"}>
              <IconButton
                onClick={toggleFlag}
                color={flagged ? "warning" : "default"}
              >
                <FlagIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Answers */}
        {!isMulti ? (
          <RadioGroup
            value={Number.isInteger(answer) ? answer : -1}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setAnswer(idx);
              debouncedSave({ answer: idx });
            }}
          >
            {options.map((opt, i) => (
              <Stack
                key={i}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ my: 0.5 }}
              >
                <FormControlLabel
                  value={i}
                  control={<Radio disabled={disabled} />}
                  label=""
                  sx={{ mr: 0 }}
                />
                <Box
                  onDoubleClick={() => toggleStrikeOption(i)}
                  sx={{
                    flex: 1,
                    textDecoration: strikes.includes(i)
                      ? "line-through"
                      : "none",
                    opacity: strikes.includes(i) ? 0.6 : 1,
                    cursor: enableStrikethrough ? "pointer" : "default",
                  }}
                >
                  {opt}
                </Box>
              </Stack>
            ))}
          </RadioGroup>
        ) : (
          <Stack spacing={1}>
            {options.map((opt, i) => {
              const checked = Array.isArray(answer) && answer.includes(i);
              return (
                <Stack key={i} direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    checked={!!checked}
                    onChange={() => {
                      const arr = Array.isArray(answer) ? [...answer] : [];
                      const has = arr.includes(i);
                      const next = has
                        ? arr.filter((x) => x !== i)
                        : [...arr, i];
                      setAnswer(next);
                      debouncedSave({ answer: next });
                    }}
                  />
                  <Box
                    onDoubleClick={() => toggleStrikeOption(i)}
                    sx={{
                      flex: 1,
                      textDecoration: strikes.includes(i)
                        ? "line-through"
                        : "none",
                      opacity: strikes.includes(i) ? 0.6 : 1,
                      cursor: enableStrikethrough ? "pointer" : "default",
                    }}
                  >
                    {opt}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}

        {/* Removed highlight chips to stop the "long rounded boxes" */}
      </div>
    </Paper>
  );
}

export default forwardRef(QuestionViewInner);
