// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   TextField,
//   Stack,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   IconButton,
//   CircularProgress,
// } from "@mui/material";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// import FilterListIcon from "@mui/icons-material/FilterList";
// import ViewColumnIcon from "@mui/icons-material/ViewColumn";
// import DownloadIcon from "@mui/icons-material/Download";
// import EmailIcon from "@mui/icons-material/Email";
// import AddIcon from "@mui/icons-material/Add";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import { useNavigate } from "react-router-dom";
// import API from "../../LoginSystem/axios";

// export default function AdminUsers() {
//   const navigate = useNavigate();

//   const [learners, setLearners] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");

//   const fetchUsers = async () => {
//     try {
//       const res = await API.get("/api/admin/users");
//       setLearners(res.data.users || []);
//     } catch (err) {
//       console.error("Failed to fetch users", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const filteredLearners = learners.filter((u) =>
//     u.email?.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <Box p={3}>

//       {/* 🔙 BACK BUTTON (ADDED – NO LOGIC CHANGE) */}
//       <Button
//         startIcon={<ArrowBackIcon />}
//         onClick={() => navigate("/admin/dashboard")}
//         sx={{ mb: 2, textTransform: "none" }}
//       >
//         Back to Dashboard
//       </Button>

//       {/* ================= HEADER ================= */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={3}
//       >
//         <Typography variant="h5" fontWeight={600}>
//           All Learners
//         </Typography>

//         <Stack direction="row" spacing={1}>
//           <Button variant="outlined" startIcon={<MoreVertIcon />}>
//             MORE
//           </Button>
//           <Button variant="outlined" startIcon={<EmailIcon />}>
//             SEND MESSAGE
//           </Button>
//           <Button
//             variant="contained"
//             color="success"
//             startIcon={<AddIcon />}
//             onClick={() => navigate("/admin/users/add")}
//           >
//             ADD
//           </Button>
//         </Stack>
//       </Stack>

//       {/* ================= SEARCH + ACTIONS ================= */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={2}
//       >
//         <TextField
//           placeholder="Search by Email"
//           size="small"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           sx={{ width: 300 }}
//         />

//         <Stack direction="row" spacing={1}>
//           <Button size="small" variant="outlined" startIcon={<FilterListIcon />}>
//             FILTERS
//           </Button>
//           <Button size="small" variant="outlined" startIcon={<ViewColumnIcon />}>
//             COLUMNS
//           </Button>
//           <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>
//             EXPORT
//           </Button>
//         </Stack>
//       </Stack>

//       {/* ================= TABLE ================= */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ backgroundColor: "#f5f7fa" }}>
//               <TableCell><b>Learner Details</b></TableCell>
//               <TableCell><b>Email Status</b></TableCell>
//               <TableCell><b>Last Login</b></TableCell>
//               <TableCell><b>Total Spent</b></TableCell>
//               <TableCell><b>Active Devices</b></TableCell>
//               <TableCell align="right"><b>Actions</b></TableCell>
//             </TableRow>
//           </TableHead>

//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={6} align="center">
//                   <CircularProgress size={24} />
//                 </TableCell>
//               </TableRow>
//             ) : filteredLearners.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={6} align="center">
//                   No learners found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               filteredLearners.map((user, idx) => (
//                 <TableRow
//   key={idx}
//   hover
//   sx={{ cursor: "pointer" }}
//   onClick={() => navigate(`/admin/users/${user.sub}`)}
// >

//                   <TableCell>
//                     <Typography fontWeight={600}>
//                       {user.name || "-"}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       {user.email}
//                     </Typography>
//                   </TableCell>

//                   <TableCell>
//                     <Chip
//                       label={user.emailVerified ? "Verified" : "Unverified"}
//                       color={user.emailVerified ? "success" : "error"}
//                       size="small"
//                       variant="outlined"
//                     />
//                   </TableCell>

//                   <TableCell>
//                     {user.lastLogin
//                       ? new Date(user.lastLogin).toLocaleDateString()
//                       : "-"}
//                   </TableCell>

//                   <TableCell>
//                     {user.totalSpent ? `₹ ${user.totalSpent}` : "-"}
//                   </TableCell>

//                   <TableCell>{user.activeDevices || 0}</TableCell>

//                   <TableCell align="right">
//                     <IconButton>
//                       <MoreVertIcon />
//                     </IconButton>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   );
// }


// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   TextField,
//   Stack,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   IconButton,
//   CircularProgress,
//   Menu,
//   MenuItem,
// } from "@mui/material";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// // import FilterListIcon from "@mui/icons-material/FilterList";   // ❌ COMMENTED
// // import ViewColumnIcon from "@mui/icons-material/ViewColumn";   // ❌ COMMENTED
// // import DownloadIcon from "@mui/icons-material/Download";       // ❌ COMMENTED
// // import EmailIcon from "@mui/icons-material/Email";             // ❌ COMMENTED
// import AddIcon from "@mui/icons-material/Add";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import { useNavigate } from "react-router-dom";
// import API from "../../LoginSystem/axios";

// export default function AdminUsers() {
//   const navigate = useNavigate();

//   const [learners, setLearners] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");

//   // ✅ ADD DROPDOWN STATE
//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);

//   const fetchUsers = async () => {
//     try {
//       const res = await API.get("/api/admin/users");
//       setLearners(res.data.users || []);
//     } catch (err) {
//       console.error("Failed to fetch users", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const filteredLearners = learners.filter((u) =>
//     u.email?.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <Box p={3}>
//       {/* 🔙 BACK */}
//       <Button
//         startIcon={<ArrowBackIcon />}
//         onClick={() => navigate("/admin/dashboard")}
//         sx={{ mb: 2, textTransform: "none" }}
//       >
//         Back to Dashboard
//       </Button>

//       {/* ================= HEADER ================= */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={3}
//       >
//         <Typography variant="h5" fontWeight={600}>
//           All Learners
//         </Typography>

//         {/* ❌ COMMENTED BUTTONS */}
//         {/*
//         <Stack direction="row" spacing={1}>
//           <Button variant="outlined">MORE</Button>
//           <Button variant="outlined">SEND MESSAGE</Button>
//         </Stack>
//         */}

//         {/* ✅ ADD DROPDOWN */}
//         <Button
//           variant="contained"
//           color="success"
//           startIcon={<AddIcon />}
//           onClick={(e) => setAnchorEl(e.currentTarget)}
//         >
//           ADD
//         </Button>

//         <Menu
//           anchorEl={anchorEl}
//           open={open}
//           onClose={() => setAnchorEl(null)}
//         >
//           <MenuItem
//             onClick={() => {
//               setAnchorEl(null);
//               navigate("/admin/users/add"); // 👈 existing ADD link
//             }}
//           >
//             Create Individual
//           </MenuItem>

//           <MenuItem
//             onClick={() => {
//               setAnchorEl(null);
//               navigate("/admin/users/bulk-create"); // 👈 bulk create
//             }}
//           >
//             Bulk Create
//           </MenuItem>
//         </Menu>
//       </Stack>

//       {/* ================= SEARCH ================= */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={2}
//       >
//         <TextField
//           placeholder="Search by Email"
//           size="small"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           sx={{ width: 300 }}
//         />

//         {/* ❌ COMMENTED FILTER / COLUMN / EXPORT */}
//         {/*
//         <Stack direction="row" spacing={1}>
//           <Button size="small" variant="outlined">FILTERS</Button>
//           <Button size="small" variant="outlined">COLUMNS</Button>
//           <Button size="small" variant="outlined">EXPORT</Button>
//         </Stack>
//         */}
//       </Stack>

//       {/* ================= TABLE ================= */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ backgroundColor: "#f5f7fa" }}>
//               <TableCell><b>Learner Details</b></TableCell>
//               <TableCell><b>Email Status</b></TableCell>
//               <TableCell><b>Last Login</b></TableCell>
//               <TableCell><b>Total Spent</b></TableCell>
//               <TableCell><b>Active Devices</b></TableCell>
//               <TableCell align="right"><b>Actions</b></TableCell>
//             </TableRow>
//           </TableHead>

//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={6} align="center">
//                   <CircularProgress size={24} />
//                 </TableCell>
//               </TableRow>
//             ) : filteredLearners.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={6} align="center">
//                   No learners found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               filteredLearners.map((user, idx) => (
//                 <TableRow
//                   key={idx}
//                   hover
//                   sx={{ cursor: "pointer" }}
//                   onClick={() => navigate(`/admin/users/${user.sub}`)}
//                 >
//                   <TableCell>
//                     <Typography fontWeight={600}>
//                       {user.name || "-"}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       {user.email}
//                     </Typography>
//                   </TableCell>

//                   <TableCell>
//                     <Chip
//                       label={user.emailVerified ? "Verified" : "Unverified"}
//                       color={user.emailVerified ? "success" : "error"}
//                       size="small"
//                       variant="outlined"
//                     />
//                   </TableCell>

//                   <TableCell>
//                     {user.lastLogin
//                       ? new Date(user.lastLogin).toLocaleDateString()
//                       : "-"}
//                   </TableCell>

//                   <TableCell>
//                     {user.totalSpent ? `₹ ${user.totalSpent}` : "-"}
//                   </TableCell>

//                   <TableCell>{user.activeDevices || 0}</TableCell>

//                   <TableCell align="right">
//                     <IconButton>
//                       <MoreVertIcon />
//                     </IconButton>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   );
// }

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   TextField,
//   Stack,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   CircularProgress,
//   Button,
//   Menu,
//   MenuItem,
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import DeleteIcon from "@mui/icons-material/Delete";
// import IconButton from "@mui/material/IconButton";
// import { useNavigate } from "react-router-dom";
// import API from "../../LoginSystem/axios";
// import Checkbox from "@mui/material/Checkbox";

// export default function AdminUsers() {
//   const navigate = useNavigate();

//   const [learners, setLearners] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [selectedUsers, setSelectedUsers] = useState([]);


//   // ✅ ADD DROPDOWN STATE
//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);

//   const fetchUsers = async () => {
//     try {
//       const res = await API.get("/api/admin/users");
//       setLearners(res.data.users || []);
//     } catch (err) {
//       console.error("Failed to fetch users", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

// // ✅ STEP 3: handle single checkbox select
// const handleSelectUser = (sub) => {
//   setSelectedUsers((prev) =>
//     prev.includes(sub)
//       ? prev.filter((id) => id !== sub)
//       : [...prev, sub]
//   );
// };

// // ✅ STEP 4: bulk delete handler
// const handleBulkDelete = async () => {
//   if (selectedUsers.length === 0) {
//     alert("Please select at least one user");
//     return;
//   }

//   const confirmDelete = window.confirm(
//     `Are you sure you want to delete ${selectedUsers.length} users?`
//   );
//   if (!confirmDelete) return;

//   try {
//     await API.post("/api/admin/users/bulk-delete", {
//       subs: selectedUsers,
//     });

//     alert("✅ Selected users deleted");
//     setSelectedUsers([]);
//     fetchUsers();
//   } catch (err) {
//     console.error(err);
//     alert("❌ Failed to delete users");
//   }
// };


//   const handleDelete = async (sub, email) => {
//   const confirmDelete = window.confirm(
//     `Are you sure you want to delete ${email}?`
//   );
//   if (!confirmDelete) return;

//   try {
//     await API.delete(`/api/admin/users/${sub}`);
//     alert("✅ User deleted successfully");
//     fetchUsers(); // list refresh
//   } catch (err) {
//     console.error(err);
//     alert("❌ Failed to delete user");
//   }
// };

//   const filteredLearners = learners.filter((u) =>
//     u.email?.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <Box p={3}>
//       {/* 🔙 Back */}
//       <Button
//         startIcon={<ArrowBackIcon />}
//         onClick={() => navigate("/admin/dashboard")}
//         sx={{ mb: 2, textTransform: "none" }}
//       >
//         Back to Dashboard
//       </Button>

//       {/* ================= HEADER + ADD DROPDOWN ================= */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={3}
//       >
//         <Typography variant="h5" fontWeight={600}>
//           All Learners
//         </Typography>

//         {/* ✅ ADD DROPDOWN */}
//         <Button
//           variant="contained"
//           color="success"
//           startIcon={<AddIcon />}
//           onClick={(e) => setAnchorEl(e.currentTarget)}
//         >
//           ADD
//         </Button>

//         <Menu
//           anchorEl={anchorEl}
//           open={open}
//           onClose={() => setAnchorEl(null)}
//         >
//           <MenuItem
//             onClick={() => {
//               setAnchorEl(null);
//               navigate("/admin/users/add");
//             }}
//           >
//             Create Individual
//           </MenuItem>

//           <MenuItem
//             onClick={() => {
//               setAnchorEl(null);
//               navigate("/admin/users/bulk-create");
//             }}
//           >
//             Bulk Create
//           </MenuItem>
//         </Menu>
//       </Stack>

//       {/* ================= SEARCH + TOTAL COUNT ================= */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={2}
//       >
//         <TextField
//           placeholder="Search by Email"
//           size="small"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           sx={{ width: 300 }}
//         />

//         <Typography fontWeight={600} color="text.secondary">
//           Total Learners: {learners.length}
//         </Typography>
//       </Stack>

//       {/* ================= TABLE ================= */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ backgroundColor: "#f5f7fa" }}>
//               <TableCell>
//                 <b>Learner Details</b>
//               </TableCell>
//               <TableCell>
//                 <b>Email Status</b>
//               </TableCell>

//               <TableCell align="center">
//   <b>Delete</b>
// </TableCell>


//               {/* ❌ COMMENTED HEADERS */}
//               {/*
//               <TableCell><b>Last Login</b></TableCell>
//               <TableCell><b>Total Spent</b></TableCell>
//               <TableCell><b>Active Devices</b></TableCell>
//               <TableCell align="right"><b>Actions</b></TableCell>
//               */}
//             </TableRow>
//           </TableHead>

//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={2} align="center">
//                   <CircularProgress size={24} />
//                 </TableCell>
//               </TableRow>
//             ) : filteredLearners.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={2} align="center">
//                   No learners found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               filteredLearners.map((user, idx) => (
//                 <TableRow
//                   key={idx}
//                   hover
//                   sx={{ cursor: "pointer" }}
//                   onClick={() => navigate(`/admin/users/${user.sub}`)}
//                 >
//                   <TableCell>
//                     <Typography fontWeight={600}>
//                       {user.name || "-"}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       {user.email}
//                     </Typography>
//                   </TableCell>

//                   <TableCell>
//                     <Chip
//                       label={user.emailVerified ? "Verified" : "Unverified"}
//                       color={user.emailVerified ? "success" : "error"}
//                       size="small"
//                       variant="outlined"
//                     />
//                   </TableCell>

//                   <TableCell align="center">
//   <IconButton
//     color="error"
//     onClick={(e) => {
//       e.stopPropagation(); // row click se bachata hai
//       handleDelete(user.sub, user.email);
//     }}
//   >
//     <DeleteIcon />
//   </IconButton>
// </TableCell>


//                   {/* ❌ COMMENTED ROW DATA */}
//                   {/*
//                   <TableCell>-</TableCell>
//                   <TableCell>-</TableCell>
//                   <TableCell>0</TableCell>
//                   <TableCell align="right">...</TableCell>
//                   */}
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   );
// }

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import API from "../../LoginSystem/axios";

export default function AdminUsers() {
  const navigate = useNavigate();

  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // ADD dropdown
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/api/admin/users");
      setLearners(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // single checkbox toggle
  const handleSelectUser = (sub) => {
    setSelectedUsers((prev) =>
      prev.includes(sub)
        ? prev.filter((id) => id !== sub)
        : [...prev, sub]
    );
  };

  // bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user");
      return;
    }

    if (!window.confirm(`Delete ${selectedUsers.length} users?`)) return;

    try {
      await API.post("/api/admin/users/bulk-delete", {
        subs: selectedUsers,
      });
      alert("✅ Selected users deleted");
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete users");
    }
  };

  // single delete
  const handleDelete = async (sub, email) => {
    if (!window.confirm(`Delete ${email}?`)) return;

    try {
      await API.delete(`/api/admin/users/${sub}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete user");
    }
  };

  const filteredLearners = learners.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/admin/dashboard")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          All Learners
        </Typography>

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          ADD
        </Button>

        <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => navigate("/admin/users/add")}>
            Create Individual
          </MenuItem>
          <MenuItem onClick={() => navigate("/admin/users/bulk-create")}>
            Bulk Create
          </MenuItem>
        </Menu>
      </Stack>

      {/* Search + count */}
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <TextField
          placeholder="Search by Email"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />

        <Typography fontWeight={600}>
          Total Learners: {learners.length}
        </Typography>
      </Stack>

      {/* Bulk delete button */}
      {selectedUsers.length > 0 && (
        <Stack direction="row" justifyContent="flex-end" mb={2}>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>
            Delete Selected ({selectedUsers.length})
          </Button>
        </Stack>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f7fa" }}>
              {/* Select all */}
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedUsers.length > 0 &&
                    selectedUsers.length < filteredLearners.length
                  }
                  checked={
                    filteredLearners.length > 0 &&
                    selectedUsers.length === filteredLearners.length
                  }
                  onChange={(e) =>
                    setSelectedUsers(
                      e.target.checked
                        ? filteredLearners.map((u) => u.sub)
                        : []
                    )
                  }
                />
              </TableCell>

              <TableCell><b>Learner Details</b></TableCell>
              <TableCell><b>Email Status</b></TableCell>
              <TableCell align="center"><b>Delete</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredLearners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No learners found
                </TableCell>
              </TableRow>
            ) : (
              filteredLearners.map((user) => (
                <TableRow
                  key={user.sub}
                  hover
                  onClick={() => navigate(`/admin/users/${user.sub}`)}
                >
                  {/* checkbox */}
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.includes(user.sub)}
                      onChange={() => handleSelectUser(user.sub)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>

                  {/* details */}
                  <TableCell>
                    <Typography fontWeight={600}>{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </TableCell>

                  {/* status */}
                  <TableCell>
                    <Chip
                      label={user.emailVerified ? "Verified" : "Unverified"}
                      color={user.emailVerified ? "success" : "error"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* delete */}
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user.sub, user.email);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
