const fs = require("fs");
const PDFDocument = require("pdfkit");

function generateTestCertificate() {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const fileName = "test-certificate.pdf";
  const stream = fs.createWriteStream(fileName);
  doc.pipe(stream);

  // ===== Certificate Content =====
  doc.fontSize(22).text("CERTIFICATE OF COMPLETION", {
    align: "center",
  });

  doc.moveDown(1.5);

  doc.fontSize(14).text("This is to certify that", {
    align: "center",
  });

  doc.moveDown(0.5);

  doc.fontSize(20).text("Amit Kumar", {
    align: "center",
    underline: true,
  });

  doc.moveDown(1);

  doc.fontSize(14).text("has successfully completed the course", {
    align: "center",
  });

  doc.moveDown(0.5);

  doc.fontSize(18).text("React Mastery", {
    align: "center",
  });

  doc.moveDown(2);

  doc.fontSize(12).text("Issued on: 23 Jan 2026", {
    align: "center",
  });

  doc.moveDown(1);

  doc.fontSize(12).text("Edzest LMS", {
    align: "center",
  });

  doc.end();

  stream.on("finish", () => {
    console.log("✅ Certificate PDF generated:", fileName);
  });
}

generateTestCertificate();
