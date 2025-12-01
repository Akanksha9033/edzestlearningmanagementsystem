console.log("ENV QBANK_TABLE      = ", process.env.QBANK_TABLE);
console.log("ENV PAYMENTS_TABLE   = ", process.env.PAYMENTS_TABLE);
console.log("ENV MOCK_ACCESS_TABLE= ", process.env.MOCK_ACCESS_TABLE);
console.log("ENV MOCKTEST_PRICE_PAISE =", process.env.MOCKTEST_PRICE_PAISE);

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

console.log("✅ Payments route file loaded");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*  ✅ FIX: DynamoDB Client for Lambda (region added, no credentials needed)  */
/* -------------------------------------------------------------------------- */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  // ❗ IMPORTANT: no credentials block here
});

const ddb = DynamoDBDocumentClient.from(client);

/* -------------------------------------------------------------------------- */
/*  Table Names                                                              */
/* -------------------------------------------------------------------------- */
const PAYMENTS = process.env.PAYMENTS_TABLE || "Payments";
const QBANK = process.env.QBANK_TABLE || "QBank";
const BANKS = process.env.DDB_BANKS || "QuestionBanks"; // existing QBank price lookup

// NEW: MockTest access table + fixed price
const MOCK_ACCESS = process.env.MOCK_ACCESS_TABLE || "MockAccessV2";
const MOCKTEST_PRICE_PAISE = Number(process.env.MOCKTEST_PRICE_PAISE || "100");

// Optional future course table
const COURSES = process.env.COURSES_TABLE || "CourseAccess";

/* -------------------------------------------------------------------------- */
/*  Product Type Resolver                                                    */
/* -------------------------------------------------------------------------- */
function resolveProductTable(productId, productType) {
  const type = String(productType || "").trim().toUpperCase();

  if (type === "MOCKTEST") {
    return { type: "MOCKTEST", table: MOCK_ACCESS };
  }
  if (type === "COURSE") {
    return { type: "COURSE", table: COURSES };
  }

  return { type: "QBANK", table: QBANK };
}

/* -------------------------------------------------------------------------- */
/*  Razorpay keys                                                            */
/* -------------------------------------------------------------------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const now = () => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/*  🟢 TEST                                                                  */
/* -------------------------------------------------------------------------- */
router.get("/test", (req, res) => {
  res.json({ message: "✅ Payments route working fine!" });
});

/* -------------------------------------------------------------------------- */
/*  🟠 Create Order                                                          */
/* -------------------------------------------------------------------------- */
router.post("/create-order", async (req, res) => {
  try {
    const { productId, amountPaise, productType } = req.body || {};
    let amount = 100; // default ₹1

    const { type: resolvedType } = resolveProductTable(productId, productType);

    // client-sent amount
    if (Number(amountPaise) > 0) {
      amount = Number(amountPaise);
    } else if (resolvedType === "MOCKTEST") {
      // use env price if available
      if (MOCKTEST_PRICE_PAISE > 0) {
        amount = MOCKTEST_PRICE_PAISE;
        console.log(`💰 Using MOCKTEST_PRICE_PAISE: ${amount} paise`);
      }
    } else if (productId && resolvedType === "QBANK") {
      // QBank price lookup
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
        console.warn(
          "⚠️ Could not fetch bank price, using default ₹1:",
          err.message
        );
      }
    }

    const receipt = `order_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
    });

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
/*  🔵 Verify Payment                                                        */
/* -------------------------------------------------------------------------- */
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      order_id,
      payment_id,
      signature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      productId,
      productType,
    } = req.body;

    const finalOrderId = order_id || razorpay_order_id;
    const finalPaymentId = payment_id || razorpay_payment_id;
    const finalSignature = signature || razorpay_signature;

    if (
      !finalOrderId ||
      !finalPaymentId ||
      !finalSignature ||
      !userId ||
      !productId
    ) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    const hmac = crypto.createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    );
    hmac.update(`${finalOrderId}|${finalPaymentId}`);
    const digest = hmac.digest("hex");

    if (digest !== finalSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { table: accessTable, type: resolvedType } = resolveProductTable(
      productId,
      productType
    );

    // Save success
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

    // Access grant
    const accessFrom = new Date();
    const accessTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await ddb.send(
      new PutCommand({
        TableName: accessTable,
        Item: {
          userId,
          productId,
          accessFrom: accessFrom.toISOString(),
          accessTill: accessTill.toISOString(),
          sourcePaymentId: finalPaymentId,
          status: "ACTIVE",
          productType: resolvedType,
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
/*  🟣 Check Access                                                          */
/* -------------------------------------------------------------------------- */
router.get("/has-access", async (req, res) => {
  try {
    const { userId, productId, productType, type } = req.query;
    if (!userId || !productId)
      return res
        .status(400)
        .json({ allowed: false, message: "Missing userId or productId" });

    const effectiveType = productType || type;

    const { table: accessTable } = resolveProductTable(
      productId,
      effectiveType
    );

    const result = await ddb.send(
      new GetCommand({
        TableName: accessTable,
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
