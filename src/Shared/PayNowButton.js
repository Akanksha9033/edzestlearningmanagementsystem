import React, { useCallback, useState } from "react";
import axios from "axios";
import API from "../LoginSystem/axios";

/* --------- load Razorpay checkout JS once ---------- */
async function loadRazorpay() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* --------- resolve API base (CRA + Vite safe) ---------- */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL);

if (!API_BASE) {
  console.error("❌ API_BASE is not defined. Check frontend env variables.");
}

export default function PayNowButton({
  userId,
  productId = "Edzest_QBank_Access",
  productType = "QBANK",
  amountPaise,
  label = "💳 Pay Now",
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const safeUserId =
    userId ||
    window?.__authUser?.sub ||
    window?.__authUser?.id ||
    window?.__authUser?.userId ||
    null;

  const handlePay = useCallback(async () => {
    if (!safeUserId) {
      alert("User not found. Please log in.");
      return;
    }

    setLoading(true);

    try {
      const ok = await loadRazorpay();
      if (!ok) {
        alert("Unable to load Razorpay. Check your network.");
        return;
      }

      // 1️⃣ Create order
      const { data } = await axios.post(
        `${API_BASE}/api/payments/create-order`,
        {
          userId: safeUserId,
          productId,
          productType,
          amountPaise,
        }
      );

      if (!data?.orderId || !data?.key) {
        alert("Failed to create order.");
        return;
      }

      // 2️⃣ Open Razorpay
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Edzest LMS",
        description: `${productType} Purchase`,
        order_id: data.orderId,
        theme: { color: "#4748ac" },

        handler: async (resp) => {
          try {
            // 3️⃣ Verify payment
            const verify = await axios.post(
              `${API_BASE}/api/payments/verify-payment`,
              {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                userId: safeUserId,
                productId,
                productType,
              }
            );

            if (verify.data?.success) {
              alert("✅ Payment successful!");
              onSuccess?.();
            } else {
              alert("⚠️ Payment verification failed.");
            }
          } catch (err) {
            console.error("Verify error", err);
            alert("Payment verification error.");
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      console.error("Payment failed", err);
      alert("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, [safeUserId, productId, productType, amountPaise, onSuccess]);

  return (
    <button onClick={handlePay} disabled={loading}>
      {loading ? "Processing…" : label}
    </button>
  );
}
