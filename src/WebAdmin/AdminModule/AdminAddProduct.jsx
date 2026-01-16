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
} from "@mui/material";

export default function AdminAddProduct() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [productType, setProductType] = useState("TRIAL");

  /* LOAD PRODUCTS */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // ✅ CORRECT endpoint for your backend
        const res = await API.get("/api/admin/products");
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  /* SAVE PRODUCT */
  const handleSave = async () => {
    if (!productId) {
      alert("Please select a product");
      return;
    }

    try {
      setSaving(true);

      await API.post("/api/admin/add-product", {
        userId,
        productId,
        productType,
      });

      alert("Product assigned successfully");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Failed to assign product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={6}>
        <CircularProgress />
        <Typography mt={2}>Loading products…</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Add Product To Learner
      </Typography>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Select Product</InputLabel>
          <Select
            value={productId}
            label="Select Product"
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <MenuItem key={p.productId} value={p.productId}>
                {p.title} ({p.kind})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={productType}
            label="Type"
            onChange={(e) => setProductType(e.target.value)}
          >
            <MenuItem value="TRIAL">Trial</MenuItem>
            <MenuItem value="FULL">Full Access</MenuItem>
          </Select>
        </FormControl>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save & Next"}
          </Button>

          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
