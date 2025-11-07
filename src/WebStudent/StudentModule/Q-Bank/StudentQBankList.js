
// // src/components/student/StudentQBankList.jsx
// import React, { useEffect, useState } from "react";
// import { useAuth } from "../../../LoginSystem/context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import API from "../../../LoginSystem/axios";

// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Grid,
//   CardActionArea,
// } from "@mui/material";
// import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

// export default function StudentQBankList() {
//   const [banks, setBanks] = useState([]);
//   const [attempts, setAttempts] = useState({});
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   useEffect(() => {
//     fetchBanks();
//   }, []);

//   useEffect(() => {
//     if (user) fetchAttempts();
//   }, [user]);

//   const fetchBanks = async () => {
//     try {
//       const res = await API.get("/api/admin/qbank");
//       setBanks(res.data || []);
//     } catch (err) {
//       console.error("❌ Error fetching banks:", err);
//     }
//   };

//   const fetchAttempts = async () => {
//     try {
//       const studentId = user?.sub || user?.id || user?.userId;
//       if (!studentId) return;
//       const res = await API.get(
//         `/api/student/qbank/student/attempts/${studentId}`
//       );
//       setAttempts(res.data?.attempts || {});
//     } catch (err) {
//       console.error("❌ Error fetching attempts:", err);
//     }
//   };

//   // ✅ existing routes kept same
//   const goDetails = (bankId) => navigate(`/student/qbank/details/${bankId}`);

//   const goFilter = (bank) => {
//     const bankId = bank.bankId || bank._id || bank.id;
//     navigate(`/student/qbank/filter?bankId=${encodeURIComponent(bankId)}`, {
//       state: { bankId, bankName: bank.name },
//     });
//   };

//   const visibleBanks = (banks || []).filter((b) => b?.status === "PUBLISHED");

//   return (
//     <Box sx={{ p: 3 }}>
//       {/* Back to student dashboard */}
//       <Box sx={{ mb: 2 }}>
//         <Button
//           variant="text"
//           startIcon={<ArrowBackIosNewIcon />}
//           onClick={() => navigate("/student/dashboard")}
//           sx={{
//             color: "#4748ac",
//             textTransform: "none",
//             fontWeight: 600,
//             px: 0,
//             "&:hover": {
//               textDecoration: "underline",
//               backgroundColor: "transparent",
//             },
//           }}
//         >
//           Back to Dashboard
//         </Button>
//       </Box>

//       <Typography
//         variant="h5"
//         gutterBottom
//         sx={{
//           fontWeight: 600,
//           fontSize: { xs: "1.05rem", md: "1.2rem" },
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//         }}
//       >
//         <span role="img" aria-label="books">
//           📚
//         </span>
//         <span>Available Question Banks</span>
//       </Typography>

//       <Grid container spacing={2}>
//         {visibleBanks.map((bank) => {
//           const bankId = bank.bankId || bank._id || bank.id;
//           const prev =
//             attempts[bankId] || attempts[bank.bankId] || attempts[bank._id];
//           const lastAttemptTime = prev?.startTime
//             ? new Date(prev.startTime).toLocaleString("en-IN")
//             : "—";

//           const thumbSrc =
//             (bank.thumbnailUrl && bank.thumbnailUrl.trim() !== ""
//               ? bank.thumbnailUrl
//               : null) ||
//             "https://via.placeholder.com/400x200.png?text=Question+Bank";

//           return (
//             <Grid item xs={12} sm={6} md={4} key={bankId}>
//               <Card
//                 sx={{
//                   borderRadius: "12px",
//                   boxShadow:
//                     "0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
//                   border: "1px solid #e5e7eb",
//                   overflow: "hidden",
//                   display: "flex",
//                   flexDirection: "column",
//                   height: "100%",
//                 }}
//               >
//                 {/* Thumbnail */}
//                 <Box
//                   component="img"
//                   src={thumbSrc}
//                   alt={bank.name || "Question Bank"}
//                   sx={{
//                     width: "100%",
//                     height: 120,
//                     objectFit: "cover",
//                     backgroundColor: "#f5f5f5",
//                     borderBottom: "1px solid #e5e7eb",
//                   }}
//                   onError={(e) => {
//                     e.currentTarget.src =
//                       "https://via.placeholder.com/400x200.png?text=Question+Bank";
//                   }}
//                 />

//                 {/* Clickable area (same logic) */}
//                 <CardActionArea
//                   onClick={() => goDetails(bankId)}
//                   sx={{
//                     flexGrow: 1,
//                     display: "flex",
//                     alignItems: "stretch",
//                   }}
//                 >
//                   <CardContent
//                     sx={{
//                       flexGrow: 1,
//                       display: "flex",
//                       flexDirection: "column",
//                       justifyContent: "space-between",
//                       p: 2,
//                     }}
//                   >
//                     {/* Bank title */}
//                     <Typography
//                       variant="subtitle1"
//                       sx={{
//                         fontWeight: 600,
//                         fontSize: "0.95rem",
//                         color: "#111827",
//                       }}
//                     >
//                       {bank.name || "Untitled Q-Bank"}
//                     </Typography>

//                     <Typography
//                       variant="body2"
//                       sx={{
//                         color: "#6b7280",
//                         fontSize: "0.8rem",
//                       }}
//                     >
//                       Last used: {lastAttemptTime}
//                     </Typography>
//                   </CardContent>
//                 </CardActionArea>

//                 {/* ✅ Two Buttons: Practice & Review */}
//                 <Box
//                   sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     gap: 1,
//                     px: 2,
//                     pb: 2,
//                     pt: 0.5,
//                   }}
//                 >
//                   <Button
//                     fullWidth
//                     variant="contained"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       goFilter(bank);
//                     }}
//                     sx={{
//                       textTransform: "none",
//                       fontWeight: 600,
//                       fontSize: "0.8rem",
//                       backgroundColor: "#4748ac",
//                       borderRadius: "8px",
//                       "&:hover": { backgroundColor: "#3a3b8e" },
//                     }}
//                   >
//                     Practice
//                   </Button>

//                   <Button
//                     fullWidth
//                     variant="outlined"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       goDetails(bankId); // same function reused
//                     }}
//                     sx={{
//                       textTransform: "none",
//                       fontWeight: 600,
//                       fontSize: "0.8rem",
//                       borderColor: "#4748ac",
//                       color: "#4748ac",
//                       borderRadius: "8px",
//                       "&:hover": {
//                         backgroundColor: "rgba(71,72,172,0.08)",
//                         borderColor: "#4748ac",
//                       },
//                     }}
//                   >
//                     Review
//                   </Button>
//                 </Box>
//               </Card>
//             </Grid>
//           );
//         })}
//       </Grid>
//     </Box>
//   );
// }


// src/components/student/StudentQBankList.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../LoginSystem/context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../../../LoginSystem/axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function StudentQBankList() {
  const [banks, setBanks] = useState([]);
  const [attempts, setAttempts] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (user) fetchAttempts();
  }, [user]);

  const fetchBanks = async () => {
    try {
      const res = await API.get("/api/admin/qbank");
      setBanks(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching banks:", err);
    }
  };

  const fetchAttempts = async () => {
    try {
      const studentId = user?.sub || user?.id || user?.userId;
      if (!studentId) return;
      const res = await API.get(
        `/api/student/qbank/student/attempts/${studentId}`
      );
      setAttempts(res.data?.attempts || {});
    } catch (err) {
      console.error("❌ Error fetching attempts:", err);
    }
  };

  const goDetails = (bankId) => navigate(`/student/qbank/details/${bankId}`);

  const goFilter = (bank) => {
    const bankId = bank.bankId || bank._id || bank.id;
    navigate(`/student/qbank/filter?bankId=${encodeURIComponent(bankId)}`, {
      state: { bankId, bankName: bank.name },
    });
  };

  const visibleBanks = (banks || []).filter((b) => b?.status === "PUBLISHED");

  return (
    <Box sx={{ p: 3 }}>
      {/* Back to Dashboard */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => navigate("/student/dashboard")}
          sx={{
            color: "#4748ac",
            textTransform: "none",
            fontWeight: 600,
            px: 0,
            "&:hover": {
              textDecoration: "underline",
              backgroundColor: "transparent",
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          fontSize: { xs: "1.05rem", md: "1.2rem" },
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span role="img" aria-label="books">
          📚
        </span>
        <span>Available Question Banks</span>
      </Typography>

      <Grid container spacing={2}>
        {visibleBanks.map((bank) => {
          const bankId = bank.bankId || bank._id || bank.id;
          const prev =
            attempts[bankId] || attempts[bank.bankId] || attempts[bank._id];
          const lastAttemptTime = prev?.startTime
            ? new Date(prev.startTime).toLocaleString("en-IN")
            : "—";

          const thumbSrc =
            (bank.thumbnailUrl && bank.thumbnailUrl.trim() !== ""
              ? bank.thumbnailUrl
              : null) ||
            "https://via.placeholder.com/400x200.png?text=Question+Bank";

          return (
            <Grid item xs={12} sm={6} md={4} key={bankId}>
              <Card
                sx={{
                  borderRadius: "12px",
                  boxShadow:
                    "0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* ✅ Thumbnail now clickable → Practice page */}
                <Box
                  component="img"
                  src={thumbSrc}
                  alt={bank.name || "Question Bank"}
                  sx={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    backgroundColor: "#f5f5f5",
                    borderBottom: "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                  onClick={() => goFilter(bank)} // 👈 same as Practice
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x200.png?text=Question+Bank";
                  }}
                />

                {/* Card content (non-clickable title) */}
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#111827",
                      cursor: "default", // 👈 not clickable
                      userSelect: "none",
                    }}
                  >
                    {bank.name || "Untitled Q-Bank"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: "0.8rem",
                    }}
                  >
                    Last used: {lastAttemptTime}
                  </Typography>
                </CardContent>

                {/* ✅ Two Buttons: Practice + Review */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    px: 2,
                    pb: 2,
                    pt: 0.5,
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      goFilter(bank);
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      backgroundColor: "#4748ac",
                      borderRadius: "8px",
                      "&:hover": { backgroundColor: "#3a3b8e" },
                    }}
                  >
                    Practice
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      goDetails(bankId);
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderColor: "#4748ac",
                      color: "#4748ac",
                      borderRadius: "8px",
                      "&:hover": {
                        backgroundColor: "rgba(71,72,172,0.08)",
                        borderColor: "#4748ac",
                      },
                    }}
                  >
                    Review
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

