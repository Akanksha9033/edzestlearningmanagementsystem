
// // src/components/student/StudentQBankFilterForm.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
// import API from "../../../LoginSystem/axios";
// import { useAuth } from "../../../LoginSystem/context/AuthContext";
// import {
//   Box, Button, Select, MenuItem, TextField, InputLabel,
//   FormControl, Typography, Alert, CircularProgress
// } from "@mui/material";
// import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"; // ← added

// export default function StudentQBankFilterForm() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [params] = useSearchParams();
//   const { user } = useAuth();

//   // derive bankId (route is /student/qbank/filter?bankId=...)
//   const bankId = useMemo(
//     () => location.state?.bankId || params.get("bankId") || "",
//     [location.state, params]
//   );

//   // options
//   const [options, setOptions] = useState({
//     tasks: [],                 // was: tags
//     difficulty: [],
//     questionType: [],
//     performanceDomain: [],
//     approach: [],
//     exam: [],
//   });

//   // form
//   const [form, setForm] = useState({
//     task: "",                  // was: tags
//     difficulty: "",
//     questionType: "",
//     performanceDomain: "",
//     approach: "",
//     exam: "",
//     duration: 10,
//     questionCount: 10,
//   });

//   const [loading, setLoading] = useState(true);
//   const [errMsg, setErrMsg] = useState("");

//   useEffect(() => {
//     if (!bankId) {
//       setErrMsg("Missing bankId. Returning to list…");
//       const t = setTimeout(() => navigate("/student/qbank", { replace: true }), 800);
//       return () => clearTimeout(t);
//     }
//   }, [bankId, navigate]);

//   // Fetch available filters
//   useEffect(() => {
//     if (!bankId) return;
//     (async () => {
//       setLoading(true);
//       setErrMsg("");
//       try {
//         const url = `/api/student/qbank/${bankId}/filters`;
//         const res = await API.get(url);
//         const data = res.data || {};
//         setOptions({
//           tasks: data.tasks || data.tags || [],   // prefer tasks
//           difficulty: data.difficulty || [],
//           questionType: data.questionType || [],
//           performanceDomain: data.performanceDomain || [],
//           approach: data.approach || [],
//           exam: data.exam || [],
//         });

//         if (
//           (!(data.tasks || data.tags) || (data.tasks || data.tags).length === 0) &&
//           (!data.difficulty || data.difficulty.length === 0) &&
//           (!data.questionType || data.questionType.length === 0) &&
//           (!data.performanceDomain || data.performanceDomain.length === 0)
//         ) {
//           setErrMsg("No filter options returned by the server. (Check backend /:bankId/filters route and bankId match.)");
//         }
//       } catch (e) {
//         const msg = e?.response?.data?.error || e?.message || "Failed to load filters";
//         setErrMsg(msg);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [bankId]);

//   const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

//   const handleStart = async () => {
//     try {
//       const payload = {
//         ...form,
//         tasks: form.task || "",   // new
//         tags:  form.task || "",   // mirror for legacy
//         studentId: user?.sub || user?.id || user?.userId || "anonymous-student",
//       };

//       const url = `/api/student/qbank/${bankId}/session/create`;
//       const res = await API.post(url, payload);

//       navigate(`/student/qbank/session/${res.data.sessionId}`, {
//         state: {
//           questions: res.data.questions,
//           duration: form.duration,
//           sessionId: res.data.sessionId,
//           bankId,
//         },
//       });
//     } catch (e) {
//       alert(e?.response?.data?.error || "Failed to start session");
//     }
//   };

//   if (!bankId) {
//     return (
//       <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
//         <Alert severity="warning">No bank selected. Redirecting…</Alert>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
//       {/* Back to list */}
//       <Box sx={{ mb: 1 }}>
//         <Button
//           variant="text"
//           startIcon={<ArrowBackIosNewIcon />}
//           onClick={() => navigate("/student/qbank")}
//           sx={{ color: "#4748ac", textTransform: "none", fontWeight: 600, px: 0 }}
//         >
//           Back to Banks
//         </Button>
//       </Box>

//       <Typography variant="h5" sx={{ mb: 3 }}>
//         Choose Filters
//       </Typography>

//       {!!errMsg && (
//         <Alert severity="warning" sx={{ mb: 2 }}>
//           {errMsg}
//         </Alert>
//       )}

//       {loading ? (
//         <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
//           <CircularProgress />
//         </Box>
//       ) : (
//         <>
//           {/* Exam */}
//           {/* <FormControl fullWidth sx={{ mb: 2 }}>
//             <InputLabel id="exam-label">Exam</InputLabel>
//             <Select
//               labelId="exam-label"
//               label="Exam"
//               value={form.exam}
//               onChange={(e) => handleChange("exam", e.target.value)}
//             >
//               {options.exam.map((x, i) => (
//                 <MenuItem key={i} value={x}>
//                   {x}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl> */}

//           {/* Domain (was: Performance Domain) */}
//           {/* <FormControl fullWidth sx={{ mb: 2 }}>
//             <InputLabel id="pdomain-label">Domain</InputLabel>
//             <Select
//               labelId="pdomain-label"
//               label="Domain"
//               value={form.performanceDomain}
//               onChange={(e) => handleChange("performanceDomain", e.target.value)}
//             >
//               {options.performanceDomain.map((p, i) => (
//                 <MenuItem key={i} value={p}>
//                   {p}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl> */}

//           {/* Task */}
//           <FormControl fullWidth sx={{ mb: 2 }}>
//             <InputLabel id="task-label">Task</InputLabel>
//             <Select
//               labelId="task-label"
//               label="Task"
//               value={form.task}
//               onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
//             >
//               {options.tasks.map((t, i) => (
//                 <MenuItem key={i} value={t}>
//                   {t}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           {/* Approach */}
//           <FormControl fullWidth sx={{ mb: 2 }}>
//             <InputLabel id="approach-label">Approach</InputLabel>
//             <Select
//               labelId="approach-label"
//               label="Approach"
//               value={form.approach}
//               onChange={(e) => handleChange("approach", e.target.value)}
//             >
//               {options.approach.map((a, i) => (
//                 <MenuItem key={i} value={a}>
//                   {a}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           {/* Difficulty */}
//           {/* <FormControl fullWidth sx={{ mb: 2 }}>
//             <InputLabel id="difficulty-label">Difficulty</InputLabel>
//             <Select
//               labelId="difficulty-label"
//               label="Difficulty"
//               value={form.difficulty}
//               onChange={(e) => handleChange("difficulty", e.target.value)}
//             >
//               {options.difficulty.map((d, i) => (
//                 <MenuItem key={i} value={d}>
//                   {d}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl> */}

//           {/* Question Type */}
//           <FormControl fullWidth sx={{ mb: 2 }}>
//             <InputLabel id="qtype-label">Question Type</InputLabel>
//             <Select
//               labelId="qtype-label"
//               label="Question Type"
//               value={form.questionType}
//               onChange={(e) => handleChange("questionType", e.target.value)}
//             >
//               {options.questionType.map((q, i) => (
//                 <MenuItem key={i} value={q}>
//                   {q}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           {/* Number of Questions */}
//           <TextField
//             label="Number of Questions"
//             type="number"
//             fullWidth
//             sx={{ mb: 2 }}
//             value={form.questionCount}
//             onChange={(e) => handleChange("questionCount", Number(e.target.value))}
//           />

//           {/* Duration */}
//           <TextField
//             label="Duration (minutes)"
//             type="number"
//             fullWidth
//             sx={{ mb: 2 }}
//             value={form.duration}
//             onChange={(e) => handleChange("duration", Number(e.target.value))}
//           />

//           <Button
//             variant="contained"
//             fullWidth
//             onClick={handleStart}
//             sx={{ backgroundColor: "#4748ac" }}
//             disabled={!bankId}
//           >
//             Start Session
//           </Button>
//         </>
//       )}
//     </Box>
//   );
// }



// src/components/student/StudentQBankFilterForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import API from "../../../LoginSystem/axios";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import {
  Box, Button, Select, MenuItem, TextField, InputLabel,
  FormControl, Typography, Alert, CircularProgress
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function StudentQBankFilterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { user } = useAuth();

  // 🔹 NEW: approach notification flag
  const [approachNotice, setApproachNotice] = useState(false);

  // derive bankId (route is /student/qbank/filter?bankId=...)
  const bankId = useMemo(
    () => location.state?.bankId || params.get("bankId") || "",
    [location.state, params]
  );

  // options
  const [options, setOptions] = useState({
    tasks: [],                 // was: tags
    difficulty: [],
    questionType: [],
    performanceDomain: [],
    approach: [],
    exam: [],
  });

  // form
  const [form, setForm] = useState({
    task: "",                  // was: tags
    difficulty: "",
    questionType: "",
    performanceDomain: "",
    approach: "",
    exam: "",
    duration: 10,
    questionCount: 10,
  });

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!bankId) {
      setErrMsg("Missing bankId. Returning to list…");
      const t = setTimeout(() => navigate("/student/qbank", { replace: true }), 800);
      return () => clearTimeout(t);
    }
  }, [bankId, navigate]);

  // Fetch available filters
  useEffect(() => {
    if (!bankId) return;
    (async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const url = `/api/student/qbank/${bankId}/filters`;
        const res = await API.get(url);
        const data = res.data || {};
        setOptions({
          tasks: data.tasks || data.tags || [],   // prefer tasks
          difficulty: data.difficulty || [],
          questionType: data.questionType || [],
          performanceDomain: data.performanceDomain || [],
          approach: data.approach || [],
          exam: data.exam || [],
        });

        if (
          (!(data.tasks || data.tags) || (data.tasks || data.tags).length === 0) &&
          (!data.difficulty || data.difficulty.length === 0) &&
          (!data.questionType || data.questionType.length === 0) &&
          (!data.performanceDomain || data.performanceDomain.length === 0)
        ) {
          setErrMsg("No filter options returned by the server. (Check backend /:bankId/filters route and bankId match.)");
        }
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || "Failed to load filters";
        setErrMsg(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [bankId]);

  const handleChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleStart = async () => {
    try {
      const payload = {
        ...form,
        tasks: form.task || "",   // new
        tags:  form.task || "",   // mirror for legacy
        studentId: user?.sub || user?.id || user?.userId || "anonymous-student",
      };

      // ❗️No logic change: approach already form.se approach hi jaa raha hai
      // blank ("") hone par backend waise bhi filter skip karega

      const url = `/api/student/qbank/${bankId}/session/create`;
      const res = await API.post(url, payload);

      navigate(`/student/qbank/session/${res.data.sessionId}`, {
        state: {
          questions: res.data.questions,
          duration: form.duration,
          sessionId: res.data.sessionId,
          bankId,
        },
      });
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to start session");
    }
  };

  if (!bankId) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert severity="warning">No bank selected. Redirecting…</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      {/* Back to list */}
      <Box sx={{ mb: 1 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => navigate("/student/qbank")}
          sx={{ color: "#4748ac", textTransform: "none", fontWeight: 600, px: 0 }}
        >
          Back to Banks
        </Button>
      </Box>

      <Typography variant="h5" sx={{ mb: 3 }}>
        Choose Filters
      </Typography>

      {!!errMsg && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Task */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="task-label">Task</InputLabel>
            <Select
              labelId="task-label"
              label="Task"
              value={form.task}
              onChange={(e) => handleChange("task", e.target.value)}
            >
              {options.tasks.map((t, i) => (
                <MenuItem key={i} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Approach */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="approach-label">Approach</InputLabel>
            <Select
              labelId="approach-label"
              label="Approach"
              value={form.approach}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("approach", value);

                // 🔹 Yahin pe notification trigger hoga
                setApproachNotice(value === "");
              }}
            >
              {/* 🔹 Blank menu item → All approaches */}
              <MenuItem value="">
                <em>All Approaches</em>
              </MenuItem>

              {options.approach.map((a, i) => (
                <MenuItem key={i} value={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 🔔 Info notification when blank chosen */}

          {/* {approachNotice && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Is task ke <strong>saare approaches ke saare questions</strong> dikh jayenge.
            </Alert>
          )} */}

          {/* Question Type */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="qtype-label">Question Type</InputLabel>
            <Select
              labelId="qtype-label"
              label="Question Type"
              value={form.questionType}
              onChange={(e) => handleChange("questionType", e.target.value)}
            >
              {options.questionType.map((q, i) => (
                <MenuItem key={i} value={q}>
                  {q}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Number of Questions */}
          <TextField
            label="Number of Questions"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.questionCount}
            onChange={(e) => handleChange("questionCount", Number(e.target.value))}
          />

          {/* Duration */}
          <TextField
            label="Duration (minutes)"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.duration}
            onChange={(e) => handleChange("duration", Number(e.target.value))}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleStart}
            sx={{ backgroundColor: "#4748ac" }}
            disabled={!bankId}
          >
            Start Session
          </Button>
        </>
      )}
    </Box>
  );
}
