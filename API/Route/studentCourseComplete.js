router.post("/student/course/complete", authAccess, async (req, res) => {
  const { courseId, courseTitle } = req.body;
  const userSub = req.user.sub;
  const studentName = req.user.name;

  // 1. Generate PDF
  const { filePath } = await generateCertificate({
    studentName,
    courseTitle,
    issuedAt: new Date().toISOString(),
  });

  // 2. Upload to S3
  const s3Key = await uploadCertificate({
    filePath,
    userSub,
    courseId,
  });

  // 3. Save DB
  await saveCertificate({
    pk: `USER#${userSub}`,
    sk: `CERT#${courseId}`,
    courseId,
    courseTitle,
    issuedAt: new Date().toISOString(),
    s3Key,
  });

  // 4. Send email (next step)
  await sendCertificateEmail(req.user.email, s3Key);

  res.json({ success: true });
});
