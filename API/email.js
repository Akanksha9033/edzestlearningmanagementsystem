// // backend/email.js (CommonJS)
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// const REGION = process.env.AWS_REGION || "ap-south-1";
// const ses = new SESClient({ region: REGION });

// function escapeHtml(s) {
//   return String(s || "")
//     .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
//     .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
// }

// async function sendContactEmail({ fullName, email, phoneNumber, message }) {
//   const FROM = process.env.EMAIL_FROM; // must be SES-verified
//   const TO   = process.env.EMAIL_TO;   // verify if SES sandbox
//   const APP  = process.env.APP_NAME || "Edzest";

//   if (!FROM || !TO) throw new Error("Missing EMAIL_FROM/EMAIL_TO env vars");

//   const subject = `[${APP}] New contact: ${fullName || "(no name)"}`;

//   const text = [
//     `Name: ${fullName || ""}`,
//     `Email: ${email || ""}`,
//     `Phone: ${phoneNumber || ""}`,
//     ``,
//     `Message:`,
//     message || ""
//   ].join("\n");

//   const html = `
//     <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">
//       <h2 style="margin:0 0 12px;">New contact form submission</h2>
//       <p><b>Name:</b> ${escapeHtml(fullName || "")}</p>
//       <p><b>Email:</b> ${escapeHtml(email || "")}</p>
//       <p><b>Phone:</b> ${escapeHtml(phoneNumber || "")}</p>
//       <p><b>Message:</b><br/>${escapeHtml(message || "").replace(/\n/g,"<br/>")}</p>
//     </div>
//   `;

//   const cmd = new SendEmailCommand({
//     Source: FROM,
//     Destination: { ToAddresses: [TO] },
//     ReplyToAddresses: email ? [email] : undefined,
//     Message: {
//       Subject: { Data: subject, Charset: "UTF-8" },
//       Body: { Text: { Data: text, Charset: "UTF-8" }, Html: { Data: html, Charset: "UTF-8" } }
//     }
//   });

//   const out = await ses.send(cmd);
//   console.log("SES OK", out?.MessageId);
//   return out;
// }

// module.exports = { sendContactEmail };





// backend/email.js (CommonJS)
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const REGION = process.env.AWS_REGION || "ap-south-1";
const ses = new SESClient({ region: REGION });

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

async function sendContactEmail({ fullName, email, phoneNumber, message }) {
  const FROM = process.env.EMAIL_FROM; // must be SES-verified
  const TO   = process.env.EMAIL_TO;   // verify if SES sandbox
  const APP  = process.env.APP_NAME || "Edzest";

  if (!FROM || !TO) throw new Error("Missing EMAIL_FROM/EMAIL_TO env vars");

  const subject = `[${APP}] New contact: ${fullName || "(no name)"}`;

  const text = [
    `Name: ${fullName || ""}`,
    `Email: ${email || ""}`,
    `Phone: ${phoneNumber || ""}`,
    ``,
    `Message:`,
    message || ""
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New contact form submission</h2>
      <p><b>Name:</b> ${escapeHtml(fullName || "")}</p>
      <p><b>Email:</b> ${escapeHtml(email || "")}</p>
      <p><b>Phone:</b> ${escapeHtml(phoneNumber || "")}</p>
      <p><b>Message:</b><br/>${escapeHtml(message || "").replace(/\n/g,"<br/>")}</p>
    </div>
  `;

  const cmd = new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: [TO] },
    // ⬇️ CHANGED: force Reply-To to the app mailbox (contact@edzest.org)
    ReplyToAddresses: [FROM],
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: text, Charset: "UTF-8" },
        Html: { Data: html, Charset: "UTF-8" }
      }
    }
  });

  const out = await ses.send(cmd);
  console.log("SES OK", out?.MessageId);
  return out;
}

module.exports = { sendContactEmail };
