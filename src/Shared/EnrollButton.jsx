// import React, { useState } from "react";
// import { Button } from "@mui/material";
// import API from "../LoginSystem/axios";
// import PayNowButton from "./PayNowButton";

// /*
//   PROPS:
//   - productId
//   - productType (QBANK | MOCKTEST | COURSE | EBOOK)
//   - title
//   - thumbnailUrl
//   - isPaid
//   - pricePaise
//   - isEnrolled
//   - userId
//   - onEnrolled()  // callback after enroll
//   - onOpen()      // what to do after enrolled (Practice / Start / Open)
// */

// export default function EnrollButton({
//   productId,
//   productType,
//   title,
//   thumbnailUrl,
//   isPaid = false,
//   pricePaise = 0,
//   isEnrolled = false,
//   userId,
//   onEnrolled,
//   onOpen,
// }) {
//   const [loading, setLoading] = useState(false);

//   /* -------------------------
//      ENROLL HANDLER
//   -------------------------- */
//   const enroll = async (source = "free") => {
//     try {
//       setLoading(true);

//       await API.post("/api/student/enroll", {
//         productId,
//         productType,
//         title,
//         thumbnailUrl,
//         accessSource: source, // free | paid
//       });

//       onEnrolled && onEnrolled();
//     } catch (err) {
//       alert("Enrollment failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* -------------------------
//      UI LOGIC
//   -------------------------- */

//   // ✅ Already enrolled → OPEN / PRACTICE / START
//   if (isEnrolled) {
//     return (
//       <Button
//         fullWidth
//         variant="contained"
//         onClick={onOpen}
//         sx={{
//           textTransform: "none",
//           fontWeight: 600,
//           backgroundColor: "#4748ac",
//         }}
//       >
//         Open
//       </Button>
//     );
//   }

//   // ✅ Paid but not enrolled → Pay & Enroll
//   if (isPaid) {
//     return (
//       <PayNowButton
//         userId={userId}
//         productId={productId}
//         productType={productType}
//         amountPaise={pricePaise}
//         label={`Pay ₹${pricePaise / 100} & Enroll`}
//         onSuccess={() => enroll("paid")}
//       />
//     );
//   }

//   // ✅ Free and not enrolled → Enroll
//   return (
//     <Button
//       fullWidth
//       variant="contained"
//       disabled={loading}
//       onClick={() => enroll("free")}
//       sx={{
//         textTransform: "none",
//         fontWeight: 600,
//         backgroundColor: "#4748ac",
//       }}
//     >
//       {loading ? "Enrolling..." : "Enroll"}
//     </Button>
//   );
// }
import React, { useState } from "react";
import { Button } from "@mui/material";
import API from "../LoginSystem/axios";
import PayNowButton from "./PayNowButton";

export default function EnrollButton({
  productId,
  productType,
  title,
  thumbnailUrl,
  isPaid = false,
  pricePaise = 0,
  isEnrolled = false,
  userId,
  onEnrolled,
  onOpen,
}) {
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------
     SAFE ENROLL / UPGRADE HANDLER
  -------------------------------------------------- */
  const enroll = async (source = "free") => {
  try {
    setLoading(true);

    await API.post("/api/student/enroll/free", {
      productId,
      productType,
      title,
      thumbnailUrl: thumbnailUrl || null,
    });

    onEnrolled?.();
  } catch (err) {
    console.error(err);
    alert("Enrollment failed");
  } finally {
    setLoading(false);
  }
};


  /* -------------------------------------------------
     UI LOGIC
  -------------------------------------------------- */

  // ✅ Already enrolled → OPEN / START
  if (isEnrolled) {
    return (
      <Button
        fullWidth
        variant="contained"
        onClick={onOpen}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          backgroundColor: "#4748ac",
        }}
      >
        Open
      </Button>
    );
  }

  // ✅ Paid but not enrolled → Pay & Enroll
  if (isPaid) {
    return (
      <PayNowButton
        userId={userId}
        productId={productId}
        productType={productType}
        amountPaise={pricePaise}
        label={`Pay ₹${pricePaise / 100} & Enroll`}
        onSuccess={() => enroll("paid")}
      />
    );
  }

  // ✅ Free and not enrolled → Enroll
  return (
    <Button
      fullWidth
      variant="contained"
      disabled={loading}
      onClick={() => enroll("free")}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        backgroundColor: "#4748ac",
      }}
    >
      {loading ? "Enrolling..." : "Enroll"}
    </Button>
  );
}
