
// import React, { useCallback, useState } from "react";
// import axios from "axios";

// /* --------- small helper: load Razorpay checkout JS once ---------- */
// async function loadRazorpay() {
//   // ✅ Guard for SSR / non-browser environments
//   if (typeof window === "undefined" || typeof document === "undefined") {
//     console.error(
//       "[PayNowButton] Razorpay can only load in a browser environment."
//     );
//     return false;
//   }

//   if (window.Razorpay) return true;

//   return new Promise((resolve) => {
//     const s = document.createElement("script");
//     s.src = "https://checkout.razorpay.com/v1/checkout.js";
//     s.onload = () => resolve(true);
//     s.onerror = () => resolve(false);
//     document.body.appendChild(s);
//   });
// }

// /* resolve API base for both CRA and Vite builds */
// const API_BASE =
//   (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
//   (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE) ||
//   "http://localhost:5000";

// /**
//  * PayNowButton (Shared)
//  *
//  * Props:
//  * - userId: string (required)
//  * - productId: string (optional; useful if you sell multiple qbanks)
//  * - productType: "QBANK" | "MOCKTEST" | "COURSE"
//  * - onSuccess: function() -> void  (optional)
//  * - amountPaise: number (optional; backend may ignore in prod)
//  * - label: string (optional)
//  * - variant: "plain" | "mui"  (optional)
//  */
// export default function PayNowButton({
//   userId,
//   productId = "Edzest_QBank_Access",
//   productType = "QBANK",
//   onSuccess,
//   amountPaise,
//   label = "💳 Pay Now",
//   variant = "plain",
// }) {
//   const [loading, setLoading] = useState(false);

//   /* ------------------------------------------------------------------
//       ✅ Ensure userId always uses Cognito `sub` if available
//   ------------------------------------------------------------------ */
//   const safeUserId =
//     userId ||
//     window?.__authUser?.sub ||
//     window?.__authUser?.id ||
//     window?.__authUser?.userId ||
//     null;

//   if (!safeUserId) {
//     console.warn("⚠️ PayNowButton: No userId detected!", {
//       userIdProp: userId,
//       globalUser: window?.__authUser,
//     });
//   }

//   const handlePay = useCallback(async () => {
//     if (!safeUserId) {
//       alert("User not found. Please log in.");
//       return;
//     }

//     // Extra guard: only run in browser
//     if (typeof window === "undefined" || typeof document === "undefined") {
//       console.error(
//         "[PayNowButton] Payment flow can only run in a browser environment."
//       );
//       alert("Payment can only be done from a browser.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const ok = await loadRazorpay();
//       if (!ok) {
//         alert("Unable to load Razorpay. Check your network.");
//         return;
//       }

//       // 1️⃣ Ask backend to create an order
//       const { data } = await axios.post(
//         `${API_BASE}/api/payments/create-order`,
//         {
//           userId: safeUserId,
//           productId,
//           productType,

//           // ✅ keep sending for backward compatibility
//           // backend will decide whether to use it
//           amountPaise,
//         }
//       );

//       if (!data?.orderId || !data?.key) {
//         alert("Failed to create order.");
//         return;
//       }

//       // 2️⃣ Open Razorpay checkout
//       const rzp = new window.Razorpay({
//         key: data.key,
//         amount: data.amount,
//         currency: data.currency || "INR",
//         name: "Edzest LMS",
//         description: `${productType} Purchase (${productId})`,
//         order_id: data.orderId,
//         theme: { color: "#4748ac" },
//         handler: async (resp) => {
//           try {
//             // 3️⃣ Verify payment with backend
//             const verifyResponse = await axios.post(
//               `${API_BASE}/api/payments/verify-payment`,
//               {
//                 razorpay_order_id: resp.razorpay_order_id,
//                 razorpay_payment_id: resp.razorpay_payment_id,
//                 razorpay_signature: resp.razorpay_signature,
//                 userId: safeUserId,
//                 productId,
//                 productType,
//               }
//             );

//             if (verifyResponse.data?.success) {
//               alert("✅ Payment verified successfully! Access granted.");
//               onSuccess?.();
//             } else {
//               alert("⚠️ Payment verification failed. Please contact support.");
//               console.error("Verification error:", verifyResponse.data);
//             }
//           } catch (err) {
//             console.error("❌ Error verifying payment:", err);
//             alert("Error verifying payment. Check console for details.");
//           }
//         },
//         modal: { ondismiss: () => setLoading(false) },
//         prefill: {
//           name: "Student",
//           email: "student@example.com",
//           contact: "9999999999",
//         },
//       });

//       rzp.open();
//     } catch (e) {
//       console.error("PayNowButton error:", e);
//       alert("Payment could not be started. Check console for details.");
//     } finally {
//       setLoading(false);
//     }
//   }, [safeUserId, productId, productType, onSuccess, amountPaise]);

//   return (
//     <button
//       onClick={handlePay}
//       disabled={loading}
//       style={{
//         background: "#4748ac",
//         color: "#fff",
//         border: "none",
//         padding: "8px 16px",
//         borderRadius: 8,
//         fontSize: 14,
//         cursor: loading ? "not-allowed" : "pointer",
//         opacity: loading ? 0.7 : 1,
//       }}
//     >
//       {loading ? "Processing…" : label}
//     </button>
//   );
// }


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
