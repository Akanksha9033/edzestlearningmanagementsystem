// src/components/Blocks/TableBlock.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";

/**
 * TableBlock
 * - Admin: editable grid with add/remove rows/cols, typing in cells, and a heading/title
 * - Student: read-only table with optional heading
 *
 * Now supports selecting & deleting a single cell (clear), a row, or a column.
 */
export default function TableBlock({ block = {}, onChange, isStudent = false }) {
  const data = block.data || {};
  const rows = Number.isFinite(data.rows) ? data.rows : 2;
  const cols = Number.isFinite(data.cols) ? data.cols : 2;
  const heading = typeof data.heading === "string" ? data.heading : (data.title || "");

  // Normalize cells to rows x cols
  const cells = useMemo(() => {
    const raw = Array.isArray(data.cells) ? data.cells : [];
    const out = [];
    for (let r = 0; r < rows; r++) {
      const row = Array.isArray(raw[r]) ? raw[r].slice(0, cols) : [];
      while (row.length < cols) row.push("");
      out.push(row);
    }
    return out;
  }, [data.cells, rows, cols]);

  // Initialize once if needed
  useEffect(() => {
    if (block?.type === "table" && (!block.data || !Array.isArray(block.data?.cells))) {
      onChange?.({
        ...block,
        type: "table",
        data: { type: "table", heading: heading || "", rows, cols, cells },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (next) => {
    onChange?.({
      ...block,
      type: "table",
      data: {
        type: "table",
        heading,
        rows,
        cols,
        cells,
        ...next,
      },
    });
  };

  const setHeading = (value) => update({ heading: value });

  const setCell = (r, c, value) => {
    const next = cells.map((row) => row.slice());
    next[r][c] = value;
    update({ cells: next });
  };

  const addRow = () =>
    update({ rows: rows + 1, cells: [...cells, Array(cols).fill("")] });

  const removeRowAt = (idx) => {
    if (rows <= 1) return;
    const next = cells.filter((_, r) => r !== idx);
    update({ rows: rows - 1, cells: next });
  };

  const removeRow = () => removeRowAt(rows - 1);

  const addCol = () => {
    const next = cells.map((r) => [...r, ""]);
    update({ cols: cols + 1, cells: next });
  };

  const removeColAt = (idx) => {
    if (cols <= 1) return;
    const next = cells.map((r) => r.filter((_, c) => c !== idx));
    update({ cols: cols - 1, cells: next });
  };

  const removeCol = () => removeColAt(cols - 1);

  /* ----------------------
     Bold support (no markers shown in inputs)
  -----------------------*/
  const [focusPos, setFocusPos] = useState({ r: 0, c: 0 });

  const isBoldMarked = useCallback((val) => {
    if (typeof val !== "string") return false;
    return /^\s*\*\*(.*)\*\*\s*$/.test(val);
  }, []);

  const unwrapBold = useCallback((val) => {
    if (typeof val !== "string") return val ?? "";
    const m = /^\s*\*\*(.*)\*\*\s*$/.exec(val);
    return m ? m[1] : val;
  }, []);

  const wrapBold = useCallback((val) => {
    const clean = val ?? "";
    // avoid double-wrap
    return isBoldMarked(clean) ? clean : `**${clean}**`;
  }, [isBoldMarked]);

  const toggleBoldAt = useCallback((r, c) => {
    const raw = cells?.[r]?.[c] ?? "";
    const nextVal = isBoldMarked(raw) ? unwrapBold(raw) : wrapBold(unwrapBold(raw));
    setCell(r, c, nextVal);
  }, [cells, isBoldMarked, unwrapBold, wrapBold]);

  /* ----------------------
     Center support (new) — uses [[C]]...[[/C]] markers
  -----------------------*/
  const isCenteredMarked = useCallback((val) => {
    if (typeof val !== "string") return false;
    return /^\s*\[\[C\]\](.*)\[\[\/C\]\]\s*$/.test(val);
  }, []);

  const unwrapCenter = useCallback((val) => {
    if (typeof val !== "string") return val ?? "";
    const m = /^\s*\[\[C\]\](.*)\[\[\/C\]\]\s*$/.exec(val);
    return m ? m[1] : val;
  }, []);

  const wrapCenter = useCallback((val) => {
    const clean = val ?? "";
    return isCenteredMarked(clean) ? clean : `[[C]]${clean}[[/C]]`;
  }, [isCenteredMarked]);

  // Helper to build the stored string from flags
  const applyMarkers = useCallback((plain, { bold, center }) => {
    let out = plain ?? "";
    if (bold) out = wrapBold(out);
    if (center) out = wrapCenter(out);
    return out;
  }, [wrapBold, wrapCenter]);

  const toggleCenterAt = useCallback((r, c) => {
    const raw = cells?.[r]?.[c] ?? "";
    // Determine current flags
    const bold = isBoldMarked(raw);
    const centered = isCenteredMarked(raw);
    // Strip all markers → to plain text
    let plain = raw;
    if (centered) plain = unwrapCenter(plain);
    if (bold) plain = unwrapBold(plain);
    // Re-apply with toggled center
    const next = applyMarkers(plain, { bold, center: !centered });
    setCell(r, c, next);
  }, [cells, isBoldMarked, isCenteredMarked, unwrapBold, unwrapCenter, applyMarkers]);

  const onCellKeyDown = (e, r, c) => {
    if (e.ctrlKey && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      toggleBoldAt(r, c);
    }
    // Delete (clear) when in cell selection mode and focused
    if (!isStudent && selection.mode === "cell" && selection.r === r && selection.c === c) {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setCell(r, c, "");
      }
    }
    // Optional: Ctrl+E to toggle center (quick hotkey)
    if (e.ctrlKey && (e.key === "e" || e.key === "E")) {
      e.preventDefault();
      toggleCenterAt(r, c);
    }
  };

  /* ----------------------
     Selection (cell / row / column) + delete
  -----------------------*/
  const [selection, setSelection] = useState({ mode: "cell", r: 0, c: 0 }); // mode: 'cell' | 'row' | 'col'

  const setSelectionMode = (mode) => {
    // Clamp selection within bounds when switching modes
    if (mode === "row") setSelection({ mode, r: Math.min(selection.r ?? 0, rows - 1), c: 0 });
    else if (mode === "col") setSelection({ mode, r: 0, c: Math.min(selection.c ?? 0, cols - 1) });
    else setSelection({ mode: "cell", r: Math.min(selection.r ?? 0, rows - 1), c: Math.min(selection.c ?? 0, cols - 1) });
  };

  const handleCellClick = (r, c) => {
    if (isStudent) return;
    if (selection.mode === "cell") {
      setSelection({ mode: "cell", r, c });
      setFocusPos({ r, c });
    } else if (selection.mode === "row") {
      setSelection({ mode: "row", r, c: 0 });
    } else if (selection.mode === "col") {
      setSelection({ mode: "col", r: 0, c });
    }
  };

  const deleteSelected = () => {
    if (isStudent) return;
    if (selection.mode === "cell") {
      setCell(selection.r, selection.c, "");
    } else if (selection.mode === "row") {
      removeRowAt(selection.r);
      // move selection to a valid row index
      const nextR = Math.max(0, Math.min(selection.r, rows - 2));
      setSelection({ mode: "row", r: nextR, c: 0 });
    } else if (selection.mode === "col") {
      removeColAt(selection.c);
      // move selection to a valid col index
      const nextC = Math.max(0, Math.min(selection.c, cols - 2));
      setSelection({ mode: "col", r: 0, c: nextC });
    }
  };

  const clearCell = () => {
    if (selection.mode === "cell") setCell(selection.r, selection.c, "");
  };

  // helpers for highlighting
  const isCellSelected = (r, c) =>
    selection.mode === "cell" && selection.r === r && selection.c === c;
  const isRowSelected = (r) => selection.mode === "row" && selection.r === r;
  const isColSelected = (c) => selection.mode === "col" && selection.c === c;

  return (
    <div>
      <style>{`
        .tb-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .25rem;
          padding: .375rem .5rem;
          font-size: .75rem;
          font-weight: 800;
          border-radius: .5rem;
          border: 1px solid #3f44a9;
          background: #4748ac;
          color: #fff;
          box-shadow: 0 1px 2px rgba(2,6,23,.08);
          transition: transform .06s ease, filter .15s ease, box-shadow .15s ease;
        }
        .tb-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .tb-btn:active { transform: translateY(0); }
        .tb-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }

        .tb-btn--ghost {
          background: #fff;
          color: #0f172a;
          border: 1px solid #e5e7eb;
        }
        .tb-btn--ghost.active {
          border-color: #aab0ff;
          box-shadow: 0 0 0 3px rgba(71,72,172,.22);
        }

        .tb-input {
          width: 100%;
          font-size: .875rem;
          border: 1px solid #e5e7eb;
          border-radius: .5rem;
          padding: .375rem .5rem;
          outline: none;
          background: #fff;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .tb-input:focus {
          border-color: #aab0ff;
          box-shadow: 0 0 0 3px rgba(71,72,172,.22);
        }

        .tb-label { font-size: .7rem; color: #6b7280; letter-spacing: .3px; margin-bottom: .25rem; display: inline-block; }
        .tb-heading { font-weight: 800; color: #0f172a; font-size: 1rem; text-align: left; margin: .25rem 0 .5rem 0; }

        .tb-table { border-collapse: collapse; width: 100%; min-width: 320px; background: #fff; table-layout: fixed; }
        .tb-table td, .tb-table th { border: 1px solid #1f2937; padding: .5rem; vertical-align: top; min-width: 80px; }

        .tb-table tr:nth-child(even) td { background: #fbfbff; }

        /* Selection highlights */
        .tb-row-selected td { background: #f2f6ff !important; }
        .tb-col-selected { background: #f2f6ff !important; }
        .tb-cell-selected { outline: 2px solid #4748ac; outline-offset: -2px; }

        .tb-meta { font-size: .75rem; color: #6b7280; }
        .tb-pill { display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;background:#eef2ff;border:1px solid #dbe1ff;color:#334155;font-weight:700;font-size:.65rem; }
      `}</style>

      {/* Heading */}
      {isStudent ? (
        heading ? <div className="tb-heading">{heading}</div> : null
      ) : (
        <div className="mb-2">
          <label className="tb-label">Table Heading (optional)</label>
          <input
            className="tb-input"
            placeholder="e.g., Comparison of Plant vs Animal Cells"
            value={heading || ""}
            onChange={(e) => setHeading(e.target.value)}
          />
        </div>
      )}

      {/* Toolbar */}
      {!isStudent && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="tb-meta">Rows: {rows} · Cols: {cols}</span>
          <span className="tb-pill">R{(selection.r ?? 0) + 1}C{(selection.c ?? 0) + 1}</span>

          {/* Selection mode */}
          <div className="ml-2 flex gap-2" role="group" aria-label="Selection mode">
            <button
              type="button"
              className={`tb-btn tb-btn--ghost ${selection.mode === "cell" ? "active" : ""}`}
              onClick={() => setSelectionMode("cell")}
              title="Select a single cell"
            >
              Cell
            </button>
            <button
              type="button"
              className={`tb-btn tb-btn--ghost ${selection.mode === "row" ? "active" : ""}`}
              onClick={() => setSelectionMode("row")}
              title="Select a whole row"
            >
              Row
            </button>
            <button
              type="button"
              className={`tb-btn tb-btn--ghost ${selection.mode === "col" ? "active" : ""}`}
              onClick={() => setSelectionMode("col")}
              title="Select a whole column"
            >
              Col
            </button>
          </div>

          <div className="ml-auto flex gap-2">
            <button type="button" className="tb-btn" onClick={addRow}>+ Row</button>
            <button type="button" className="tb-btn" onClick={removeRow} disabled={rows <= 1}>− Row</button>
            <button type="button" className="tb-btn" onClick={addCol}>+ Col</button>
            <button type="button" className="tb-btn" onClick={removeCol} disabled={cols <= 1}>− Col</button>

            <button
              type="button"
              className="tb-btn"
              onClick={() => toggleBoldAt(selection.r ?? 0, selection.c ?? 0)}
              title="Bold (Ctrl+B on focused cell)"
            >
              <span style={{ fontWeight: 900 }}>B</span>
            </button>

            {/* NEW: Center toggle */}
            <button
              type="button"
              className="tb-btn"
              onClick={() => toggleCenterAt(selection.r ?? 0, selection.c ?? 0)}
              title="Center align (Ctrl+E on focused cell)"
            >
              Center
            </button>

            {/* Delete / Clear based on selection */}
            <button
              type="button"
              className="tb-btn"
              onClick={deleteSelected}
              title={
                selection.mode === "cell"
                  ? "Clear selected cell"
                  : selection.mode === "row"
                  ? "Delete selected row"
                  : "Delete selected column"
              }
              disabled={
                (selection.mode === "row" && rows <= 1) ||
                (selection.mode === "col" && cols <= 1)
              }
            >
              {selection.mode === "cell" ? "Clear Cell" : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto">
        <table className="tb-table">
          <tbody>
            {cells.map((row, r) => {
              const rowSelected = !isStudent && isRowSelected(r);
              return (
                <tr key={r} className={rowSelected ? "tb-row-selected" : undefined}>
                  {row.map((val, c) => {
                    // compute flags from RAW (with any markers)
                    const centered = isCenteredMarked(val);
                    const boldMarked = isBoldMarked(val);

                    // unwrap to display plain text
                    let display = val;
                    if (centered) display = unwrapCenter(display);
                    if (boldMarked) display = unwrapBold(display);

                    const colSelected = !isStudent && isColSelected(c);
                    const cellSelected = !isStudent && isCellSelected(r, c);

                    return (
                      <td
                        key={c}
                        className={[
                          colSelected ? "tb-col-selected" : "",
                          cellSelected ? "tb-cell-selected" : "",
                        ].join(" ").trim()}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {isStudent ? (
                          <div
                            className="whitespace-pre-wrap text-sm"
                            style={{ fontWeight: boldMarked ? 800 : 400, textAlign: centered ? "center" : "left" }}
                          >
                            {display}
                          </div>
                        ) : (
                          <input
                            className="tb-input"
                            value={display}
                            onChange={(e) => {
                              // preserve both bold + center states while editing
                              const plain = e.target.value;
                              const toStore = applyMarkers(plain, {
                                bold: boldMarked,
                                center: centered,
                              });
                              setCell(r, c, toStore);
                            }}
                            placeholder={`R${r + 1}C${c + 1}`}
                            onFocus={() => {
                              setFocusPos({ r, c });
                              if (selection.mode === "cell") setSelection({ mode: "cell", r, c });
                            }}
                            onKeyDown={(e) => onCellKeyDown(e, r, c)}
                            style={{ fontWeight: boldMarked ? 700 : 400, textAlign: centered ? "center" : "left" }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isStudent && (
        <div className="mt-1 tb-meta">
          Tips:
          <ul style={{ margin: "4px 0 0 18px" }}>
            <li>Choose a <strong>Selection</strong> mode (Cell / Row / Col), then click a cell to select.</li>
            <li><strong>Delete Selected</strong> removes the selected row/column (or clears a single cell).</li>
            <li>Press <strong>Ctrl+B</strong> to toggle bold on the focused cell.</li>
            <li>Press <strong>Ctrl+E</strong> to toggle <em>center alignment</em> on the focused cell.</li>
            <li>With Cell selection, press <strong>Delete/Backspace</strong> to clear the focused cell.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
