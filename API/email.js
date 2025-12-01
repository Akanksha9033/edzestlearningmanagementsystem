// backend/email.js (CommonJS)
// AWS SES v3 imports
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// Region selection (defaults to ap-south-1)
const REGION = process.env.AWS_REGION || "ap-south-1";

// Create SES client instance
const ses = new SESClient({ region: REGION });

/**
 * Escape HTML to avoid injection in emails
 */
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends contact form submission email
 */
async function sendContactEmail({ fullName, email, phoneNumber, message }) {
  const FROM = process.env.EMAIL_FROM; // SES-verified sender
  const TO = process.env.EMAIL_TO;     // SES-verified recipient
  const APP = process.env.APP_NAME || "Edzest";

  if (!FROM || !TO) throw new Error("Missing EMAIL_FROM/EMAIL_TO env vars");

  // Email subject
  const subject = `[${APP}] New contact: ${fullName || "(no name)"}`;

  // Plain text email (fallback)
  const text = [
    `Name: ${fullName || ""}`,
    `Email: ${email || ""}`,
    `Phone: ${phoneNumber || ""}`,
    ``,
    `Message:`,
    message || "",
  ].join("\n");

  // HTML version (safe escaped)
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New contact form submission</h2>
      <p><b>Name:</b> ${escapeHtml(fullName || "")}</p>
      <p><b>Email:</b> ${escapeHtml(email || "")}</p>
      <p><b>Phone:</b> ${escapeHtml(phoneNumber || "")}</p>
      <p><b>Message:</b><br/>${escapeHtml(message || "").replace(/\n/g, "<br/>")}</p>
    </div>
  `;

  // SES email sending command
  const cmd = new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: [TO] },

    // Reply will go to your app mailbox, not the visitor's email
    ReplyToAddresses: [FROM],

    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: text, Charset: "UTF-8" },
        Html: { Data: html, Charset: "UTF-8" },
      },
    },
  });

  // Execute SES send
  const out = await ses.send(cmd);
  console.log("SES OK", out?.MessageId);
  return out;
}

// Export function
module.exports = { sendContactEmail };
