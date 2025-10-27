import React, { useState, useId } from "react";
import "./BlockSidebar.css"; // keeps your existing styling

const tools = [
  { type: "text", label: "Text Block", icon: "📝" },
  { type: "image", label: "Image Block", icon: "🖼️" },
  { type: "quiz", label: "Quiz Block", icon: "❓" },
  { type: "table", label: "Table Block", icon: "🔢" },
  { type: "infobox", label: "Info Box", icon: "ℹ️" },
  { type: "divider", label: "Page Divider", icon: "⎯" },
];

export default function BlockSidebar({ onAdd }) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  return (
    <>
      {/* Lightweight styles to support the open/close UX without requiring CSS edits */}
      <style>{`
        .bs-hamburger {
          position: fixed;
          left: 14px;
          top: 14px;
          z-index: 1000;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(2,6,23,.10);
          font-weight: 800;
          cursor: pointer;
          user-select: none;
        }
        .bs-hamburger:hover{ filter: brightness(1.02); }
        .bs-hamburger .bars {
          width: 18px; height: 14px; position: relative; display: inline-block;
        }
        .bs-hamburger .bars::before,
        .bs-hamburger .bars::after,
        .bs-hamburger .bars span {
          content: ""; position: absolute; left: 0; right: 0; height: 2px; background: #0f172a; border-radius: 2px;
        }
        .bs-hamburger .bars::before { top: 0; }
        .bs-hamburger .bars span { top: 6px; }
        .bs-hamburger .bars::after { bottom: 0; }

        /* Optional smooth slide if your CSS doesn't already provide it */
        .blockSidebar {
          transition: transform .2s ease, opacity .2s ease;
        }
        .blockSidebar.closed {
          transform: translateX(-110%);
          opacity: 0;
          pointer-events: none;
        }

        /* Close button in header */
        .bs-close {
          margin-left: auto;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #0f172a;
          border-radius: 10px;
          padding: 6px 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .bs-close:hover { filter: brightness(1.03); }
      `}</style>

      {/* Hamburger (appears only when sidebar is closed) */}
      {!open && (
        <button
          className="bs-hamburger"
          aria-label="Open tools sidebar"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(true)}
        >
          <span className="bars"><span /></span>
          Tools
        </button>
      )}

      {/* Sidebar */}
      <aside
        id={panelId}
        className={`blockSidebar ${open ? "open" : "closed"}`}
        aria-hidden={!open}
      >
        <div className="sidebarHeader" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>E-Book Tools</h3>
          <button
            type="button"
            className="bs-close"
            onClick={() => setOpen(false)}
            aria-label="Close tools sidebar"
            title="Close"
          >
            Close
          </button>
        </div>

        <div className="toolList">
          {tools.map((tool) => (
            <button
              key={tool.type}
              className="toolButton"
              onClick={() => onAdd?.(tool.type)}
            >
              <span className="toolIcon">{tool.icon}</span>
              <span className="toolLabel">{tool.label}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
