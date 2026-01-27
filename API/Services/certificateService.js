const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateCertificate({
  studentName,
  courseTitle,
  issuedAt,
  trainerName = "Amit Kumar Chandan",
}) {
  const fileName = `certificate-${Date.now()}.pdf`;
  const filePath = path.join("/tmp", fileName);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));

  // Border
  doc.rect(20, 20, 555, 802).stroke();

  // Title
  doc
    .fontSize(28)
    .font("Times-Bold")
    .text("CERTIFICATE OF COMPLETION", { align: "center" });

  doc.moveDown(2);

  doc
    .fontSize(14)
    .font("Times-Roman")
    .text("This certificate is hereby granted to", { align: "center" });

  doc.moveDown(1);

  // Student Name
  doc
    .fontSize(26)
    .font("Helvetica-Bold")
    .text(studentName.toUpperCase(), { align: "center" });

  doc.moveDown(1.5);

  doc
    .fontSize(14)
    .font("Times-Roman")
    .text(
      `for completing the training sessions on ${courseTitle} via online mode. This confirms the eligibility of 3 PDUs towards Way of Working.`,
      { align: "center", width: 460 }
    );

  doc.moveDown(4);

  doc
    .fontSize(12)
    .text(`Trainer: ${trainerName}, PMI-ATP Instructor`, {
      align: "center",
    });

  doc.end();

  return { filePath, fileName };
}

module.exports = { generateCertificate };
