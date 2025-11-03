import React, { useState } from "react";
import "./qb-toolbar-mocklike.css";

/**
 * Mocktest-style toolbar — UI only.
 * No selection/highlight logic; no answer logic touched.
 */
export default function QBToolbarMockLike() {
  const [highlightOn, setHighlightOn] = useState(false);
  const [strikeOn, setStrikeOn] = useState(false);
  const [scratchOpen, setScratchOpen] = useState(false);

  return (
    <>
      {/* Top purple bar */}
      <div className="qbml-bar">
        <div className="qbml-left">
          <button
            type="button"
            className={`qbml-btn ${highlightOn ? "active" : ""}`}
            onClick={() => setHighlightOn(v => !v)}
            aria-pressed={highlightOn}
          >
            HIGHLIGHT
          </button>

          <button
            type="button"
            className={`qbml-btn ${strikeOn ? "active" : ""}`}
            onClick={() => setStrikeOn(v => !v)}
            aria-pressed={strikeOn}
          >
            STRIKETHROUGH
          </button>

          <button
            type="button"
            className="qbml-btn"
            onClick={() => setScratchOpen(v => !v)}
          >
            SCRATCH PAD
          </button>
        </div>

        {/* Right side kept empty to respect your “only add these 3” ask.
            (If later you want Mark for Review / Section / Timer, we can pass a rightSlot here) */}
        <div className="qbml-right" />
      </div>

      {/* Slide-over Scratch Pad (UI only) */}
      <div className={`qbml-scratch ${scratchOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="qbml-scratch-header">
          <span>Scratch Pad</span>
          <button className="qbml-close" onClick={() => setScratchOpen(false)} aria-label="Close">×</button>
        </div>
        <div className="qbml-scratch-body">
          <textarea className="qbml-textarea" placeholder="Type your rough notes here…" />
        </div>
        <div className="qbml-scratch-footer">
          <button className="qbml-btn ghost" onClick={() => setScratchOpen(false)}>Close</button>
        </div>
      </div>

      {/* Backdrop */}
      {scratchOpen && <div className="qbml-backdrop" onClick={() => setScratchOpen(false)} />}
    </>
  );
}
