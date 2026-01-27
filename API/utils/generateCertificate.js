

// // api/utils/generateCertificate.js

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   GetCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// const PDFDocument = require("pdfkit");
// const path = require("path");
// const fs = require("fs");
// const os = require("os");

// // ================= AWS =================
// const REGION = process.env.AWS_REGION || "ap-south-1";

// console.log("🧪 [CERT] REGION =", REGION);

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// const s3 = new S3Client({ region: REGION });
// const ses = new SESClient({ region: REGION });

// // ================= CONFIG =================
// const CERT_TABLE =
//   process.env.CERTIFICATES_TABLE || "Certificates";

// const CERT_BUCKET =
//   process.env.CERTIFICATE_BUCKET || "edzest-certificates";

// const SES_FROM_EMAIL =
//   process.env.SES_FROM_EMAIL || "no-reply@edzest.org";

// console.log("🧪 [CERT] TABLE =", CERT_TABLE);
// console.log("🧪 [CERT] BUCKET =", CERT_BUCKET);
// console.log("🧪 [CERT] SES_FROM_EMAIL =", SES_FROM_EMAIL);

// // ==================================================
// // 📧 EMAIL SENDER (SAFE ADD – NO CORE LOGIC CHANGE)
// // ==================================================
// async function sendCertificateEmail({
//   toEmail,
//   studentName,
//   courseTitle,
//   downloadUrl,
// }) {
//   console.log("📧 [CERT-MAIL] Preparing email", {
//     toEmail,
//     courseTitle,
//   });

//   if (!toEmail) {
//     console.warn("⚠️ [CERT-MAIL] Missing recipient email");
//     return;
//   }

//   try {
//     await ses.send(
//       new SendEmailCommand({
//         Source: SES_FROM_EMAIL,
//         Destination: {
//           ToAddresses: [toEmail],
//         },
//         Message: {
//           Subject: {
//             Data: `🎓 Your Certificate for ${courseTitle}`,
//             Charset: "UTF-8",
//           },
//           Body: {
//             Html: {
//               Charset: "UTF-8",
//               Data: `
//                 <p>Hi <b>${studentName}</b>,</p>
//                 <p>Congratulations on successfully completing <b>${courseTitle}</b> 🎉</p>
//                 <p>You can download your certificate using the link below:</p>
//                 <p>
//                   <a href="${downloadUrl}" target="_blank">
//                     👉 Download Certificate
//                   </a>
//                 </p>
//                 <br/>
//                 <p>Regards,<br/>Edzest Team</p>
//               `,
//             },
//           },
//         },
//       })
//     );

//     console.log("📨 [CERT-MAIL] Email sent successfully to", toEmail);
//   } catch (err) {
//     console.error("🔥 [CERT-MAIL] Email failed:", err.message);
//   }
// }

// // ==================================================
// // 🎓 CERTIFICATE GENERATOR (LOGIC UNCHANGED)
// // ==================================================
// module.exports = async function generateCertificate({
//   userId,
//   email,
//   courseSlug,
//   courseTitle,
//   studentName,
// }) {
//   console.log("🎓 [CERT] START", {
//     userId,
//     courseSlug,
//     email,
//     courseTitle,
//     studentName,
//   });

//   try {
//     // ================= 1️⃣ CHECK EXISTING =================
//     console.log("🔍 [CERT] Checking existing certificate");

//     const existing = await ddb.send(
//       new GetCommand({
//         TableName: CERT_TABLE,
//         Key: {
//           pk: `USER#${userId}`,
//           sk: `CERT#COURSE#${courseSlug}`,
//         },
//       })
//     );

//     console.log("📦 [CERT] Existing result:", existing.Item);

//     if (existing.Item) {
//       console.log("ℹ️ [CERT] Already exists, skipping");
//       return existing.Item;
//     }

//     // ================= 2️⃣ TEMP PATH =================
//     const tmpDir = os.tmpdir();
//     const tmpPath = path.join(
//       tmpDir,
//       `certificate-${userId}-${courseSlug}.pdf`
//     );

//     console.log("📝 [CERT] Temp dir:", tmpDir);
//     console.log("📝 [CERT] PDF path:", tmpPath);

//     // ================= 3️⃣ GENERATE PDF =================
//     const doc = new PDFDocument({ size: "A4", margin: 50 });
//     const stream = fs.createWriteStream(tmpPath);

//     doc.pipe(stream);

//     doc.fontSize(26).text("Certificate of Completion", { align: "center" });
//     doc.moveDown(2);
//     doc.fontSize(16).text("This is to certify that", { align: "center" });
//     doc.moveDown(1);
//     doc.fontSize(22).text(studentName, { align: "center" });
//     doc.moveDown(1);
//     doc.fontSize(16).text("has successfully completed the course", {
//       align: "center",
//     });
//     doc.moveDown(1);
//     doc.fontSize(18).text(courseTitle, { align: "center" });
//     doc.moveDown(3);
//     doc.fontSize(12).text(
//       `Issued on: ${new Date().toLocaleDateString()}`,
//       { align: "center" }
//     );

//     doc.end();

//     await new Promise((resolve, reject) => {
//       stream.on("finish", resolve);
//       stream.on("error", reject);
//     });

//     console.log("✅ [CERT] PDF created");

//     // ================= 4️⃣ UPLOAD TO S3 =================
//     const s3Key = `certificates/${userId}/${courseSlug}.pdf`;

//     console.log("☁️ [CERT] Uploading to S3:", s3Key);

//     const fileBuffer = fs.readFileSync(tmpPath);

//     await s3.send(
//       new PutObjectCommand({
//         Bucket: CERT_BUCKET,
//         Key: s3Key,
//         Body: fileBuffer,
//         ContentType: "application/pdf",
//       })
//     );

//     const downloadUrl = `https://${CERT_BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

//     console.log("🔗 [CERT] Uploaded URL:", downloadUrl);

//     // ================= 5️⃣ SAVE TO DDB =================
//     const item = {
//       pk: `USER#${userId}`,
//       sk: `CERT#COURSE#${courseSlug}`,

//       userId,
//       email,
//       courseSlug,
//       courseTitle,
//       issuedAt: Date.now(),

//       // required for signed download
//       s3Key,

//       // backward compatibility
//       downloadUrl,
//     };

//     console.log("🧾 [CERT] Saving item to DynamoDB:", item);

//     await ddb.send(
//       new PutCommand({
//         TableName: CERT_TABLE,
//         Item: item,
//       })
//     );

//     console.log("🎉 [CERT] SUCCESS");

//     // ================= 6️⃣ SEND EMAIL (SAFE ADD) =================
//     await sendCertificateEmail({
//       toEmail: email,
//       studentName,
//       courseTitle,
//       downloadUrl,
//     });

//     return item;
//   } catch (err) {
//     console.error("🔥 [CERT][FATAL ERROR]", err);
//     throw err;
//   }
// };


// // api/utils/generateCertificate.js

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   GetCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
// const PDFDocument = require("pdfkit");
// const path = require("path");
// const fs = require("fs");
// const os = require("os");
// const https = require("https");

// // ================= AWS =================
// const REGION = process.env.AWS_REGION || "ap-south-1";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// const s3 = new S3Client({ region: REGION });

// // ================= CONFIG =================
// const CERT_TABLE =
//   process.env.CERTIFICATES_TABLE || "Certificates";

// const CERT_BUCKET =
//   process.env.CERTIFICATE_BUCKET || "edzest-certificates";

// // ✅ TEMPLATE IMAGE (S3 public URL)
// const TEMPLATE_IMAGE_URL =

//   "https://edzest-certificates.s3.ap-south-1.amazonaws.com/templates/certificate-template-clean.png";


// // ==================================================
// // 🎓 CERTIFICATE GENERATOR
// // ==================================================
// module.exports = async function generateCertificate({
//   userId,
//   email,
//   courseSlug,
//   courseTitle,
//   studentName,
// }) {
//   console.log("🎓 [CERT] START", { userId, courseSlug });

//   // ================= 1️⃣ CHECK EXISTING =================
//   const existing = await ddb.send(
//     new GetCommand({
//       TableName: CERT_TABLE,
//       Key: {
//         pk: `USER#${userId}`,
//         sk: `CERT#COURSE#${courseSlug}`,
//       },
//     })
//   );

//   if (existing.Item) {
//     console.log("ℹ️ [CERT] Already exists");
//     return existing.Item;
//   }

//   // ================= 2️⃣ TEMP FILES =================
//   const tmpDir = os.tmpdir();
//   const pdfPath = path.join(tmpDir, `certificate-${userId}.pdf`);
//   const imgPath = path.join(tmpDir, "template.png");

//   // ================= 3️⃣ DOWNLOAD TEMPLATE IMAGE =================
//   await new Promise((resolve, reject) => {
//     const file = fs.createWriteStream(imgPath);
//     https.get(TEMPLATE_IMAGE_URL, (res) => {
//       res.pipe(file);
//       file.on("finish", () => file.close(resolve));
//     }).on("error", reject);
//   });

//   console.log("🖼️ [CERT] Template downloaded");

//   // ================= 4️⃣ CREATE PDF =================
//   const doc = new PDFDocument({
//     size: "A4",
//     margin: 0,
//   });

//   const stream = fs.createWriteStream(pdfPath);
//   doc.pipe(stream);

//   // 🔹 Background image
//   doc.image(imgPath, 0, 0, {
//     width: doc.page.width,
//     height: doc.page.height,
//   });

// // ================= TEXT OVER TEMPLATE =================
// doc.fillColor("#000");

// // ✅ STUDENT NAME (exactly below "granted to" in image)
// doc.font("Helvetica-Bold")
//   .fontSize(34)
//   .text(studentName.toUpperCase(), 0, 440, {
//     align: "center",
//     width: doc.page.width,
//   });

// // ✅ COURSE LINE (image ke niche wale paragraph ke upar)
// doc.font("Helvetica")
//   .fontSize(14)
//   .text(
//     `for completing the training sessions on ${courseTitle}`,
//     120,
//     490,
//     {
//       align: "center",
//       width: doc.page.width - 240,
//     }
//   );

// // ✅ ISSUE DATE (ONLY ONCE)
// doc.font("Helvetica")
//   .fontSize(11)
//   .text(
//     `Issued on: ${new Date().toLocaleDateString("en-IN")}`,
//     0,
//     525, // 🔥 moved UP
//     {
//       align: "center",
//       width: doc.page.width,
//     }
//   );



//   doc.end();

//   await new Promise((r) => stream.on("finish", r));
//   console.log("📄 [CERT] PDF created");

//   // ================= 5️⃣ UPLOAD TO S3 =================
//   const s3Key = `certificates/${userId}/${courseSlug}.pdf`;

//   await s3.send(
//     new PutObjectCommand({
//       Bucket: CERT_BUCKET,
//       Key: s3Key,
//       Body: fs.readFileSync(pdfPath),
//       ContentType: "application/pdf",
//     })
//   );

//   const downloadUrl = `https://${CERT_BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

//   // ================= 6️⃣ SAVE TO DDB =================
//   const item = {
//     pk: `USER#${userId}`,
//     sk: `CERT#COURSE#${courseSlug}`,
//     userId,
//     email,
//     courseSlug,
//     courseTitle,
//     issuedAt: Date.now(),
//     s3Key,
//     downloadUrl,
//   };

//   await ddb.send(
//     new PutCommand({
//       TableName: CERT_TABLE,
//       Item: item,
//     })
//   );

//   console.log("🎉 [CERT] DONE");
//   return item;
// };


const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const os = require("os");
const https = require("https");

/* ================= AWS ================= */
const REGION = process.env.AWS_REGION || "ap-south-1";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

const s3 = new S3Client({ region: REGION });
const ses = new SESClient({ region: REGION });

/* ================= CONFIG ================= */
const CERT_TABLE =
  process.env.CERTIFICATES_TABLE || "Certificates";

const CERT_BUCKET =
  process.env.CERTIFICATE_BUCKET || "edzest-certificates";

const SES_FROM_EMAIL =
  process.env.SES_FROM_EMAIL || "no-reply@edzest.org";

// ✅ TEMPLATE IMAGE (S3 public URL)
const TEMPLATE_IMAGE_URL =
  "https://edzest-certificates.s3.ap-south-1.amazonaws.com/templates/certificate-template-clean.png";

/* ==================================================
   📧 EMAIL SENDER (ADD ONLY – NO LOGIC CHANGE)
================================================== */
async function sendCertificateEmail({
  toEmail,
  studentName,
  courseTitle,
  downloadUrl,
}) {
  if (!toEmail) {
    console.warn("⚠️ [CERT MAIL] Missing email, skipping mail");
    return;
  }

  console.log("📧 [CERT MAIL] Sending certificate mail to", toEmail);

  await ses.send(
    new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: `🎓 Your Certificate for ${courseTitle}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <p>Hi <b>${studentName}</b>,</p>

              <p>
                Congratulations on successfully completing
                <b>${courseTitle}</b> 🎉
              </p>

              <p>
                You can download your certificate from the link below:
              </p>

              <p>
                <a href="${downloadUrl}" target="_blank">
                  👉 Download Certificate
                </a>
              </p>

              <br/>
              <p>Regards,<br/>Edzest Team</p>
            `,
          },
        },
      },
    })
  );

  console.log("✅ [CERT MAIL] Email sent successfully");
}

/* ==================================================
   🎓 CERTIFICATE GENERATOR (LOGIC UNCHANGED)
================================================== */
module.exports = async function generateCertificate({
  userId,
  email,
  courseSlug,
  courseTitle,
  studentName,
}) {
  console.log("🎓 [CERT] START", { userId, courseSlug });

  /* ================= 1️⃣ CHECK EXISTING ================= */
  const existing = await ddb.send(
    new GetCommand({
      TableName: CERT_TABLE,
      Key: {
        pk: `USER#${userId}`,
        sk: `CERT#COURSE#${courseSlug}`,
      },
    })
  );

  if (existing.Item) {
    console.log("ℹ️ [CERT] Already exists, skipping generation");
    return existing.Item;
  }

  /* ================= 2️⃣ TEMP FILES ================= */
  const tmpDir = os.tmpdir();
  const pdfPath = path.join(tmpDir, `certificate-${userId}.pdf`);
  const imgPath = path.join(tmpDir, "template.png");

  /* ================= 3️⃣ DOWNLOAD TEMPLATE IMAGE ================= */
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(imgPath);
    https
      .get(TEMPLATE_IMAGE_URL, (res) => {
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });

  console.log("🖼️ [CERT] Template downloaded");

  /* ================= 4️⃣ CREATE PDF ================= */
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
  });

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // 🔹 Background image
  doc.image(imgPath, 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  // ================= TEXT OVER TEMPLATE =================
  doc.fillColor("#000");

  doc.font("Helvetica-Bold")
    .fontSize(34)
    .text(studentName.toUpperCase(), 0, 440, {
      align: "center",
      width: doc.page.width,
    });

  doc.font("Helvetica")
    .fontSize(14)
    .text(
      `for completing the training sessions on ${courseTitle}`,
      120,
      490,
      {
        align: "center",
        width: doc.page.width - 240,
      }
    );

  doc.font("Helvetica")
    .fontSize(11)
    .text(
      `Issued on: ${new Date().toLocaleDateString("en-IN")}`,
      0,
      525,
      {
        align: "center",
        width: doc.page.width,
      }
    );

  doc.end();
  await new Promise((r) => stream.on("finish", r));

  console.log("📄 [CERT] PDF created");

  /* ================= 5️⃣ UPLOAD TO S3 ================= */
  const s3Key = `certificates/${userId}/${courseSlug}.pdf`;

  await s3.send(
    new PutObjectCommand({
      Bucket: CERT_BUCKET,
      Key: s3Key,
      Body: fs.readFileSync(pdfPath),
      ContentType: "application/pdf",
    })
  );

  const downloadUrl = `https://${CERT_BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

  /* ================= 6️⃣ SAVE TO DDB ================= */
  const item = {
    pk: `USER#${userId}`,
    sk: `CERT#COURSE#${courseSlug}`,
    userId,
    email,
    courseSlug,
    courseTitle,
    issuedAt: Date.now(),
    s3Key,
    downloadUrl,
  };

  await ddb.send(
    new PutCommand({
      TableName: CERT_TABLE,
      Item: item,
    })
  );

  console.log("🎉 [CERT] DONE");

  /* ================= 7️⃣ SEND EMAIL (SAFE ADD) ================= */
  try {
    await sendCertificateEmail({
      toEmail: email,
      studentName,
      courseTitle,
      downloadUrl,
    });
  } catch (e) {
    console.error("🔥 [CERT MAIL ERROR]", e.message);
  }

  return item;
};
