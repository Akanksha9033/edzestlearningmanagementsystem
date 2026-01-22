



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
//         console.log("📦 [MyEnrollments] enrollments:", res.data.enrollments);
//         setEnrollments(res.data.enrollments || []);
//       } catch (e) {
//         console.error("❌ Failed to load enrollments", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEnrollments();
//   }, []);

//   /* ---------------- DEFAULT CARD CLICK ---------------- */
//   const openEnrollment = (e) => {
//     console.log("🖱️ [OPEN CLICK]", e);

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
//         // ✅ ONLY FIX: go to bookshelf (intro modal lives there)
//         navigate("/ebooks", {
//           state: {
//             openEbookId: e.productId,
//             from: "enrollments",
//           },
//         });
//         break;

//       default:
//         console.warn("⚠️ Unknown product type:", e.productType);
//     }
//   };

//   /* ---------------- BUTTON HANDLERS (OVERRIDE) ---------------- */
//   const handleQbankPractice = (ev, e) => {
//     ev.stopPropagation();
//     navigate(`/student/qbank/filter?bankId=${e.productId}`);
//   };

//   const handleQbankReview = (ev, e) => {
//     ev.stopPropagation();
//     navigate(`/student/qbank/details/${e.productId}`);
//   };

//   const handleMocktestStart = (ev, e) => {
//     ev.stopPropagation();
//     navigate(`/student/attempts/${e.productId}`);
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

//                       {/* ACTION FOOTER */}
//                       <Box mt={2} display="flex" gap={1}>
//                         {e.productType === "QBANK" && (
//                           <>
//                             <Box
//                               sx={btnPrimary}
//                               onClick={(ev) => handleQbankPractice(ev, e)}
//                             >
//                               PRACTICE
//                             </Box>
//                             <Box
//                               sx={btnOutline}
//                               onClick={(ev) => handleQbankReview(ev, e)}
//                             >
//                               REVIEW
//                             </Box>
//                           </>
//                         )}

//                         {e.productType === "MOCKTEST" && (
//                           <Box
//                             sx={btnPrimary}
//                             onClick={(ev) => handleMocktestStart(ev, e)}
//                           >
//                             START / RESUME
//                           </Box>
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

// /* =====================================================
//    ✅ SAFE THUMBNAIL NORMALIZER
//    (NO LOGIC CHANGE – ONLY URL FIX)
// ===================================================== */
// function normalizeThumbnailUrl(url) {
//   if (!url) return null;

//   // s3://bucket/path → https://bucket.s3.amazonaws.com/path
//   if (typeof url === "string" && url.startsWith("s3://")) {
//     const noScheme = url.replace("s3://", "");
//     const firstSlash = noScheme.indexOf("/");
//     if (firstSlash === -1) return null;

//     const bucket = noScheme.slice(0, firstSlash);
//     const key = noScheme.slice(firstSlash + 1);

//     return `https://${bucket}.s3.amazonaws.com/${key}`;
//   }

//   // already http / https
//   return url;
// }

// export default function MyEnrollments() {
//   const [loading, setLoading] = useState(true);
//   const [enrollments, setEnrollments] = useState([]);
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   const navigate = useNavigate();

//   const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
//   const contentCols = isCollapsed
//     ? "col-12 col-md-11 col-lg-11"
//     : "col-12 col-md-9 col-lg-10";

//   /* =====================================================
//      LOAD ENROLLMENTS (UNCHANGED)
//   ===================================================== */
//   useEffect(() => {
//     const fetchEnrollments = async () => {
//       try {
//         const res = await API.get("/api/student/enrollments");
//         console.log("📦 [MyEnrollments] enrollments:", res.data.enrollments);
//         setEnrollments(res.data.enrollments || []);
//       } catch (e) {
//         console.error("❌ Failed to load enrollments", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEnrollments();
//   }, []);

//   /* =====================================================
//      CARD CLICK HANDLER (UNCHANGED)
//   ===================================================== */
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
//         navigate("/ebooks", {
//           state: { openEbookId: e.productId, from: "enrollments" },
//         });
//         break;
//       default:
//         console.warn("⚠️ Unknown product type:", e.productType);
//     }
//   };

//   /* =====================================================
//      BUTTON HANDLERS (UNCHANGED)
//   ===================================================== */
//   const handleQbankPractice = (ev, e) => {
//     ev.stopPropagation();
//     navigate(`/student/qbank/filter?bankId=${e.productId}`);
//   };

//   const handleQbankReview = (ev, e) => {
//     ev.stopPropagation();
//     navigate(`/student/qbank/details/${e.productId}`);
//   };

//   const handleMocktestStart = (ev, e) => {
//     ev.stopPropagation();
//     navigate(`/student/attempts/${e.productId}`);
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

//                 const imageSrc =
//                   normalizeThumbnailUrl(e.thumbnailUrl) ||
//                   "https://via.placeholder.com/400x220.png?text=Enrollment";

//                 console.log(
//                   "🖼️ Enrollment thumbnail:",
//                   e.thumbnailUrl,
//                   "→",
//                   imageSrc
//                 );

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
//                       src={imageSrc}
//                       onError={(ev) => {
//                         ev.currentTarget.src =
//                           "https://via.placeholder.com/400x220.png?text=Enrollment";
//                       }}
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

//                       {/* ACTION FOOTER */}
//                       <Box mt={2} display="flex" gap={1}>
//                         {e.productType === "QBANK" && (
//                           <>
//                             <Box
//                               sx={btnPrimary}
//                               onClick={(ev) => handleQbankPractice(ev, e)}
//                             >
//                               PRACTICE
//                             </Box>
//                             <Box
//                               sx={btnOutline}
//                               onClick={(ev) => handleQbankReview(ev, e)}
//                             >
//                               REVIEW
//                             </Box>
//                           </>
//                         )}

//                         {e.productType === "MOCKTEST" && (
//                           <Box
//                             sx={btnPrimary}
//                             onClick={(ev) => handleMocktestStart(ev, e)}
//                           >
//                             START / RESUME
//                           </Box>
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

// /* =====================================================
//    BUTTON STYLES (UNCHANGED)
// ===================================================== */
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

/* =====================================================
   SAFE THUMBNAIL NORMALIZER
   (NO LOGIC CHANGE – ONLY URL FIX)
===================================================== */
function normalizeThumbnailUrl(url) {
  if (!url) return null;

  // s3://bucket/path → https://bucket.s3.amazonaws.com/path
  if (typeof url === "string" && url.startsWith("s3://")) {
    const noScheme = url.replace("s3://", "");
    const firstSlash = noScheme.indexOf("/");
    if (firstSlash === -1) return null;

    const bucket = noScheme.slice(0, firstSlash);
    const key = noScheme.slice(firstSlash + 1);

    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  // already http / https
  return url;
}

export default function MyEnrollments() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigate = useNavigate();

  const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
  const contentCols = isCollapsed
    ? "col-12 col-md-11 col-lg-11"
    : "col-12 col-md-9 col-lg-10";

  /* =====================================================
     LOAD ENROLLMENTS (UNCHANGED)
  ===================================================== */
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

  /* =====================================================
     CARD CLICK HANDLER (UNCHANGED)
  ===================================================== */
  const openEnrollment = (e) => {
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
        navigate("/ebooks", {
          state: { openEbookId: e.productId, from: "enrollments" },
        });
        break;
      default:
        console.warn("⚠️ Unknown product type:", e.productType);
    }
  };

  /* =====================================================
     BUTTON HANDLERS (UNCHANGED)
  ===================================================== */
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

          {/* ✅ MOBILE OFFCANVAS SIDEBAR (HAMBURGER FIX) */}
    <div
      className="offcanvas offcanvas-start bg-dark text-white d-md-none"
      tabIndex="-1"
      id="mobileSidebar"
      aria-labelledby="mobileSidebarLabel"
    >
      <div className="offcanvas-header">
        <h5 className="offcanvas-title" id="mobileSidebarLabel">
          Student
        </h5>
        <button
          type="button"
          className="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        />
      </div>

      <div className="offcanvas-body p-0">
        <StudentSidebar isCollapsed={false} toggleSidebar={() => {}} />
      </div>
    </div>

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

                const imageSrc =
                  normalizeThumbnailUrl(e.thumbnailUrl) ||
                  "https://via.placeholder.com/400x220.png?text=Enrollment";

                console.log(
                  "🖼️ Enrollment thumbnail:",
                  e.thumbnailUrl,
                  "→",
                  imageSrc
                );

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
                      src={imageSrc}
                      onError={(ev) => {
                        ev.currentTarget.src =
                          "https://via.placeholder.com/400x220.png?text=Enrollment";
                      }}
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

/* =====================================================
   BUTTON STYLES (UNCHANGED)
===================================================== */
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
