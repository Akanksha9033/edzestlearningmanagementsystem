const nodemailer = require("nodemailer");

async function sendCertificateEmail(email, downloadUrl) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: "🎓 Your Course Completion Certificate",
    html: `
      <p>Congratulations!</p>
      <p>Your certificate is ready.</p>
      <a href="${downloadUrl}">Download Certificate</a>
    `,
  });
}

module.exports = { sendCertificateEmail };
