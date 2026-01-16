// import React, { useEffect, useState } from "react";
// import { Box, Typography, CircularProgress } from "@mui/material";
// import { useNavigate } from "react-router-dom";
// import API from "../../LoginSystem/axios";

// export default function MyEnrollments() {
//   const [loading, setLoading] = useState(true);
//   const [enrollments, setEnrollments] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchEnrollments = async () => {
//       try {
//         const res = await API.get("/api/student/enrollments");
//         setEnrollments(res.data.enrollments || []);
//       } catch (e) {
//         console.error("Failed to load enrollments", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEnrollments();
//   }, []);

//   // ✅ NEW (SAFE): open product if clickable
//   const handleOpenEnrollment = (e) => {
//     if (e.productType === "MOCKTEST" && e.productId) {
//       navigate(`/student/attempts/${e.productId}`);
//     }
//   };

//   if (loading) return <CircularProgress />;

//   return (
//     <Box p={3}>
//       <Typography variant="h5" fontWeight={600} mb={3}>
//         My Enrollments
//       </Typography>

//       {enrollments.length === 0 ? (
//         <Typography>No enrollments found</Typography>
//       ) : (
//         enrollments.map((e, idx) => {
//           // ✅ map backend accessSource → UI label
//           const accessLabel =
//             e.accessSource === "paid"
//               ? "PURCHASED"
//               : e.accessSource === "admin"
//               ? "ASSIGNED"
//               : e.accessSource === "free"
//               ? "FREE"
//               : "ACCESS";

//           // ✅ badge color based on accessSource
//           const badgeColor =
//             e.accessSource === "paid"
//               ? "#f59e0b"
//               : e.accessSource === "admin"
//               ? "#2563eb"
//               : e.accessSource === "free"
//               ? "#16a34a"
//               : "#6b7280";

//           const isClickable = e.productType === "MOCKTEST";

//           return (
//             <Box
//               key={idx}
//               p={2}
//               mb={2}
//               border="1px solid #e5e7eb"
//               borderRadius={2}
//               display="flex"
//               justifyContent="space-between"
//               alignItems="center"
//               sx={{
//                 cursor: isClickable ? "pointer" : "default",
//                 "&:hover": isClickable
//                   ? { backgroundColor: "#f9fafb" }
//                   : undefined,
//               }}
//               onClick={() => isClickable && handleOpenEnrollment(e)}
//             >
//               {/* LEFT SIDE */}
//               <Box>
//                 <Typography fontWeight={600}>
//                   {e.productType}
//                 </Typography>

//                 {e.expiry && (
//                   <Typography variant="body2" color="text.secondary">
//                     Expires on:{" "}
//                     {new Date(e.expiry).toLocaleDateString()}
//                   </Typography>
//                 )}
//               </Box>

//               {/* RIGHT BADGE */}
//               <Box
//                 px={1.5}
//                 py={0.5}
//                 borderRadius={1}
//                 fontSize={12}
//                 fontWeight={600}
//                 color="#fff"
//                 sx={{ backgroundColor: badgeColor }}
//               >
//                 {accessLabel}
//               </Box>
//             </Box>
//           );
//         })
//       )}
//     </Box>
//   );
// }

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   CircularProgress,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";
// import API from "../../LoginSystem/axios";
// import StudentSidebar from "../Dashboard/StudentSidebar";
// import DashboardHeader from "../../Shared/DashboardHeader";

// export default function MyEnrollments() {
//   const [loading, setLoading] = useState(true);
//   const [enrollments, setEnrollments] = useState([]);
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   const navigate = useNavigate();

//   const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
//   const contentCols = isCollapsed
//     ? "col-12 col-md-11 col-lg-11"
//     : "col-12 col-md-9 col-lg-10";

//   useEffect(() => {
//     const fetchEnrollments = async () => {
//       try {
//         const res = await API.get("/api/student/enrollments");
//         setEnrollments(res.data.enrollments || []);
//       } catch (e) {
//         console.error("Failed to load enrollments", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEnrollments();
//   }, []);

//   const openEnrollment = (e) => {
//     switch (e.productType) {
//       case "COURSE":
//         navigate(`/student/course/${e.productId}`);
//         break;
//       case "MOCKTEST":
//         navigate(`/student/attempts/${e.productId}`);
//         break;
//       case "QBANK":
//         navigate(`/student/qbank/filter?bankId=${e.productId}`);
//         break;
//       case "EBOOK":
//         navigate(`/student/ebook/${e.productId}`);
//         break;
//       default:
//         console.warn("Unknown product type:", e.productType);
//     }
//   };

//   if (loading) {
//     return (
//       <Box textAlign="center" mt={8}>
//         <CircularProgress />
//         <Typography mt={2}>Loading your enrollments…</Typography>
//       </Box>
//     );
//   }

//   return (
//     <div className="container-fluid p-0">
//       <div className="row g-0">
//         <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
//           <StudentSidebar
//             isCollapsed={isCollapsed}
//             toggleSidebar={() => setIsCollapsed((p) => !p)}
//           />
//         </div>

//         <div className={`${contentCols} d-flex flex-column min-vh-100`}>
//           <DashboardHeader />

//           <div className="container-fluid py-4 flex-grow-1 overflow-auto">
//             <Typography variant="h5" fontWeight={700} mb={3}>
//               My Enrollments
//             </Typography>

//             <Box
//               display="grid"
//               gridTemplateColumns={{
//                 xs: "1fr",
//                 sm: "repeat(2, 1fr)",
//                 md: "repeat(3, 1fr)",
//               }}
//               gap={3}
//             >
//               {enrollments.map((e, idx) => {
//                 const accessLabel =
//                   e.accessSource === "paid"
//                     ? "PURCHASED"
//                     : e.accessSource === "admin"
//                     ? "ASSIGNED"
//                     : "FREE";

//                 return (
//                   <Box
//                     key={idx}
//                     onClick={() => openEnrollment(e)}
//                     sx={{
//                       cursor: "pointer",
//                       backgroundColor: "#fff",
//                       borderRadius: "14px",
//                       overflow: "hidden",
//                       boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
//                       transition: "all 0.25s ease",
//                       "&:hover": {
//                         transform: "translateY(-4px)",
//                         boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
//                       },
//                     }}
//                   >
//                     {/* Thumbnail */}
//                     <Box
//                       component="img"
//                       src={
//                         e.thumbnailUrl ||
//                         "https://via.placeholder.com/400x220.png?text=Enrollment"
//                       }
//                       sx={{
//                         width: "100%",
//                         height: 180,
//                         objectFit: "cover",
//                       }}
//                     />

//                     {/* Content */}
//                     <Box p={2}>
//                       <Typography fontWeight={600} fontSize={16}>
//                         {e.title || e.productType}
//                       </Typography>

//                       <Typography fontSize={13} color="#6b7280">
//                         {e.productType}
//                       </Typography>

//                       <Box mt={1}>
//                         <Box
//                           sx={{
//                             display: "inline-block",
//                             px: 1.2,
//                             py: 0.4,
//                             fontSize: 11,
//                             fontWeight: 700,
//                             borderRadius: "999px",
//                             background: "#ecfdf5",
//                             color: "#047857",
//                           }}
//                         >
//                           {accessLabel}
//                         </Box>
//                       </Box>

//                       {/* 🔥 ACTION FOOTER (PRODUCT WISE) */}
//                       <Box mt={2} display="flex" gap={1}>
//                         {e.productType === "QBANK" && (
//                           <>
//                             <Box sx={btnPrimary}>PRACTICE</Box>
//                             <Box sx={btnOutline}>REVIEW</Box>
//                           </>
//                         )}

//                         {e.productType === "MOCKTEST" && (
//                           <Box sx={btnPrimary}>START / RESUME</Box>
//                         )}

//                         {(e.productType === "COURSE" ||
//                           e.productType === "EBOOK") && (
//                           <Box sx={btnPrimary}>OPEN</Box>
//                         )}
//                       </Box>
//                     </Box>
//                   </Box>
//                 );
//               })}
//             </Box>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------- BUTTON STYLES (UI ONLY) ---------- */
// const btnPrimary = {
//   flex: 1,
//   textAlign: "center",
//   background: "#2563eb",
//   color: "#fff",
//   fontWeight: 600,
//   fontSize: 14,
//   py: 1,
//   borderRadius: "8px",
// };

// const btnOutline = {
//   flex: 1,
//   textAlign: "center",
//   border: "1.5px solid #2563eb",
//   color: "#2563eb",
//   fontWeight: 600,
//   fontSize: 14,
//   py: 1,
//   borderRadius: "8px",
// };


import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import API from "../../LoginSystem/axios";
import StudentSidebar from "../Dashboard/StudentSidebar";
import DashboardHeader from "../../Shared/DashboardHeader";

export default function MyEnrollments() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigate = useNavigate();

  const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
  const contentCols = isCollapsed
    ? "col-12 col-md-11 col-lg-11"
    : "col-12 col-md-9 col-lg-10";

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await API.get("/api/student/enrollments");
        console.log("📦 [MyEnrollments] enrollments:", res.data.enrollments);
        setEnrollments(res.data.enrollments || []);
      } catch (e) {
        console.error("❌ Failed to load enrollments", e);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  /* ---------------- DEFAULT CARD CLICK ---------------- */
  const openEnrollment = (e) => {
    console.log("🖱️ [OPEN CLICK]", e);

    switch (e.productType) {
      case "COURSE":
        navigate(`/student/course/${e.productId}`);
        break;

      case "MOCKTEST":
        navigate(`/student/attempts/${e.productId}`);
        break;

      case "QBANK":
        navigate(`/student/qbank/filter?bankId=${e.productId}`);
        break;

      case "EBOOK":
        // ✅ ONLY FIX: go to bookshelf (intro modal lives there)
        navigate("/ebooks", {
          state: {
            openEbookId: e.productId,
            from: "enrollments",
          },
        });
        break;

      default:
        console.warn("⚠️ Unknown product type:", e.productType);
    }
  };

  /* ---------------- BUTTON HANDLERS (OVERRIDE) ---------------- */
  const handleQbankPractice = (ev, e) => {
    ev.stopPropagation();
    navigate(`/student/qbank/filter?bankId=${e.productId}`);
  };

  const handleQbankReview = (ev, e) => {
    ev.stopPropagation();
    navigate(`/student/qbank/details/${e.productId}`);
  };

  const handleMocktestStart = (ev, e) => {
    ev.stopPropagation();
    navigate(`/student/attempts/${e.productId}`);
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
        <Typography mt={2}>Loading your enrollments…</Typography>
      </Box>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
          <StudentSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={() => setIsCollapsed((p) => !p)}
          />
        </div>

        <div className={`${contentCols} d-flex flex-column min-vh-100`}>
          <DashboardHeader />

          <div className="container-fluid py-4 flex-grow-1 overflow-auto">
            <Typography variant="h5" fontWeight={700} mb={3}>
              My Enrollments
            </Typography>

            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              }}
              gap={3}
            >
              {enrollments.map((e, idx) => {
                const accessLabel =
                  e.accessSource === "paid"
                    ? "PURCHASED"
                    : e.accessSource === "admin"
                    ? "ASSIGNED"
                    : "FREE";

                return (
                  <Box
                    key={idx}
                    onClick={() => openEnrollment(e)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor: "#fff",
                      borderRadius: "14px",
                      overflow: "hidden",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    {/* Thumbnail */}
                    <Box
                      component="img"
                      src={
                        e.thumbnailUrl ||
                        "https://via.placeholder.com/400x220.png?text=Enrollment"
                      }
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                      }}
                    />

                    {/* Content */}
                    <Box p={2}>
                      <Typography fontWeight={600} fontSize={16}>
                        {e.title || e.productType}
                      </Typography>

                      <Typography fontSize={13} color="#6b7280">
                        {e.productType}
                      </Typography>

                      <Box mt={1}>
                        <Box
                          sx={{
                            display: "inline-block",
                            px: 1.2,
                            py: 0.4,
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: "999px",
                            background: "#ecfdf5",
                            color: "#047857",
                          }}
                        >
                          {accessLabel}
                        </Box>
                      </Box>

                      {/* ACTION FOOTER */}
                      <Box mt={2} display="flex" gap={1}>
                        {e.productType === "QBANK" && (
                          <>
                            <Box
                              sx={btnPrimary}
                              onClick={(ev) => handleQbankPractice(ev, e)}
                            >
                              PRACTICE
                            </Box>
                            <Box
                              sx={btnOutline}
                              onClick={(ev) => handleQbankReview(ev, e)}
                            >
                              REVIEW
                            </Box>
                          </>
                        )}

                        {e.productType === "MOCKTEST" && (
                          <Box
                            sx={btnPrimary}
                            onClick={(ev) => handleMocktestStart(ev, e)}
                          >
                            START / RESUME
                          </Box>
                        )}

                        {(e.productType === "COURSE" ||
                          e.productType === "EBOOK") && (
                          <Box sx={btnPrimary}>OPEN</Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- BUTTON STYLES (UI ONLY) ---------- */
const btnPrimary = {
  flex: 1,
  textAlign: "center",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  py: 1,
  borderRadius: "8px",
};

const btnOutline = {
  flex: 1,
  textAlign: "center",
  border: "1.5px solid #2563eb",
  color: "#2563eb",
  fontWeight: 600,
  fontSize: 14,
  py: 1,
  borderRadius: "8px",
};
