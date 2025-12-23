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

  const rootRef = useRef(null);
  const lastRangeRef = useRef(null);
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

 // ✅ RESTORE HIGHLIGHT / STRIKE HTML AFTER REFRESH
  if (data?.saved?.markup && rootRef.current) {
    rootRef.current.innerHTML = data.saved.markup;
  }

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

  const captureSelectionIfInside = useCallback(() => {
    const root = rootRef.current;
    const sel = window.getSelection?.();
    if (!root || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const a = range.startContainer,
      b = range.endContainer;
    const text = String(sel.toString() || "").trim();
    if (text && root.contains(a) && root.contains(b)) {
      lastRangeRef.current = range.cloneRange();
    }
  }, []);

  useEffect(() => {
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

  // ✅ Save current question HTML (for refresh-safe highlight/strike)
const saveMarkup = () => {
  if (!rootRef.current) return;
  const html = rootRef.current.innerHTML;
  onSave?.({ markup: html });
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
    const next = [...highlights, { t: Date.now() }];
  setHighlights(next);
debouncedSave({ highlights: next });
setTimeout(saveMarkup, 0); // ✅ ADD THIS LINE

  };

  const applyStrikeFromSelection = () => {
    if (disabled || !enableStrikethrough) return;
    const range = getValidRange();
    if (!range) return;
    wrapRange(range, "span", { textDecoration: "line-through" });
    const next = [...strikes];
   setStrikes(next);
debouncedSave();
setTimeout(saveMarkup, 0); // ✅ ADD THIS LINE

  };

  const toggleStrikeOption = (i) => {
    if (!enableStrikethrough) return;
    setStrikes((prev) => {
      const has = prev.includes(i);
      const next = has ? prev.filter((x) => x !== i) : [...prev, i];
      setTimeout(() => {
  debouncedSave();
  saveMarkup(); // ✅ ADD
}, 0);

      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    highlightSelection: applyHighlightFromSelection,
  strikeSelection: applyStrikeFromSelection,

  }));

  const q = data?.question || {};
  const options = Array.isArray(q.options) ? q.options : [];

  return (
    <Paper sx={{ p: 2 }}>
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

        {/* SINGLE-CHOICE */}
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

                {/* ADDED TEXT CLICK SUPPORT */}
                <Box
                  onClick={() => {
                    if (disabled) return;
                    setAnswer(i);
                    debouncedSave({ answer: i });
                  }}
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

          /* MULTI-SELECT */
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

                  {/* ADDED TEXT CLICK SUPPORT */}
                  <Box
                    onClick={() => {
                      if (disabled) return;
                      const arr = Array.isArray(answer) ? [...answer] : [];
                      const has = arr.includes(i);
                      const next = has
                        ? arr.filter((x) => x !== i)
                        : [...arr, i];
                      setAnswer(next);
                      debouncedSave({ answer: next });
                    }}
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

      </div>
    </Paper>
  );
}

export default forwardRef(QuestionViewInner);
