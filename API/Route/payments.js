// const express = require("express");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

// console.log("✅ Payments route file loaded");

// const router = express.Router();

// // DynamoDB connection
// const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// // Table names from .env
// const PAYMENTS = process.env.PAYMENTS_TABLE || "Payments";
// const QBANK = process.env.QBANK_TABLE || "QBank";
// const BANKS = process.env.DDB_BANKS || "QuestionBanks"; // ✅ added for price lookup

// // Razorpay credentials (must be in .env)
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Small helper
// const now = () => new Date().toISOString();

// /* -------------------------------------------------------------------------- */
// /* 🟢 TEST ROUTE - to verify router mount                                    */
// /* -------------------------------------------------------------------------- */
// router.get("/test", (req, res) => {
//   res.json({ message: "✅ Payments route working fine!" });
// });

// /* -------------------------------------------------------------------------- */
// /* 🟠 Create Order (POST /api/payments/create-order)                          */
// /* -------------------------------------------------------------------------- */
// router.post("/create-order", async (req, res) => {
//   try {
//     const { productId, amountPaise } = req.body || {};
//     let amount = 100; // ✅ default ₹1

//     // ✅ Prefer client-sent or DynamoDB-stored price if available
//     if (Number(amountPaise) > 0) {
//       amount = Number(amountPaise);
//     } else if (productId) {
//       try {
//         const result = await ddb.send(
//           new GetCommand({
//             TableName: BANKS,
//             Key: { bankId: productId },
//           })
//         );
//         const p = result.Item?.pricePaise;
//         if (typeof p === "number" && p > 0) {
//           amount = p;
//           console.log(`💰 Using bank-specific price: ${p} paise`);
//         }
//       } catch (err) {
//         console.warn("⚠️ Could not fetch bank price, using default ₹1:", err.message);
//       }
//     }

//     const receipt = `order_${Date.now()}`;
//     const order = await razorpay.orders.create({
//       amount,
//       currency: "INR",
//       receipt,
//     });

//     // save pending record
//     await ddb.send(
//       new PutCommand({
//         TableName: PAYMENTS,
//         Item: {
//           paymentId: `pending_${order.id}`,
//           orderId: order.id,
//           amountPaise: amount,
//           currency: "INR",
//           status: "CREATED",
//           createdAt: now(),
//           updatedAt: now(),
//         },
//       })
//     );

//     res.json({
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error("❌ Razorpay order creation failed:", err);
//     res.status(500).json({ error: "Failed to create order" });
//   }
// });

// /* -------------------------------------------------------------------------- */
// /* 🔵 Verify Payment (POST /api/payments/verify-payment)                      */
// /* -------------------------------------------------------------------------- */
// router.post("/verify-payment", async (req, res) => {
//   try {
//     // ✅ Accept both frontend naming styles
//     const {
//       order_id,
//       payment_id,
//       signature,
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       userId,
//       productId,
//     } = req.body;

//     // ✅ Normalize field names (handle both types)
//     const finalOrderId = order_id || razorpay_order_id;
//     const finalPaymentId = payment_id || razorpay_payment_id;
//     const finalSignature = signature || razorpay_signature;

//     if (!finalOrderId || !finalPaymentId || !finalSignature || !userId || !productId) {
//       return res.status(400).json({ error: "Missing payment details" });
//     }

//     // ✅ Validate signature
//     const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//     hmac.update(`${finalOrderId}|${finalPaymentId}`);
//     const digest = hmac.digest("hex");

//     if (digest !== finalSignature) {
//       return res.status(400).json({ error: "Invalid signature" });
//     }

//     // ✅ Store successful payment
//     await ddb.send(
//       new PutCommand({
//         TableName: PAYMENTS,
//         Item: {
//           paymentId: finalPaymentId,
//           orderId: finalOrderId,
//           userId,
//           productId,
//           amountPaise: 100,
//           currency: "INR",
//           status: "SUCCESS",
//           signatureVerified: true,
//           createdAt: now(),
//           updatedAt: now(),
//         },
//       })
//     );

//     // ✅ Grant 30-day access for this specific QBank
//     const accessFrom = new Date();
//     const accessTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

//     await ddb.send(
//       new PutCommand({
//         TableName: QBANK,
//         Item: {
//           userId,
//           productId,
//           accessFrom: accessFrom.toISOString(),
//           accessTill: accessTill.toISOString(),
//           sourcePaymentId: finalPaymentId,
//           status: "ACTIVE",
//         },
//       })
//     );

//     res.json({ success: true, message: "Payment verified & access granted" });
//   } catch (err) {
//     console.error("❌ Payment verification failed:", err);
//     res.status(500).json({ error: "Verification failed" });
//   }
// });

// /* -------------------------------------------------------------------------- */
// /* 🟣 Check Access (GET /api/payments/has-access)                             */
// /* -------------------------------------------------------------------------- */
// router.get("/has-access", async (req, res) => {
//   try {
//     const { userId, productId } = req.query;
//     if (!userId || !productId)
//       return res.status(400).json({ allowed: false, message: "Missing userId or productId" });

//     const result = await ddb.send(
//       new GetCommand({
//         TableName: QBANK,
//         Key: { userId, productId },
//       })
//     );

//     const item = result.Item;
//     const nowIso = new Date().toISOString();
//     const hasAccess =
//       !!item && item.status === "ACTIVE" && (!item.accessTill || item.accessTill > nowIso);

//     res.json({ allowed: hasAccess });
//   } catch (err) {
//     console.error("❌ Error checking access:", err);
//     res.status(500).json({ allowed: false, error: "Server error" });
//   }
// });

// module.exports = router;
console.log("ENV QBANK_TABLE = ", process.env.QBANK_TABLE);
console.log("ENV PAYMENTS_TABLE = ", process.env.PAYMENTS_TABLE);

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

console.log("✅ Payments route file loaded");

const router = express.Router();

// DynamoDB connection
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Table names from .env
const PAYMENTS = process.env.PAYMENTS_TABLE || "Payments";
const QBANK = process.env.QBANK_TABLE || "QBank";
const BANKS = process.env.DDB_BANKS || "QuestionBanks"; // ✅ added for price lookup

// Razorpay credentials (must be in .env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Small helper
const now = () => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/* 🟢 TEST ROUTE - to verify router mount                                    */
/* -------------------------------------------------------------------------- */
router.get("/test", (req, res) => {
  res.json({ message: "✅ Payments route working fine!" });
});

/* -------------------------------------------------------------------------- */
/* 🟠 Create Order (POST /api/payments/create-order)                          */
/* -------------------------------------------------------------------------- */
router.post("/create-order", async (req, res) => {
  try {
    const { productId, amountPaise } = req.body || {};
    let amount = 100; // ✅ default ₹1

    // ✅ Prefer client-sent or DynamoDB-stored price if available
    if (Number(amountPaise) > 0) {
      amount = Number(amountPaise);
    } else if (productId) {
      try {
        const result = await ddb.send(
          new GetCommand({
            TableName: BANKS,
            Key: { bankId: productId },
          })
        );
        const p = result.Item?.pricePaise;
        if (typeof p === "number" && p > 0) {
          amount = p;
          console.log(`💰 Using bank-specific price: ${p} paise`);
        }
      } catch (err) {
        console.warn("⚠️ Could not fetch bank price, using default ₹1:", err.message);
      }
    }

    const receipt = `order_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
    });

    // save pending record
    await ddb.send(
      new PutCommand({
        TableName: PAYMENTS,
        Item: {
          paymentId: `pending_${order.id}`,
          orderId: order.id,
          amountPaise: amount,
          currency: "INR",
          status: "CREATED",
          createdAt: now(),
          updatedAt: now(),
        },
      })
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Razorpay order creation failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔵 Verify Payment (POST /api/payments/verify-payment)                      */
/* -------------------------------------------------------------------------- */
router.post("/verify-payment", async (req, res) => {
  try {
    // ✅ Accept both frontend naming styles
    const {
      order_id,
      payment_id,
      signature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      productId,
    } = req.body;

    // ✅ Normalize field names (handle both types)
    const finalOrderId = order_id || razorpay_order_id;
    const finalPaymentId = payment_id || razorpay_payment_id;
    const finalSignature = signature || razorpay_signature;

    if (!finalOrderId || !finalPaymentId || !finalSignature || !userId || !productId) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    // ✅ Validate signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${finalOrderId}|${finalPaymentId}`);
    const digest = hmac.digest("hex");

    if (digest !== finalSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // ✅ Store successful payment
    await ddb.send(
      new PutCommand({
        TableName: PAYMENTS,
        Item: {
          paymentId: finalPaymentId,
          orderId: finalOrderId,
          userId,
          productId,
          amountPaise: 100,
          currency: "INR",
          status: "SUCCESS",
          signatureVerified: true,
          createdAt: now(),
          updatedAt: now(),
        },
      })
    );

    // ✅ Grant 30-day access for this specific QBank
    const accessFrom = new Date();
    const accessTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await ddb.send(
      new PutCommand({
        TableName: QBANK,
        Item: {
          userId,
          productId,
          accessFrom: accessFrom.toISOString(),
          accessTill: accessTill.toISOString(),
          sourcePaymentId: finalPaymentId,
          status: "ACTIVE",
        },
      })
    );

    res.json({ success: true, message: "Payment verified & access granted" });
  } catch (err) {
    console.error("❌ Payment verification failed:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟣 Check Access (GET /api/payments/has-access)                             */
/* -------------------------------------------------------------------------- */
router.get("/has-access", async (req, res) => {
  try {
    const { userId, productId } = req.query;
    if (!userId || !productId)
      return res.status(400).json({ allowed: false, message: "Missing userId or productId" });

    const result = await ddb.send(
      new GetCommand({
        TableName: QBANK,
        Key: { userId, productId },
      })
    );

    const item = result.Item;
   const nowTime = Date.now();
const hasAccess =
  !!item &&
  item.status === "ACTIVE" &&
  (!item.accessTill || new Date(item.accessTill).getTime() > nowTime);


    res.json({ allowed: hasAccess });
  } catch (err) {
    console.error("❌ Error checking access:", err);
    res.status(500).json({ allowed: false, error: "Server error" });
  }
});

module.exports = router;
