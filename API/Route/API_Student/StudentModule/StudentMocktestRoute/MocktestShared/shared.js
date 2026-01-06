

// const {
//   DynamoDBClient
// } = require("@aws-sdk/client-dynamodb");

// const {
//   DynamoDBDocumentClient,
//   GetCommand
// } = require("@aws-sdk/lib-dynamodb");

// /* ---------------- S3 v3 ---------------- */
// const {
//   S3Client,
//   GetObjectCommand
// } = require("@aws-sdk/client-s3");

// /* ---------------- REGION ---------------- */
// const REGION = process.env.AWS_REGION || "ap-south-1";

// /* ---------------- Clients ---------------- */
// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// const s3 = new S3Client({ region: REGION });

// /* ---------------- Tables ---------------- */
// const MOCKS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

// /* ======================================================================
//    HELPERS
// ====================================================================== */

// function parseS3Uri(uri) {
//   if (!uri || typeof uri !== "string") return null;
//   const m = uri.match(/^s3:\/\/([^/]+)\/(.+)$/i);
//   if (!m) return null;
//   return { bucket: m[1], key: m[2] };
// }

// function inferS3FromImageOrEnv(rec, mockTestId) {
//   if (rec?.imageUrl) {
//     const parsed = parseS3Uri(rec.imageUrl);
//     if (parsed) {
//       const parts = parsed.key.split("/");
//       parts.pop();
//       const base = parts.join("/");
//       return { bucket: parsed.bucket, key: `${base}/parsed.json` };
//     }
//   }

//   const bucket = process.env.MOCKS_BUCKET || process.env.S3_BUCKET;
//   const prefix = process.env.MOCKS_PREFIX || "mocktests";
//   return { bucket, key: `${prefix}/${mockTestId}/parsed.json` };
// }

// /* ======================================================================
//    🔒 SAFETY: SECTION SANITIZER (NO LOGIC CHANGE)
// ====================================================================== */
// function sanitizeSections(sections, totalQuestions) {
//   if (!Array.isArray(sections)) return [];

//   let cursor = 0;

//   return sections.map((s, idx) => {
//     const count = Math.max(
//       0,
//       Math.min(Number(s.count || 0), totalQuestions - cursor)
//     );

//     const out = {
//       index: idx,
//       name: String(s.name || `Section ${idx + 1}`),
//       start: cursor,
//       count,
//     };

//     cursor += count;
//     return out;
//   });
// }

// /* ======================================================================
//    S3 READ — v3 (UNCHANGED LOGIC)
// ====================================================================== */

// async function loadMockFromS3(bucket, key) {
//   const obj = await s3.send(
//     new GetObjectCommand({ Bucket: bucket, Key: key })
//   );

//   const stream = await obj.Body.transformToString();
//   return JSON.parse(stream);
// }

// /* ======================================================================
//    Load record from DynamoDB (LOGIC SAME, SAFETY ADDED)
// ====================================================================== */

// async function loadMockMetaFromDdb(mockTestId) {
//   const result = await ddb.send(
//     new GetCommand({
//       TableName: MOCKS_TABLE,
//       Key: { mockTestId },
//     })
//   );

//   const rec = result.Item || null;
//   if (!rec) return null;

//   let sections = Array.isArray(rec.sections) ? rec.sections : null;

//   if (!sections) {
//     try {
//       const { bucket, key } = inferS3FromImageOrEnv(rec, mockTestId);
//       const parsed = await loadMockFromS3(bucket, key);

//       const rawSections =
//         (parsed?.summary?.sections && Array.isArray(parsed.summary.sections) && parsed.summary.sections) ||
//         (parsed?.meta?.sections && Array.isArray(parsed.meta.sections) && parsed.meta.sections) ||
//         null;

//       if (Array.isArray(rawSections)) {
//         sections = rawSections.map((s, i) => {
//           const start =
//             s.start != null
//               ? Number(s.start)
//               : Number(s.startSerial != null ? Number(s.startSerial) - 1 : 0);

//           let count = Number(s.count || 0);
//           if (!count && (s.endSerial != null || s.startSerial != null)) {
//             const startSerial = Number(s.startSerial || 1);
//             const endSerial = Number(s.endSerial || startSerial - 1);
//             count = Math.max(0, endSerial - startSerial + 1);
//           }

//           return {
//             index: i,
//             name: String(s.name || `Section ${i + 1}`),
//             start: Number.isFinite(start) ? start : 0,
//             count: Number.isFinite(count) ? count : 0,
//           };
//         });
//       }
//     } catch (_) {}
//   }

//   const totalQuestions =
//     Number(rec.totalQuestions) || 0;

//   return {
//     ...rec,
//     sections: sanitizeSections(sections || [], totalQuestions),
//   };
// }

// /* ======================================================================
//    PUBLIC API — used in all student routes
// ====================================================================== */

// async function loadMockMeta(mockTestId) {
//   const rec = await loadMockMetaFromDdb(mockTestId);

//   if (rec) {
//     let s3Bucket = rec.s3Bucket;
//     let s3Key = rec.s3Key;

//     if (!s3Bucket || !s3Key) {
//       const inferred = inferS3FromImageOrEnv(rec, mockTestId);
//       s3Bucket = inferred.bucket;
//       s3Key = inferred.key;
//     }

//     // 🔒 FINAL SAFETY SYNC WITH parsed.json
//     try {
//       const full = await loadMockFromS3(s3Bucket, s3Key);
//       const rows = full?.rows || full?.questions || [];

//       if (rows.length && rec.totalQuestions !== rows.length) {
//         rec.totalQuestions = rows.length;
//       }

//       if (rec.useSections) {
//         rec.sections = sanitizeSections(rec.sections || [], rows.length);
//       }
//     } catch (_) {}

//     return {
//       mockTestId,
//       title: rec.title || "",
//       status: rec.status || "DRAFT",
//       durationSec: Number(rec.duration || 0),
//       imageUrl: rec.imageUrl || "",
//       sections: Array.isArray(rec.sections) ? rec.sections : [],
//       totalQuestions: Number(rec.totalQuestions || 0),
//       useSections: !!rec.useSections,
//       breakMinutes: Number(rec.breakMinutes || 0),
//       sectionDurations: Array.isArray(rec.sectionDurations)
//         ? rec.sectionDurations
//         : [],
//       s3Bucket,
//       s3Key,
//     };
//   }

//   /* ---------------- fallback (UNCHANGED) ---------------- */
//   const bucket = process.env.S3_BUCKET || process.env.MOCKS_BUCKET;
//   const prefix = process.env.MOCKS_PREFIX || "mocktests";
//   const key = `${prefix}/${mockTestId}/parsed.json`;

//   const full = await loadMockFromS3(bucket, key);
//   const meta = full?.meta || {};
//   const rows = full?.rows || full?.questions || [];

//   const fallbackSections =
//     (Array.isArray(meta.sections) && meta.sections) ||
//     (Array.isArray(full?.summary?.sections) && full.summary.sections) ||
//     [];

//   return {
//     mockTestId,
//     title: meta.title || "",
//     status: meta.status || "DRAFT",
//     durationSec: Number(meta.durationSec || 0),
//     imageUrl: meta.imageUrl || "",
//     sections: sanitizeSections(fallbackSections, rows.length),
//     totalQuestions: rows.length,
//     useSections: !!meta.useSections,
//     breakMinutes: Number(meta.breakMinutes || 0),
//     sectionDurations: Array.isArray(meta.sectionDurations)
//       ? meta.sectionDurations
//       : [],
//     s3Bucket: bucket,
//     s3Key: key,
//   };
// }

// /* ======================================================================
//    LOAD ONE QUESTION — SAFE BOUND CHECK
// ====================================================================== */

// async function loadOneQuestion(meta, qIndex) {
//   const full = await loadMockFromS3(meta.s3Bucket, meta.s3Key);
//   const rows = full?.rows || full?.questions || [];

//   if (qIndex < 0 || qIndex >= rows.length) return null;
//   return rows[qIndex];
// }

// /* ======================================================================
//    SECTION BASE INDEX (UNCHANGED)
// ====================================================================== */

// function sectionBaseIndex(sections = [], secIndex) {
//   const s = sections[secIndex] || {};
//   if (Number.isInteger(s.startSerial)) return Math.max(0, s.startSerial - 1);
//   let base = 0;
//   for (let i = 0; i < secIndex; i++) base += Number(sections[i]?.count || 0);
//   return base;
// }

// module.exports = {
//   loadMockMeta,
//   loadOneQuestion,
//   sectionBaseIndex,
// };


const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

/* ---------------- S3 v3 ---------------- */
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

/* ---------------- REGION ---------------- */
const REGION = process.env.AWS_REGION || "ap-south-1";

/* ---------------- Clients ---------------- */
const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

const s3 = new S3Client({ region: REGION });

/* ---------------- Tables ---------------- */
const MOCKS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

/* ======================================================================
   HELPERS (UNCHANGED)
====================================================================== */

function parseS3Uri(uri) {
  if (!uri || typeof uri !== "string") return null;
  const m = uri.match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (!m) return null;
  return { bucket: m[1], key: m[2] };
}

function inferS3FromImageOrEnv(rec, mockTestId) {
  if (rec?.imageUrl) {
    const parsed = parseS3Uri(rec.imageUrl);
    if (parsed) {
      const parts = parsed.key.split("/");
      parts.pop();
      const base = parts.join("/");
      return { bucket: parsed.bucket, key: `${base}/parsed.json` };
    }
  }

  const bucket = process.env.MOCKS_BUCKET || process.env.S3_BUCKET;
  const prefix = process.env.MOCKS_PREFIX || "mocktests";
  return { bucket, key: `${prefix}/${mockTestId}/parsed.json` };
}

/* ======================================================================
   🔒 SAFETY: SECTION SANITIZER (UNCHANGED)
====================================================================== */
function sanitizeSections(sections, totalQuestions) {
  if (!Array.isArray(sections)) return [];

  let cursor = 0;

  return sections.map((s, idx) => {
    const count = Math.max(
      0,
      Math.min(Number(s.count || 0), totalQuestions - cursor)
    );

    const out = {
      index: idx,
      name: String(s.name || `Section ${idx + 1}`),
      start: cursor,
      count,
    };

    cursor += count;
    return out;
  });
}

/* ======================================================================
   S3 READ — v3 (UNCHANGED)
====================================================================== */

async function loadMockFromS3(bucket, key) {
  const obj = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  const stream = await obj.Body.transformToString();
  return JSON.parse(stream);
}

/* ======================================================================
   Load record from DynamoDB (UNCHANGED LOGIC)
====================================================================== */

async function loadMockMetaFromDdb(mockTestId) {
  const result = await ddb.send(
    new GetCommand({
      TableName: MOCKS_TABLE,
      Key: { mockTestId },
    })
  );

  const rec = result.Item || null;
  if (!rec) return null;

  let sections = Array.isArray(rec.sections) ? rec.sections : null;

  if (!sections) {
    try {
      const { bucket, key } = inferS3FromImageOrEnv(rec, mockTestId);
      const parsed = await loadMockFromS3(bucket, key);

      const rawSections =
        (parsed?.summary?.sections && Array.isArray(parsed.summary.sections) && parsed.summary.sections) ||
        (parsed?.meta?.sections && Array.isArray(parsed.meta.sections) && parsed.meta.sections) ||
        null;

      if (Array.isArray(rawSections)) {
        sections = rawSections.map((s, i) => {
          const start =
            s.start != null
              ? Number(s.start)
              : Number(s.startSerial != null ? Number(s.startSerial) - 1 : 0);

          let count = Number(s.count || 0);
          if (!count && (s.endSerial != null || s.startSerial != null)) {
            const startSerial = Number(s.startSerial || 1);
            const endSerial = Number(s.endSerial || startSerial - 1);
            count = Math.max(0, endSerial - startSerial + 1);
          }

          return {
            index: i,
            name: String(s.name || `Section ${i + 1}`),
            start: Number.isFinite(start) ? start : 0,
            count: Number.isFinite(count) ? count : 0,
          };
        });
      }
    } catch (_) {}
  }

  const totalQuestions = Number(rec.totalQuestions) || 0;

  return {
    ...rec,
    sections: sanitizeSections(sections || [], totalQuestions),
  };
}

/* ======================================================================
   PUBLIC API — used in all student routes (UNCHANGED)
====================================================================== */

async function loadMockMeta(mockTestId) {
  const rec = await loadMockMetaFromDdb(mockTestId);

  if (rec) {
    let s3Bucket = rec.s3Bucket;
    let s3Key = rec.s3Key;

    if (!s3Bucket || !s3Key) {
      const inferred = inferS3FromImageOrEnv(rec, mockTestId);
      s3Bucket = inferred.bucket;
      s3Key = inferred.key;
    }

    try {
      const full = await loadMockFromS3(s3Bucket, s3Key);
      const rows = full?.rows || full?.questions || [];

      if (rows.length && rec.totalQuestions !== rows.length) {
        rec.totalQuestions = rows.length;
      }

      if (rec.useSections) {
        rec.sections = sanitizeSections(rec.sections || [], rows.length);
      }
    } catch (_) {}

    return {
      mockTestId,
      title: rec.title || "",
      status: rec.status || "DRAFT",
      durationSec: Number(rec.duration || 0),
      imageUrl: rec.imageUrl || "",
      sections: Array.isArray(rec.sections) ? rec.sections : [],
      totalQuestions: Number(rec.totalQuestions || 0),
      useSections: !!rec.useSections,
      breakMinutes: Number(rec.breakMinutes || 0),
      sectionDurations: Array.isArray(rec.sectionDurations)
        ? rec.sectionDurations
        : [],
      s3Bucket,
      s3Key,
    };
  }

  /* ---------------- fallback (UNCHANGED) ---------------- */
  const bucket = process.env.S3_BUCKET || process.env.MOCKS_BUCKET;
  const prefix = process.env.MOCKS_PREFIX || "mocktests";
  const key = `${prefix}/${mockTestId}/parsed.json`;

  const full = await loadMockFromS3(bucket, key);
  const meta = full?.meta || {};
  const rows = full?.rows || full?.questions || [];

  const fallbackSections =
    (Array.isArray(meta.sections) && meta.sections) ||
    (Array.isArray(full?.summary?.sections) && full.summary.sections) ||
    [];

  return {
    mockTestId,
    title: meta.title || "",
    status: meta.status || "DRAFT",
    durationSec: Number(meta.durationSec || 0),
    imageUrl: meta.imageUrl || "",
    sections: sanitizeSections(fallbackSections, rows.length),
    totalQuestions: rows.length,
    useSections: !!meta.useSections,
    breakMinutes: Number(meta.breakMinutes || 0),
    sectionDurations: Array.isArray(meta.sectionDurations)
      ? meta.sectionDurations
      : [],
    s3Bucket: bucket,
    s3Key: key,
  };
}

/* ======================================================================
   LOAD ONE QUESTION — ✅ SAFE CORRECT FALLBACK ADDED
====================================================================== */

function letterOrIndexToOneBased(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  if (/^[a-f]$/i.test(s)) return s.toUpperCase().charCodeAt(0) - 64;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return null;
}

function splitMulti(val) {
  if (val == null) return [];
  return String(val)
    .split(/[,\s;]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function loadOneQuestion(meta, qIndex) {
  const full = await loadMockFromS3(meta.s3Bucket, meta.s3Key);
  const rows = full?.rows || full?.questions || [];

  if (qIndex < 0 || qIndex >= rows.length) return null;

  const row = rows[qIndex];

  /* ✅ SAFETY FIX: derive correct if null (NO existing logic changed) */
  if (row && row.correct == null && row?.meta?.raw) {
    const raw = row.meta.raw;
    const qType = String(row.questionType || "");

    const correctRaw =
      raw.CorrectOption ??
      raw["Correct Option"] ??
      raw.CorrectOptions ??
      raw["Correct Options"] ??
      raw.CorrectAnswer ??
      raw["Correct Answer"] ??
      raw.Answer ??
      null;

    if (/multi/i.test(qType)) {
      const parts = splitMulti(correctRaw)
        .map(letterOrIndexToOneBased)
        .filter(Number.isInteger)
        .map((n) => n - 1)
        .filter((n) => n >= 0);

      row.correct = parts.length
        ? Array.from(new Set(parts)).sort((a, b) => a - b)
        : null;
    } else {
      const oneBased = letterOrIndexToOneBased(correctRaw);
      row.correct = Number.isInteger(oneBased)
        ? Math.max(0, oneBased - 1)
        : null;
    }
  }

  return row;
}

/* ======================================================================
   SECTION BASE INDEX (UNCHANGED)
====================================================================== */

function sectionBaseIndex(sections = [], secIndex) {
  const s = sections[secIndex] || {};
  if (Number.isInteger(s.startSerial)) return Math.max(0, s.startSerial - 1);
  let base = 0;
  for (let i = 0; i < secIndex; i++) base += Number(sections[i]?.count || 0);
  return base;
}

module.exports = {
  loadMockMeta,
  loadOneQuestion,
  sectionBaseIndex,
};
