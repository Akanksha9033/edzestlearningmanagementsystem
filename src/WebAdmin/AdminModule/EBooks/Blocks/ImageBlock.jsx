// import React, { useRef, useState, useEffect } from "react";
// import { uploadEBookImage } from "../api/ebooksApi";
// import "./ImageBlock.css";

// export default function ImageBlock({ block, onChange }) {
//   const fileInputRef = useRef(null);
//   const pasteRef = useRef(null);
//   const [uploading, setUploading] = useState(false);

//   const safeAlign = (v) =>
//     v === "left" || v === "right" || v === "center" ? v : "center";
//   const clampPct = (n) =>
//     Math.max(20, Math.min(100, Number.isFinite(n) ? n : 100));

//   // normalize block defaults (so admin preview matches student view)
//   useEffect(() => {
//     const next = {
//       ...block,
//       width: clampPct(parseInt(block?.width ?? 100, 10)),
//       align: safeAlign(block?.align),
//       caption: typeof block?.caption === "string" ? block.caption : "",
//     };
//     if (
//       next.width !== block?.width ||
//       next.align !== block?.align ||
//       next.caption !== block?.caption
//     ) {
//       onChange(next);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ✅ Handles file uploads (normal selection)
//   const handleFile = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     await uploadImage(file);
//   };

//   // ✅ Shared upload handler
//   const uploadImage = async (file) => {
//     try {
//       setUploading(true);
//       const res = await uploadEBookImage(file);
//       const uploadedUrl = res.data?.url;

//       if (uploadedUrl) {
//         onChange({
//           ...block,
//           src: uploadedUrl,
//           url: uploadedUrl,
//           width: clampPct(parseInt(block?.width ?? 100, 10)),
//           align: safeAlign(block?.align),
//           caption: block?.caption || "",
//         });
//       }
//     } catch (err) {
//       const msg =
//         err?.response?.data?.error || err.message || "Failed to upload image";
//       alert(msg);
//       console.error("[Image upload error]", err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   // ✅ Handle pasted image from clipboard
//   useEffect(() => {
//     const handlePaste = async (e) => {
//       if (uploading) return;
//       const items = e.clipboardData?.items;
//       if (!items) return;

//       for (const item of items) {
//         if (item.type.indexOf("image") !== -1) {
//           const file = item.getAsFile();
//           if (file) await uploadImage(file);
//         }
//       }
//     };

//     const node = pasteRef.current;
//     if (node) node.addEventListener("paste", handlePaste);
//     return () => node && node.removeEventListener("paste", handlePaste);
//   }, [uploading]);

//   // ✅ Manual URL input
//   const handleUrlChange = (e) => {
//     const inputUrl = e.target.value;
//     onChange({
//       ...block,
//       src: inputUrl,
//       url: inputUrl,
//       width: clampPct(parseInt(block?.width ?? 100, 10)),
//       align: safeAlign(block?.align),
//       caption: block?.caption || "",
//     });
//   };

//   // ✅ Resize control
//   const handleResize = (e) => {
//     const width = clampPct(parseInt(e.target.value, 10));
//     onChange({ ...block, width });
//   };

//   // ✅ Alignment control
//   const handleAlignChange = (e) => {
//     const align = safeAlign(e.target.value);
//     onChange({ ...block, align });
//   };

//   // ✅ Caption control (NEW)
//   const handleCaptionChange = (e) => {
//     onChange({ ...block, caption: e.target.value });
//   };

//   const imgUrl = block?.src || block?.url || "";
//   const widthPct = clampPct(parseInt(block?.width ?? 100, 10));
//   const align = safeAlign(block?.align);
//   const caption = block?.caption || "";

//   return (
//     <div ref={pasteRef} className="image-block" tabIndex={0}>
//       <style>{`
//         .image-block{ border:1px solid #e5e7eb; border-radius:14px; padding:12px; background:#fff; }
//         .upload-controls{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
//         .upload-btn{
//           border:none; background:#4748ac; color:#fff; font-weight:800; padding:8px 12px; border-radius:10px; cursor:pointer;
//           box-shadow:0 8px 22px rgba(71,72,172,.18);
//         }
//         .upload-btn:disabled{ opacity:.6; cursor:not-allowed; }
//         .url-input{ flex:1 1 260px; min-width:220px; border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; }
//         .align-controls{ display:flex; align-items:center; gap:8px; }
//         .image-preview{ margin-top:10px; }
//         .image-frame{ display:block; margin-left:auto; margin-right:auto; }
//         .image-frame.left{ margin-left:0; margin-right:auto; }
//         .image-frame.right{ margin-left:auto; margin-right:0; }
//         .resize-control{ display:flex; align-items:center; gap:8px; margin-top:8px; }

//         /* caption input */
//         .caption-wrap{ margin-top:8px; display:flex; align-items:center; gap:8px; }
//         .caption-label{ font-size:12px; color:#6b7280; }
//         .caption-input{
//           flex:1 1 auto;
//           border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px;
//         }
//         .caption-hint{ font-size:12px; color:#9ca3af; margin-top:4px; }
//       `}</style>

//       <div className="upload-controls">
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept="image/*"
//           onChange={handleFile}
//           style={{ display: "none" }}
//         />
//         <button
//           onClick={() => fileInputRef.current?.click()}
//           disabled={uploading}
//           className="upload-btn"
//         >
//           {uploading ? "Uploading..." : "📁 Upload Image"}
//         </button>

//         <span> or Paste Image URL:</span>
//         <input
//           type="text"
//           placeholder="https://example.com/image.jpg"
//           value={imgUrl}
//           onChange={handleUrlChange}
//           className="url-input"
//         />
//       </div>

//       <div className="text-gray-500 text-sm mt-2 italic">
//         📋 You can also <b>Ctrl + V</b> to paste an image directly here.
//       </div>

//       <div className="align-controls mt-3">
//         <label className="font-medium mr-2">🧭 Image Alignment:</label>
//         <select
//           value={align}
//           onChange={handleAlignChange}
//           className="border p-1 rounded"
//         >
//           <option value="left">Left</option>
//           <option value="center">Center</option>
//           <option value="right">Right</option>
//         </select>
//       </div>

//       {/* ✅ Image Preview + Caption */}
//       {imgUrl ? (
//         <div className="image-preview">
//           <img
//             src={imgUrl}
//             alt="E-Book Visual"
//             className={`image-frame ${align}`}
//             style={{
//               width: `${widthPct}%`,
//               maxWidth: "100%",
//               height: "auto",
//               display: "block",
//             }}
//           />

//           {/* Caption editor (per image) */}
//           <div className="caption-wrap" style={{
//             justifyContent:
//               align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"
//           }}>
//             <span className="caption-label">Caption:</span>
//             <input
//               className="caption-input"
//               type="text"
//               placeholder="Describe this image (shown under the image)"
//               value={caption}
//               onChange={handleCaptionChange}
//               // keep width visually aligned to image width
//               style={{ width: `${widthPct}%` }}
//             />
//           </div>
//           <div className="caption-hint" style={{
//             textAlign: align === "left" ? "left" : align === "right" ? "right" : "center"
//           }}>
//             This text will appear just beneath the image when published.
//           </div>

//           <div className="resize-control">
//             <label>Resize (%): </label>
//             <input
//               type="range"
//               min="20"
//               max="100"
//               value={widthPct}
//               onChange={handleResize}
//             />
//             <span>{widthPct}%</span>
//           </div>
//         </div>
//       ) : (
//         <div className="no-image-placeholder">No image selected or pasted</div>
//       )}
//     </div>
//   );
// }
import React, { useRef, useState, useEffect } from "react";
import { uploadEBookImage } from "../api/ebooksApi";
import "./ImageBlock.css";

export default function ImageBlock({ block, onChange }) {
  const fileInputRef = useRef(null);
  const pasteRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const safeAlign = (v) =>
    v === "left" || v === "right" || v === "center" ? v : "center";
  const clampPct = (n) =>
    Math.max(20, Math.min(100, Number.isFinite(n) ? n : 100));

  // normalize block defaults (so admin preview matches student view)
  useEffect(() => {
    const next = {
      ...block,
      width: clampPct(parseInt(block?.width ?? 100, 10)),
      align: safeAlign(block?.align),
      caption: typeof block?.caption === "string" ? block.caption : "",
    };
    if (
      next.width !== block?.width ||
      next.align !== block?.align ||
      next.caption !== block?.caption
    ) {
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Handles file uploads (normal selection)
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  };

  // ✅ Shared upload handler
  const uploadImage = async (file) => {
    try {
      setUploading(true);
      const res = await uploadEBookImage(file);
      const uploadedUrl = res.data?.url;

      if (uploadedUrl) {
        onChange({
          ...block,
          src: uploadedUrl,
          url: uploadedUrl,
          width: clampPct(parseInt(block?.width ?? 100, 10)),
          align: safeAlign(block?.align),
          caption: block?.caption || "",
        });
      }
    } catch (err) {
      // ✅ NEW: surface backend code/details if provided
      /* eslint-disable no-console */
      console.log("UPLOAD ERROR DETAILS:", err?.response?.data);
      const msg =
        err?.response?.data?.details || // ← most helpful from server
        err?.response?.data?.error ||
        err.message ||
        "Failed to upload image";
      /* eslint-enable no-console */
      alert(msg);
      console.error("[Image upload error]", err);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Handle pasted image from clipboard
  useEffect(() => {
    const handlePaste = async (e) => {
      if (uploading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) await uploadImage(file);
        }
      }
    };

    const node = pasteRef.current;
    if (node) node.addEventListener("paste", handlePaste);
    return () => node && node.removeEventListener("paste", handlePaste);
  }, [uploading]);

  // ✅ Manual URL input
  const handleUrlChange = (e) => {
    const inputUrl = e.target.value;
    onChange({
      ...block,
      src: inputUrl,
      url: inputUrl,
      width: clampPct(parseInt(block?.width ?? 100, 10)),
      align: safeAlign(block?.align),
      caption: block?.caption || "",
    });
  };

  // ✅ Resize control
  const handleResize = (e) => {
    const width = clampPct(parseInt(e.target.value, 10));
    onChange({ ...block, width });
  };

  // ✅ Alignment control
  const handleAlignChange = (e) => {
    const align = safeAlign(e.target.value);
    onChange({ ...block, align });
  };

  // ✅ Caption control (NEW)
  const handleCaptionChange = (e) => {
    onChange({ ...block, caption: e.target.value });
  };

  const imgUrl = block?.src || block?.url || "";
  const widthPct = clampPct(parseInt(block?.width ?? 100, 10));
  const align = safeAlign(block?.align);
  const caption = block?.caption || "";

  return (
    <div ref={pasteRef} className="image-block" tabIndex={0}>
      <style>{`
        .image-block{ border:1px solid #e5e7eb; border-radius:14px; padding:12px; background:#fff; }
        .upload-controls{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .upload-btn{
          border:none; background:#4748ac; color:#fff; font-weight:800; padding:8px 12px; border-radius:10px; cursor:pointer;
          box-shadow:0 8px 22px rgba(71,72,172,.18);
        }
        .upload-btn:disabled{ opacity:.6; cursor:not-allowed; }
        .url-input{ flex:1 1 260px; min-width:220px; border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; }
        .align-controls{ display:flex; align-items:center; gap:8px; }
        .image-preview{ margin-top:10px; }
        .image-frame{ display:block; margin-left:auto; margin-right:auto; }
        .image-frame.left{ margin-left:0; margin-right:auto; }
        .image-frame.right{ margin-left:auto; margin-right:0; }
        .resize-control{ display:flex; align-items:center; gap:8px; margin-top:8px; }

        /* caption input */
        .caption-wrap{ margin-top:8px; display:flex; align-items:center; gap:8px; }
        .caption-label{ font-size:12px; color:#6b7280; }
        .caption-input{
          flex:1 1 auto;
          border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px;
        }
        .caption-hint{ font-size:12px; color:#9ca3af; margin-top:4px; }
      `}</style>

      <div className="upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="upload-btn"
        >
          {uploading ? "Uploading..." : "📁 Upload Image"}
        </button>

        <span> or Paste Image URL:</span>
        <input
          type="text"
          placeholder="https://example.com/image.jpg"
          value={imgUrl}
          onChange={handleUrlChange}
          className="url-input"
        />
      </div>

      <div className="text-gray-500 text-sm mt-2 italic">
        📋 You can also <b>Ctrl + V</b> to paste an image directly here.
      </div>

      <div className="align-controls mt-3">
        <label className="font-medium mr-2">🧭 Image Alignment:</label>
        <select
          value={align}
          onChange={handleAlignChange}
          className="border p-1 rounded"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* ✅ Image Preview + Caption */}
      {imgUrl ? (
        <div className="image-preview">
          <img
            src={imgUrl}
            alt="E-Book Visual"
            className={`image-frame ${align}`}
            style={{
              width: `${widthPct}%`,
              maxWidth: "100%",
              height: "auto",
              display: "block",
            }}
          />

          {/* Caption editor (per image) */}
          <div className="caption-wrap" style={{
            justifyContent:
              align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"
          }}>
            <span className="caption-label">Caption:</span>
            <input
              className="caption-input"
              type="text"
              placeholder="Describe this image (shown under the image)"
              value={caption}
              onChange={handleCaptionChange}
              // keep width visually aligned to image width
              style={{ width: `${widthPct}%` }}
            />
          </div>
          <div className="caption-hint" style={{
            textAlign: align === "left" ? "left" : align === "right" ? "right" : "center"
          }}>
            This text will appear just beneath the image when published.
          </div>

          <div className="resize-control">
            <label>Resize (%): </label>
            <input
              type="range"
              min="20"
              max="100"
              value={widthPct}
              onChange={handleResize}
            />
            <span>{widthPct}%</span>
          </div>
        </div>
      ) : (
        <div className="no-image-placeholder">No image selected or pasted</div>
      )}
    </div>
  );
}
