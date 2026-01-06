
// // ExamShell.jsx


// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Box, CircularProgress, Typography } from "@mui/material";
// import { useAuth } from "../../../LoginSystem/context/AuthContext";
// import API from "../../../LoginSystem/axios";
// import ExamRunner from "./ExamRunner";

// // format seconds -> hh:mm:ss
// function formatHMS(sec) {
//   const s = Math.max(0, Math.floor(sec));
//   const h = Math.floor(s / 3600);
//   const m = Math.floor((s % 3600) / 60);
//   const r = s % 60;
//   return [h, m, r].map(v => String(v).padStart(2, "0")).join(":");
// }

// // helpers to normalize minutes/seconds confusion
// const minToSec = (m) => Math.max(0, Math.floor(Number(m || 0) * 60));
// const normalizeSeconds = ({ timeLeftSec, durationSec }, mockMinutes) => {
//   const s  = Number(timeLeftSec  || 0);
//   const ds = Number(durationSec  || 0);
//   const mm = Number(mockMinutes  || 0);
//   if (mm > 0) {
//     const looksLikeMinutes = (x) => x > 0 && Math.abs(x - mm) <= 2;
//     if (looksLikeMinutes(s))  return minToSec(s);
//     if (looksLikeMinutes(ds)) return minToSec(ds);
//     if (s >= mm * 30)  return s;
//     if (ds >= mm * 30) return ds;
//     return minToSec(mm);
//   }
//   if (s >= 60)  return s;
//   if (ds >= 60) return ds;
//   if (s > 0)    return s * 60;
//   if (ds > 0)   return ds * 60;
//   return 0;
// };

// export default function ExamShell() {
//   const { attemptId } = useParams();
//   const nav = useNavigate();
//   const { ready, user } = useAuth();

//   console.log("🟣 ExamShell MOUNTED");
// console.log("🟣 attemptId from URL:", attemptId);
// console.log("🟣 ready:", ready);
// console.log("🟣 user:", user);

//   const [loading, setLoading] = useState(true);
//   const [meta, setMeta] = useState(null);
//   const [mockMinutes, setMockMinutes] = useState(null);

//   // auth gate
//  useEffect(() => {
//   if (!ready) return;

//   // 🔒 wait a tick so auth can hydrate
//   const t = setTimeout(() => {
//     if (!user) nav("/login", { replace: true });
//   }, 300);

//   return () => clearTimeout(t);
// }, [ready, user, nav]);


//   // load attempt
//   useEffect(() => {
//     if (!ready || !user) return;
//     (async () => {
//       try {
//         const r = await API.get(`/api/student/attempts/${attemptId}`);
//         setMeta(r.data);
//       } catch (e) {
//         console.error(e);
//         alert("Attempt not found");
//         nav("/student/mocktests", { replace: true });
//       }
//     })();
//   }, [attemptId, ready, user, nav]);

//   // load admin minutes for that mock
//   useEffect(() => {
//     if (!meta?.mockTestId) return;
//     (async () => {
//       try {
//         const { data } = await API.get("/api/student/mocktests");
//         const items = Array.isArray(data?.items) ? data.items : [];
//         const mock = items.find(m => m.mockTestId === meta.mockTestId);
//         if (mock && mock.duration != null) setMockMinutes(Number(mock.duration));
//       } catch (e) {
//         console.error("Fetch mock minutes failed:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [meta?.mockTestId]);

//   if (!ready || loading || !meta) {
//     return (
//       <Box textAlign="center" mt={10}>
//         <CircularProgress />
//         <Typography mt={2}>Loading exam…</Typography>
//       </Box>
//     );
//   }

//   // final seed seconds
//   const seedSec = normalizeSeconds(
//     { timeLeftSec: meta.timeLeftSec, durationSec: meta.durationSec },
//     mockMinutes
//   );
//   console.log("🟢 META FROM SERVER:", meta);
// console.log("🟢 MOCK MINUTES:", mockMinutes);
// console.log("🟢 SEED SECONDS:", seedSec);

//   return (
//     <ExamRunner
//       attemptId={attemptId}
//       meta={meta}
//       seedSec={seedSec}
//       onMetaUpdate={setMeta}
//       onExit={() => nav("/student/mocktests", { replace: true })}
//       formatHMS={formatHMS}
//     />
//   );
// }

// ExamShell.jsx

// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Box, CircularProgress, Typography } from "@mui/material";
// import { useAuth } from "../../../LoginSystem/context/AuthContext";
// import API from "../../../LoginSystem/axios";
// import ExamRunner from "./ExamRunner";

// // format seconds -> hh:mm:ss
// // function formatHMS(sec) {
// //   const s = Math.max(0, Math.floor(sec));
// //   const h = Math.floor(s / 3600);
// //   const m = Math.floor((s % 3600) / 60);
// //   const r = s % 60;
// //   return [h, m, r].map(v => String(v).padStart(2, "0")).join(":");
// // }

// function formatMinutesOnly(sec) {
//   const safe = Math.max(0, Math.floor(sec || 0));
//   const minutes = Math.floor(safe / 60);
//   return String(minutes);
// }


// // helpers to normalize minutes/seconds confusion
// const minToSec = (m) => Math.max(0, Math.floor(Number(m || 0) * 60));
// const normalizeSeconds = ({ timeLeftSec, durationSec }, mockMinutes) => {
//   const s  = Number(timeLeftSec  || 0);
//   const ds = Number(durationSec  || 0);
//   const mm = Number(mockMinutes  || 0);
//   if (mm > 0) {
//     const looksLikeMinutes = (x) => x > 0 && Math.abs(x - mm) <= 2;
//     if (looksLikeMinutes(s))  return minToSec(s);
//     if (looksLikeMinutes(ds)) return minToSec(ds);
//     if (s >= mm * 30)  return s;
//     if (ds >= mm * 30) return ds;
//     return minToSec(mm);
//   }
//   if (s >= 60)  return s;
//   if (ds >= 60) return ds;
//   if (s > 0)    return s * 60;
//   if (ds > 0)   return ds * 60;
//   return 0;
// };

// export default function ExamShell() {
//   const { attemptId } = useParams();
//   const nav = useNavigate();
//   const { ready, user } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [meta, setMeta] = useState(null);
//   const [mockMinutes, setMockMinutes] = useState(null);

//   // auth gate
//   useEffect(() => {
//     if (!ready) return;
//     const t = setTimeout(() => {
//       if (!user) nav("/login", { replace: true });
//     }, 300);
//     return () => clearTimeout(t);
//   }, [ready, user, nav]);

//   // load attempt
//   useEffect(() => {
//     if (!ready || !user) return;
//     (async () => {
//       try {
//         const r = await API.get(`/api/student/attempts/${attemptId}`);
//         setMeta(r.data);
//       } catch (e) {
//         console.error(e);
//         alert("Attempt not found");
//         nav("/student/mocktests", { replace: true });
//       }
//     })();
//   }, [attemptId, ready, user, nav]);

//   // load admin minutes for that mock
//   useEffect(() => {
//     if (!meta?.mockTestId) return;
//     (async () => {
//       try {
//         const { data } = await API.get("/api/student/mocktests");
//         const items = Array.isArray(data?.items) ? data.items : [];
//         const mock = items.find(m => m.mockTestId === meta.mockTestId);

//         // ✅ SAFE: support both durationMinutes and duration
//         if (mock) {
//           const minutes =
//             mock.durationMinutes ??
//             mock.duration ??
//             null;

//           if (minutes != null) {
//             setMockMinutes(Number(minutes));
//           }
//         }
//       } catch (e) {
//         console.error("Fetch mock minutes failed:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [meta?.mockTestId]);

//   if (!ready || loading || !meta) {
//     return (
//       <Box textAlign="center" mt={10}>
//         <CircularProgress />
//         <Typography mt={2}>Loading exam…</Typography>
//       </Box>
//     );
//   }

//   // final seed seconds
//   const seedSec = normalizeSeconds(
//     { timeLeftSec: meta.timeLeftSec, durationSec: meta.durationSec },
//     mockMinutes
//   );

//   return (
//     <ExamRunner
//       attemptId={attemptId}
//       meta={meta}
//       seedSec={seedSec}
//       onMetaUpdate={setMeta}
//       onExit={() => nav("/student/mocktests", { replace: true })}
//       formatHMS={formatHMS}
//     />
//   );
// }

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import API from "../../../LoginSystem/axios";
import ExamRunner from "./ExamRunner";

/**
 * ✅ Minutes : Seconds display (UI only)
 * Engine still works in seconds
 * Example:
 * 10754 sec → 179:14
 */
function formatMinSec(sec) {
  const safe = Math.max(0, Math.floor(sec || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// helpers to normalize minutes/seconds confusion (UNCHANGED)
const minToSec = (m) => Math.max(0, Math.floor(Number(m || 0) * 60));
const normalizeSeconds = ({ timeLeftSec, durationSec }, mockMinutes) => {
  const s  = Number(timeLeftSec  || 0);
  const ds = Number(durationSec  || 0);
  const mm = Number(mockMinutes  || 0);
  if (mm > 0) {
    const looksLikeMinutes = (x) => x > 0 && Math.abs(x - mm) <= 2;
    if (looksLikeMinutes(s))  return minToSec(s);
    if (looksLikeMinutes(ds)) return minToSec(ds);
    if (s >= mm * 30)  return s;
    if (ds >= mm * 30) return ds;
    return minToSec(mm);
  }
  if (s >= 60)  return s;
  if (ds >= 60) return ds;
  if (s > 0)    return s * 60;
  if (ds > 0)   return ds * 60;
  return 0;
};

export default function ExamShell() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const { ready, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [mockMinutes, setMockMinutes] = useState(null);

  // auth gate (UNCHANGED)
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (!user) nav("/login", { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [ready, user, nav]);

  // load attempt (UNCHANGED)
  useEffect(() => {
    if (!ready || !user) return;
    (async () => {
      try {
        const r = await API.get(`/api/student/attempts/${attemptId}`);
        setMeta(r.data);
      } catch (e) {
        console.error(e);
        alert("Attempt not found");
        nav("/student/mocktests", { replace: true });
      }
    })();
  }, [attemptId, ready, user, nav]);

  // load admin minutes for that mock (UNCHANGED)
  useEffect(() => {
    if (!meta?.mockTestId) return;
    (async () => {
      try {
        const { data } = await API.get("/api/student/mocktests");
        const items = Array.isArray(data?.items) ? data.items : [];
        const mock = items.find(m => m.mockTestId === meta.mockTestId);

        // ✅ SAFE: support both durationMinutes and duration
        if (mock) {
          const minutes =
            mock.durationMinutes ??
            mock.duration ??
            null;

          if (minutes != null) {
            setMockMinutes(Number(minutes));
          }
        }
      } catch (e) {
        console.error("Fetch mock minutes failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [meta?.mockTestId]);

  if (!ready || loading || !meta) {
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
        <Typography mt={2}>Loading exam…</Typography>
      </Box>
    );
  }

  // final seed seconds (UNCHANGED)
  const seedSec = normalizeSeconds(
    { timeLeftSec: meta.timeLeftSec, durationSec: meta.durationSec },
    mockMinutes
  );

  return (
    <ExamRunner
      attemptId={attemptId}
      meta={meta}
      seedSec={seedSec}
      onMetaUpdate={setMeta}
      onExit={() => nav("/student/mocktests", { replace: true })}
      /* 🔥 ONLY DISPLAY CHANGE:
         same prop name, now Minutes:Seconds */
      formatHMS={formatMinSec}
    />
  );
}
