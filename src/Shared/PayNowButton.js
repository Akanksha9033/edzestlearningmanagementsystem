import React, { useCallback, useState } from "react";
import axios from "axios";

/* --------- small helper: load Razorpay checkout JS once ---------- */
async function loadRazorpay() {

  // ✅ Guard for SSR / non-browser environments
  if (typeof window === "undefined" || typeof document === "undefined") {
    console.error("[PayNowButton] Razorpay can only load in a browser environment.");
    return false;
  }

  if (window.Razorpay) return true;


  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* resolve API base for both CRA and Vite builds */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE) ||
  "http://localhost:5000";

/**
 * PayNowButton (Shared)
 *
 * Props:
 * - userId: string (required)
 * - productId: string (optional; useful if you sell multiple qbanks)
 * - onSuccess: function() -> void  (optional; e.g. refresh list or navigate)
 * - amountPaise: number (optional; default comes from backend env)
 * - label: string (optional; default "Pay Now")
 * - variant: "plain" | "mui"  (optional)
 */
export default function PayNowButton({
  userId,
  productId = "Edzest_QBank_Access",
  onSuccess,
  amountPaise, // not required; backend already uses env (e.g., 100 for ₹1)
  label = "💳 Pay Now",
  variant = "plain",
}) {
  const [loading, setLoading] = useState(false);

  const handlePay = useCallback(async () => {
    if (!userId) {
      alert("User not found. Please log in.");
      return;
    }


    // ✅ Extra guard: only run in browser
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.error("[PayNowButton] Payment flow can only run in a browser environment.");
      alert("Payment can only be done from a browser.");
      return;
    }

    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) {
        alert("Unable to load Razorpay. Check your network.");
        return;
      }

      // 1️⃣ Ask backend to create an order
      const { data } = await axios.post(`${API_BASE}/api/payments/create-order`, {
        userId,
        productId,
        amountPaise, // backend may ignore if it uses env
      });

      if (!data?.orderId || !data?.key) {
        alert("Failed to create order.");
        return;
      }

      // 2️⃣ Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Edzest LMS",
        description: `Q-Bank Access (${productId})`,
        order_id: data.orderId,
        theme: { color: "#4748ac" },
        handler: async (resp) => {
          try {
            // 3️⃣ Verify payment with backend after successful payment
            const verifyResponse = await axios.post(
              `${API_BASE}/api/payments/verify-payment`,
              {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                userId,
                productId,
              }
            );

            if (verifyResponse.data?.success) {
              alert("✅ Payment verified successfully! Access granted.");
              onSuccess?.();
            } else {
              alert("⚠️ Payment verification failed. Please contact support.");
              console.error("Verification error:", verifyResponse.data);
            }
          } catch (err) {
            console.error("❌ Error verifying payment:", err);
            alert("Error verifying payment. Check console for details.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        prefill: {
          name: "Student",
          email: "student@example.com",
          contact: "9999999999",
        },
      });

      rzp.open();
    } catch (e) {
      console.error("PayNowButton error:", e);
      alert("Payment could not be started. Check console for details.");
    } finally {
      setLoading(false);
    }
  }, [userId, productId, onSuccess, amountPaise]);

  // default style button
  return (
    <button
      onClick={handlePay}
      disabled={loading}
      style={{
        background: "#4748ac",
        color: "#fff",
        border: "none",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 14,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Processing…" : label}
    </button>
  );
}
