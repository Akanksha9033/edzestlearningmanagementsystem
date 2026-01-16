import React from "react";
import { createPortal } from "react-dom";

export default function IntroModal({ open, onClose, onStart }) {
  if (!open) return null;

  return createPortal(
    <>
      {/* ================= INLINE CSS ================= */}
      <style>{`
        .intro-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .intro-modal {
          width: 720px;
          max-width: 92%;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          animation: modalIn 0.25s ease;
        }

        .intro-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          background: linear-gradient(180deg, #f8fafc, #ffffff);
          border-bottom: 1px solid #e5e7eb;
        }

        .intro-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .intro-close {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
        }

        .intro-body {
          padding: 22px 26px;
          font-size: 14px;
          color: #374151;
        }

        .intro-subtitle {
          margin-bottom: 14px;
          color: #6b7280;
        }

        .intro-list {
          padding-left: 18px;
          margin-bottom: 16px;
        }

        .intro-list li {
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .intro-list code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 13px;
        }

        .intro-hint {
          font-size: 12.5px;
          color: #6b7280;
          margin-top: 8px;
        }

        .intro-foot {
          padding: 18px;
          display: flex;
          justify-content: center;
          border-top: 1px solid #e5e7eb;
        }

        .intro-start {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          border: none;
          padding: 12px 34px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(79, 70, 229, 0.35);
        }

        .intro-start:hover {
          opacity: 0.95;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* ================= MODAL ================= */}
      <div className="intro-backdrop">
        <div className="intro-modal">
          {/* HEADER */}
          <div className="intro-head">
            <h3 className="intro-title">Features & Tools</h3>
            <button className="intro-close" onClick={onClose}>
              Close
            </button>
          </div>

          {/* BODY */}
          <div className="intro-body">
            <p className="intro-subtitle">
              Quick tips to get the most out of your reading experience:
            </p>

            <ol className="intro-list">
              <li>
                <strong>Summarize the chapter</strong> by clicking the top-right
                button <em>“Summarize chapter”</em>.
              </li>
              <li>
                <strong>Make notes in NOTES PAD.</strong> Press{" "}
                <code>Ctrl+I</code> to open and <code>Ctrl+M</code> to close.
              </li>
              <li>
                <strong>Download your notes</strong> as a Word file or save to the
                cloud anytime.
              </li>
              <li>
                <strong>Select text and search on Google</strong> using the
                action chip that appears.
              </li>
              <li>
                <strong>Select a paragraph</strong> to convert it into bullet
                points with the <em>“Summarize”</em> option.
              </li>
            </ol>

            <p className="intro-hint">
              You can switch your Notes layout between split-screen and floating
              window from the Notes toolbar.
            </p>
          </div>

          {/* FOOTER */}
          <div className="intro-foot">
            <button className="intro-start" onClick={onStart}>
              Start Reading
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
