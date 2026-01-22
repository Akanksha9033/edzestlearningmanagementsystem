const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { ses } = require("./sesClient");

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function sendAssignmentEmail({
  to,
  studentName = "Student",
  productName,
  productType,
  expiry, // "2026-12-31" OR ISO OR null
}) {
  const expiryText = expiry
    ? `Access valid till: ${formatDate(expiry)}`
    : "Lifetime access";

  const htmlBody = `
    <p>Hello ${studentName},</p>
    <p>🎉 <strong>You’ve been enrolled in ${productName}</strong> (${productType})</p>
    <p><strong>${expiryText}</strong></p>
    <p>Please login to your dashboard to start using the product.</p>
    <br/>
    <p>Happy Learning 🚀</p>
    <p><strong>Edzest Team</strong></p>
  `;

const cmd = new SendEmailCommand({
  Source: process.env.SES_FROM_EMAIL, // 👈 contact@edzest.org
  Destination: { ToAddresses: [to] },
  Message: {
    Subject: { Data: `You’ve been enrolled in ${productName}` },
    Body: {
      Html: { Data: htmlBody },
    },
  },
});


  await ses.send(cmd);
  console.log("📧 SES email sent to:", to);
}

module.exports = { sendAssignmentEmail };
