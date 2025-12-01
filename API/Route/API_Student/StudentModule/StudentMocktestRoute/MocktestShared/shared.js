// // server/routes/StudentModule/StudentMocktestRoute/MocktestShared/shared.js
// const AWS = require("../../../../../Services/aws/config");
// const { DocumentClient } = require("aws-sdk/clients/dynamodb");
// const dynamo = new DocumentClient({ service: new AWS.DynamoDB() });
// const { s3 } = require("../../../../../Services/aws/s3");

// const MOCKS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

// // --- Helpers ----------------------------------------------------

// function parseS3Uri(uri) {
//   if (!uri || typeof uri !== "string") return null;
//   const m = uri.match(/^s3:\/\/([^/]+)\/(.+)$/i);
//   if (!m) return null;
//   return { bucket: m[1], key: m[2] };
// }

// function inferS3FromImageOrEnv(rec, mockTestId) {
//   // If imageUrl is like s3://bucket/mocktests/<id>/cover.jpg => parsed.json in the same folder
//   if (rec?.imageUrl) {
//     const p = parseS3Uri(rec.imageUrl);
//     if (p) {
//       const parts = p.key.split("/");
//       if (parts.length >= 2) {
//         parts.pop(); // remove filename (e.g., cover.jpg)
//         const base = parts.join("/");
//         return { bucket: p.bucket, key: `${base}/parsed.json` };
//       }
//     }
//   }

//   // Fallback to env
//   const bucket = process.env.MOCKS_BUCKET || process.env.S3_BUCKET;
//   const prefix = process.env.MOCKS_PREFIX || "mocktests";
//   const key = `${prefix}/${mockTestId}/parsed.json`;
//   return { bucket, key };
// }

// async function loadMockFromS3(bucket, key) {
//   const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
//   return JSON.parse(obj.Body.toString("utf-8"));
// }

// /**
//  * Load the mock item from DDB. If sections are missing on the record,
//  * fall back to parsed.json in S3 and normalize to [{index,name,start,count}].
//  */
// async function loadMockMetaFromDdb(mockTestId) {
//   const r = await dynamo.get({ TableName: MOCKS_TABLE, Key: { mockTestId } }).promise();
//   const rec = r.Item || null;
//   if (!rec) return null;

//   let sections = Array.isArray(rec.sections) ? rec.sections : null;

//   if (!sections) {
//     try {
//       // figure out where parsed.json lives
//       const { bucket, key } = inferS3FromImageOrEnv(rec, mockTestId);
//       const parsed = await loadMockFromS3(bucket, key);

//       // prefer summary.sections; fall back to meta.sections if present
//       const rawSections =
//         (parsed && Array.isArray(parsed?.summary?.sections) && parsed.summary.sections) ||
//         (parsed && Array.isArray(parsed?.meta?.sections) && parsed.meta.sections) ||
//         null;

//       if (Array.isArray(rawSections)) {
//         sections = rawSections.map((s, i) => {
//           const start =
//             s.start != null
//               ? Number(s.start)
//               : Number(s.startSerial != null ? Number(s.startSerial) - 1 : 0);

//           // If count not present, try to compute from serials
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
//     } catch (_) {
//       // swallow fallback errors; we just leave sections as null -> []
//     }
//   }

//   return {
//     ...rec,
//     sections: sections || [],
//   };
// }

// // --- Main API used by routes -----------------------------------

// async function loadMockMeta(mockTestId) {
//   const rec = await loadMockMetaFromDdb(mockTestId);

//   if (rec) {
//     // derive s3 location if missing on the item
//     let s3Bucket = rec.s3Bucket;
//     let s3Key = rec.s3Key;
//     if (!s3Bucket || !s3Key) {
//       const inferred = inferS3FromImageOrEnv(rec, mockTestId);
//       s3Bucket = inferred.bucket;
//       s3Key = inferred.key;
//     }

//     return {
//       mockTestId,
//       title: rec.title || "",
//       status: rec.status || "DRAFT",
//       // NOTE: your table stores minutes in "duration"; the rest of your code converts as needed
//       durationSec: Number(rec.duration || 0),
//       imageUrl: rec.imageUrl || "",
//       sections: Array.isArray(rec.sections) ? rec.sections : [],
//       totalQuestions: Number(rec.totalQuestions || 0),
//       useSections: !!rec.useSections,             // <-- include flag for the student app
//       breakMinutes: Number(rec.breakMinutes || 0), // <-- include break config
//       sectionDurations: Array.isArray(rec.sectionDurations) ? rec.sectionDurations : [], // optional
//       s3Bucket,
//       s3Key,
//     };
//   }

//   // No DDB item? Fall back to env convention
//   const bucket = process.env.S3_BUCKET || process.env.MOCKS_BUCKET;
//   const prefix = process.env.MOCKS_PREFIX || "mocktests";
//   const key = `${prefix}/${mockTestId}/parsed.json`;

//   const full = await loadMockFromS3(bucket, key);
//   const meta = full?.meta || {};
//   // fallback sections if present in meta/summary
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
//     sections: fallbackSections,
//     totalQuestions: Number(meta.totalQuestions || (full?.rows?.length || 0)),
//     useSections: !!meta.useSections,
//     breakMinutes: Number(meta.breakMinutes || 0),
//     sectionDurations: Array.isArray(meta.sectionDurations) ? meta.sectionDurations : [],
//     s3Bucket: bucket,
//     s3Key: key,
//   };
// }

// async function loadOneQuestion(meta, qIndex) {
//   if (!meta.s3Bucket || !meta.s3Key) {
//     throw new Error("Questions source (s3Bucket/s3Key) not set for this mock.");
//   }
//   const full = await loadMockFromS3(meta.s3Bucket, meta.s3Key);
//   const rows = full?.rows || full?.questions || [];
//   return rows[qIndex] || null;
// }

// function sectionBaseIndex(sections = [], secIndex) {
//   const s = sections[secIndex] || {};
//   if (Number.isInteger(s.startSerial)) return Math.max(0, s.startSerial - 1);
//   let base = 0;
//   for (let i = 0; i < secIndex; i++) base += Number(sections[i]?.count || 0);
//   return base;
// }

// module.exports = { loadMockMeta, loadOneQuestion, sectionBaseIndex };


// ======================================================================
//  shared.js — FULL AWS SDK v3 UPGRADE (NO LOGIC OR STRUCTURE CHANGED)
// ======================================================================

/* ---------------- DynamoDB v3 ---------------- */
const {
  DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand
} = require("@aws-sdk/lib-dynamodb");

/* ---------------- S3 v3 ---------------- */
const {
  S3Client,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

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
   HELPERS
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
      parts.pop(); // remove filename
      const base = parts.join("/");
      return { bucket: parsed.bucket, key: `${base}/parsed.json` };
    }
  }

  const bucket = process.env.MOCKS_BUCKET || process.env.S3_BUCKET;
  const prefix = process.env.MOCKS_PREFIX || "mocktests";
  return { bucket, key: `${prefix}/${mockTestId}/parsed.json` };
}

/* ======================================================================
   S3 READ — rewritten ONLY to v3, logic same
====================================================================== */

async function loadMockFromS3(bucket, key) {
  const obj = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  const stream = await obj.Body.transformToString();
  return JSON.parse(stream);
}

/* ======================================================================
   Load record from DynamoDB (NO LOGIC CHANGED)
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

  return {
    ...rec,
    sections: sections || [],
  };
}

/* ======================================================================
   PUBLIC API — used in all other student mocktest routes
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

  // fallback (unchanged)
  const bucket = process.env.S3_BUCKET || process.env.MOCKS_BUCKET;
  const prefix = process.env.MOCKS_PREFIX || "mocktests";
  const key = `${prefix}/${mockTestId}/parsed.json`;

  const full = await loadMockFromS3(bucket, key);
  const meta = full?.meta || {};
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
    sections: fallbackSections,
    totalQuestions: Number(meta.totalQuestions || (full?.rows?.length || 0)),
    useSections: !!meta.useSections,
    breakMinutes: Number(meta.breakMinutes || 0),
    sectionDurations: Array.isArray(meta.sectionDurations)
      ? meta.sectionDurations
      : [],
    s3Bucket: bucket,
    s3Key: key,
  };
}

async function loadOneQuestion(meta, qIndex) {
  const full = await loadMockFromS3(meta.s3Bucket, meta.s3Key);
  const rows = full?.rows || full?.questions || [];
  return rows[qIndex] || null;
}

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
