import React from "react";

/**
 * A simple page divider for both editor & reader.
 * No state; purely presentational.
 */
export default function DividerBlock() {
  return (
    <div className="divider-wrap" aria-label="Page divider">
      <style>{`
        .divider-wrap{
          margin: 24px 0;
        }
        .divider-line{
          border: 0;
          height: 2px; /* slightly thicker for visibility */
          width: 100%;
          background: linear-gradient(
            90deg,
            rgba(0,0,0,0) 0%,
            rgba(17,24,39,.45) 15%,
            rgba(17,24,39,.75) 50%,
            rgba(17,24,39,.45) 85%,
            rgba(0,0,0,0) 100%
          );
          border-radius: 999px;
        }
      `}</style>
      <hr className="divider-line" />
    </div>
  );
}
