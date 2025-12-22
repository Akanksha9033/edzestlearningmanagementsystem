// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import API from "../../../LoginSystem/axios";

// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Grid,
//   Button,
//   Stack, 
//   Chip,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   MenuItem,
//   Divider,
// } from "@mui/material";

// export default function AdminQBankList() {
//   const [banks, setBanks] = useState([]);
//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [selectedBankId, setSelectedBankId] = useState("");
//   const navigate = useNavigate();

//   // fetch all banks
//   useEffect(() => {
//     async function fetchBanks() {
//       try {
//         const res = await API.get("/api/admin/qbank");
//         setBanks(res.data || []);
//       } catch (err) {
//         console.error("❌ Error fetching QBank list:", err);
//       }
//     }
//     fetchBanks();
//   }, []);

//   // go to settings page for a bank
//   const openSettings = (bankId) => {
//     navigate(`/admin/qbank/${bankId}/qbsetting`);
//   };

//   // delete a bank
//   const handleDelete = async (bankId) => {
//     if (!window.confirm("Are you sure you want to delete this Question Bank?"))
//       return;

//     try {
//       await API.delete(`/api/admin/qbank/${bankId}`);
//       setBanks((prev) => prev.filter((bank) => bank.bankId !== bankId));
//       alert("🗑️ Question Bank deleted successfully");
//     } catch (err) {
//       console.error("❌ Error deleting bank:", err);
//       alert("Failed to delete Question Bank");
//     }
//   };

//   return (
//     <Box
//       sx={{
//         p: 4,
//         minHeight: "100vh",
//         backgroundColor: "#f8fafc",
//         backgroundImage:
//           "radial-gradient(circle at 20% 20%, rgba(71,72,172,0.05) 0%, rgba(0,0,0,0) 70%)",
//       }}
//     >
//       {/* Page header */}
//       <Typography
//         variant="h5"
//         sx={{
//           fontWeight: 600,
//           color: "#1e293b",
//           mb: 3,
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//         }}
//       >
//         <span role="img" aria-label="qbank">
//           📚
//         </span>
//         All Question Banks
//       </Typography>

//       {/* Card grid, like mocktests layout */}
//       <Grid container spacing={3}>
//         {banks.map((bank) => {
//           const createdDate = bank.createdAt
//             ? new Date(bank.createdAt).toLocaleDateString()
//             : "N/A";
//           const isPublished = bank?.status === "PUBLISHED";

//           return (
//             <Grid item xs={12} sm={6} md={4} key={bank.bankId}>
//               <Card
//                 sx={{
//                   borderRadius: "6px",
//                   border: "1px solid rgba(0,0,0,0.12)",
//                   boxShadow:
//                     "0 2px 4px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.05)",
//                   overflow: "hidden",
//                   backgroundColor: "#fff",
//                   display: "flex",
//                   flexDirection: "column",
//                   transition: "box-shadow 0.2s, transform 0.2s",
//                   "&:hover": {
//                     boxShadow:
//                       "0 4px 8px rgba(0,0,0,0.07), 0 20px 32px rgba(0,0,0,0.08)",
//                     transform: "translateY(-2px)",
//                   },
//                 }}
//               >
//                 {/* Top image area (mocktest style) */}
//                 <Box
//                   sx={{
//                     width: "100%",
//                     height: 180,
//                     backgroundColor: "#e2e8f0",
//                     borderBottom: "1px solid rgba(0,0,0,0.08)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     overflow: "hidden",
//                   }}
//                 >
//                   {bank.thumbnailUrl ? (
//                     <img
//                       src={bank.thumbnailUrl}
//                       alt={`${bank.name} cover`}
//                       style={{
//                         width: "100%",
//                         height: "100%",
//                         objectFit: "cover",
//                         objectPosition: "center",
//                         display: "block",
//                       }}
//                       onError={(e) => {
//                         // if image not public yet, hide the img and show placeholder bg
//                         e.currentTarget.style.display = "none";
//                       }}
//                     />
//                   ) : (
//                     <Box
//                       sx={{
//                         fontSize: "0.8rem",
//                         color: "#475569",
//                         textAlign: "center",
//                         px: 2,
//                       }}
//                     >
//                       No Thumbnail
//                     </Box>
//                   )}
//                 </Box>

//                 {/* Bottom content (custom for q-bank) */}
//                 <CardContent sx={{ p: 2.5 }}>
//                   {/* Title */}
//                   <Typography
//                     variant="subtitle1"
//                     sx={{ fontWeight: 600, color: "#1f2937", mb: 1 }}
//                   >
//                     {bank.name || "Untitled Bank"}
//                   </Typography>

//                   {/* Created Date */}
//                   <Typography
//                     variant="body2"
//                     sx={{
//                       color: "#475569",
//                       lineHeight: 1.4,
//                       mb: 1.5,
//                     }}
//                   >
//                     Created: {createdDate}
//                   </Typography>

//                   {/* Row: status + View Excel */}
//                   <Stack
//                     direction="row"
//                     flexWrap="wrap"
//                     alignItems="center"
//                     spacing={1}
//                     sx={{ mb: 1.5 }}
//                   >
//                     {/* status chip like mocktest "PUBLISHED" / "UNPUBLISHED" */}
//                     {isPublished ? (
//                       <Chip
//                         size="small"
//                         label="PUBLISHED"
//                         sx={{
//                           fontWeight: 600,
//                           fontSize: "0.7rem",
//                           color: "#fff",
//                           backgroundColor: "#1b5e20",
//                           borderRadius: "4px",
//                           height: 24,
//                         }}
//                       />
//                     ) : (
//                       <Chip
//                         size="small"
//                         label="UNPUBLISHED"
//                         sx={{
//                           fontWeight: 600,
//                           fontSize: "0.7rem",
//                           backgroundColor: "#fff",
//                           color: "#000",
//                           border: "1px solid rgba(0,0,0,0.3)",
//                           borderRadius: "4px",
//                           height: 24,
//                         }}
//                       />
//                     )}

//                     {/* View Excel button (instead of "Free" chip in mocktest) */}
//                     {bank.excelFileUrl && (
//                       <Button
//                         size="small"
//                         variant="outlined"
//                         sx={{
//                           textTransform: "none",
//                           lineHeight: 1.2,
//                           fontWeight: 600,
//                           fontSize: "0.7rem",
//                           borderRadius: "4px",
//                           height: 24,
//                           borderColor: "#94a3b8",
//                           color: "#1e293b",
//                           backgroundColor: "#fff",
//                           "&:hover": {
//                             backgroundColor: "#f8fafc",
//                             borderColor: "#64748b",
//                           },
//                         }}
//                         onClick={() => {
//                           window.open(
//                             bank.excelFileUrl,
//                             "_blank",
//                             "noopener,noreferrer"
//                           );
//                         }}
//                       >
//                         📄 View Excel
//                       </Button>
//                     )}
//                   </Stack>

//                   {/* Action row: Edit / Delete */}
//                   <Stack direction="row" spacing={1} flexWrap="wrap">
//                     <Button
//                       variant="contained"
//                       size="small"
//                       sx={{
//                         textTransform: "none",
//                         fontWeight: 700,
//                         fontSize: "0.75rem",
//                         lineHeight: 1.2,
//                         borderRadius: "4px",
//                         backgroundColor: "#4748ac",
//                         boxShadow: "0 6px 14px rgba(71,72,172,0.35)",
//                         "&:hover": {
//                           backgroundColor: "#3e40a5",
//                           boxShadow: "0 8px 18px rgba(71,72,172,0.45)",
//                         },
//                       }}
//                       onClick={() =>
//                         navigate(`/admin/qbank/edit/${bank.bankId}`)
//                       }
//                     >
//                       ✏️ Edit
//                     </Button>

//                     <Button
//                       variant="outlined"
//                       color="error"
//                       size="small"
//                       sx={{
//                         textTransform: "none",
//                         fontWeight: 600,
//                         fontSize: "0.75rem",
//                         lineHeight: 1.2,
//                         borderRadius: "4px",
//                         "&:hover": {
//                           background: "#fff5f5",
//                           borderColor: "#c62828",
//                           color: "#c62828",
//                         },
//                       }}
//                       onClick={() => handleDelete(bank.bankId)}
//                     >
//                       🗑️ Delete
//                     </Button>
//                   </Stack>
//                 </CardContent>
//               </Card>
//             </Grid>
//           );
//         })}
//       </Grid>

//       {/* hidden settings picker dialog (same logic, unchanged) */}
//       <Dialog
//         open={pickerOpen}
//         onClose={() => setPickerOpen(false)}
//         fullWidth
//         maxWidth="xs"
//         PaperProps={{
//           sx: {
//             borderRadius: 3,
//             overflow: "hidden",
//             boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
//           },
//         }}
//       >
//         <DialogTitle
//           sx={{
//             fontWeight: 800,
//             color: "#1f2937",
//             py: 2.25,
//             background:
//               "linear-gradient(180deg, rgba(71,72,172,0.06), rgba(71,72,172,0))",
//           }}
//         >
//           Select Question Bank
//         </DialogTitle>
//         <Divider />
//         <DialogContent sx={{ pt: 2 }}>
//           <TextField
//             fullWidth
//             select
//             label="Question Bank"
//             margin="normal"
//             value={selectedBankId}
//             onChange={(e) => setSelectedBankId(e.target.value)}
//             InputLabelProps={{ sx: { fontWeight: 600 } }}
//             sx={{
//               "& .MuiOutlinedInput-root": { borderRadius: 2 },
//               "& .MuiSelect-select": { py: 1.2 },
//             }}
//           >
//             {banks.map((b) => (
//               <MenuItem key={b.bankId} value={b.bankId}>
//                 {b.name}
//               </MenuItem>
//             ))}
//           </TextField>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2.5 }}>
//           <Button
//             onClick={() => setPickerOpen(false)}
//             sx={{ textTransform: "none" }}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="contained"
//             disabled={!selectedBankId}
//             onClick={() => {
//               setPickerOpen(false);
//               openSettings(selectedBankId);
//             }}
//             sx={{
//               textTransform: "none",
//               fontWeight: 700,
//               background: "linear-gradient(135deg, #4748ac, #2f3192)",
//               boxShadow: "0 8px 18px rgba(71,72,172,0.35)",
//               "&:hover": {
//                 background: "linear-gradient(135deg, #3e40a5, #2a2c86)",
//               },
//             }}
//           >
//             Open Settings
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import API from "../../../LoginSystem/axios";

// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Grid,
//   Button,
//   Stack,
//   Chip,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   MenuItem,
//   Divider,
//   Tooltip,
// } from "@mui/material";
// import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

// export default function AdminQBankList() {
//   const [banks, setBanks] = useState([]);
//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [selectedBankId, setSelectedBankId] = useState("");
//   const navigate = useNavigate();

//   const brand = "#4748ac";

//   // 👇 fallback cover for when S3 thumbnail fails / not public yet / older bank with no thumbnail
//   const FALLBACK_THUMB =
//     "https://via.placeholder.com/600x360.png?text=Question+Bank";

//   // fetch all banks
//   useEffect(() => {
//     async function fetchBanks() {
//       try {
//         const res = await API.get("/api/admin/qbank");
//         setBanks(res.data || []);
//       } catch (err) {
//         console.error("❌ Error fetching QBank list:", err);
//       }
//     }
//     fetchBanks();
//   }, []);

//   // go to settings page for a bank
//   const openSettings = (bankId) => {
//     navigate(`/admin/qbank/${bankId}/qbsetting`);
//   };

//   // delete a bank
//   const handleDelete = async (bankId) => {
//     if (!window.confirm("Are you sure you want to delete this Question Bank?"))
//       return;

//     try {
//       await API.delete(`/api/admin/qbank/${bankId}`);
//       setBanks((prev) => prev.filter((bank) => bank.bankId !== bankId));
//       alert("🗑️ Question Bank deleted successfully");
//     } catch (err) {
//       console.error("❌ Error deleting bank:", err);
//       alert("Failed to delete Question Bank");
//     }
//   };

//   return (
//     <Box
//       sx={{
//         p: 4,
//         minHeight: "100vh",
//         backgroundColor: "#f8fafc",
//         backgroundImage:
//           "radial-gradient(circle at 20% 20%, rgba(71,72,172,0.05) 0%, rgba(0,0,0,0) 70%)",
//         position: "relative",
//       }}
//     >
//       {/* ⬅️ Back button */}
//       <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 1 }}>
//         <Tooltip title="Back to Dashboard" arrow>
//           <Button
//             onClick={() => navigate("/admin/dashboard")}
//             startIcon={<ArrowBackIosNewIcon />}
//             variant="outlined"
//             sx={{
//               px: 2,
//               py: 0.9,
//               borderRadius: 999,
//               textTransform: "none",
//               fontWeight: 700,
//               letterSpacing: 0.2,
//               borderColor: brand,
//               color: brand,
//               background: "rgba(71,72,172,0.06)",
//               "&:hover": {
//                 background: "rgba(71,72,172,0.12)",
//                 borderColor: "#3e40a5",
//                 color: "#2a2c86",
//               },
//             }}
//           >
//             Back
//           </Button>
//         </Tooltip>
//       </Box>

//       {/* page heading */}
//       <Typography
//         variant="h5"
//         sx={{
//           fontWeight: 600,
//           color: "#1e293b",
//           mb: 3,
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//           justifyContent: "center",
//         }}
//       >
//         <span role="img" aria-label="qbank">
//           📚
//         </span>
//         All Question Banks
//       </Typography>

//       {/* card grid */}
//       <Grid container spacing={3}>
//         {banks.map((bank) => {
//           const createdDate = bank.createdAt
//             ? new Date(bank.createdAt).toLocaleDateString()
//             : "N/A";
//           const isPublished = bank?.status === "PUBLISHED";

//           // pick which image URL to try first
//           const initialThumb = bank.thumbnailUrl && bank.thumbnailUrl.trim()
//             ? bank.thumbnailUrl
//             : FALLBACK_THUMB;

//           return (
//             <Grid item xs={12} sm={6} md={4} key={bank.bankId}>
//               <Card
//                 sx={{
//                   borderRadius: "6px",
//                   border: "1px solid rgba(0,0,0,0.12)",
//                   boxShadow:
//                     "0 2px 4px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.05)",
//                   overflow: "hidden",
//                   backgroundColor: "#fff",
//                   display: "flex",
//                   flexDirection: "column",
//                   transition: "box-shadow 0.2s, transform 0.2s",
//                   width: 260, // tighter like your screenshot
//                   "&:hover": {
//                     boxShadow:
//                       "0 4px 8px rgba(0,0,0,0.07), 0 20px 32px rgba(0,0,0,0.08)",
//                     transform: "translateY(-2px)",
//                   },
//                 }}
//               >
//                 {/* Thumbnail area (always 180px tall) */}
//                 <Box
//                   sx={{
//                     width: "100%",
//                     height: 180,
//                     backgroundColor: "#e2e8f0",
//                     borderBottom: "1px solid rgba(0,0,0,0.08)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     overflow: "hidden",
//                   }}
//                 >
//                   <img
//                     src={initialThumb}
//                     alt={`${bank.name || "Question Bank"} cover`}
//                     style={{
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                       objectPosition: "center",
//                       display: "block",
//                     }}
//                     onError={(e) => {
//                       // if S3 URL 403s / 404s etc → swap to fallback, don't go blank
//                       if (e.currentTarget.src !== FALLBACK_THUMB) {
//                         e.currentTarget.src = FALLBACK_THUMB;
//                       }
//                     }}
//                   />
//                 </Box>

//                 {/* bottom details */}
//                 <CardContent sx={{ p: 2 }}>
//                   {/* title */}
//                   <Typography
//                     variant="subtitle1"
//                     sx={{ fontWeight: 600, color: "#1f2937", mb: 1 }}
//                   >
//                     {bank.name || "Untitled Bank"}
//                   </Typography>

//                   {/* created date */}
//                   <Typography
//                     variant="body2"
//                     sx={{
//                       color: "#475569",
//                       lineHeight: 1.4,
//                       mb: 1,
//                     }}
//                   >
//                     Created: {createdDate}
//                   </Typography>

//                   {/* chips row */}
//                   <Stack
//                     direction="row"
//                     flexWrap="wrap"
//                     alignItems="center"
//                     spacing={1}
//                     sx={{ mb: 1.5 }}
//                   >
//                     {isPublished ? (
//                       <Chip
//                         size="small"
//                         label="PUBLISHED"
//                         sx={{
//                           fontWeight: 600,
//                           fontSize: "0.7rem",
//                           color: "#fff",
//                           backgroundColor: "#1b5e20",
//                           borderRadius: "4px",
//                           height: 24,
//                         }}
//                       />
//                     ) : (
//                       <Chip
//                         size="small"
//                         label="UNPUBLISHED"
//                         sx={{
//                           fontWeight: 600,
//                           fontSize: "0.7rem",
//                           backgroundColor: "#fff",
//                           color: "#000",
//                           border: "1px solid rgba(0,0,0,0.3)",
//                           borderRadius: "4px",
//                           height: 24,
//                         }}
//                       />
//                     )}

//                     {bank.excelFileUrl && (
//                       <Button
//                         size="small"
//                         variant="outlined"
//                         sx={{
//                           textTransform: "none",
//                           lineHeight: 1.2,
//                           fontWeight: 600,
//                           fontSize: "0.7rem",
//                           borderRadius: "4px",
//                           height: 24,
//                           borderColor: "#94a3b8",
//                           color: "#1e293b",
//                           backgroundColor: "#fff",
//                           "&:hover": {
//                             backgroundColor: "#f8fafc",
//                             borderColor: "#64748b",
//                           },
//                         }}
//                         onClick={() => {
//                           window.open(
//                             bank.excelFileUrl,
//                             "_blank",
//                             "noopener,noreferrer"
//                           );
//                         }}
//                       >
//                         📄 View Excel
//                       </Button>
//                     )}
//                   </Stack>

//                   {/* action buttons row */}
//                   <Stack direction="row" spacing={1} flexWrap="wrap">
//                     <Button
//                       variant="contained"
//                       size="small"
//                       sx={{
//                         textTransform: "none",
//                         fontWeight: 700,
//                         fontSize: "0.75rem",
//                         lineHeight: 1.2,
//                         borderRadius: "4px",
//                         backgroundColor: "#4748ac",
//                         boxShadow: "0 6px 14px rgba(71,72,172,0.35)",
//                         "&:hover": {
//                           backgroundColor: "#3e40a5",
//                           boxShadow:
//                             "0 8px 18px rgba(71,72,172,0.45)",
//                         },
//                       }}
//                       onClick={() =>
//                         navigate(`/admin/qbank/edit/${bank.bankId}`)
//                       }
//                     >
//                       ✏️ Edit
//                     </Button>

//                     <Button
//                       variant="outlined"
//                       color="error"
//                       size="small"
//                       sx={{
//                         textTransform: "none",
//                         fontWeight: 600,
//                         fontSize: "0.75rem",
//                         lineHeight: 1.2,
//                         borderRadius: "4px",
//                         "&:hover": {
//                           background: "#fff5f5",
//                           borderColor: "#c62828",
//                           color: "#c62828",
//                         },
//                       }}
//                       onClick={() => handleDelete(bank.bankId)}
//                     >
//                       🗑️ Delete
//                     </Button>
//                   </Stack>
//                 </CardContent>
//               </Card>
//             </Grid>
//           );
//         })}
//       </Grid>

//       {/* settings picker dialog (unchanged behavior) */}
//       <Dialog
//         open={pickerOpen}
//         onClose={() => setPickerOpen(false)}
//         fullWidth
//         maxWidth="xs"
//         PaperProps={{
//           sx: {
//             borderRadius: 3,
//             overflow: "hidden",
//             boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
//           },
//         }}
//       >
//         <DialogTitle
//           sx={{
//             fontWeight: 800,
//             color: "#1f2937",
//             py: 2.25,
//             background:
//               "linear-gradient(180deg, rgba(71,72,172,0.06), rgba(71,72,172,0))",
//           }}
//         >
//           Select Question Bank
//         </DialogTitle>
//         <Divider />
//         <DialogContent sx={{ pt: 2 }}>
//           <TextField
//             fullWidth
//             select
//             label="Question Bank"
//             margin="normal"
//             value={selectedBankId}
//             onChange={(e) => setSelectedBankId(e.target.value)}
//             InputLabelProps={{ sx: { fontWeight: 600 } }}
//             sx={{
//               "& .MuiOutlinedInput-root": { borderRadius: 2 },
//               "& .MuiSelect-select": { py: 1.2 },
//             }}
//           >
//             {banks.map((b) => (
//               <MenuItem key={b.bankId} value={b.bankId}>
//                 {b.name}
//               </MenuItem>
//             ))}
//           </TextField>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2.5 }}>
//           <Button
//             onClick={() => setPickerOpen(false)}
//             sx={{ textTransform: "none" }}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="contained"
//             disabled={!selectedBankId}
//             onClick={() => {
//               setPickerOpen(false);
//               openSettings(selectedBankId);
//             }}
//             sx={{
//               textTransform: "none",
//               fontWeight: 700,
//               background:
//                 "linear-gradient(135deg, #4748ac, #2f3192)",
//               boxShadow: "0 8px 18px rgba(71,72,172,0.35)",
//               "&:hover": {
//                 background:
//                   "linear-gradient(135deg, #3e40a5, #2a2c86)",
//               },
//             }}
//           >
//             Open Settings
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

// src/MockTest/.../AdminQBankList.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../LoginSystem/axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function AdminQBankList() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("");
  const navigate = useNavigate();

  const brand = "#4748ac";
  const FALLBACK_THUMB =
    "https://via.placeholder.com/600x360.png?text=Question+Bank";

  // fetch all banks
  useEffect(() => {
    async function fetchBanks() {
      try {
        const res = await API.get("/api/admin/qbank");
        setBanks(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching QBank list:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBanks();
  }, []);

  const openSettings = (bankId) => {
    navigate(`/admin/qbank/${bankId}/qbsetting`);
  };

  const handleDelete = async (bankId) => {
    if (!window.confirm("Are you sure you want to delete this Question Bank?"))
      return;

    try {
      await API.delete(`/api/admin/qbank/${bankId}`);
      setBanks((prev) => prev.filter((bank) => bank.bankId !== bankId));
      alert("🗑️ Question Bank deleted successfully");
    } catch (err) {
      console.error("❌ Error deleting bank:", err);
      alert("Failed to delete Question Bank");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(71,72,172,0.05) 0%, rgba(0,0,0,0) 70%)",
        position: "relative",
      }}
    >
      {/* ⬅ Back to Dashboard */}
      <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 1 }}>
        <Tooltip title="Back to Dashboard" arrow>
          <Button
            onClick={() => navigate("/admin/dashboard")}
            startIcon={<ArrowBackIosNewIcon />}
            variant="outlined"
            sx={{
              px: 2,
              py: 0.9,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              letterSpacing: 0.2,
              borderColor: brand,
              color: brand,
              background: "rgba(71,72,172,0.06)",
              "&:hover": {
                background: "rgba(71,72,172,0.12)",
                borderColor: "#3e40a5",
                color: "#2a2c86",
              },
            }}
          >
            Back
          </Button>
        </Tooltip>
      </Box>

      {/* Heading */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: "#1e293b",
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        <span role="img" aria-label="qbank">
          📚
        </span>
        All Question Banks
      </Typography>

      {/* Grid of banks */}
      <Grid container spacing={3}>
        {banks.map((bank) => {
          const createdDate = bank.createdAt
            ? new Date(bank.createdAt).toLocaleDateString()
            : "N/A";
          const isPublished = bank?.status === "PUBLISHED";
          const initialThumb =
            bank.thumbnailUrl && bank.thumbnailUrl.trim()
              ? bank.thumbnailUrl
              : FALLBACK_THUMB;

          return (
            <Grid item xs={12} sm={6} md={4} key={bank.bankId}>
              <Card
                sx={{
                  borderRadius: "6px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  width: 260,
                  "&:hover": {
                    boxShadow:
                      "0 4px 8px rgba(0,0,0,0.07), 0 20px 32px rgba(0,0,0,0.08)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* Thumbnail */}
                <Box
                  sx={{
                    width: "100%",
                    height: 180,
                    backgroundColor: "#e2e8f0",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={initialThumb}
                    alt={`${bank.name || "Question Bank"} cover`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                    }}
                    onError={(e) => {
                      if (e.currentTarget.src !== FALLBACK_THUMB) {
                        e.currentTarget.src = FALLBACK_THUMB;
                      }
                    }}
                  />
                </Box>

                {/* Details */}
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: "#1f2937", mb: 1 }}
                  >
                    {bank.name || "Untitled Bank"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#475569", lineHeight: 1.4, mb: 1 }}
                  >
                    Created: {createdDate}
                  </Typography>

                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1.5 }}
                  >
                    {isPublished ? (
                      <Chip
                        size="small"
                        label="PUBLISHED"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          color: "#fff",
                          backgroundColor: "#1b5e20",
                          borderRadius: "4px",
                          height: 24,
                        }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label="UNPUBLISHED"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          backgroundColor: "#fff",
                          color: "#000",
                          border: "1px solid rgba(0,0,0,0.3)",
                          borderRadius: "4px",
                          height: 24,
                        }}
                      />
                    )}

                    {bank.excelFileUrl && (
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          textTransform: "none",
                          lineHeight: 1.2,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          borderRadius: "4px",
                          height: 24,
                          borderColor: "#94a3b8",
                          color: "#1e293b",
                          backgroundColor: "#fff",
                          "&:hover": {
                            backgroundColor: "#f8fafc",
                            borderColor: "#64748b",
                          },
                        }}
                        onClick={() =>
                          window.open(
                            bank.excelFileUrl,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                      >
                        📄 View Excel
                      </Button>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        lineHeight: 1.2,
                        borderRadius: "4px",
                        backgroundColor: "#4748ac",
                        boxShadow: "0 6px 14px rgba(71,72,172,0.35)",
                        "&:hover": {
                          backgroundColor: "#3e40a5",
                          boxShadow: "0 8px 18px rgba(71,72,172,0.45)",
                        },
                      }}
                      onClick={() =>
                        navigate(`/admin/qbank/edit/${bank.bankId}`)
                      }
                    >
                      ✏️ Edit
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        lineHeight: 1.2,
                        borderRadius: "4px",
                        "&:hover": {
                          background: "#fff5f5",
                          borderColor: "#c62828",
                          color: "#c62828",
                        },
                      }}
                      onClick={() => handleDelete(bank.bankId)}
                    >
                      🗑️ Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* (optional) settings picker dialog — same as before, you can add if needed */}
    </Box>
  );
}
