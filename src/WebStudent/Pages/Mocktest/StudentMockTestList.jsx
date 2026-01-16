// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import API from "../../../LoginSystem/axios";
// import { useAuth } from "../../../LoginSystem/context/AuthContext";

// import {
//   Box,
//   Typography,
//   Stack,
//   Card,
//   CardActionArea,
//   CardMedia,
//   CardContent,
//   Chip,
//   Button,
//   CircularProgress,
// } from "@mui/material";

// import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
// import PayNowButton from "../../../Shared/PayNowButton";

// /* unchanged */
// const resolveImageUrl = (raw) => {
//   if (!raw) return "";
//   if (/^https?:\/\//i.test(raw)) return raw;
//   const m = String(raw).match(/^s3:\/\/([^/]+)\/(.+)$/i);
//   if (!m) return raw;
//   const [, bucket, key] = m;
//   return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
// };

// export default function StudentMockTestList() {
//   const nav = useNavigate();
//   const { ready, user } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [items, setItems] = useState([]);

//   // ⭐ NEW → Store access for each mockTestId
//   const [accessMap, setAccessMap] = useState({});

//   // Auth guard
//   useEffect(() => {
//     if (!ready) return;
//     if (!user) nav("/login", { replace: true });
//   }, [ready, user, nav]);

//   // Load mock tests
//   useEffect(() => {
//     if (!ready || !user) return;
//     (async () => {
//       try {
//         const r = await API.get("/api/student/mocktests");
//         setItems(Array.isArray(r.data?.items) ? r.data.items : []);
//       } catch (e) {
//         console.error(e);
//         alert("Failed to load mock tests");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [ready, user]);

//   // ⭐ NEW — Check access for each mock test
//   const checkAccessForAll = async () => {
//     try {
//       const studentId = user?.sub || user?.id || user?.userId;
//       if (!studentId || items.length === 0) return;

//       const map = {};

//       for (const m of items) {
//         const productId = `MOCK_${m.mockTestId}`;

//         const res = await API.get("/api/payments/has-access", {
//           params: { userId: studentId, productId },
//         });

//         map[m.mockTestId] = res.data?.allowed || false;
//       }

//       setAccessMap(map);
//     } catch (err) {
//       console.error("Access check error:", err);
//     }
//   };

//   // Recheck access when items loaded
//   useEffect(() => {
//     if (user && items.length > 0) {
//       checkAccessForAll();
//     }
//   }, [user, items]);

//   // Open attempts page
//   const openAttemptsForMock = (mockTestId) => {
//     nav(`/student/attempts/${mockTestId}`);
//   };

//   if (!ready) {
//     return (
//       <Box textAlign="center" mt={10} px={2}>
//         <CircularProgress />
//         <Typography mt={2}>Preparing your session…</Typography>
//       </Box>
//     );
//   }

//   if (loading) {
//     return (
//       <Box textAlign="center" mt={10} px={2}>
//         <CircularProgress />
//         <Typography mt={2}>Loading…</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box
//       maxWidth={1200}
//       mx="auto"
//       mt={{ xs: 2, md: 3 }}
//       px={{ xs: 1.25, sm: 2 }}
//       sx={{
//         WebkitOverflowScrolling: "touch",
//         overscrollBehavior: "auto",
//       }}
//     >
//       {/* 🔙 Back Button */}
//       <Box sx={{ mb: 1 }}>
//         <Button
//           variant="text"
//           startIcon={<ArrowBackIosNewIcon />}
//           onClick={() => nav("/student/dashboard")}
//           sx={{
//             color: "#4748ac",
//             textTransform: "none",
//             fontWeight: 600,
//             px: 0,
//             minWidth: 0,
//             "&:hover": {
//               backgroundColor: "transparent",
//               textDecoration: "underline",
//             },
//           }}
//         >
//           Back to Dashboard
//         </Button>
//       </Box>

//       {/* Page heading */}
//       <Typography variant="h5" fontWeight={800} mb={{ xs: 1.25, sm: 2 }}>
//         Available Mock Tests
//       </Typography>

//       {/* Grid */}
//       <Box
//         sx={{
//           display: "grid",
//           gridTemplateColumns: {
//             xs: "1fr",
//             sm: "repeat(2, minmax(0, 1fr))",
//             md: "repeat(3, minmax(0, 1fr))",
//           },
//           gap: 16,
//         }}
//       >
//         {items.map((m) => {
//           const img = resolveImageUrl(m.imageUrl || "");
//           const isPaid = !m.isFree && (m.price || 0) > 0;
//           const hasAccess = accessMap[m.mockTestId];

//           // ⭐ NEW → completes the requirement
//           const canOpen = !isPaid || hasAccess;

//           return (
//             <Card
//               key={m.mockTestId}
//               elevation={1}
//               sx={{
//                 borderRadius: 2,
//                 height: "100%",
//                 display: "flex",
//                 flexDirection: "column",
//                 overflow: "hidden",
//               }}
//             >
//               {/* ⭐ UPDATED: block click until access */}
//               <CardActionArea
//                 onClick={() => {
//                   if (canOpen) openAttemptsForMock(m.mockTestId);
//                 }}
//                 sx={{
//                   cursor: canOpen ? "pointer" : "not-allowed",
//                   opacity: canOpen ? 1 : 0.6,
//                 }}
//               >
//                 {img ? (
//                   <CardMedia
//                     component="img"
//                     image={img}
//                     alt={m.title}
//                     sx={{
//                       aspectRatio: "16 / 9",
//                       objectFit: "cover",
//                       width: "100%",
//                       height: "auto",
//                     }}
//                   />
//                 ) : (
//                   <Box
//                     sx={{
//                       aspectRatio: "16 / 9",
//                       display: "grid",
//                       placeItems: "center",
//                       bgcolor: "#f3f4f6",
//                       color: "text.secondary",
//                       width: "100%",
//                     }}
//                   >
//                     No image
//                   </Box>
//                 )}

//                 <CardContent sx={{ pb: 1.25 }}>
//                   <Stack direction="row" alignItems="center" spacing={1}>
//                     <Typography
//                       variant="subtitle1"
//                       fontWeight={700}
//                       sx={{
//                         flex: 1,
//                         overflow: "hidden",
//                         textOverflow: "ellipsis",
//                         display: "-webkit-box",
//                         WebkitLineClamp: 2,
//                         WebkitBoxOrient: "vertical",
//                         lineHeight: 1.25,
//                       }}
//                     >
//                       {m.title}
//                     </Typography>
//                     <Chip
//                       size="small"
//                       label={m.status || "DRAFT"}
//                       color={m.status === "PUBLISHED" ? "success" : "default"}
//                       sx={{ flexShrink: 0, ml: 0.5 }}
//                     />
//                   </Stack>

//                   <Typography
//                     variant="body2"
//                     color="text.secondary"
//                     mt={0.75}
//                     sx={{ wordBreak: "break-word" }}
//                   >
//                     {isPaid ? `₹${m.price}` : "Free"}
//                   </Typography>
//                 </CardContent>
//               </CardActionArea>

//               {/* ⭐ FINAL LOGIC → PAY OR START */}
//               <Box px={2} pb={2} pt={0}>
//                 {isPaid && !hasAccess ? (
//                   <PayNowButton
//                     userId={user?.sub || user?.id || user?.userId}
//                     productId={`MOCK_${m.mockTestId}`}
//                     productType="MOCKTEST"   
//                     amountPaise={(m.price || 0) * 100}
//                     label={`Pay ₹${m.price} to Unlock`}
//                     onSuccess={checkAccessForAll}
//                   />
//                 ) : (
//                   <Button
//                     fullWidth
//                     variant="contained"
//                     onClick={() => openAttemptsForMock(m.mockTestId)}
//                     sx={{
//                       backgroundColor: "#4748ac",
//                       textTransform: "none",
//                       py: 1,
//                     }}
//                   >
//                     Start / Resume
//                   </Button>
//                 )}
//               </Box>
//             </Card>
//           );
//         })}
//       </Box>
//     </Box>
//   );
// }

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../LoginSystem/axios";
import { useAuth } from "../../../LoginSystem/context/AuthContext";

import {
  Box,
  Typography,
  Stack,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import EnrollButton from "../../../Shared/EnrollButton";

/* unchanged */
const resolveImageUrl = (raw) => {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const m = String(raw).match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (!m) return raw;
  const [, bucket, key] = m;
  return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
};

export default function StudentMockTestList() {
  const nav = useNavigate();
  const { ready, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  // ✅ ENROLLMENT MAP (NEW – does NOT replace existing logic)
  const [enrolledMap, setEnrolledMap] = useState({});

  /* ---------------- AUTH GUARD (UNCHANGED) ---------------- */
  useEffect(() => {
    if (!ready) return;
    if (!user) nav("/login", { replace: true });
  }, [ready, user, nav]);

  /* ---------------- LOAD MOCK TESTS (UNCHANGED) ---------------- */
  useEffect(() => {
    if (!ready || !user) return;
    (async () => {
      try {
        const r = await API.get("/api/student/mocktests");
        setItems(Array.isArray(r.data?.items) ? r.data.items : []);
      } catch (e) {
        console.error(e);
        alert("Failed to load mock tests");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, user]);

  /* ---------------- LOAD ENROLLMENTS (NEW SAFE LAYER) ---------------- */
  const fetchEnrollments = async () => {
    try {
      const res = await API.get("/api/student/enrollments");
      const list = res.data?.enrollments || [];

      const map = {};
      list.forEach((e) => {
        if (e.productType === "MOCKTEST") {
          map[e.productId] = true;
        }
      });

      setEnrolledMap(map);
    } catch (err) {
      console.error("❌ Failed to fetch enrollments", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  /* ---------------- NAVIGATION (UNCHANGED) ---------------- */
  const openAttemptsForMock = (mockTestId) => {
    nav(`/student/attempts/${mockTestId}`);
  };

  /* ---------------- LOADING STATES (UNCHANGED) ---------------- */
  if (!ready) {
    return (
      <Box textAlign="center" mt={10} px={2}>
        <CircularProgress />
        <Typography mt={2}>Preparing your session…</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box textAlign="center" mt={10} px={2}>
        <CircularProgress />
        <Typography mt={2}>Loading…</Typography>
      </Box>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <Box
      maxWidth={1200}
      mx="auto"
      mt={{ xs: 2, md: 3 }}
      px={{ xs: 1.25, sm: 2 }}
    >
      {/* 🔙 Back Button */}
      <Box sx={{ mb: 1 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => nav("/student/dashboard")}
          sx={{
            color: "#4748ac",
            textTransform: "none",
            fontWeight: 600,
            px: 0,
            "&:hover": {
              backgroundColor: "transparent",
              textDecoration: "underline",
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Typography variant="h5" fontWeight={800} mb={2}>
        Available Mock Tests
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 16,
        }}
      >
        {items.map((m) => {
          const img = resolveImageUrl(m.imageUrl || "");
          const isPaid = !m.isFree && (m.price || 0) > 0;
          const isEnrolled = enrolledMap[m.mockTestId] === true;

          return (
            <Card
              key={m.mockTestId}
              sx={{
                borderRadius: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardActionArea
                onClick={() => {
                  if (isEnrolled) openAttemptsForMock(m.mockTestId);
                }}
                sx={{
                  cursor: isEnrolled ? "pointer" : "default",
                  opacity: isEnrolled ? 1 : 0.7,
                }}
              >
                {img ? (
                  <CardMedia component="img" image={img} alt={m.title} />
                ) : (
                  <Box
                    sx={{
                      aspectRatio: "16 / 9",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "#f3f4f6",
                    }}
                  >
                    No image
                  </Box>
                )}

                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={700} sx={{ flex: 1 }}>
                      {m.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={m.status || "DRAFT"}
                      color={m.status === "PUBLISHED" ? "success" : "default"}
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {isPaid ? `₹${m.price}` : "Free"}
                  </Typography>
                </CardContent>
              </CardActionArea>

              {/* ✅ SHARED ENROLL BUTTON */}
              <Box px={2} pb={2}>
                <EnrollButton
                  productId={m.mockTestId}
                  productType="MOCKTEST"
                  title={m.title}
                  thumbnailUrl={img}
                  isPaid={isPaid}
                  pricePaise={(m.price || 0) * 100}
                  isEnrolled={isEnrolled}
                  onEnrolled={fetchEnrollments}
                  onOpen={() => openAttemptsForMock(m.mockTestId)}
                />
              </Box>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
