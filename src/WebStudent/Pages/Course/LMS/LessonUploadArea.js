// import React, { useRef, useState } from "react";
// import API from "../../../../LoginSystem/axios";

// /*
// Props:
// - label (string)
// - folder (string) e.g. courses/<courseId>/sections/<sectionId>
// - accept (string) default: any type
// - type (string) e.g. "video" | "pdf" | "audio" | "slides" | ...
// - onUploaded ({ key, duration, size, contentType })
// - fileInputRef (optional) forward external ref
// */
// export default function LessonUploadArea({
//   label = "Upload File",
//   folder = "",
//   accept = "*/*", // value is fine here; just avoid writing */ in block comments
//   type = "file",
//   onUploaded,
//   fileInputRef: externalRef,
// }) {
//   const localRef = useRef(null);
//   const setInputRef = (el) => {
//     localRef.current = el;
//     if (externalRef) {
//       if (typeof externalRef === "function") externalRef(el);
//       else externalRef.current = el;
//     }
//   };

//   const [fileName, setFileName] = useState("");
//   const [status, setStatus] = useState("idle"); // idle|signing|uploading|done|error
//   const [progress, setProgress] = useState(0);
//   const [errorMsg, setErrorMsg] = useState("");

//   const handleClick = () => localRef.current?.click();
//   const onDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
//   const onChange = (e) => handleFiles(e.target.files);

//   async function handleFiles(files) {
//     const file = files && files[0];
//     if (!file) return;

//     setFileName(file.name);
//     setStatus("signing");
//     setProgress(0);
//     setErrorMsg("");

//     // 1) Presign PUT
//     try {
//       const { data: sig } = await API.post("/api/media/presignPut", {
//         filename: file.name,
//         contentType: file.type || "application/octet-stream",
//         folder,
//       });
//       if (!sig?.url || !sig?.key) throw new Error(sig?.error || "presign failed");

//       // 2) PUT to S3
//       setStatus("uploading");
//       const putRes = await fetch(sig.url, { method: "PUT", body: file });
//       if (!putRes.ok) throw new Error(`S3 PUT failed (${putRes.status})`);
//       setProgress(100);

//       const duration =
//         String(type).toLowerCase() === "video"
//           ? await getVideoDuration(file).catch(() => 0)
//           : 0;

//       setStatus("done");
//       onUploaded?.({
//         key: sig.key,
//         duration,
//         size: file.size,
//         contentType: file.type || "application/octet-stream",
//       });
//       return;
//     } catch (err) {
//       console.error("Direct PUT failed:", err);
//       setErrorMsg(`Direct upload failed: ${err.message}`);
//     }

//     // 3) Fallback via backend proxy
//     try {
//       setStatus("uploading");
//       const fd = new FormData();
//       fd.append("file", file);
//       fd.append("folder", folder || "uploads");

//       const { data } = await API.post("/api/media/upload-direct", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//         onUploadProgress: (e) => {
//           if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
//         },
//       });

//       const duration =
//         String(type).toLowerCase() === "video"
//           ? await getVideoDuration(file).catch(() => 0)
//           : 0;

//       setStatus("done");
//       setProgress(100);
//       onUploaded?.({
//         key: data.key,
//         duration,
//         size: file.size,
//         contentType: file.type || "application/octet-stream",
//       });
//     } catch (e) {
//       console.error("Server upload failed:", e);
//       setStatus("error");
//       setErrorMsg(`Upload failed: ${e.response?.data?.error || e.message}`);
//     }
//   }

//   return (
//     <div
//       className="border rounded p-5 text-center bg-light"
//       onClick={handleClick}
//       onDragOver={(e) => e.preventDefault()}
//       onDrop={onDrop}
//       style={{
//         cursor: "pointer",
//         minHeight: 160,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         flexDirection: "column",
//       }}
//       title="Click or drop a file"
//     >
//       <input
//         ref={setInputRef}
//         type="file"
//         accept={accept}
//         onChange={onChange}
//         style={{ display: "none" }}
//       />
//       <div><span style={{ fontSize: 24, marginRight: 8 }}>📁</span><strong>{label}</strong></div>
//       <div className="text-muted">Drop files here or <u>browse files</u></div>

//       {fileName && (
//         <div className="small mt-2">
//           {fileName} • {status}{status === "uploading" ? ` • ${progress}%` : ""}
//         </div>
//       )}

//       {status === "uploading" && (
//         <div className="mt-2" style={{ width: "80%", height: 8, background: "#eee", borderRadius: 4 }}>
//           <div style={{ height: "100%", width: `${progress}%`, background: "#0d6efd", borderRadius: 4, transition: "width .2s ease" }} />
//         </div>
//       )}

//       {status === "error" && <div className="text-danger small mt-2">{errorMsg}</div>}
//     </div>
//   );
// }

// function getVideoDuration(file) {
//   return new Promise((resolve, reject) => {
//     const url = URL.createObjectURL(file);
//     const v = document.createElement("video");
//     v.preload = "metadata";
//     v.onloadedmetadata = () => {
//       URL.revokeObjectURL(url);
//       resolve(Math.round(v.duration || 0));
//     };
//     v.onerror = reject;
//     v.src = url;
//   });
// }


import React, { useRef, useState } from "react";
import API from "../../../../LoginSystem/axios";
import axios from "axios"; // ⭐ REQUIRED FOR S3 PUT

/*
Props:
- label
- folder
- accept
- type ("video"|"pdf"|"audio"|...)
- onUploaded ({ key, duration, size, contentType })
- fileInputRef (optional)
*/

export default function LessonUploadArea({
  label = "Upload File",
  folder = "",
  accept = "*/*",
  type = "file",
  onUploaded,
  fileInputRef: externalRef,
}) {
  const localRef = useRef(null);
  const setInputRef = (el) => {
    localRef.current = el;
    if (externalRef) {
      if (typeof externalRef === "function") externalRef(el);
      else externalRef.current = el;
    }
  };

  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | signing | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleClick = () => localRef.current?.click();
  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
  const onChange = (e) => handleFiles(e.target.files);

  async function handleFiles(files) {
    const file = files && files[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("signing");
    setProgress(0);
    setErrorMsg("");

    // 1️⃣ PRESIGN URL
    let sig;
    try {
      const res = await API.post("/api/media/presignPut", {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        folder,
      });
      sig = res.data;

      if (!sig?.url || !sig?.key) throw new Error("Invalid presign response");
    } catch (err) {
      console.error("Presign failed:", err);
      setStatus("error");
      setErrorMsg("Failed to generate upload link");
      return;
    }

    // 2️⃣ DIRECT UPLOAD TO S3 (Axios PUT)
    try {
      setStatus("uploading");

      await axios.put(sig.url, file, {
        headers: { "Content-Type": file.type },
        timeout: 10 * 60 * 1000, // ⭐ 10 minutes
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          }
        },
      });

      setProgress(100);

      // 3️⃣ If video: extract duration
      const duration =
        type.toLowerCase() === "video"
          ? await getVideoDuration(file).catch(() => 0)
          : 0;

      setStatus("done");

      onUploaded?.({
        key: sig.key,
        duration,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });

      return;
    } catch (err) {
      console.error("Direct PUT failed:", err);
      setErrorMsg(`Direct upload failed: ${err.message}`);
    }

    // 3️⃣ FALLBACK — UPLOAD THROUGH BACKEND
    try {
      setStatus("uploading");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder || "uploads");

      const { data } = await API.post("/api/media/upload-direct", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      const duration =
        type.toLowerCase() === "video"
          ? await getVideoDuration(file).catch(() => 0)
          : 0;

      setStatus("done");
      setProgress(100);

      onUploaded?.({
        key: data.key,
        duration,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    } catch (e) {
      console.error("Server upload failed:", e);
      setStatus("error");
      setErrorMsg(`Upload failed: ${e.response?.data?.error || e.message}`);
    }
  }

  return (
    <div
      className="border rounded p-5 text-center bg-light"
      onClick={handleClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{
        cursor: "pointer",
        minHeight: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
      title="Click or drop a file"
    >
      <input
        ref={setInputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        style={{ display: "none" }}
      />

      <div>
        <span style={{ fontSize: 24, marginRight: 8 }}>📁</span>
        <strong>{label}</strong>
      </div>
      <div className="text-muted">
        Drop files here or <u>browse files</u>
      </div>

      {fileName && (
        <div className="small mt-2">
          {fileName} • {status}
          {status === "uploading" ? ` • ${progress}%` : ""}
        </div>
      )}

      {status === "uploading" && (
        <div
          className="mt-2"
          style={{
            width: "80%",
            height: 8,
            background: "#eee",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#0d6efd",
              borderRadius: 4,
              transition: "width .2s ease",
            }}
          />
        </div>
      )}

      {status === "error" && (
        <div className="text-danger small mt-2">{errorMsg}</div>
      )}
    </div>
  );
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(v.duration || 0));
    };
    v.onerror = reject;
    v.src = url;
  });
}
