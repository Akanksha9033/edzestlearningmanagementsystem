// import React, { useMemo, useEffect } from "react";

// /**
//  * InfoBoxBlock
//  * Admin: editable "Title" + "Info" (multiline). Shows a live student preview.
//  * Student: handled in ChapterViewer (click-to-open card).
//  *
//  * Data shape saved on the block:
//  * {
//  *   id,
//  *   type: "infobox",
//  *   data: {
//  *     type: "infobox",
//  *     title: string,
//  *     info: string
//  *   }
//  * }
//  */
// export default function InfoBoxBlock({ block = {}, onChange, isStudent = false }) {
//   const data = useMemo(() => {
//     const d = block.data || {};
//     return {
//       type: "infobox",
//       title: typeof d.title === "string" ? d.title : "",
//       info: typeof d.info === "string" ? d.info : "",
//     };
//   }, [block.data]);

//   // ✅ Initialize once if block was added without proper data
//   useEffect(() => {
//     if (block?.type === "infobox" && (!block.data || typeof block.data.title !== "string")) {
//       onChange?.({
//         ...block,
//         type: "infobox",
//         data: { type: "infobox", title: "", info: "" },
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // run once

//   const update = (partial) => {
//     onChange?.({
//       ...block,
//       type: "infobox",
//       data: { ...data, ...partial, type: "infobox" },
//     });
//   };

//   if (isStudent) {
//     // Student rendering is done in ChapterViewer; we keep admin-only UI here.
//     return null;
//   }

//   return (
//     <div>
//       <style>{`
//         .ibx-label{ font-size:12px; color:#6b7280; margin-bottom:4px; display:block; }
//         .ibx-input{
//           width:100%; border:1px solid #e5e7eb; border-radius:10px;
//           padding:10px 12px; font-size:14px; outline:none;
//         }
//         .ibx-input:focus{ box-shadow:0 0 0 3px rgba(71,72,172,.18); border-color:#c7c9ff; }
//         .ibx-textarea{
//           width:100%; min-height:120px; border:1px solid #e5e7eb; border-radius:10px;
//           padding:10px 12px; font-size:14px; outline:none; resize:vertical;
//           line-height:1.6;
//         }
//         .ibx-textarea:focus{ box-shadow:0 0 0 3px rgba(71,72,172,.18); border-color:#c7c9ff; }
//         .ibx-preview{
//           margin-top:12px; padding:14px; border-radius:14px; background:#ffffff;
//           border:1px dashed #d1d5db;
//         }
//         .ibx-box{
//           cursor:default;
//           border:2px solid #1f2937; /* dark lines */
//           border-radius:14px;
//           padding:14px;
//           background:#fff;
//         }
//         .ibx-title{
//           font-weight:800; color:#0f172a; margin:0 0 6px 0;
//         }
//         .ibx-sub{
//           font-size:12px; color:#6b7280; margin-bottom:10px;
//         }
//         .ibx-btn{
//           appearance:none; border:none; border-radius:12px; padding:8px 12px;
//           color:#fff; font-weight:800; cursor:pointer; background:#4748ac;
//           box-shadow:0 8px 22px rgba(71,72,172,.25);
//         }
//       `}</style>

//       <label className="ibx-label">Info Box Title</label>
//       <input
//         className="ibx-input"
//         placeholder="e.g., Quick Tip"
//         value={data.title}
//         onChange={(e) => update({ title: e.target.value })}
//       />

//       <div style={{ height: 8 }} />

//       <label className="ibx-label">Info (shown to students when they click)</label>
//       <textarea
//         className="ibx-textarea"
//         placeholder="Write the explanation, hint, or additional information…"
//         value={data.info}
//         onChange={(e) => update({ info: e.target.value })}
//       />

//       <div className="ibx-preview">
//         <div className="ibx-sub">Student preview</div>
//         <div className="ibx-box">
//           <div className="ibx-title">{data.title || "Untitled Info"}</div>
//           <div style={{ fontSize: 13, color: "#374151" }}>
//             Students see only this box. When they click it in the reader, your info will open in a pop-up with a close button.
//           </div>
//           <div style={{ marginTop: 10 }}>
//             <button className="ibx-btn" type="button" disabled>
//               Click to Read (student)
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }













// src/components/Blocks/InfoBoxBlock.jsx
import React, { useMemo, useEffect } from "react";

/**
 * InfoBoxBlock
 * Admin: editable list of one or more Title+Info entries.
 * Student: rendering handled in ChapterViewer (currently uses only the 1st entry for compatibility).
 *
 * Data shape saved on the block:
 * {
 *   id,
 *   type: "infobox",
 *   data: {
 *     type: "infobox",
 *     // Back-compat single fields (kept in sync with first item)
 *     title: string,
 *     info: string,
 *     // New multi-entry list
 *     items: Array<{ title: string, info: string }>
 *   }
 * }
 */
export default function InfoBoxBlock({ block = {}, onChange, isStudent = false }) {
  const data = useMemo(() => {
    const d = block.data || {};
    const items = Array.isArray(d.items)
      ? d.items.map((it) => ({
          title: typeof it?.title === "string" ? it.title : "",
          info: typeof it?.info === "string" ? it.info : "",
        }))
      : [
          {
            title: typeof d.title === "string" ? d.title : "",
            info: typeof d.info === "string" ? d.info : "",
          },
        ];
    return {
      type: "infobox",
      title: typeof d.title === "string" ? d.title : (items[0]?.title || ""),
      info: typeof d.info === "string" ? d.info : (items[0]?.info || ""),
      items,
    };
  }, [block.data]);

  // Initialize if block was added without proper data
  useEffect(() => {
    if (block?.type === "infobox" && (!block.data || typeof block.data.title !== "string" && !Array.isArray(block.data.items))) {
      onChange?.({
        ...block,
        type: "infobox",
        data: { type: "infobox", title: "", info: "", items: [{ title: "", info: "" }] },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once

  const emit = (next) => {
    // Keep single fields mirrored to first item for back-compat with ChapterViewer
    const first = (next.items && next.items[0]) || (data.items && data.items[0]) || { title: "", info: "" };
    onChange?.({
      ...block,
      type: "infobox",
      data: {
        type: "infobox",
        title: typeof next.title === "string" ? next.title : first.title,
        info: typeof next.info === "string" ? next.info : first.info,
        items: Array.isArray(next.items) ? next.items : data.items,
      },
    });
  };

  // Single-field setters (edit the first item and mirror)
  const setTitle = (value) => {
    const items = data.items.slice();
    if (!items.length) items.push({ title: "", info: "" });
    items[0] = { ...items[0], title: value };
    emit({ title: value, items });
  };
  const setInfo = (value) => {
    const items = data.items.slice();
    if (!items.length) items.push({ title: "", info: "" });
    items[0] = { ...items[0], info: value };
    emit({ info: value, items });
  };

  // Multi-entry actions
  const setItem = (idx, patch) => {
    const items = data.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    emit({ items });
  };
  const addItem = () => {
    const items = [...data.items, { title: "", info: "" }];
    emit({ items });
  };
  const removeItem = (idx) => {
    if (data.items.length === 1) return; // keep at least one
    const items = data.items.filter((_, i) => i !== idx);
    emit({ items });
  };
  const moveUp = (idx) => {
    if (idx <= 0) return;
    const items = data.items.slice();
    [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
    emit({ items });
  };
  const moveDown = (idx) => {
    if (idx >= data.items.length - 1) return;
    const items = data.items.slice();
    [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
    emit({ items });
  };

  if (isStudent) return null;

  return (
    <div>
      <style>{`
        .ibx-label{ font-size:12px; color:#6b7280; margin-bottom:4px; display:block; }
        .ibx-input{
          width:100%; border:1px solid #e5e7eb; border-radius:10px;
          padding:10px 12px; font-size:14px; outline:none;
        }
        .ibx-input:focus{ box-shadow:0 0 0 3px rgba(71,72,172,.18); border-color:#c7c9ff; }
        .ibx-textarea{
          width:100%; min-height:120px; border:1px solid #e5e7eb; border-radius:10px;
          padding:10px 12px; font-size:14px; outline:none; resize:vertical;
          line-height:1.6;
        }
        .ibx-textarea:focus{ box-shadow:0 0 0 3px rgba(71,72,172,.18); border-color:#c7c9ff; }

        .ibx-row{ border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
        .ibx-row + .ibx-row{ margin-top:10px; }
        .ibx-row-head{ display:flex; align-items:center; gap:8px; }
        .ibx-index{ font-size:12px; color:#6b7280; }
        .ibx-row-actions{ margin-left:auto; display:flex; gap:6px; }
        .ibx-btn{
          appearance:none; border:1px solid #3f44a9; border-radius:10px; padding:6px 10px;
          background:#4748ac; color:#fff; font-weight:800; cursor:pointer;
        }
        .ibx-btn.alt{ background:#fff; color:#111827; border-color:#e5e7eb; }
        .ibx-btn.sm{ padding:4px 8px; font-size:12px; }
        .ibx-muted{ font-size:12px; color:#6b7280; }

        .ibx-preview{
          margin-top:12px; padding:14px; border-radius:14px; background:#ffffff;
          border:1px dashed #d1d5db;
        }
        .ibx-box{
          cursor:default;
          border:2px solid #1f2937;
          border-radius:14px;
          padding:14px;
          background:#fff;
        }
        .ibx-title{ font-weight:800; color:#0f172a; margin:0 0 6px 0; }
        .ibx-sub{ font-size:12px; color:#6b7280; margin-bottom:10px; }
        .ibx-chip{ display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; background:#eef2ff; border:1px solid #e0e7ff; color:#374151; }
      `}</style>

      {/* Quick single-fields (first item, kept for compatibility) */}
      <label className="ibx-label">Info Box Title (first item)</label>
      <input
        className="ibx-input"
        placeholder="e.g., Quick Tip"
        value={data.title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div style={{ height: 8 }} />

      <label className="ibx-label">Info (first item — students see this if your viewer reads single entry)</label>
      <textarea
        className="ibx-textarea"
        placeholder="Write the explanation, hint, or additional information…"
        value={data.info}
        onChange={(e) => setInfo(e.target.value)}
      />

      <div style={{ height: 12 }} />

      {/* Multi-entry editor */}
      <div className="ibx-row-head">
        <div className="ibx-muted">Items: {data.items.length}</div>
        <div className="ibx-row-actions">
          <button type="button" className="ibx-btn sm" onClick={addItem}>+ Add Item</button>
        </div>
      </div>

      <div style={{ height: 8 }} />

      {data.items.map((item, i) => (
        <div key={i} className="ibx-row">
          <div className="ibx-row-head" style={{ marginBottom: 8 }}>
            <span className="ibx-index">Item {i + 1}</span>
            <div className="ibx-row-actions">
              <button type="button" className="ibx-btn alt sm" onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
              <button type="button" className="ibx-btn alt sm" onClick={() => moveDown(i)} disabled={i === data.items.length - 1}>↓</button>
              <button type="button" className="ibx-btn alt sm" onClick={() => removeItem(i)} disabled={data.items.length === 1}>Delete</button>
            </div>
          </div>

          <label className="ibx-label">Title</label>
          <input
            className="ibx-input"
            placeholder="Title"
            value={item.title}
            onChange={(e) => setItem(i, { title: e.target.value })}
          />

          <div style={{ height: 8 }} />

          <label className="ibx-label">Info</label>
          <textarea
            className="ibx-textarea"
            placeholder="Info text for this item…"
            value={item.info}
            onChange={(e) => setItem(i, { info: e.target.value })}
          />
        </div>
      ))}

      {/* Preview */}
      {/* <div className="ibx-preview">
        <div className="ibx-sub">
          Student preview (compact): {data.items.length > 1 ? <span className="ibx-chip">{data.items.length} items</span> : null}
        </div>
        <div className="ibx-box">
          <div className="ibx-title">{(data.items[0]?.title || "Untitled Info")}</div>
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
            Students click an Info box in the reader to open it. Your current reader uses the first item.
          </div>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "#374151", lineHeight: 1.5 }}>
            {data.items.map((it, i) => (
              <li key={i} style={{ margin: "4px 0" }}>
                <strong>{it.title || "(no title)"}</strong>{it.info ? ": " + (it.info.length > 60 ? it.info.slice(0, 60) + "…" : it.info) : ""}
              </li>
            ))}
          </ol>
        </div>
      </div> */}



    </div>
  );
}
