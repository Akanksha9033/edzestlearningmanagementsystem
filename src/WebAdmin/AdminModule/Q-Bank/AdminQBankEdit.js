

// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import API from "../../../LoginSystem/axios";

// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   TextField,
//   Select,
//   MenuItem,
//   Button,
//   RadioGroup,
//   FormControlLabel,
//   Radio,
//   Checkbox,
// } from "@mui/material";
// import SettingsIcon from "@mui/icons-material/Settings";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// export default function AdminQBankEdit() {
//   const { bankId } = useParams();
//   const navigate = useNavigate();

//   const [questions, setQuestions] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [filters, setFilters] = useState({
//     difficulty: "",
//     questionType: "",
//     tags: "",
//     performanceDomain: "",
//   });

//   // 🔹 Fetch questions of this bank
//   useEffect(() => {
//     async function fetchQuestions() {
//       try {
//         const res = await API.get(`/api/admin/qbank/${bankId}/questions`, {
//           params: filters,
//         });
//         setQuestions(Array.isArray(res.data) ? res.data : []);
//         setCurrentIndex(0);
//       } catch (err) {
//         console.error("❌ Error loading questions:", err);
//       }
//     }
//     fetchQuestions();
//   }, [bankId, filters]);

//   const handleChange = (field, value) => {
//     const updated = [...questions];
//     updated[currentIndex][field] = value;
//     setQuestions(updated);
//   };

//   const handleSave = async () => {
//     try {
//       const q = questions[currentIndex];
//       await API.put(`/api/admin/qbank/${bankId}/questions/${q.questionId}`, q);
//       alert(`✅ Question ${currentIndex + 1} updated!`);
//     } catch (err) {
//       console.error("❌ Error saving question:", err);
//       alert("❌ Failed to save question");
//     }
//   };

//   const handleFilterChange = (field, value) => {
//     setFilters((prev) => ({ ...prev, [field]: value }));
//   };

//   const nextQuestion = () => {
//     if (currentIndex < questions.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     }
//   };

//   const prevQuestion = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//     }
//   };

//   // 🟢 Publish
//   const handlePublish = async () => {
//     if (
//       window.confirm(
//         "Are you sure you want to publish this Question Bank? Once published, students will be able to see it."
//       )
//     ) {
//       try {
//         await API.put(`/api/admin/qbank/publish/${bankId}`);
//         alert("✅ Question Bank published successfully!");
//       } catch (err) {
//         console.error("❌ Publish failed:", err);
//         alert("❌ Failed to publish Question Bank.");
//       }
//     }
//   };

//   // ✅ Open the QB settings page (qbsetting.js)
//   const openSettings = () => {
//     navigate(`/admin/qbank/${bankId}/qbsetting`);
//   };

//   // ✅ FIXED: Go back to the list route you showed in the screenshot
//   const goBackToList = () => {
//     navigate("/admin/qbank/list", { replace: true });
//   };

//   if (!questions.length) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1.5 }}>
//           <Button
//             variant="text"
//             startIcon={<ArrowBackIcon />}
//             onClick={goBackToList}
//             sx={{ textTransform: "none" }}
//           >
//             Back to List
//           </Button>
//         </Box>

//         <Typography variant="h6" color="error">
//           ⚠️ No questions found for this bank.
//         </Typography>
//       </Box>
//     );
//   }

//   const q = questions[currentIndex];

//   return (
//     <Box sx={{ p: 3 }}>
//       {/* Header row: Back (left), Title (center-ish), Settings (right) */}
//       <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
//         <Button
//           variant="text"
//           startIcon={<ArrowBackIcon />}
//           onClick={goBackToList}
//           sx={{ textTransform: "none" }}
//         >
//           Back to List
//         </Button>

//         <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", m: 0 }}>
//           ✏️ Edit Question Bank ({currentIndex + 1}/{questions.length})
//         </Typography>

//         <Box sx={{ ml: "auto" }}>
//           <Button
//             size="small"
//             variant="outlined"
//             startIcon={<SettingsIcon />}
//             onClick={openSettings}
//           >
//             Settings
//           </Button>
//         </Box>
//       </Box>

//       <Card
//         sx={{
//           boxShadow: 3,
//           borderRadius: "12px",
//           p: 2,
//           transition: "0.3s",
//           "&:hover": { boxShadow: 6 },
//         }}
//       >
//         <CardContent>
//           {/* Question Text */}
//           <TextField
//             label="Question Text"
//             fullWidth
//             multiline
//             rows={3}
//             value={q.questionText}
//             onChange={(e) => handleChange("questionText", e.target.value)}
//             sx={{ mb: 2 }}
//           />

//           {/* Options */}
//           <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
//             Options:
//           </Typography>

//           {q.questionType === "Multi-Select" ? (
//             q.options?.map((opt, i) => (
//               <FormControlLabel
//                 key={i}
//                 control={
//                   <Checkbox
//                     checked={q.correctAnswer?.includes(
//                       String.fromCharCode(65 + i)
//                     )}
//                     onChange={(e) => {
//                       const val = String.fromCharCode(65 + i);
//                       let updatedAnswers = [...(q.correctAnswer || [])];
//                       if (e.target.checked) {
//                         if (!updatedAnswers.includes(val))
//                           updatedAnswers.push(val);
//                       } else {
//                         updatedAnswers = updatedAnswers.filter(
//                           (ans) => ans !== val
//                         );
//                       }
//                       handleChange("correctAnswer", updatedAnswers);
//                     }}
//                   />
//                 }
//                 label={
//                   <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                     <Typography sx={{ minWidth: "20px", fontWeight: "bold" }}>
//                       {String.fromCharCode(65 + i)}.
//                     </Typography>
//                     <TextField
//                       value={opt}
//                       onChange={(e) => {
//                         const updated = [...q.options];
//                         updated[i] = e.target.value;
//                         handleChange("options", updated);
//                       }}
//                       sx={{ flex: 1, background: "#fff", borderRadius: "8px" }}
//                     />
//                   </Box>
//                 }
//                 sx={{
//                   mb: 1,
//                   alignItems: "flex-start",
//                   background: "#fff",
//                   borderRadius: "8px",
//                   p: 1,
//                   boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//                 }}
//               />
//             ))
//           ) : (
//             <RadioGroup
//               value={q.correctAnswer?.[0] || ""}
//               onChange={(e) => handleChange("correctAnswer", [e.target.value])}
//             >
//               {q.options?.map((opt, i) => (
//                 <FormControlLabel
//                   key={i}
//                   value={String.fromCharCode(65 + i)}
//                   control={<Radio />}
//                   label={
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <Typography sx={{ minWidth: "20px", fontWeight: "bold" }}>
//                         {String.fromCharCode(65 + i)}.
//                       </Typography>
//                       <TextField
//                         value={opt}
//                         onChange={(e) => {
//                           const updated = [...q.options];
//                           updated[i] = e.target.value;
//                           handleChange("options", updated);
//                         }}
//                         sx={{
//                           flex: 1,
//                           background: "#fff",
//                           borderRadius: "8px",
//                         }}
//                       />
//                     </Box>
//                   }
//                   sx={{
//                     mb: 1,
//                     alignItems: "flex-start",
//                     background: "#fff",
//                     borderRadius: "8px",
//                     p: 1,
//                     boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//                   }}
//                 />
//               ))}
//             </RadioGroup>
//           )}

//           {/* Dropdowns */}
//           <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
//             <Select
//               value={q.difficulty || ""}
//               onChange={(e) => {
//                 handleChange("difficulty", e.target.value);
//                 handleFilterChange("difficulty", e.target.value);
//               }}
//             >
//               <MenuItem value="Easy">Easy</MenuItem>
//               <MenuItem value="Medium">Medium</MenuItem>
//               <MenuItem value="Difficult">Difficult</MenuItem>
//             </Select>

//             <Select
//               value={q.questionType || ""}
//               onChange={(e) => {
//                 handleChange("questionType", e.target.value);
//                 handleFilterChange("questionType", e.target.value);
//               }}
//             >
//               <MenuItem value="Single-Select">Single-Select</MenuItem>
//               <MenuItem value="Multi-Select">Multi-Select</MenuItem>
//               <MenuItem value="Fill-in-the-Blank">Fill-in-the-Blank</MenuItem>
//               <MenuItem value="True/False">True/False</MenuItem>
//             </Select>

//             <TextField
//               label="Tags"
//               value={q.tags || ""}
//               onChange={(e) => {
//                 handleChange("tags", e.target.value);
//                 handleFilterChange("tags", e.target.value);
//               }}
//             />

//             <TextField
//               label="Domain"
//               value={q.performanceDomain || ""}
//               onChange={(e) => {
//                 handleChange("performanceDomain", e.target.value);
//                 handleFilterChange("performanceDomain", e.target.value);
//               }}
//             />
//           </Box>

//           {/* Explanation */}
//           <TextField
//             label="Explanation"
//             fullWidth
//             multiline
//             rows={2}
//             value={q.explanation || ""}
//             onChange={(e) => handleChange("explanation", e.target.value)}
//             sx={{ mt: 2 }}
//           />

//           {/* ✅ Save, Nav & Publish Buttons */}
//           <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
//             <Button
//               variant="outlined"
//               disabled={currentIndex === 0}
//               onClick={prevQuestion}
//             >
//               ⬅ Previous
//             </Button>

//             <Button
//               variant="contained"
//               sx={{
//                 backgroundColor: "#4748ac",
//                 "&:hover": { backgroundColor: "#373885" },
//               }}
//               onClick={handleSave}
//             >
//               💾 Save
//             </Button>

//             <Button
//               variant="outlined"
//               disabled={currentIndex === questions.length - 1}
//               onClick={nextQuestion}
//             >
//               Next ➡
//             </Button>

//             {/* 🚀 Publish Button */}
//             <Button
//               variant="contained"
//               color="success"
//               sx={{
//                 backgroundColor: "#2e7d32",
//                 "&:hover": { backgroundColor: "#1b5e20" },
//                 ml: "auto",
//               }}
//               onClick={handlePublish}
//             >
//               🚀 Publish
//             </Button>
//           </Box>
//         </CardContent>
//       </Card>
//     </Box>
//   );
// }


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../LoginSystem/axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  CircularProgress, // ✅ ADDED
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function AdminQBankEdit() {
  const { bankId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState({
    difficulty: "",
    questionType: "",
    tags: "",
    performanceDomain: "",
  });

  // 🔹 Fetch questions of this bank
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await API.get(`/api/admin/qbank/${bankId}/questions`, {
          params: filters,
        });
        setQuestions(Array.isArray(res.data) ? res.data : []);
        setCurrentIndex(0);
      } catch (err) {
        console.error("❌ Error loading questions:", err);
      }
    }
    fetchQuestions();
  }, [bankId, filters]);

  const handleChange = (field, value) => {
    const updated = [...questions];
    updated[currentIndex][field] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    try {
      const q = questions[currentIndex];
      await API.put(`/api/admin/qbank/${bankId}/questions/${q.questionId}`, q);
      alert(`✅ Question ${currentIndex + 1} updated!`);
    } catch (err) {
      console.error("❌ Error saving question:", err);
      alert("❌ Failed to save question");
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 🟢 Publish
  const handlePublish = async () => {
    if (
      window.confirm(
        "Are you sure you want to publish this Question Bank? Once published, students will be able to see it."
      )
    ) {
      try {
        await API.put(`/api/admin/qbank/publish/${bankId}`);
        alert("✅ Question Bank published successfully!");
      } catch (err) {
        console.error("❌ Publish failed:", err);
        alert("❌ Failed to publish Question Bank.");
      }
    }
  };

  // ✅ Open the QB settings page (qbsetting.js)
  const openSettings = () => {
    navigate(`/admin/qbank/${bankId}/qbsetting`);
  };

  // ✅ FIXED: Go back to the list route you showed in the screenshot
  const goBackToList = () => {
    navigate("/admin/qbank/list", { replace: true });
  };

  if (!questions.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1.5 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={goBackToList}
            sx={{ textTransform: "none" }}
          >
            Back to List
          </Button>
        </Box>

        {/* 🔄 Replaced "No questions found" with a loader */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  const q = questions[currentIndex];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header row: Back (left), Title (center-ish), Settings (right) */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={goBackToList}
          sx={{ textTransform: "none" }}
        >
          Back to List
        </Button>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", m: 0 }}>
          ✏️ Edit Question Bank ({currentIndex + 1}/{questions.length})
        </Typography>

        <Box sx={{ ml: "auto" }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={openSettings}
          >
            Settings
          </Button>
        </Box>
      </Box>

      <Card
        sx={{
          boxShadow: 3,
          borderRadius: "12px",
          p: 2,
          transition: "0.3s",
          "&:hover": { boxShadow: 6 },
        }}
      >
        <CardContent>
          {/* Question Text */}
          <TextField
            label="Question Text"
            fullWidth
            multiline
            rows={3}
            value={q.questionText}
            onChange={(e) => handleChange("questionText", e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Options */}
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            Options:
          </Typography>

          {q.questionType === "Multi-Select" ? (
            q.options?.map((opt, i) => (
              <FormControlLabel
                key={i}
                control={
                  <Checkbox
                    checked={q.correctAnswer?.includes(
                      String.fromCharCode(65 + i)
                    )}
                    onChange={(e) => {
                      const val = String.fromCharCode(65 + i);
                      let updatedAnswers = [...(q.correctAnswer || [])];
                      if (e.target.checked) {
                        if (!updatedAnswers.includes(val))
                          updatedAnswers.push(val);
                      } else {
                        updatedAnswers = updatedAnswers.filter(
                          (ans) => ans !== val
                        );
                      }
                      handleChange("correctAnswer", updatedAnswers);
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ minWidth: "20px", fontWeight: "bold" }}>
                      {String.fromCharCode(65 + i)}.
                    </Typography>
                    <TextField
                      value={opt}
                      onChange={(e) => {
                        const updated = [...q.options];
                        updated[i] = e.target.value;
                        handleChange("options", updated);
                      }}
                      sx={{ flex: 1, background: "#fff", borderRadius: "8px" }}
                    />
                  </Box>
                }
                sx={{
                  mb: 1,
                  alignItems: "flex-start",
                  background: "#fff",
                  borderRadius: "8px",
                  p: 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              />
            ))
          ) : (
            <RadioGroup
              value={q.correctAnswer?.[0] || ""}
              onChange={(e) => handleChange("correctAnswer", [e.target.value])}
            >
              {q.options?.map((opt, i) => (
                <FormControlLabel
                  key={i}
                  value={String.fromCharCode(65 + i)}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ minWidth: "20px", fontWeight: "bold" }}>
                        {String.fromCharCode(65 + i)}.
                      </Typography>
                      <TextField
                        value={opt}
                        onChange={(e) => {
                          const updated = [...q.options];
                          updated[i] = e.target.value;
                          handleChange("options", updated);
                        }}
                        sx={{
                          flex: 1,
                          background: "#fff",
                          borderRadius: "8px",
                        }}
                      />
                    </Box>
                  }
                  sx={{
                    mb: 1,
                    alignItems: "flex-start",
                    background: "#fff",
                    borderRadius: "8px",
                    p: 1,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                />
              ))}
            </RadioGroup>
          )}

          {/* Dropdowns */}
          <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
            <Select
              value={q.difficulty || ""}
              onChange={(e) => {
                handleChange("difficulty", e.target.value);
                handleFilterChange("difficulty", e.target.value);
              }}
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Difficult">Difficult</MenuItem>
            </Select>

            <Select
              value={q.questionType || ""}
              onChange={(e) => {
                handleChange("questionType", e.target.value);
                handleFilterChange("questionType", e.target.value);
              }}
            >
              <MenuItem value="Single-Select">Single-Select</MenuItem>
              <MenuItem value="Multi-Select">Multi-Select</MenuItem>
              <MenuItem value="Fill-in-the-Blank">Fill-in-the-Blank</MenuItem>
              <MenuItem value="True/False">True/False</MenuItem>
            </Select>

            <TextField
              label="Tags"
              value={q.tags || ""}
              onChange={(e) => {
                handleChange("tags", e.target.value);
                handleFilterChange("tags", e.target.value);
              }}
            />

            <TextField
              label="Domain"
              value={q.performanceDomain || ""}
              onChange={(e) => {
                handleChange("performanceDomain", e.target.value);
                handleFilterChange("performanceDomain", e.target.value);
              }}
            />
          </Box>

          {/* Explanation */}
          <TextField
            label="Explanation"
            fullWidth
            multiline
            rows={2}
            value={q.explanation || ""}
            onChange={(e) => handleChange("explanation", e.target.value)}
            sx={{ mt: 2 }}
          />

          {/* ✅ Save, Nav & Publish Buttons */}
          <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              disabled={currentIndex === 0}
              onClick={prevQuestion}
            >
              ⬅ Previous
            </Button>

            <Button
              variant="contained"
              sx={{
                backgroundColor: "#4748ac",
                "&:hover": { backgroundColor: "#373885" },
              }}
              onClick={handleSave}
            >
              💾 Save
            </Button>

            <Button
              variant="outlined"
              disabled={currentIndex === questions.length - 1}
              onClick={nextQuestion}
            >
              Next ➡
            </Button>

            {/* 🚀 Publish Button */}
            <Button
              variant="contained"
              color="success"
              sx={{
                backgroundColor: "#2e7d32",
                "&:hover": { backgroundColor: "#1b5e20" },
                ml: "auto",
              }}
              onClick={handlePublish}
            >
              🚀 Publish
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
