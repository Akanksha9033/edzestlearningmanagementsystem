// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   Box,
//   Typography,
//   Paper,
//   Grid,
//   CircularProgress,
// } from "@mui/material";
// import API from "../../LoginSystem/axios";

// /* ================= STYLES ================= */
// const headerStyles = {
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "space-between",
//   mb: 3,
// };

// const userInfo = {
//   display: "flex",
//   alignItems: "center",
//   gap: 2,
// };

// const avatarCircle = {
//   width: 56,
//   height: 56,
//   borderRadius: "50%",
//   background: "#e5f4ff",
//   color: "#2563eb",
//   fontWeight: 700,
//   fontSize: 22,
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
// };

// const statsContainer = {
//   p: 3,
//   borderRadius: 2,
//   mb: 4,
// };

// const statItem = {
//   "& .label": {
//     fontSize: 13,
//     color: "#6b7280",
//   },
//   "& .value": {
//     fontSize: 20,
//     fontWeight: 600,
//     mt: 0.5,
//   },
// };

// const emptyProducts = {
//   textAlign: "center",
//   py: 6,
//   color: "#6b7280",
// };

// export default function AdminLearnerProfile() {
//   const { sub } = useParams();
//   const navigate = useNavigate();
//   const [learner, setLearner] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [enrollments, setEnrollments] = useState([]);


//   useEffect(() => {
//     const fetchLearner = async () => {
//       try {
//         const res = await API.get(`/api/admin/users/${sub}`);
//         setLearner(res.data.user);
//         setEnrollments(res.data.enrollments || []);

//       } catch (err) {
//         console.error("Learner fetch failed", err);
//         setLearner(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLearner();
//   }, [sub]);

//   if (loading) {
//     return (
//       <Box p={4} textAlign="center">
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (!learner) {
//     return (
//       <Box p={4}>
//         <Typography>Learner not found</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box p={3} sx={{ background: "#f5f7fa", minHeight: "100vh" }}>

//       {/* ================= BACK + BREADCRUMB ================= */}
//       <Box sx={{ mb: 2 }}>
//         <Typography
//           sx={{
//             cursor: "pointer",
//             color: "#2563eb",
//             fontWeight: 500,
//             mb: 1,
//             width: "fit-content",
//           }}
//           onClick={() => navigate("/admin/users")}
//         >
//           &lt; Back
//         </Typography>

//         <Typography variant="body2" color="text.secondary">
//           <span
//             style={{ color: "#2563eb", cursor: "pointer" }}
//             onClick={() => navigate("/admin/dashboard")}
//           >
//             DASHBOARD
//           </span>
//           {" / "}
//           <span
//             style={{ color: "#2563eb", cursor: "pointer" }}
//             onClick={() => navigate("/admin/users")}
//           >
//             LEARNERS
//           </span>
//           {" / "}
//           <span style={{ color: "#6b7280" }}>
//             {learner.name}
//           </span>
//         </Typography>
//       </Box>

//       {/* ================= HEADER ================= */}
//       <Box sx={headerStyles}>
//         <Box sx={userInfo}>
//           <Box sx={avatarCircle}>
//             {learner.name?.charAt(0)?.toUpperCase()}
//           </Box>

//           <Box>
//             <Typography variant="h6" fontWeight={600}>
//               {learner.name}
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {learner.email}
//             </Typography>
//           </Box>
//         </Box>

//         <Box display="flex" gap={1}>
//           <Paper sx={{ px: 2, py: 1, cursor: "pointer" }}>INSIGHTS</Paper>
//           <Paper sx={{ px: 2, py: 1, cursor: "pointer" }}>MORE</Paper>
//           <Paper
//             sx={{
//               px: 2,
//               py: 1,
//               bgcolor: "#22c55e",
//               color: "#fff",
//               fontWeight: 600,
//               cursor: "pointer",
//             }}
//             onClick={() => navigate(`/admin/users/${sub}/add-product`)}
//           >
//             + ADD PRODUCT
//           </Paper>
//         </Box>
//       </Box>

//       {/* ================= STATS ================= */}
//       <Paper sx={statsContainer}>
//         <Grid container spacing={3}>
//           <Grid item xs={12} md={3} sx={statItem}>
//             <Typography className="label">Total Enrollments</Typography>
//            <Typography className="value">{enrollments.length}</Typography>

//           </Grid>

//           <Grid item xs={12} md={3} sx={statItem}>
//             <Typography className="label">Total Payments</Typography>
//             <Typography className="value">₹ 0</Typography>
//           </Grid>

//           <Grid item xs={12} md={3} sx={statItem}>
//             <Typography className="label">Last Active</Typography>
//             <Typography className="value">-</Typography>
//           </Grid>

//           <Grid item xs={12} md={3} sx={statItem}>
//             <Typography className="label">Active Devices</Typography>
//             <Typography className="value">0</Typography>
//           </Grid>
//         </Grid>
//       </Paper>

//       {/* ================= PRODUCTS ================= */}
//      <Paper sx={{ borderRadius: 2, p: 2 }}>
//   {enrollments.length === 0 ? (
//     <Box sx={emptyProducts}>
//       <Typography fontWeight={600}>No Products Enrolled</Typography>
//     </Box>
//   ) : (
//     <Grid container spacing={2}>
//       {enrollments.map((e) => (
//         <Grid item xs={12} md={6} key={e.sk}>
//           <Paper sx={{ p: 2, borderRadius: 2 }}>
//             <Typography fontWeight={600}>
//               {e.title || e.productType}
//             </Typography>

//             <Typography variant="body2" color="text.secondary">
//               {e.productType}
//             </Typography>

//             <Typography
//               variant="caption"
//               sx={{
//                 fontWeight: 700,
//                 color: e.accessSource === "admin" ? "#2563eb" : "#16a34a",
//               }}
//             >
//               {e.accessSource === "admin" ? "ASSIGNED" : "PAID"}
//             </Typography>
//           </Paper>
//         </Grid>
//       ))}
//     </Grid>
//   )}
// </Paper>

//     </Box>
//   );
// }


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import API from "../../LoginSystem/axios";

/* ================= STYLES ================= */
const headerStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 3,
};

const userInfo = {
  display: "flex",
  alignItems: "center",
  gap: 2,
};

const avatarCircle = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "#e5f4ff",
  color: "#2563eb",
  fontWeight: 700,
  fontSize: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statsContainer = {
  p: 3,
  borderRadius: 2,
  mb: 4,
};

const statItem = {
  "& .label": {
    fontSize: 13,
    color: "#6b7280",
  },
  "& .value": {
    fontSize: 20,
    fontWeight: 600,
    mt: 0.5,
  },
};

const emptyProducts = {
  textAlign: "center",
  py: 6,
  color: "#6b7280",
};

export default function AdminLearnerProfile() {
  const { sub } = useParams();
  const navigate = useNavigate();
  const [learner, setLearner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);

  /* ================= FETCH LEARNER ================= */
  useEffect(() => {
    const fetchLearner = async () => {
      try {
        const res = await API.get(`/api/admin/users/${sub}`);
        setLearner(res.data.user);
        setEnrollments(res.data.enrollments || []);
      } catch (err) {
        console.error("Learner fetch failed", err);
        setLearner(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLearner();
  }, [sub]);

  /* ================= DEBUG (SAFE) ================= */
  useEffect(() => {
    console.log("ADMIN ENROLLMENTS →", enrollments);
  }, [enrollments]);

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!learner) {
    return (
      <Box p={4}>
        <Typography>Learner not found</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ background: "#f5f7fa", minHeight: "100vh" }}>
      {/* ================= BACK + BREADCRUMB ================= */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            cursor: "pointer",
            color: "#2563eb",
            fontWeight: 500,
            mb: 1,
            width: "fit-content",
          }}
          onClick={() => navigate("/admin/users")}
        >
          &lt; Back
        </Typography>

        <Typography variant="body2" color="text.secondary">
          <span
            style={{ color: "#2563eb", cursor: "pointer" }}
            onClick={() => navigate("/admin/dashboard")}
          >
            DASHBOARD
          </span>
          {" / "}
          <span
            style={{ color: "#2563eb", cursor: "pointer" }}
            onClick={() => navigate("/admin/users")}
          >
            LEARNERS
          </span>
          {" / "}
          <span style={{ color: "#6b7280" }}>{learner.name}</span>
        </Typography>
      </Box>

      {/* ================= HEADER ================= */}
      <Box sx={headerStyles}>
        <Box sx={userInfo}>
          <Box sx={avatarCircle}>
            {learner.name?.charAt(0)?.toUpperCase()}
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={600}>
              {learner.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {learner.email}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Paper sx={{ px: 2, py: 1, cursor: "pointer" }}>INSIGHTS</Paper>
          <Paper sx={{ px: 2, py: 1, cursor: "pointer" }}>MORE</Paper>
          <Paper
            sx={{
              px: 2,
              py: 1,
              bgcolor: "#22c55e",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/admin/users/${sub}/add-product`)}
          >
            + ADD PRODUCT
          </Paper>
        </Box>
      </Box>

      {/* ================= STATS ================= */}
      <Paper sx={statsContainer}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Total Enrollments</Typography>
            <Typography className="value">{enrollments.length}</Typography>
          </Grid>

          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Total Payments</Typography>
            <Typography className="value">₹ 0</Typography>
          </Grid>

          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Last Active</Typography>
            <Typography className="value">-</Typography>
          </Grid>

          <Grid item xs={12} md={3} sx={statItem}>
            <Typography className="label">Active Devices</Typography>
            <Typography className="value">0</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= PRODUCTS ================= */}
      <Paper sx={{ borderRadius: 2, p: 2 }}>
        {enrollments.length === 0 ? (
          <Box sx={emptyProducts}>
            <Typography fontWeight={600}>No Products Enrolled</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {enrollments.map((e) => {
            const safeThumb =
  e.thumbnailUrl ||
  e.imageUrl ||
  e.image ||
  e.coverImage ||
  "/images/placeholder-course.png";


              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={e.sk}>
                  <Paper
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      background: "#fff",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                      transition: "transform .2s ease",
                      "&:hover": { transform: "translateY(-4px)" },
                    }}
                  >
                    {/* Thumbnail */}
                    <Box sx={{ width: "100%", height: 160 }}>
                      <img
                        src={safeThumb}
                        alt={e.title || e.productType}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(ev) => {
                          ev.currentTarget.src =
                            "/images/placeholder-course.png";
                        }}
                      />
                    </Box>

                    {/* Card Body */}
                    <Box sx={{ p: 1.5 }}>
                      <Typography
                        sx={{ fontWeight: 700, fontSize: 14 }}
                        noWrap
                      >
                        {e.title || e.productType}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6b7280",
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        {e.productType}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Box
                          sx={{
                            fontSize: 11,
                            px: 1,
                            py: 0.4,
                            borderRadius: 50,
                            background: "#eef2ff",
                            color: "#4f46e5",
                            fontWeight: 700,
                          }}
                        >
                          {e.productType}
                        </Box>

                        <Box
                          sx={{
                            fontSize: 11,
                            px: 1,
                            py: 0.4,
                            borderRadius: 50,
                            background:
                              e.accessSource === "admin"
                                ? "#ecfdf5"
                                : "#eff6ff",
                            color:
                              e.accessSource === "admin"
                                ? "#059669"
                                : "#2563eb",
                            fontWeight: 800,
                          }}
                        >
                          {e.accessSource === "admin"
                            ? "ASSIGNED"
                            : "PAID"}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>
    </Box>
  );
}
