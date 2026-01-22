// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import API from "../../LoginSystem/axios";

// import {
//   Box,
//   Typography,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   Button,
//   Stack,
//   CircularProgress,
//   TextField,
// } from "@mui/material";

// export default function AdminAddProduct() {
//   const { sub } = useParams();
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [products, setProducts] = useState([]);
//   const [selectedProductId, setSelectedProductId] = useState("");

//   const [accessType, setAccessType] = useState("");
//   const [expiry, setExpiry] = useState("");

//   const [learner, setLearner] = useState(null);

//   /* ================= LOAD LEARNER ================= */
//   useEffect(() => {
//     const loadLearner = async () => {
//       try {
//         const res = await API.get(`/api/admin/users/${sub}`);
//         setLearner(res.data.user);
//       } catch (err) {
//         console.error("❌ Failed to load learner", err);
//         alert("Failed to load learner");
//       }
//     };

//     loadLearner();
//   }, [sub]);

//   /* ================= LOAD PRODUCTS ================= */
//   useEffect(() => {
//     const loadProducts = async () => {
//       try {
//         console.log("🚀 Fetching products...");
//         const res = await API.get("/api/admin/products/published"); // ✅ FIXED

//         console.log("🔥 PRODUCTS FROM API:", res.data);

//         setProducts(Array.isArray(res.data) ? res.data : []);
//       } catch (err) {
//         console.error("❌ Failed to load products", err);
//         setProducts([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadProducts();
//   }, []);

//   /* ================= ACCESS TYPE LOGIC ================= */
//   useEffect(() => {
//     if (accessType === "TRIAL") {
//       const d = new Date();
//       d.setDate(d.getDate() + 7);
//       setExpiry(d.toISOString().slice(0, 10));
//     }

//     if (accessType === "PAID") {
//       setExpiry("");
//     }
//   }, [accessType]);

//   /* ================= ASSIGN ================= */
//   const handleSave = async () => {
//     const selectedProduct = products.find(
//       (p) => p.id === selectedProductId
//     );

//     if (!selectedProduct || !accessType) {
//       alert("Please select product & access type");
//       return;
//     }

//     setSaving(true);

//     try {
//       await API.post("/api/admin/assign-product", { // ✅ FIXED
//         studentSub: sub,
//         studentEmail: learner.email,
//         studentName: learner.name,

//         productId: selectedProduct.id,
//         productType: selectedProduct.kind,
//         title: selectedProduct.title,
//          thumbnailUrl: selectedProduct.thumbnailUrl, // ✅ ADD THIS LINE

//         accessSource: accessType.toLowerCase(),
//         expiry,
//       });

//       alert("✅ Product assigned");
//       navigate(-1);
//     } catch (err) {
//       console.error("❌ Assign failed", err);
//       alert("Failed to assign product");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ================= LOADING ================= */
//   if (loading) {
//     return (
//       <Box textAlign="center" mt={6}>
//         <CircularProgress />
//         <Typography mt={2}>Loading…</Typography>
//       </Box>
//     );
//   }

//   /* ================= UI ================= */
//   return (
//     <Box maxWidth={600} mx="auto" mt={4}>
//       <Typography variant="h5" fontWeight={700} mb={3}>
//         Assign Product to Learner
//       </Typography>

//       <Stack spacing={3}>
//         {/* PRODUCT */}
//         <FormControl fullWidth>
//           <InputLabel>Select Product</InputLabel>
//           <Select
//             label="Select Product"
//             value={selectedProductId}
//             onChange={(e) => setSelectedProductId(e.target.value)}
//           >
//             {products.length === 0 ? (
//               <MenuItem disabled>No products available</MenuItem>
//             ) : (
//               products.map((p) => (
//                 <MenuItem key={`${p.kind}-${p.id}`} value={p.id}>
//                   {p.kind} – {p.title}
//                 </MenuItem>
//               ))
//             )}
//           </Select>
//         </FormControl>

//         {/* ACCESS TYPE */}
//         <FormControl fullWidth>
//           <InputLabel>Access Type</InputLabel>
//           <Select
//             label="Access Type"
//             value={accessType}
//             onChange={(e) => setAccessType(e.target.value)}
//           >
//             <MenuItem value="TRIAL">Trial (7 Days)</MenuItem>
//             <MenuItem value="PAID">Paid (Custom Expiry)</MenuItem>
//           </Select>
//         </FormControl>

//         {/* EXPIRY */}
//         {accessType === "PAID" && (
//           <TextField
//             type="date"
//             label="Expiry Date"
//             InputLabelProps={{ shrink: true }}
//             value={expiry}
//             onChange={(e) => setExpiry(e.target.value)}
//           />
//         )}

//         {/* ACTIONS */}
//         <Stack direction="row" spacing={2}>
//           <Button
//             variant="contained"
//             color="success"
//             onClick={handleSave}
//             disabled={saving}
//           >
//             {saving ? "Assigning..." : "Assign Product"}
//           </Button>

//           <Button variant="outlined" onClick={() => navigate(-1)}>
//             Cancel
//           </Button>
//         </Stack>
//       </Stack>
//     </Box>
//   );
// }

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../LoginSystem/axios";

import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Stack,
  CircularProgress,
  TextField,
} from "@mui/material";

export default function AdminAddProduct() {
  const { sub } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [selectedProductKey, setSelectedProductKey] = useState(""); // ✅ FIX

  const [accessType, setAccessType] = useState("");
  const [expiry, setExpiry] = useState("");

  const [learner, setLearner] = useState(null);

  /* ================= LOAD LEARNER ================= */
  useEffect(() => {
    const loadLearner = async () => {
      try {
        const res = await API.get(`/api/admin/users/${sub}`);
        setLearner(res.data.user);
      } catch (err) {
        console.error("❌ Failed to load learner", err);
        alert("Failed to load learner");
      }
    };

    loadLearner();
  }, [sub]);

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("🚀 Fetching products...");
        const res = await API.get("/api/admin/products/published");

        console.log("🔥 PRODUCTS FROM API:", res.data);

        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Failed to load products", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  /* ================= ACCESS TYPE LOGIC ================= */
  useEffect(() => {
    if (accessType === "TRIAL") {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setExpiry(d.toISOString().slice(0, 10));
    }

    if (accessType === "PAID") {
      setExpiry("");
    }
  }, [accessType]);

  /* ================= ASSIGN ================= */
  const handleSave = async () => {
    if (!selectedProductKey || !accessType) {
      alert("Please select product & access type");
      return;
    }

    // ✅ FIX: split unique key
    const [productType, productId] = selectedProductKey.split("::");

    const selectedProduct = products.find(
      (p) => p.id === productId && p.kind === productType
    );

    if (!selectedProduct) {
      alert("Invalid product selected");
      return;
    }

    setSaving(true);

    try {
      await API.post("/api/admin/assign-product", {
        studentSub: sub,
        studentEmail: learner.email,
        studentName: learner.name,

        productId: selectedProduct.id,
        productType: selectedProduct.kind,
        title: selectedProduct.title,
        thumbnailUrl: selectedProduct.thumbnailUrl,

        accessSource: accessType.toLowerCase(),
        expiry,
      });

      alert("✅ Product assigned");
      navigate(-1);
    } catch (err) {
      console.error("❌ Assign failed", err);
      alert("Failed to assign product");
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <Box textAlign="center" mt={6}>
        <CircularProgress />
        <Typography mt={2}>Loading…</Typography>
      </Box>
    );
  }

  /* ================= UI ================= */
  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Assign Product to Learner
      </Typography>

      <Stack spacing={3}>
        {/* PRODUCT */}
        <FormControl fullWidth>
          <InputLabel>Select Product</InputLabel>
          <Select
            label="Select Product"
            value={selectedProductKey}
            onChange={(e) => setSelectedProductKey(e.target.value)}
          >
            {products.length === 0 ? (
              <MenuItem disabled>No products available</MenuItem>
            ) : (
              products.map((p) => (
                <MenuItem
                  key={`${p.kind}-${p.id}`}
                  value={`${p.kind}::${p.id}`} // ✅ FIX
                >
                  {p.kind} – {p.title}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* ACCESS TYPE */}
        <FormControl fullWidth>
          <InputLabel>Access Type</InputLabel>
          <Select
            label="Access Type"
            value={accessType}
            onChange={(e) => setAccessType(e.target.value)}
          >
            <MenuItem value="TRIAL">Trial (7 Days)</MenuItem>
            <MenuItem value="PAID">Paid (Custom Expiry)</MenuItem>
          </Select>
        </FormControl>

        {/* EXPIRY */}
        {accessType === "PAID" && (
          <TextField
            type="date"
            label="Expiry Date"
            InputLabelProps={{ shrink: true }}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        )}

        {/* ACTIONS */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Assigning..." : "Assign Product"}
          </Button>

          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
