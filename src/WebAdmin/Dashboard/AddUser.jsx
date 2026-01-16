// import React, { useState } from "react";
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   Stack,
//   MenuItem,
//   Checkbox,
//   FormControlLabel,
//   Paper,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";
// import API from "../../LoginSystem/axios";
// import { useAuth } from "../../LoginSystem/context/AuthContext";

// export default function AddUser() {
//   const navigate = useNavigate();
//   const { ready } = useAuth(); // ✅ IMPORTANT

//   const [form, setForm] = useState({
//     email: "",
//     fullName: "",
//     password: "",
//     product: "",
//     accessType: "trial",
//     amount: 0,
//     expiry: "",
//     showCustomFields: false,
//   });

//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // ✅ GUARD — THIS FIXES THE ERROR
//     if (!ready) {
//       alert("Auth is still loading. Please wait 1 second and try again.");
//       return;
//     }

//     setLoading(true);

//     try {
//       await API.post("/api/admin/users", {
        
//         email: form.email,
//         name: form.fullName,
//         password: form.password || null, // optional
//         product: form.product,
//         accessType: form.accessType,
//         amount: form.amount,
//         expiry: form.expiry,
//       });
// alert("✅ Learner created successfully");
//       navigate("/admin/users");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to create user");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Box p={3} maxWidth={900} mx="auto">
//       {/* 🔙 Back */}
//       <Typography
//         sx={{
//           cursor: "pointer",
//           mb: 2,
//           color: "#1976d2",
//           fontWeight: 500,
//         }}
//         onClick={() => navigate("/admin/users")}
//       >
//         ← Learners
//       </Typography>

//       <Paper sx={{ p: 4 }}>
//         <form onSubmit={handleSubmit}>
//           <Stack spacing={3}>
//             {/* Email */}
//             <Box>
//               <Typography fontWeight={600}>Learner Email *</Typography>
//               <TextField
//                 fullWidth
//                 name="email"
//                 placeholder="Enter Learner email"
//                 value={form.email}
//                 onChange={handleChange}
//                 required
//               />
//             </Box>

//             {/* Name */}
//             <Box>
//               <Typography fontWeight={600}>Learner Full Name *</Typography>
//               <TextField
//                 fullWidth
//                 name="fullName"
//                 placeholder="Enter Learner Full Name"
//                 value={form.fullName}
//                 onChange={handleChange}
//                 required
//               />
//             </Box>

//             {/* Password */}
//             <Box>
//               <Typography fontWeight={600}>Password</Typography>
//               <TextField
//                 fullWidth
//                 type="password"
//                 name="password"
//                 placeholder="Set password (optional)"
//                 value={form.password}
//                 onChange={handleChange}
//               />
//               <Typography variant="caption" color="text.secondary">
//                 Leave empty to send password setup email
//               </Typography>
//             </Box>

//             {/* Product */}
//             <Box>
//               <Typography fontWeight={600}>Product *</Typography>
//               <TextField
//                 fullWidth
//                 select
//                 name="product"
//                 value={form.product}
//                 onChange={handleChange}
//                 required
//               >
//                 <MenuItem value="">Select product</MenuItem>
//                 <MenuItem value="course">Course</MenuItem>
//                 <MenuItem value="mocktest">Mock Test</MenuItem>
//                 <MenuItem value="qbank">Q-Bank</MenuItem>
//               </TextField>
//             </Box>

//             {/* Access Type */}
//             <Box>
//               <Typography fontWeight={600}>Access type</Typography>
//               <TextField
//                 fullWidth
//                 select
//                 name="accessType"
//                 value={form.accessType}
//                 onChange={handleChange}
//               >
//                 <MenuItem value="trial">Trial</MenuItem>
//                 <MenuItem value="paid">Paid</MenuItem>
//                 <MenuItem value="lifetime">Lifetime</MenuItem>
//               </TextField>
//             </Box>

//             {/* Amount */}
//             <Box>
//               <Typography fontWeight={600}>Amount</Typography>
//               <TextField
//                 fullWidth
//                 type="number"
//                 name="amount"
//                 value={form.amount}
//                 onChange={handleChange}
//               />
//             </Box>

//             {/* Expiry */}
//             <Box>
//               <Typography fontWeight={600}>Expiry</Typography>
//               <TextField
//                 fullWidth
//                 type="date"
//                 name="expiry"
//                 value={form.expiry}
//                 onChange={handleChange}
//                 InputLabelProps={{ shrink: true }}
//               />
//             </Box>

//             {/* Custom */}
//             <FormControlLabel
//               control={
//                 <Checkbox
//                   name="showCustomFields"
//                   checked={form.showCustomFields}
//                   onChange={handleChange}
//                 />
//               }
//               label="Show custom fields"
//             />

//             {/* Submit */}
//             <Button
//               type="submit"
//               variant="contained"
//               color="success"
//               size="large"
//               disabled={loading}
//               sx={{ mt: 2 }}
//             >
//               {loading ? "Creating..." : "Create Learner"}
//             </Button>
//           </Stack>
//         </form>
//       </Paper>
//     </Box>
//   );
// }

import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  // MenuItem,          // ❌ COMMENTED (used only in product/accessType)
  Checkbox,
  FormControlLabel,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import API from "../../LoginSystem/axios";
import { useAuth } from "../../LoginSystem/context/AuthContext";

export default function AddUser() {
  const navigate = useNavigate();
  const { ready } = useAuth();

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",

    // ❌ COMMENTED
    // product: "",
    // accessType: "trial",
    // amount: 0,
    // expiry: "",

    showCustomFields: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ready) {
      alert("Auth is still loading. Please wait 1 second and try again.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/api/admin/users", {
        email: form.email,
        name: form.fullName,
        password: form.password || null,

        // ❌ COMMENTED
        // product: form.product,
        // accessType: form.accessType,
        // amount: form.amount,
        // expiry: form.expiry,
      });

      alert("✅ Learner created successfully");
      navigate("/admin/users");
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Typography
        sx={{ cursor: "pointer", mb: 2, color: "#1976d2", fontWeight: 500 }}
        onClick={() => navigate("/admin/users")}
      >
        ← Learners
      </Typography>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Email */}
            <Box>
              <Typography fontWeight={600}>Learner Email *</Typography>
              <TextField
                fullWidth
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Box>

            {/* Name */}
            <Box>
              <Typography fontWeight={600}>Learner Full Name *</Typography>
              <TextField
                fullWidth
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </Box>

            {/* Password */}
            <Box>
              <Typography fontWeight={600}>Password</Typography>
              <TextField
                fullWidth
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </Box>

            {/* ❌ COMMENTED BLOCKS */}

            {/*
            <Box>
              <Typography fontWeight={600}>Product *</Typography>
              <TextField select fullWidth name="product" value={form.product}>
                <MenuItem value="course">Course</MenuItem>
                <MenuItem value="mocktest">Mock Test</MenuItem>
                <MenuItem value="qbank">Q-Bank</MenuItem>
              </TextField>
            </Box>

            <Box>
              <Typography fontWeight={600}>Access type</Typography>
              <TextField select fullWidth name="accessType">
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="lifetime">Lifetime</MenuItem>
              </TextField>
            </Box>

            <Box>
              <Typography fontWeight={600}>Amount</Typography>
              <TextField type="number" fullWidth name="amount" />
            </Box>

            <Box>
              <Typography fontWeight={600}>Expiry</Typography>
              <TextField type="date" fullWidth name="expiry" />
            </Box>
            */}

            {/* Custom */}
            <FormControlLabel
              control={
                <Checkbox
                  name="showCustomFields"
                  checked={form.showCustomFields}
                  onChange={handleChange}
                />
              }
              label="Show custom fields"
            />

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              color="success"
              size="large"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Learner"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
