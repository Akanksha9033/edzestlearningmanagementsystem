// console.log("ENV QBANK_TABLE      = ", process.env.QBANK_TABLE);
// console.log("ENV PAYMENTS_TABLE   = ", process.env.PAYMENTS_TABLE);
// console.log("ENV MOCK_ACCESS_TABLE= ", process.env.MOCK_ACCESS_TABLE);
// console.log("ENV MOCKTEST_PRICE_PAISE =", process.env.MOCKTEST_PRICE_PAISE);

// const express = require("express");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   GetCommand,
// } = require("@aws-sdk/lib-dynamodb");

// console.log("✅ Payments route file loaded");

// const router = express.Router();

// /* -------------------------------------------------------------------------- */
// /*  ✅ DynamoDB Client for Lambda (region added, no credentials needed)        */
// /* -------------------------------------------------------------------------- */
// const client = new DynamoDBClient({
//   region: process.env.AWS_REGION || "ap-south-1",
// });
// const ddb = DynamoDBDocumentClient.from(client);

// /* -------------------------------------------------------------------------- */
// /*  Table Names                                                               */
// /* -------------------------------------------------------------------------- */
// const PAYMENTS = process.env.PAYMENTS_TABLE || "Payments";
// const QBANK = process.env.QBANK_TABLE || "QBank";
// const BANKS = process.env.DDB_BANKS || "QuestionBanks";

// // MockTest access table + fixed price
// const MOCK_ACCESS = process.env.MOCK_ACCESS_TABLE || "MockAccessV2";
// const MOCKTEST_PRICE_PAISE = Number(process.env.MOCKTEST_PRICE_PAISE || "100");

// // Optional future course table
// const COURSES = process.env.COURSES_TABLE || "CourseAccess";
// const ENROLLMENTS_TABLE = process.env.STUDENT_ENROLLMENTS_TABLE;

// /* -------------------------------------------------------------------------- */
// /*  ✅ Safety Toggle: Allow client amount only if explicitly enabled           */
// /*  - In production keep this OFF                                             */
// /*  - Set ALLOW_CLIENT_AMOUNT=true only for dev testing                        */
// /* -------------------------------------------------------------------------- */
// const ALLOW_CLIENT_AMOUNT =
//   String(process.env.ALLOW_CLIENT_AMOUNT || "").toLowerCase() === "true";

// /* -------------------------------------------------------------------------- */
// /*  Product Type Resolver                                                     */
// /* -------------------------------------------------------------------------- */
// function resolveProductTable(productId, productType) {
//   const type = String(productType || "").trim().toUpperCase();

//   if (type === "MOCKTEST") return { type: "MOCKTEST", table: MOCK_ACCESS };
//   if (type === "COURSE") return { type: "COURSE", table: COURSES };
//   return { type: "QBANK", table: QBANK };
// }

// /* -------------------------------------------------------------------------- */
// /*  Razorpay keys                                                             */
// /* -------------------------------------------------------------------------- */
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const now = () => new Date().toISOString();

// /* -------------------------------------------------------------------------- */
// /*  🟢 TEST                                                                    */
// /* -------------------------------------------------------------------------- */
// router.get("/test", (req, res) => {
//   res.json({ message: "✅ Payments route working fine!" });
// });

// /* -------------------------------------------------------------------------- */
// /*  Helper: compute price server-side (source of truth)                        */
// /* -------------------------------------------------------------------------- */
// async function computeAmountPaise({ productId, productType, amountPaise }) {
//   let amount = 100; // default ₹1

//   const { type: resolvedType } = resolveProductTable(productId, productType);

//   // ✅ allow client amount ONLY if explicitly enabled (dev/testing)
//   if (ALLOW_CLIENT_AMOUNT && Number(amountPaise) > 0) {
//     amount = Number(amountPaise);
//     return { amount, resolvedType, pricingSource: "CLIENT_AMOUNT" };
//   }

//   // MOCKTEST fixed price from env
//   if (resolvedType === "MOCKTEST") {
//     if (MOCKTEST_PRICE_PAISE > 0) {
//       amount = MOCKTEST_PRICE_PAISE;
//       return { amount, resolvedType, pricingSource: "MOCKTEST_ENV" };
//     }
//     return { amount, resolvedType, pricingSource: "DEFAULT_1_RUPEE" };
//   }

//   // QBANK price lookup from BANKS table
//   if (productId && resolvedType === "QBANK") {
//     try {
//       const result = await ddb.send(
//         new GetCommand({
//           TableName: BANKS,
//           Key: { bankId: productId },
//         })
//       );
//       const p = result.Item?.pricePaise;
//       if (typeof p === "number" && p > 0) {
//         amount = p;
//         return { amount, resolvedType, pricingSource: "QBANK_DB_PRICE" };
//       }
//     } catch (err) {
//       console.warn("⚠️ Could not fetch bank price, using default ₹1:", err.message);
//     }
//   }

//   // COURSE pricing (future): if you have a price table, add it here later.
//   return { amount, resolvedType, pricingSource: "DEFAULT_1_RUPEE" };
// }

// /* -------------------------------------------------------------------------- */
// /*  🟠 Create Order                                                            */
// /* -------------------------------------------------------------------------- */
// router.post("/create-order", async (req, res) => {
//   try {
//     const { userId, productId, amountPaise, productType } = req.body || {};

//     // keep backward compatibility: productType optional, default QBANK
//     const effectiveProductType = productType || "QBANK";

//     const { amount, resolvedType, pricingSource } = await computeAmountPaise({
//       productId,
//       productType: effectiveProductType,
//       amountPaise,
//     });

//     const receipt = `order_${Date.now()}`;
//     const order = await razorpay.orders.create({
//       amount,
//       currency: "INR",
//       receipt,
//     });

//     // ✅ Store CREATED order details (for later verify)
//     await ddb.send(
//       new PutCommand({
//         TableName: PAYMENTS,
//         Item: {
//           paymentId: `pending_${order.id}`, // keep your existing pattern
//           orderId: order.id,
//           userId: userId || null,
//           productId: productId || null,
//           productType: effectiveProductType,
//           resolvedType,
//           amountPaise: amount,
//           currency: "INR",
//           status: "CREATED",
//           pricingSource,
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
// /*  🔵 Verify Payment                                                          */
// /* -------------------------------------------------------------------------- */
// router.post("/verify-payment", async (req, res) => {
//   try {
//     const {
//       order_id,
//       payment_id,
//       signature,
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       userId,
//       productId,
//       productType,
//     } = req.body || {};

//     const finalOrderId = order_id || razorpay_order_id;
//     const finalPaymentId = payment_id || razorpay_payment_id;
//     const finalSignature = signature || razorpay_signature;

//     if (
//       !finalOrderId ||
//       !finalPaymentId ||
//       !finalSignature ||
//       !userId ||
//       !productId ||
//       !productType
//     ) {
//       return res.status(400).json({ error: "Missing payment details" });
//     }

//     // ✅ Verify signature
//     const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//     hmac.update(`${finalOrderId}|${finalPaymentId}`);
//     const digest = hmac.digest("hex");

//     if (digest !== finalSignature) {
//       return res.status(400).json({ error: "Invalid signature" });
//     }

//     const { table: accessTable, type: resolvedType } = resolveProductTable(
//       productId,
//       productType
//     );

//     // ✅ Fetch CREATED order record to get correct amount (NO HARDCODE)
//     const created = await ddb.send(
//       new GetCommand({
//         TableName: PAYMENTS,
//         Key: { paymentId: `pending_${finalOrderId}` },
//       })
//     );

//     const createdItem = created.Item;
//     const amountFromCreated =
//       typeof createdItem?.amountPaise === "number" ? createdItem.amountPaise : null;

//     // If missing, fallback safely (still allows payment, but logs warning)
//     const finalAmountPaise =
//       amountFromCreated != null ? amountFromCreated : 100;

//     if (amountFromCreated == null) {
//       console.warn(
//         "⚠️ CREATED order not found or missing amountPaise. Using fallback ₹1.",
//         { finalOrderId }
//       );
//     }

//     // ✅ Save success payment record (kept your current behavior: new item)
//     await ddb.send(
//       new PutCommand({
//         TableName: PAYMENTS,
//         Item: {
//           paymentId: finalPaymentId,
//           orderId: finalOrderId,
//           userId,
//           productId,
//           productType,
//           resolvedType,
//           amountPaise: finalAmountPaise,
//           currency: "INR",
//           status: "SUCCESS",
//           signatureVerified: true,
//           createdAt: now(),
//           updatedAt: now(),
//         },
//       })
//     );

//     // ✅ Grant access (same as your logic)
//     const accessFrom = new Date();
//     const accessTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

//     await ddb.send(
//       new PutCommand({
//         TableName: accessTable,
//         Item: {
//           userId,
//           productId,
//           accessFrom: accessFrom.toISOString(),
//           accessTill: accessTill.toISOString(),
//           sourcePaymentId: finalPaymentId,
//           status: "ACTIVE",
//           productType: resolvedType,
//         },
//       })
//     );
// // ✅ ALSO CREATE ENROLLMENT ENTRY (so My Enrollments shows it)
// if (ENROLLMENTS_TABLE) {
//   await ddb.send(
//     new PutCommand({
//       TableName: ENROLLMENTS_TABLE,
//       Item: {
//         pk: `USER#${userId}`,                 // userId = sub (must match req.user.sub you use elsewhere)
//         sk: `ENROLLMENT#${productId}`,

//         productId,
//         productType: resolvedType,            // "QBANK" | "MOCKTEST" | "COURSE"

//         accessSource: "paid",
//         status: "ACTIVE",

//         expiry: accessTill.toISOString(),
//         createdAt: now(),
//       },
//     })
//   );

//   console.log("✅ Enrollment created in STUDENT_ENROLLMENTS_TABLE (paid)");
// } else {
//   console.warn("⚠️ STUDENT_ENROLLMENTS_TABLE env missing, enrollment not written");
// }


//     res.json({ success: true, message: "Payment verified & access granted" });
//   } catch (err) {
//     console.error("❌ Payment verification failed:", err);
//     res.status(500).json({ error: "Verification failed" });
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*  🟣 Check Access                                                            */
// /* -------------------------------------------------------------------------- */
// router.get("/has-access", async (req, res) => {
//   try {
//     const { userId, productId, productType, type } = req.query;

//     if (!userId || !productId) {
//       return res
//         .status(400)
//         .json({ allowed: false, message: "Missing userId or productId" });
//     }

//     const effectiveType = productType || type;

//     const { table: accessTable } = resolveProductTable(productId, effectiveType);

//     const result = await ddb.send(
//       new GetCommand({
//         TableName: accessTable,
//         Key: { userId, productId },
//       })
//     );

//     const item = result.Item;
//     const nowTime = Date.now();
//     const hasAccess =
//       !!item &&
//       item.status === "ACTIVE" &&
//       (!item.accessTill || new Date(item.accessTill).getTime() > nowTime);

//     res.json({ allowed: hasAccess });
//   } catch (err) {
//     console.error("❌ Error checking access:", err);
//     res.status(500).json({ allowed: false, error: "Server error" });
//   }
// });

// module.exports = router;

// console.log("ENV QBANK_TABLE      = ", process.env.QBANK_TABLE);
// console.log("ENV PAYMENTS_TABLE   = ", process.env.PAYMENTS_TABLE);
// console.log("ENV MOCK_ACCESS_TABLE= ", process.env.MOCK_ACCESS_TABLE);
// console.log("ENV MOCKTEST_PRICE_PAISE =", process.env.MOCKTEST_PRICE_PAISE);



// const express = require("express");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const { authAccess } = require("../middleware/auth");




// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   GetCommand,
// } = require("@aws-sdk/lib-dynamodb");

// console.log("✅ Payments route file loaded");

// const router = express.Router();

// /* -------------------------------------------------------------------------- */
// /*  DynamoDB Client                                                           */
// /* -------------------------------------------------------------------------- */
// const client = new DynamoDBClient({
//   region: process.env.AWS_REGION || "ap-south-1",
// });
// const ddb = DynamoDBDocumentClient.from(client);

// /* -------------------------------------------------------------------------- */
// /*  Table Names                                                               */
// /* -------------------------------------------------------------------------- */
// const PAYMENTS = process.env.PAYMENTS_TABLE || "Payments";
// const QBANK = process.env.QBANK_TABLE || "QBank";
// const BANKS = process.env.DDB_BANKS || "QuestionBanks";

// const MOCK_ACCESS = process.env.MOCK_ACCESS_TABLE || "MockAccessV2";
// const MOCKTEST_PRICE_PAISE = Number(process.env.MOCKTEST_PRICE_PAISE || "100");

// const COURSES = process.env.COURSES_TABLE || "CourseAccess";
// const ENROLLMENTS_TABLE = process.env.STUDENT_ENROLLMENTS_TABLE;

// /* -------------------------------------------------------------------------- */
// /*  Safety Toggle                                                             */
// /* -------------------------------------------------------------------------- */
// const ALLOW_CLIENT_AMOUNT =
//   String(process.env.ALLOW_CLIENT_AMOUNT || "").toLowerCase() === "true";

// /* -------------------------------------------------------------------------- */
// /*  Product Resolver                                                          */
// /* -------------------------------------------------------------------------- */
// function resolveProductTable(productId, productType) {
//   const type = String(productType || "").trim().toUpperCase();
//   if (type === "MOCKTEST") return { type: "MOCKTEST", table: MOCK_ACCESS };
//   if (type === "COURSE") return { type: "COURSE", table: COURSES };
//   return { type: "QBANK", table: QBANK };
// }

// /* -------------------------------------------------------------------------- */
// /*  Razorpay                                                                  */
// /* -------------------------------------------------------------------------- */
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const now = () => new Date().toISOString();

// /* -------------------------------------------------------------------------- */
// /*  TEST                                                                      */
// /* -------------------------------------------------------------------------- */
// router.get("/test", (req, res) => {
//   res.json({ message: "✅ Payments route working fine!" });
// });

// /* -------------------------------------------------------------------------- */
// /*  Price Resolver                                                            */
// /* -------------------------------------------------------------------------- */
// async function computeAmountPaise({ productId, productType, amountPaise }) {
//   let amount = 100;

//   const { type: resolvedType } = resolveProductTable(productId, productType);

//   if (ALLOW_CLIENT_AMOUNT && Number(amountPaise) > 0) {
//     return { amount: Number(amountPaise), resolvedType, pricingSource: "CLIENT" };
//   }

//   if (resolvedType === "MOCKTEST" && MOCKTEST_PRICE_PAISE > 0) {
//     return {
//       amount: MOCKTEST_PRICE_PAISE,
//       resolvedType,
//       pricingSource: "MOCKTEST_ENV",
//     };
//   }

//   if (productId && resolvedType === "QBANK") {
//     try {
//       const r = await ddb.send(
//         new GetCommand({
//           TableName: BANKS,
//           Key: { bankId: productId },
//         })
//       );
//       if (typeof r.Item?.pricePaise === "number") {
//         return {
//           amount: r.Item.pricePaise,
//           resolvedType,
//           pricingSource: "QBANK_DB",
//         };
//       }
//     } catch {}
//   }

//   return { amount, resolvedType, pricingSource: "DEFAULT" };
// }

// /* -------------------------------------------------------------------------- */
// /*  CREATE ORDER                                                              */
// /* -------------------------------------------------------------------------- */
// router.post("/create-order", authAccess, async (req, res) => {

//   try {
//     const { productId, amountPaise, productType } = req.body || {};
//     const userId = req.user?.sub;

//     const effectiveType = productType || "QBANK";

//     const { amount, resolvedType, pricingSource } =
//       await computeAmountPaise({
//         productId,
//         productType: effectiveType,
//         amountPaise,
//       });

//     const order = await razorpay.orders.create({
//       amount,
//       currency: "INR",
//       receipt: `order_${Date.now()}`,
//     });

//     await ddb.send(
//       new PutCommand({
//         TableName: PAYMENTS,
//         Item: {
//           paymentId: `pending_${order.id}`,
//           orderId: order.id,
//           userId,
//           productId,
//           productType: effectiveType,
//           resolvedType,
//           amountPaise: amount,
//           status: "CREATED",
//           pricingSource,
//           createdAt: now(),
//           updatedAt: now(),
//         },
//       })
//     );

//     res.json({
//       orderId: order.id,
//       amount: order.amount,
//       currency: "INR",
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error("❌ create-order failed:", err);
//     res.status(500).json({ error: "Failed to create order" });
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*  VERIFY PAYMENT                                                            */
// /* -------------------------------------------------------------------------- */
// router.post("/verify-payment", authAccess, async (req, res) => {

//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       order_id,
//       payment_id,
//       signature,
//       productId,
//       productType,
//     } = req.body || {};

//     const userId = req.user?.sub;

//     const finalOrderId = razorpay_order_id || order_id;
//     const finalPaymentId = razorpay_payment_id || payment_id;
//     const finalSignature = razorpay_signature || signature;

//     if (!finalOrderId || !finalPaymentId || !finalSignature || !productId || !productType) {
//       return res.status(400).json({ error: "Missing payment details" });
//     }

//     const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//     hmac.update(`${finalOrderId}|${finalPaymentId}`);
//     const digest = hmac.digest("hex");

//     if (digest !== finalSignature) {
//       return res.status(400).json({ error: "Invalid signature" });
//     }

//     const created = await ddb.send(
//       new GetCommand({
//         TableName: PAYMENTS,
//         Key: { paymentId: `pending_${finalOrderId}` },
//       })
//     );

//     const amountPaise = created.Item?.amountPaise || 100;

//     await ddb.send(
//       new PutCommand({
//         TableName: PAYMENTS,
//         Item: {
//           paymentId: finalPaymentId,
//           orderId: finalOrderId,
//           userId,
//           productId,
//           productType,
//           amountPaise,
//           status: "SUCCESS",
//           createdAt: now(),
//           updatedAt: now(),
//         },
//       })
//     );

//     const { table: accessTable, type } = resolveProductTable(productId, productType);

//     const accessTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

//     await ddb.send(
//       new PutCommand({
//         TableName: accessTable,
//         Item: {
//           userId,
//           productId,
//           status: "ACTIVE",
//           accessTill: accessTill.toISOString(),
//         },
//       })
//     );

//     if (ENROLLMENTS_TABLE) {
//       await ddb.send(
//         new PutCommand({
//           TableName: ENROLLMENTS_TABLE,
//           Item: {
//             pk: `USER#${userId}`,
//             sk: `ENROLLMENT#${productId}`,
//             productId,
//             productType: type,
//             accessSource: "paid",
//             status: "ACTIVE",
//             expiry: accessTill.toISOString(),
//             createdAt: now(),
//           },
//         })
//       );
//     }

//     res.json({ success: true });
//   } catch (err) {
//     console.error("❌ verify-payment failed:", err);
//     res.status(500).json({ error: "Verification failed" });
//   }
// });

// module.exports = router;

console.log("ENV QBANK_TABLE      = ", process.env.QBANK_TABLE);
console.log("ENV PAYMENTS_TABLE   = ", process.env.PAYMENTS_TABLE);
console.log("ENV MOCK_ACCESS_TABLE= ", process.env.MOCK_ACCESS_TABLE);
console.log("ENV MOCKTEST_PRICE_PAISE =", process.env.MOCKTEST_PRICE_PAISE);

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { authAccess } = require("../middleware/auth");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

console.log("✅ Payments route file loaded");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*  DynamoDB Client                                                           */
/* -------------------------------------------------------------------------- */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});
const ddb = DynamoDBDocumentClient.from(client);

/* -------------------------------------------------------------------------- */
/*  Table Names                                                               */
/* -------------------------------------------------------------------------- */
const PAYMENTS = process.env.PAYMENTS_TABLE || "Payments";
const QBANK = process.env.QBANK_TABLE || "QBank";
const BANKS = process.env.DDB_BANKS || "QuestionBanks";
const MOCK_ACCESS = process.env.MOCK_ACCESS_TABLE || "MockAccessV2";
const MOCKTEST_PRICE_PAISE = Number(process.env.MOCKTEST_PRICE_PAISE || "100");
const COURSES = process.env.COURSES_TABLE || "CourseAccess";
const ENROLLMENTS_TABLE = process.env.STUDENT_ENROLLMENTS_TABLE;

/* -------------------------------------------------------------------------- */
/*  Safety Toggle                                                             */
/* -------------------------------------------------------------------------- */
const ALLOW_CLIENT_AMOUNT =
  String(process.env.ALLOW_CLIENT_AMOUNT || "").toLowerCase() === "true";

/* -------------------------------------------------------------------------- */
/*  Product Resolver                                                          */
/* -------------------------------------------------------------------------- */
function resolveProductTable(productId, productType) {
  const type = String(productType || "").trim().toUpperCase();
  if (type === "MOCKTEST") return { type: "MOCKTEST", table: MOCK_ACCESS };
  if (type === "COURSE") return { type: "COURSE", table: COURSES };
  return { type: "QBANK", table: QBANK };
}

/* -------------------------------------------------------------------------- */
/*  Razorpay                                                                  */
/* -------------------------------------------------------------------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const now = () => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/*  TEST                                                                      */
/* -------------------------------------------------------------------------- */
router.get("/test", (req, res) => {
  res.json({ message: "✅ Payments route working fine!" });
});

/* -------------------------------------------------------------------------- */
/*  Price Resolver                                                            */
/* -------------------------------------------------------------------------- */
async function computeAmountPaise({ productId, productType, amountPaise }) {
  let amount = 100;

  const { type: resolvedType } = resolveProductTable(productId, productType);

  if (ALLOW_CLIENT_AMOUNT && Number(amountPaise) > 0) {
    return { amount: Number(amountPaise), resolvedType, pricingSource: "CLIENT" };
  }

  if (resolvedType === "MOCKTEST" && MOCKTEST_PRICE_PAISE > 0) {
    return {
      amount: MOCKTEST_PRICE_PAISE,
      resolvedType,
      pricingSource: "MOCKTEST_ENV",
    };
  }

  if (productId && resolvedType === "QBANK") {
    try {
      const r = await ddb.send(
        new GetCommand({
          TableName: BANKS,
          Key: { bankId: productId },
        })
      );
      if (typeof r.Item?.pricePaise === "number") {
        return {
          amount: r.Item.pricePaise,
          resolvedType,
          pricingSource: "QBANK_DB",
        };
      }
    } catch {}
  }

  return { amount, resolvedType, pricingSource: "DEFAULT" };
}

/* -------------------------------------------------------------------------- */
/*  CREATE ORDER                                                              */
/* -------------------------------------------------------------------------- */
router.post("/create-order", authAccess, async (req, res) => {
  try {
    const { productId, amountPaise, productType } = req.body || {};
    const userId = req.user?.sub;

    const effectiveType = productType || "QBANK";

    const { amount, resolvedType, pricingSource } =
      await computeAmountPaise({
        productId,
        productType: effectiveType,
        amountPaise,
      });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    await ddb.send(
      new PutCommand({
        TableName: PAYMENTS,
        Item: {
          paymentId: `pending_${order.id}`,
          orderId: order.id,
          userId,
          productId,
          productType: effectiveType,
          resolvedType,
          amountPaise: amount,
          status: "CREATED",
          pricingSource,
          createdAt: now(),
          updatedAt: now(),
        },
      })
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ create-order failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/* -------------------------------------------------------------------------- */
/*  VERIFY PAYMENT                                                            */
/* -------------------------------------------------------------------------- */
router.post("/verify-payment", authAccess, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      signature,
      productId,
      productType,
    } = req.body || {};

    const userId = req.user?.sub;

    const finalOrderId = razorpay_order_id || order_id;
    const finalPaymentId = razorpay_payment_id || payment_id;
    const finalSignature = razorpay_signature || signature;

    if (!finalOrderId || !finalPaymentId || !finalSignature || !productId || !productType) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${finalOrderId}|${finalPaymentId}`);
    const digest = hmac.digest("hex");

    if (digest !== finalSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const created = await ddb.send(
      new GetCommand({
        TableName: PAYMENTS,
        Key: { paymentId: `pending_${finalOrderId}` },
      })
    );

    const amountPaise = created.Item?.amountPaise || 100;

    await ddb.send(
      new PutCommand({
        TableName: PAYMENTS,
        Item: {
          paymentId: finalPaymentId,
          orderId: finalOrderId,
          userId,
          productId,
          productType,
          amountPaise,
          status: "SUCCESS",
          createdAt: now(),
          updatedAt: now(),
        },
      })
    );

    const { table: accessTable, type } = resolveProductTable(productId, productType);

    const accessTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await ddb.send(
      new PutCommand({
        TableName: accessTable,
        Item: {
          userId,
          productId,
          status: "ACTIVE",
          accessTill: accessTill.toISOString(),
        },
      })
    );

    /* ------------------------------------------------------------------ */
    /*  🔁 ENROLLMENT UPSERT (NO DUPLICATES, NO LOGIC CHANGE)              */
    /* ------------------------------------------------------------------ */
    if (ENROLLMENTS_TABLE) {
      const existing = await ddb.send(
        new GetCommand({
          TableName: ENROLLMENTS_TABLE,
          Key: {
            pk: `USER#${userId}`,
            sk: `ENROLLMENT#${productId}`,
          },
        })
      );

      await ddb.send(
        new PutCommand({
          TableName: ENROLLMENTS_TABLE,
          Item: {
            pk: `USER#${userId}`,
            sk: `ENROLLMENT#${productId}`,

            productId,
            productType: type,

            accessSource: "paid",
            status: "ACTIVE",
            expiry: accessTill.toISOString(),

            title: existing.Item?.title,
            thumbnailUrl: existing.Item?.thumbnailUrl,

            createdAt: existing.Item?.createdAt || now(),
            updatedAt: now(),
          },
        })
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ verify-payment failed:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;
