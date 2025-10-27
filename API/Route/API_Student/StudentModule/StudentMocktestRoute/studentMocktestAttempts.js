// // EdzestiLMS/API/Route/API_Student/StudentModule/StudentMocktestRoute/student.attempts.routes.js
// const express = require("express");
// const router = express.Router();

// const AWS = require("../../../../Services/aws/config");
// const { authAccess, requireRoles } = require("../../../../middleware/auth");
// const { loadMockMeta, loadOneQuestion, sectionBaseIndex } = require("./MocktestShared/shared");
// const {
//   computeSeedSeconds,
//   findExistingInProgressAttempt,
//   shouldAllowOneTimeIncrease,
// } = require("./studentMocktestAttemptHelper");

// const { DocumentClient } = require("aws-sdk/clients/dynamodb");
// const dynamo = new DocumentClient({ service: new AWS.DynamoDB() });

// const ATTEMPTS_TABLE = process.env.DDB_STU_ATTEMPTS || "StudentMocktestAttempts";
// const DATA_TABLE     = process.env.DDB_STU_DATA     || "StudentMocktestData";

// router.use(authAccess);
// router.use(requireRoles());

// /* ------------------------------- helpers ------------------------------- */

// function normalizeSectionsFromMeta(meta) {
//   // Your parsed meta already carries sections; keep it robust
//   const s = Array.isArray(meta?.sections) ? meta.sections : [];
//   return s.map((it, i) => ({
//     index: i,
//     name: String(it?.name || `Section ${i + 1}`),
//     start: sectionBaseIndex(s, i),
//     count: Number(it?.count || 0),
//   }));
// }

// function getActiveWindow(sections, currentSection) {
//   const sec = Number.isInteger(currentSection) ? currentSection : 0;
//   const start = Number(sections?.[sec]?.start ?? 0);
//   const count = Number(sections?.[sec]?.count ?? 0);
//   if (count <= 0) return { minIdx: 0, maxIdx: -1 }; // empty
//   return { minIdx: start, maxIdx: start + count - 1 };
// }


// /** Build sectionInfo (per-section time budgets) using admin's sectionDurations (minutes) if present, else even split */
// function buildSectionTimers(meta, totalDurationSec, sections) {
//   if (!sections?.length) return [];

//   // minutes array from admin (optional)
//   let mins = Array.isArray(meta?.sectionDurations) ? meta.sectionDurations.map(n => Math.max(0, Number(n || 0))) : null;

//   let secs;
//   if (mins && mins.length === sections.length) {
//     secs = mins.map(m => Math.floor(m * 60));
//   } else {
//     // even split
//     const n = sections.length;
//     const each = Math.floor(totalDurationSec / n);
//     secs = new Array(n).fill(each);
//     // remainder goes to last
//     secs[n - 1] += (totalDurationSec - each * n);
//   }

//   return sections.map((sec, i) => ({
//     index: i,
//     timeLeftSec: secs[i],
//     submittedAt: null,
//   }));
// }

// /** safe get now (sec) */
// function nowSec() { return Math.floor(Date.now() / 1000); }

// /* ============================== LIST (keep) ============================= */

// router.get("/attempts/list", async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const instituteId = req.user?.instituteId;
//     const { mockTestId } = req.query || {};
//     if (!userId || !instituteId) {
//       return res.status(400).json({ error: "Missing user/institute" });
//     }

//     const instUser = `${instituteId}#${userId}`;
//     const instMock = mockTestId ? `${instituteId}#${mockTestId}` : null;

//     let indexItems = [];
//     try {
//       if (instMock) {
//         const q = await dynamo.query({
//           TableName: ATTEMPTS_TABLE,
//           IndexName: "byInstituteMock",
//           KeyConditionExpression: "instMock = :im",
//           ExpressionAttributeValues: { ":im": instMock },
//           ScanIndexForward: false,
//           Limit: 50,
//         }).promise();
//         indexItems = q.Items || [];
//       } else {
//         const q = await dynamo.query({
//           TableName: ATTEMPTS_TABLE,
//           IndexName: "byInstituteUser",
//           KeyConditionExpression: "instUser = :iu",
//           ExpressionAttributeValues: { ":iu": instUser },
//           ScanIndexForward: false,
//           Limit: 50,
//         }).promise();
//         indexItems = q.Items || [];
//       }
//     } catch (err) {
//       console.error("Index query failed:", err);
//       indexItems = [];
//     }

//     if (!indexItems.length) {
//       const s = await dynamo.scan({
//         TableName: ATTEMPTS_TABLE,
//         FilterExpression: instMock ? "instMock = :im" : "instUser = :iu",
//         ExpressionAttributeValues: instMock ? { ":im": instMock } : { ":iu": instUser },
//         Limit: 100,
//       }).promise();
//       indexItems = s.Items || [];
//     }

//     const keys = indexItems
//       .map(it => ({ attemptId: it.attemptId, entity: "attempt" }))
//       .filter(k => !!k.attemptId);

//     const now = nowSec();
//     const out = [];

//     for (const k of keys) {
//       const g = await dynamo.get({
//         TableName: ATTEMPTS_TABLE,
//         Key: k,
//         ConsistentRead: true,
//       }).promise();
//       const A = g.Item;
//       if (!A) continue;
//       if (mockTestId && A.mockTestId !== mockTestId) continue;

//       let timeLeft = Number(A.timeLeftSec || 0);
//       if (A.status === "IN_PROGRESS" && !A.paused && A.lastHeartbeatEpoch) {
//         const elapsed = Math.max(0, now - Number(A.lastHeartbeatEpoch));
//         timeLeft = Math.max(0, timeLeft - elapsed);
//       }

//       out.push({
//         attemptId: A.attemptId,
//         mockTestId: A.mockTestId,
//         title: A.title,
//         status: A.status,
//         createdAtEpoch: A.createdAtEpoch,
//         submittedAtEpoch: A.submittedAtEpoch,
//         durationSec: Number(A.durationSec || 0),
//         timeLeftSec: timeLeft,
//         currentIndex: Number(A.currentIndex || 0),
//       });
//     }

//     out.sort((a, b) => Number(b.createdAtEpoch || 0) - Number(a.createdAtEpoch || 0));
//     res.json({ items: out });
//   } catch (e) {
//     console.error("list attempts:", e);
//     res.status(500).json({ error: "Failed to list attempts" });
//   }
// });

// /* ===================== START or RESUME (augmented) ====================== */

// router.post("/attempts", async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const instituteId = req.user?.instituteId;
//     const { mockTestId, forceNew, cancelPrevious } = req.body || {};
//     if (!userId || !instituteId || !mockTestId) {
//       return res.status(400).json({ error: "Missing user/institute/mockTestId" });
//     }

//     const instUser = `${instituteId}#${userId}`;

//     // ── resume unless forceNew ──────────────────────────────────────────────
//     const maybeExisting = await findExistingInProgressAttempt({
//       dynamo, table: ATTEMPTS_TABLE, gsiName: "byInstituteUser",
//       instUser, mockTestId, scanLimit: 25,
//     });

//     if (!forceNew && maybeExisting) {
//       return res.json(maybeExisting);
//     }
//     if (forceNew && maybeExisting && cancelPrevious) {
//       await dynamo.update({
//         TableName: ATTEMPTS_TABLE,
//         Key: { attemptId: maybeExisting.attemptId, entity: "attempt" },
//         UpdateExpression: "SET #st = :st",
//         ExpressionAttributeNames: { "#st": "status" },
//         ExpressionAttributeValues: { ":st": "CANCELLED" },
//       }).promise();
//     }

//     // ── load meta & validate ────────────────────────────────────────────────
//     const meta = await loadMockMeta(mockTestId); // ensure this signature matches your shared helper
//     if (!meta || meta.status !== "PUBLISHED") {
//       return res.status(400).json({ error: "Mock test unavailable" });
//     }

//     // ── helpers ─────────────────────────────────────────────────────────────
//     const nowSec = () => Math.floor(Date.now() / 1000);
//     const asBool = (v) => {
//       if (typeof v === "boolean") return v;
//       if (v == null) return false;
//       const s = String(v).trim().toLowerCase();
//       return s === "true" || s === "1" || s === "yes" || s === "on";
//     };

//     function buildSectionTimers(meta, totalDurationSec, sections) {
//       if (!sections?.length) return [];
//       // minutes array from admin (optional)
//       let mins = Array.isArray(meta?.sectionDurations)
//         ? meta.sectionDurations.map((n) => Math.max(0, Number(n || 0)))
//         : null;

//       let secs;
//       if (mins && mins.length === sections.length) {
//         secs = mins.map((m) => Math.floor(m * 60));
//       } else {
//         // even split
//         const n = sections.length;
//         const each = Math.floor(totalDurationSec / n);
//         secs = new Array(n).fill(each);
//         secs[n - 1] += totalDurationSec - each * n; // add remainder to last
//       }

//       return sections.map((_, i) => ({ index: i, timeLeftSec: secs[i], submittedAt: null }));
//     }

//     // ── sections & timers ───────────────────────────────────────────────────
//     const rawSections = Array.isArray(meta.sections) ? meta.sections : [];
//     let boundaries = rawSections.map((s, i) => ({
//       index: i,
//       name: s?.name || `Section ${i + 1}`,
//       start: sectionBaseIndex(rawSections, i),
//       count: Number(s?.count || 0),
//     }));
//     // sort by start to ensure a consistent flow
// boundaries = boundaries.sort((a, b) => a.start - b.start);

//     const totalCounts = boundaries.reduce((sum, b) => sum + Number(b.count || 0), 0);
//     const useSections = asBool(meta?.useSections) && boundaries.length > 0 && totalCounts > 0;
//     const breakMinutes = Number(meta?.breakMinutes || 0);

//     const seedSecs = computeSeedSeconds(meta); // supports minutes/seconds fields in meta
//     const sectionInfo = useSections ? buildSectionTimers(meta, seedSecs, boundaries) : [];

//     // cursor should start at the first section's start if sections are enabled
//     const firstIndex = useSections ? Number(boundaries[0]?.start || 0) : 0;

//     // ── create attempt ──────────────────────────────────────────────────────
//     const attemptId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
//     const now = nowSec();

//     const item = {
//       attemptId,
//       entity: "attempt",
//       instituteId,
//       userId,
//       mockTestId,
//       instUser,
//       instMock: `${instituteId}#${mockTestId}`,

//       status: "IN_PROGRESS",
//       createdAtEpoch: now,
//       startedAtEpoch: now,

//       // time
//       durationMin: Number(meta.duration || 0),
//       durationSec: seedSecs,
//       timeLeftSec: seedSecs,
//       paused: false,
//       lastHeartbeatEpoch: now,
//       qStartedAtEpoch: now,
//       perQuestionSec: {},

//       // UI/meta
//       title: meta.title,
//       imageUrl: meta.imageUrl,
//       totalQuestions: Number(meta.totalQuestions || totalCounts || 0),

//       // sections feature
//       useSections,
//       breakMinutes,
//       sections: boundaries,       // [{index,name,start,count}]
//       sectionInfo,                // [{index,timeLeftSec,submittedAt}]
//       currentSection: useSections ? 0 : null,

//       // cursor (absolute qIndex)
//       currentIndex: firstIndex,
//     };

//     await dynamo.put({ TableName: ATTEMPTS_TABLE, Item: item }).promise();
//     res.json(item);
//   } catch (e) {
//     console.error("start attempt:", e);
//     res.status(500).json({ error: "Failed to start attempt" });
//   }
// });



// /* ============================= SNAPSHOT (keep) ============================= */

// router.get("/attempts/:attemptId", async (req, res) => {
//   try {
//     const { attemptId } = req.params;
//     const r = await dynamo.get({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//     }).promise();
//     const A = r.Item;
//     if (!A) return res.status(404).json({ error: "Not found" });
//     if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

//     const now = nowSec();
//     let timeLeft = Number(A.timeLeftSec || 0);
//     if (A.status === "IN_PROGRESS" && !A.paused && A.lastHeartbeatEpoch) {
//       const elapsed = Math.max(0, now - Number(A.lastHeartbeatEpoch || now));
//       timeLeft = Math.max(0, timeLeft - elapsed);
//     }

//     const perQuestionSec = { ...(A.perQuestionSec || {}) };
//     if (A.status === "IN_PROGRESS" && !A.paused && A.qStartedAtEpoch != null && Number.isInteger(A.currentIndex)) {
//       const qElapsed = Math.max(0, now - Number(A.qStartedAtEpoch));
//       perQuestionSec[A.currentIndex] = Number(perQuestionSec[A.currentIndex] || 0) + qElapsed;
//     }

//     res.json({ ...A, timeLeftSec: timeLeft, perQuestionSec });
//   } catch (e) {
//     console.error("get attempt:", e);
//     res.status(500).json({ error: "Failed to get attempt" });
//   }
// });

// /* ============================ GET QUESTION (keep) ============================ */

// router.get("/attempts/:attemptId/questions/:qIndex", async (req, res) => {
//   try {
//     const { attemptId, qIndex } = req.params;
//     const index = Number(qIndex);

//     const a = await dynamo.get({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//     }).promise();
//     const attempt = a.Item;


//     if (!attempt) return res.status(404).json({ error: "Attempt not found" });
//     if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

//     // Precise clamp: only after attempt exists & belongs to user
//    if (attempt.useSections && Array.isArray(attempt.sections) && attempt.sections.length > 0) {
//      const { minIdx, maxIdx } = getActiveWindow(attempt.sections, attempt.currentSection);
//      if (index < minIdx || index > maxIdx) {
//        return res.status(403).json({ error: "Out of current section range" });
//      }
//    }

//     const meta = await loadMockMeta(attempt.mockTestId);
//     if (index < 0 || index >= (meta.totalQuestions || 0)) {
//       return res.status(404).json({ error: "Question not found" });
//     }
//     const question = await loadOneQuestion(meta, index);

//     const d = await dynamo.get({
//       TableName: DATA_TABLE,
//       Key: { attemptId, qIndex: index },
//     }).promise();

//     res.json({
//       question,
//       saved: d.Item?.saved || { answer: null, flagged: false, strikes: [], highlights: [], timeSpentSec: 0 },
//     });
//   } catch (e) {
//     console.error("get question:", e);
//     res.status(500).json({ error: "Failed to get question" });
//   }
// });

// /* =============================== SAVE ANSWER (keep) =============================== */

// router.patch("/attempts/:attemptId/answers/:qIndex", async (req, res) => {
//   try {
//     const { attemptId, qIndex } = req.params;
//     const index = Number(qIndex);
//     const body = req.body || {};
//     const now = nowSec();

//     const a = await dynamo.get({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//     }).promise();
//     const attempt = a.Item;
//     if (!attempt) return res.status(404).json({ error: "Attempt not found" });
//     if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

//     // Precise clamp on save, too
//  if (attempt.useSections && Array.isArray(attempt.sections) && attempt.sections.length > 0) {
//    const { minIdx, maxIdx } = getActiveWindow(attempt.sections, attempt.currentSection);
//    if (index < minIdx || index > maxIdx) {
//      return res.status(403).json({ error: "Out of current section range" });
//    }
//  }

//     await dynamo.put({
//       TableName: DATA_TABLE,
//       Item: {
//         attemptId,
//         qIndex: index,
//         saved: {
//           answer: body.answer ?? null,
//           flagged: !!body.flagged,
//           strikes: Array.isArray(body.strikes) ? body.strikes : [],
//           highlights: Array.isArray(body.highlights) ? body.highlights : [],
//           timeSpentSec: Number(body.timeSpentSec || 0),
//           updatedAtEpoch: now,
//         },
//         // Optional: keep tags here if you pass them from the client
//         // tags: Array.isArray(body.tags) ? body.tags : [],
//       },
//     }).promise();

//     await dynamo.update({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//       UpdateExpression: "SET currentIndex = :ci, lastHeartbeatEpoch = :hb",
//       ExpressionAttributeValues: {
//         ":ci": Number.isInteger(body.currentIndex) ? body.currentIndex : index,
//         ":hb": now,
//       },
//     }).promise();

//     res.json({ ok: true });
//   } catch (e) {
//     console.error("patch answer:", e);
//     res.status(500).json({ error: "Failed to save answer" });
//   }
// });

// /* ========================= HEARTBEAT / PAUSE (keep) ========================= */

// router.patch("/attempts/:attemptId", async (req, res) => {
//   try {
//     const { attemptId } = req.params;
//     const body = req.body || {};
//     const now = nowSec();

//     const a = await dynamo.get({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//     }).promise();
//     const A = a.Item;
//     if (!A) return res.status(404).json({ error: "Attempt not found" });
//     if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

//     if (A.status === "SUBMITTED") return res.json(A);

//     let timeLeft = Number(A.timeLeftSec || 0);
//     if (!A.paused && A.lastHeartbeatEpoch) {
//       const elapsed = Math.max(0, now - Number(A.lastHeartbeatEpoch));
//       timeLeft = Math.max(0, timeLeft - elapsed);
//     }

//     const perQuestionSec = { ...(A.perQuestionSec || {}) };
//     if (!A.paused && A.qStartedAtEpoch != null && Number.isInteger(A.currentIndex)) {
//       const seg = Math.max(0, now - Number(A.qStartedAtEpoch));
//       if (seg > 0) {
//         perQuestionSec[A.currentIndex] = Number(perQuestionSec[A.currentIndex] || 0) + seg;
//       }
//     }

//     const clientSec = Number(body?.timeLeftSec);
//     const allowIncreaseOnce = shouldAllowOneTimeIncrease(A, clientSec, timeLeft);
//     if (Number.isFinite(clientSec)) {
//       if (clientSec <= timeLeft || allowIncreaseOnce) timeLeft = Math.max(0, clientSec);
//     }

//     const nextPaused = typeof body?.paused === "boolean" ? body.paused : A.paused;
//     let nextIndex  = Number.isInteger(body?.currentIndex) ? body.currentIndex : A.currentIndex;

//     // Precise clamp
//    if (A.useSections && Array.isArray(A.sections) && A.sections.length > 0) {
//      const { minIdx, maxIdx } = getActiveWindow(A.sections, A.currentSection);
//      if (nextIndex < minIdx) nextIndex = minIdx;
//      if (nextIndex > maxIdx) nextIndex = maxIdx;
//    }

//     if (timeLeft <= 0) timeLeft = 0;
//     const nextQStartedAtEpoch = !nextPaused ? now : A.qStartedAtEpoch;

//     const names = {
//       "#tl": "timeLeftSec", "#ps": "paused", "#hb": "lastHeartbeatEpoch",
//       "#ci": "currentIndex", "#qs": "qStartedAtEpoch", "#pq": "perQuestionSec",
//     };
//     const values = {
//       ":tl": timeLeft, ":ps": nextPaused || timeLeft === 0, ":hb": now,
//       ":ci": nextIndex, ":qs": nextQStartedAtEpoch, ":pq": perQuestionSec,
//     };
//     const setParts = ["#tl = :tl", "#ps = :ps", "#hb = :hb", "#ci = :ci", "#qs = :qs", "#pq = :pq"];

//     if (allowIncreaseOnce) {
//       names["#ds"] = "durationSec";
//       values[":ds"] = Number(A.durationMin) * 60;
//       setParts.push("#ds = :ds");
//     }
//     if (body.status && ["IN_PROGRESS", "SUBMITTED", "CANCELLED"].includes(body.status)) {
//       names["#st"] = "status";
//       values[":st"] = body.status;
//       setParts.push("#st = :st");
//     }

//     const r = await dynamo.update({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//       UpdateExpression: `SET ${setParts.join(", ")}`,
//       ExpressionAttributeNames: names,
//       ExpressionAttributeValues: values,
//       ReturnValues: "ALL_NEW",
//     }).promise();

//     res.json(r.Attributes);
//   } catch (e) {
//     console.error("patch attempt:", e);
//     res.status(500).json({ error: "Failed to update attempt" });
//   }
// });

// /* ============================= FINAL SUBMIT (keep) ============================= */

// router.post("/attempts/:attemptId/submit", async (req, res) => {
//   try {
//     const { attemptId } = req.params;
//     const a = await dynamo.get({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//     }).promise();
//     const attempt = a.Item;
//     if (!attempt) return res.status(404).json({ error: "Attempt not found" });
//     if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

//     // Guard: if sections are enabled, block final submit until all sections are submitted
//    if (attempt.useSections) {
//      const infos = Array.isArray(attempt.sectionInfo) ? attempt.sectionInfo : [];
//      const anyPending = infos.some(si => !si || !si.submittedAt);
//      if (anyPending) {
//        return res.status(400).json({ error: "Sections pending. Submit sections first." });
//      }
//    }

//     const now = nowSec();
//     const r = await dynamo.update({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//       UpdateExpression: "SET #st = :st, submittedAtEpoch = :ts",
//       ExpressionAttributeNames: { "#st": "status" },
//       ExpressionAttributeValues: { ":st": "SUBMITTED", ":ts": now },
//       ReturnValues: "ALL_NEW",
//     }).promise();

//     res.json({ ok: true, attempt: r.Attributes });
//   } catch (e) {
//     console.error("submit attempt:", e);
//     res.status(500).json({ error: "Failed to submit attempt" });
//   }
// });

// /* ===================== NEW: SUBMIT CURRENT SECTION ====================== */
// /** Locks a section and advances currentSection (for section-wise mode) */
// router.patch("/attempts/:attemptId/submit-section", async (req, res) => {
//   try {
//     const { attemptId } = req.params;
//     const { sectionIndex } = req.body || {};
//     if (!Number.isInteger(sectionIndex)) return res.status(400).json({ error: "sectionIndex required" });

//     const r = await dynamo.get({ TableName: ATTEMPTS_TABLE, Key: { attemptId, entity: "attempt" } }).promise();
//     const att = r.Item;
//     if (!att) return res.status(404).json({ error: "Attempt not found" });
//     if (att.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });
//     if (!att.useSections) return res.status(400).json({ error: "Sections not enabled" });
//     if (att.status !== "IN_PROGRESS") return res.status(400).json({ error: "Attempt not in progress" });

//     console.log("[submit-section] attemptId=%s sec=%d totalSecs=%d", attemptId, sectionIndex, (att.sections||[]).length);

//     // mark submitted
//     const sectionInfo = Array.isArray(att.sectionInfo) ? att.sectionInfo.slice() : [];
//     if (!sectionInfo[sectionIndex]) return res.status(400).json({ error: "Invalid section index" });
//     sectionInfo[sectionIndex].submittedAt = nowSec();

//     // compute next
//     const total = Array.isArray(att.sections) ? att.sections.length : 0;
//     const next = sectionIndex + 1 < total ? sectionIndex + 1 : null;

//     // If there is a next section, move cursor to its first question
//  let nextIndex = att.currentIndex;
//  if (next !== null) {
//    const { minIdx } = getActiveWindow(att.sections, next);
//    nextIndex = Number.isFinite(minIdx) ? minIdx : nextIndex;
//  }

//  await dynamo.update({
//    TableName: ATTEMPTS_TABLE,
//    Key: { attemptId, entity: "attempt" },
//    UpdateExpression: "SET sectionInfo = :si, currentSection = :cs, currentIndex = :ci, qStartedAtEpoch = :qs",
//    ExpressionAttributeValues: {
//      ":si": sectionInfo,
//      ":cs": next,
//      ":ci": nextIndex,
//      ":qs": nowSec(),
//    },
//  }).promise();

//     res.json({ ok: true, nextSection: next });
//   } catch (e) {
//     console.error("submit-section:", e);
//     res.status(500).json({ error: "Failed to submit section" });
//   }
// });

// /* ===================== NEW: FINAL SUBMIT + SUMMARY ====================== */
// /** Finalize attempt and store a light section/tag aggregate (answered vs skipped) */
// router.patch("/attempts/:attemptId/submit-final", async (req, res) => {
//   try {
//     const { attemptId } = req.params;

//     const g = await dynamo.get({ TableName: ATTEMPTS_TABLE, Key: { attemptId, entity: "attempt" } }).promise();
//     const att = g.Item;
//     if (!att) return res.status(404).json({ error: "Attempt not found" });
//     if (att.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

//     // Load saved answers
//     const q = await dynamo.query({
//       TableName: DATA_TABLE,
//       KeyConditionExpression: "attemptId = :a",
//       ExpressionAttributeValues: { ":a": attemptId },
//     }).promise();
//     const answers = q.Items || [];

//     const sections = Array.isArray(att.sections) ? att.sections : [];
//     const useSections = !!att.useSections;

//     function findSectionIndex(absIndex) {
//       if (!useSections || sections.length === 0) return -1;
//       let base = 0;
//       for (let i = 0; i < sections.length; i++) {
//         const count = Number(sections[i]?.count || 0);
//         if (absIndex >= base && absIndex < base + count) return i;
//         base += count;
//       }
//       return -1;
//     }

//     // 🔹 helper: normalize correctness check
//     const isAnswered = (ans) =>
//       ans !== null && (Array.isArray(ans) ? ans.length > 0 : String(ans ?? "").trim() !== "");

//     function isCorrectAnswer(savedAnswer, correct) {
//       // correct can be a number (single) or array (multi)
//       if (Array.isArray(correct)) {
//         const a = Array.isArray(savedAnswer) ? [...new Set(savedAnswer)].map(Number).sort() : [];
//         const b = [...new Set(correct)].map(Number).sort();
//         if (a.length !== b.length) return false;
//         for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
//         return true;
//       }
//       return Number(savedAnswer) === Number(correct);
//     }

//     // 🔹 you MUST implement this for your question source (parsed.json / DB / S3)
//     async function loadCorrectForIndex(mockTestId, absIndex) {
//   // Uses your existing shared helpers (S3/Dynamo aware)
//   const meta = await loadMockMeta(mockTestId);
//   const q = await loadOneQuestion(meta, absIndex);
//   return q?.correct; // can be number (single) or array (multi)
// }


//     const sectionAgg = {};
//     const tagAgg = {};
//     // ✅ Always maintain an overall bucket
//     sectionAgg["all"] = { total: 0, correct: 0, incorrect: 0, skipped: 0 };

//     for (const row of answers) {
//       const abs = Number(row.qIndex || 0);
//       const secIdx = findSectionIndex(abs);
//       const secKey = secIdx >= 0 ? String(secIdx) : "all";
//       if (!sectionAgg[secKey]) sectionAgg[secKey] = { total: 0, correct: 0, incorrect: 0, skipped: 0 };

//       const saved = row.saved || {};
//       const ans = saved.answer;

//       // increment totals
//       sectionAgg[secKey].total += 1;
//       sectionAgg["all"].total += 1;

//       if (!isAnswered(ans)) {
//         sectionAgg[secKey].skipped += 1;
//         sectionAgg["all"].skipped += 1;
//         // still aggregate tags as skipped
//         const tags = Array.isArray(row.tags) ? row.tags : [];
//         for (const t of tags) {
//           const tt = String(t || "").trim().toLowerCase();
//           if (!tt) continue;
//           tagAgg[tt] = tagAgg[tt] || { total: 0, correct: 0, incorrect: 0, skipped: 0 };
//           tagAgg[tt].total += 1;
//           tagAgg[tt].skipped += 1;
//         }
//         continue;
//       }

//       // 🔸 correctness
//       let correctVal;
//       try {
//         correctVal = await loadCorrectForIndex(att.mockTestId, abs);
//       } catch (_) {}
//       if (correctVal !== undefined) {
//         const ok = isCorrectAnswer(ans, correctVal);
//         if (ok) {
//           sectionAgg[secKey].correct += 1;
//           sectionAgg["all"].correct += 1;
//         } else {
//           sectionAgg[secKey].incorrect += 1;
//           sectionAgg["all"].incorrect += 1;
//         }

//         // tag-wise correctness
//         const tags = Array.isArray(row.tags) ? row.tags : [];
//         for (const t of tags) {
//           const tt = String(t || "").trim().toLowerCase();
//           if (!tt) continue;
//           tagAgg[tt] = tagAgg[tt] || { total: 0, correct: 0, incorrect: 0, skipped: 0 };
//           tagAgg[tt].total += 1;
//           if (ok) tagAgg[tt].correct += 1;
//           else tagAgg[tt].incorrect += 1;
//         }
//       } else {
//         // If you couldn't load 'correct', you can either skip correctness
//         // or count everything as incorrect—skipping is safer:
//         // (no change to correct/incorrect here)
//         const tags = Array.isArray(row.tags) ? row.tags : [];
//         for (const t of tags) {
//           const tt = String(t || "").trim().toLowerCase();
//           if (!tt) continue;
//           tagAgg[tt] = tagAgg[tt] || { total: 0, correct: 0, incorrect: 0, skipped: 0 };
//           tagAgg[tt].total += 1;
//         }
//       }
//     }

//     // Persist
//     const r = await dynamo.update({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//       UpdateExpression: "SET #s = :s, submittedAtEpoch = :ts, result = :r",
//       ExpressionAttributeNames: { "#s": "status" },
//       ExpressionAttributeValues: {
//         ":s": "SUBMITTED",
//         ":ts": nowSec(),
//         ":r": { sectionAgg, tagAgg },
//       },
//       ReturnValues: "ALL_NEW",
//     }).promise();

//     res.json({ ok: true, attempt: r.Attributes, result: { sectionAgg, tagAgg } });
//   } catch (e) {
//     console.error("submit-final:", e);
//     res.status(500).json({ error: "Failed to finalize attempt" });
//   }
// });


// /* =========================== NEW: SUMMARY SNAPSHOT =========================== */
// /** Read back attempt with result/sections for report screens */
// router.get("/attempts/:attemptId/summary", async (req, res) => {
//   try {
//     const { attemptId } = req.params;
//     const r = await dynamo.get({ TableName: ATTEMPTS_TABLE, Key: { attemptId, entity: "attempt" } }).promise();
//     const A = r.Item;
//     if (!A) return res.status(404).json({ error: "Attempt not found" });
//     if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });
//     res.json({ ok: true, attempt: A });
//   } catch (e) {
//     console.error("summary:", e);
//     res.status(500).json({ error: "Failed to load summary" });
//   }
// });

// /* ============================== CLEAR (keep) ============================== */

// router.delete("/attempts/clear", async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const instituteId = req.user?.instituteId;
//     const { mockTestId } = req.query || {};
//     if (!userId || !instituteId) {
//       return res.status(400).json({ error: "Missing user/institute" });
//     }

//     const instUser = `${instituteId}#${userId}`;
//     const instMock = mockTestId ? `${instituteId}#${mockTestId}` : null;

//     // 1) Find attempts to delete (prefer GSIs)
//     let attempts = [];
//     try {
//       if (instMock) {
//         const q = await dynamo.query({
//           TableName: ATTEMPTS_TABLE,
//           IndexName: "byInstituteMock",
//           KeyConditionExpression: "instMock = :im",
//           ExpressionAttributeValues: { ":im": instMock },
//           ScanIndexForward: false,
//           Limit: 200,
//         }).promise();
//         attempts = q.Items || [];
//       } else {
//         const q = await dynamo.query({
//           TableName: ATTEMPTS_TABLE,
//           IndexName: "byInstituteUser",
//           KeyConditionExpression: "instUser = :iu",
//           ExpressionAttributeValues: { ":iu": instUser },
//           ScanIndexForward: false,
//           Limit: 200,
//         }).promise();
//         attempts = q.Items || [];
//       }
//     } catch (err) {
//       console.error("clear attempts: GSI query failed:", err);
//       attempts = [];
//     }

//     if (!attempts.length) return res.json({ deleted: 0 });

//     // small helper
//     const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));

//     let deletedCount = 0;

//     // 2) For each attempt, delete attempt row + all DATA rows (answers)
//     for (const A of attempts) {
//       const attemptId = A.attemptId;
//       if (!attemptId) continue;

//       // 2a) Load all DATA rows for this attempt
//       const dataRows = await dynamo.query({
//         TableName: DATA_TABLE,
//         KeyConditionExpression: "attemptId = :a",
//         ExpressionAttributeValues: { ":a": attemptId },
//       }).promise();

//       // 2b) Batch delete DATA rows (25 per batch)
//       const dataBatches = chunk(dataRows.Items || [], 25);
//       for (const batch of dataBatches) {
//         if (!batch.length) continue;
//         await dynamo.batchWrite({
//           RequestItems: {
//             [DATA_TABLE]: batch.map(it => ({
//               DeleteRequest: { Key: { attemptId: it.attemptId, qIndex: it.qIndex } }
//             })),
//           },
//         }).promise();
//       }

//       // 2c) Delete the ATTEMPT row
//       await dynamo.delete({
//         TableName: ATTEMPTS_TABLE,
//         Key: { attemptId, entity: "attempt" },
//       }).promise();

//       deletedCount += 1;
//     }

//     res.json({ deleted: deletedCount });
//   } catch (e) {
//     console.error("clear attempts:", e);
//     res.status(500).json({ error: "Failed to clear attempts" });
//   }
// });

// module.exports = router;





// EdzestiLMS/API/Route/API_Student/StudentModule/StudentMocktestRoute/student.attempts.routes.js
const express = require("express");
const router = express.Router();

const AWS = require("../../../../Services/aws/config");
const { authAccess, requireRoles } = require("../../../../middleware/auth");
const { loadMockMeta, loadOneQuestion, sectionBaseIndex } = require("./MocktestShared/shared");
const {
  computeSeedSeconds,
  findExistingInProgressAttempt,
  shouldAllowOneTimeIncrease,
} = require("./studentMocktestAttemptHelper");

const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const dynamo = new DocumentClient({ service: new AWS.DynamoDB() });

const ATTEMPTS_TABLE = process.env.DDB_STU_ATTEMPTS || "StudentMocktestAttempts";
const DATA_TABLE = process.env.DDB_STU_DATA || "StudentMocktestData";

router.use(authAccess);
router.use(requireRoles());

/* ------------------------------- helpers ------------------------------- */

function normalizeSectionsFromMeta(meta) {
  // Your parsed meta already carries sections; keep it robust
  const s = Array.isArray(meta?.sections) ? meta.sections : [];
  return s.map((it, i) => ({
    index: i,
    name: String(it?.name || `Section ${i + 1}`),
    start: sectionBaseIndex(s, i),
    count: Number(it?.count || 0),
  }));
}

function getActiveWindow(sections, currentSection) {
  const sec = Number.isInteger(currentSection) ? currentSection : 0;
  const start = Number(sections?.[sec]?.start ?? 0);
  const count = Number(sections?.[sec]?.count ?? 0);
  if (count <= 0) return { minIdx: 0, maxIdx: -1 }; // empty
  return { minIdx: start, maxIdx: start + count - 1 };
}


/** Build sectionInfo (per-section time budgets) using admin's sectionDurations (minutes) if present, else even split */
function buildSectionTimers(meta, totalDurationSec, sections) {
  if (!sections?.length) return [];

  // minutes array from admin (optional)
  let mins = Array.isArray(meta?.sectionDurations) ? meta.sectionDurations.map(n => Math.max(0, Number(n || 0))) : null;

  let secs;
  if (mins && mins.length === sections.length) {
    secs = mins.map(m => Math.floor(m * 60));
  } else {
    // even split
    const n = sections.length;
    const each = Math.floor(totalDurationSec / n);
    secs = new Array(n).fill(each);
    // remainder goes to last
    secs[n - 1] += (totalDurationSec - each * n);
  }

  return sections.map((sec, i) => ({
    index: i,
    timeLeftSec: secs[i],
    submittedAt: null,
  }));
}

/** safe get now (sec) */
function nowSec() { return Math.floor(Date.now() / 1000); }

/* ============================== LIST (keep) ============================= */

router.get("/attempts/list", async (req, res) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.user?.instituteId;
    const { mockTestId } = req.query || {};
    if (!userId || !instituteId) {
      return res.status(400).json({ error: "Missing user/institute" });
    }

    const instUser = `${instituteId}#${userId}`;
    const instMock = mockTestId ? `${instituteId}#${mockTestId}` : null;

    let indexItems = [];
    try {
      if (instMock) {
        const q = await dynamo.query({
          TableName: ATTEMPTS_TABLE,
          IndexName: "byInstituteMock",
          KeyConditionExpression: "instMock = :im",
          ExpressionAttributeValues: { ":im": instMock },
          ScanIndexForward: false,
          Limit: 50,
        }).promise();
        indexItems = q.Items || [];
      } else {
        const q = await dynamo.query({
          TableName: ATTEMPTS_TABLE,
          IndexName: "byInstituteUser",
          KeyConditionExpression: "instUser = :iu",
          ExpressionAttributeValues: { ":iu": instUser },
          ScanIndexForward: false,
          Limit: 50,
        }).promise();
        indexItems = q.Items || [];
      }
    } catch (err) {
      console.error("Index query failed:", err);
      indexItems = [];
    }

    if (!indexItems.length) {
      const s = await dynamo.scan({
        TableName: ATTEMPTS_TABLE,
        FilterExpression: instMock ? "instMock = :im" : "instUser = :iu",
        ExpressionAttributeValues: instMock ? { ":im": instMock } : { ":iu": instUser },
        Limit: 100,
      }).promise();
      indexItems = s.Items || [];
    }

    const keys = indexItems
      .map(it => ({ attemptId: it.attemptId, entity: "attempt" }))
      .filter(k => !!k.attemptId);

    const now = nowSec();
    const out = [];

    for (const k of keys) {
      const g = await dynamo.get({
        TableName: ATTEMPTS_TABLE,
        Key: k,
        ConsistentRead: true,
      }).promise();
      const A = g.Item;
      if (!A) continue;
      if (mockTestId && A.mockTestId !== mockTestId) continue;

      let timeLeft = Number(A.timeLeftSec || 0);
      if (A.status === "IN_PROGRESS" && !A.paused && A.lastHeartbeatEpoch) {
        const elapsed = Math.max(0, now - Number(A.lastHeartbeatEpoch));
        timeLeft = Math.max(0, timeLeft - elapsed);
      }

      out.push({
        attemptId: A.attemptId,
        mockTestId: A.mockTestId,
        title: A.title,
        status: A.status,
        createdAtEpoch: A.createdAtEpoch,
        submittedAtEpoch: A.submittedAtEpoch,
        durationSec: Number(A.durationSec || 0),
        timeLeftSec: timeLeft,
        currentIndex: Number(A.currentIndex || 0),
      });
    }

    out.sort((a, b) => Number(b.createdAtEpoch || 0) - Number(a.createdAtEpoch || 0));
    res.json({ items: out });
  } catch (e) {
    console.error("list attempts:", e);
    res.status(500).json({ error: "Failed to list attempts" });
  }
});

/* ===================== START or RESUME (augmented) ====================== */

router.post("/attempts", async (req, res) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.user?.instituteId;
    const { mockTestId, forceNew, cancelPrevious } = req.body || {};
    if (!userId || !instituteId || !mockTestId) {
      return res.status(400).json({ error: "Missing user/institute/mockTestId" });
    }

    const instUser = `${instituteId}#${userId}`;

    // ── resume unless forceNew ──────────────────────────────────────────────
    const maybeExisting = await findExistingInProgressAttempt({
      dynamo, table: ATTEMPTS_TABLE, gsiName: "byInstituteUser",
      instUser, mockTestId, scanLimit: 25,
    });

    if (!forceNew && maybeExisting) {
      return res.json(maybeExisting);
    }
    if (forceNew && maybeExisting && cancelPrevious) {
      await dynamo.update({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId: maybeExisting.attemptId, entity: "attempt" },
        UpdateExpression: "SET #st = :st",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":st": "CANCELLED" },
      }).promise();
    }

    // ── load meta & validate ────────────────────────────────────────────────
    const meta = await loadMockMeta(mockTestId); // ensure this signature matches your shared helper
    if (!meta || meta.status !== "PUBLISHED") {
      return res.status(400).json({ error: "Mock test unavailable" });
    }

    // ── helpers ─────────────────────────────────────────────────────────────
    const nowSec = () => Math.floor(Date.now() / 1000);
    const asBool = (v) => {
      if (typeof v === "boolean") return v;
      if (v == null) return false;
      const s = String(v).trim().toLowerCase();
      return s === "true" || s === "1" || s === "yes" || s === "on";
    };

    function buildSectionTimers(meta, totalDurationSec, sections) {
      if (!sections?.length) return [];
      // minutes array from admin (optional)
      let mins = Array.isArray(meta?.sectionDurations)
        ? meta.sectionDurations.map((n) => Math.max(0, Number(n || 0)))
        : null;

      let secs;
      if (mins && mins.length === sections.length) {
        secs = mins.map((m) => Math.floor(m * 60));
      } else {
        // even split
        const n = sections.length;
        const each = Math.floor(totalDurationSec / n);
        secs = new Array(n).fill(each);
        secs[n - 1] += totalDurationSec - each * n; // add remainder to last
      }

      return sections.map((_, i) => ({ index: i, timeLeftSec: secs[i], submittedAt: null }));
    }

    // ── sections & timers ───────────────────────────────────────────────────
    const rawSections = Array.isArray(meta.sections) ? meta.sections : [];
    let boundaries = rawSections.map((s, i) => ({
      index: i,
      name: s?.name || `Section ${i + 1}`,
      start: sectionBaseIndex(rawSections, i),
      count: Number(s?.count || 0),
    }));
    // sort by start to ensure a consistent flow
    boundaries = boundaries.sort((a, b) => a.start - b.start);

    const totalCounts = boundaries.reduce((sum, b) => sum + Number(b.count || 0), 0);
    const useSections = asBool(meta?.useSections) && boundaries.length > 0 && totalCounts > 0;
    const breakMinutes = Number(meta?.breakMinutes || 0);

    const seedSecs = computeSeedSeconds(meta); // supports minutes/seconds fields in meta
    const sectionInfo = useSections ? buildSectionTimers(meta, seedSecs, boundaries) : [];

    // cursor should start at the first section's start if sections are enabled
    const firstIndex = useSections ? Number(boundaries[0]?.start || 0) : 0;

    // ── create attempt ──────────────────────────────────────────────────────
    const attemptId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = nowSec();

    const item = {
      attemptId,
      entity: "attempt",
      instituteId,
      userId,
      mockTestId,
      instUser,
      instMock: `${instituteId}#${mockTestId}`,

      status: "IN_PROGRESS",
      createdAtEpoch: now,
      startedAtEpoch: now,

      // time
      durationMin: Number(meta.duration || 0),
      durationSec: seedSecs,
      timeLeftSec: seedSecs,
      paused: false,
      lastHeartbeatEpoch: now,
      qStartedAtEpoch: now,
      perQuestionSec: {},

      // UI/meta
      title: meta.title,
      imageUrl: meta.imageUrl,
      totalQuestions: Number(meta.totalQuestions || totalCounts || 0),

      // sections feature
      useSections,
      breakMinutes,
      sections: boundaries,       // [{index,name,start,count}]
      sectionInfo,                // [{index,timeLeftSec,submittedAt}]
      currentSection: useSections ? 0 : null,

      // cursor (absolute qIndex)
      currentIndex: firstIndex,
    };

    await dynamo.put({ TableName: ATTEMPTS_TABLE, Item: item }).promise();
    res.json(item);
  } catch (e) {
    console.error("start attempt:", e);
    res.status(500).json({ error: "Failed to start attempt" });
  }
});



/* ============================= SNAPSHOT (keep) ============================= */

router.get("/attempts/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const r = await dynamo.get({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
    }).promise();
    const A = r.Item;
    if (!A) return res.status(404).json({ error: "Not found" });
    if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    const now = nowSec();
    let timeLeft = Number(A.timeLeftSec || 0);
    if (A.status === "IN_PROGRESS" && !A.paused && A.lastHeartbeatEpoch) {
      const elapsed = Math.max(0, now - Number(A.lastHeartbeatEpoch || now));
      timeLeft = Math.max(0, timeLeft - elapsed);
    }

    const perQuestionSec = { ...(A.perQuestionSec || {}) };
    if (A.status === "IN_PROGRESS" && !A.paused && A.qStartedAtEpoch != null && Number.isInteger(A.currentIndex)) {
      const qElapsed = Math.max(0, now - Number(A.qStartedAtEpoch));
      perQuestionSec[A.currentIndex] = Number(perQuestionSec[A.currentIndex] || 0) + qElapsed;
    }

    res.json({ ...A, timeLeftSec: timeLeft, perQuestionSec });
  } catch (e) {
    console.error("get attempt:", e);
    res.status(500).json({ error: "Failed to get attempt" });
  }
});

/* ============================ GET QUESTION (keep) ============================ */

router.get("/attempts/:attemptId/questions/:qIndex", async (req, res) => {
  try {
    const { attemptId, qIndex } = req.params;
    const index = Number(qIndex);

    const a = await dynamo.get({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
    }).promise();
    const attempt = a.Item;


    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    // Precise clamp: only after attempt exists & belongs to user
    if (attempt.useSections && Array.isArray(attempt.sections) && attempt.sections.length > 0) {
      const { minIdx, maxIdx } = getActiveWindow(attempt.sections, attempt.currentSection);
      if (index < minIdx || index > maxIdx) {
        return res.status(403).json({ error: "Out of current section range" });
      }
    }

    const meta = await loadMockMeta(attempt.mockTestId);
    if (index < 0 || index >= (meta.totalQuestions || 0)) {
      return res.status(404).json({ error: "Question not found" });
    }
    const question = await loadOneQuestion(meta, index);

    const d = await dynamo.get({
      TableName: DATA_TABLE,
      Key: { attemptId, qIndex: index },
    }).promise();

    res.json({
      question,
      saved: d.Item?.saved || { answer: null, flagged: false, strikes: [], highlights: [], timeSpentSec: 0 },
    });
  } catch (e) {
    console.error("get question:", e);
    res.status(500).json({ error: "Failed to get question" });
  }
});

/* =============================== SAVE ANSWER (keep) =============================== */

router.patch("/attempts/:attemptId/answers/:qIndex", async (req, res) => {
  try {
    const { attemptId, qIndex } = req.params;
    const index = Number(qIndex);
    const body = req.body || {};
    const now = nowSec();

    const a = await dynamo.get({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
    }).promise();
    const attempt = a.Item;
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    // Precise clamp on save, too
    if (attempt.useSections && Array.isArray(attempt.sections) && attempt.sections.length > 0) {
      const { minIdx, maxIdx } = getActiveWindow(attempt.sections, attempt.currentSection);
      if (index < minIdx || index > maxIdx) {
        return res.status(403).json({ error: "Out of current section range" });
      }
    }

    await dynamo.put({
      TableName: DATA_TABLE,
      Item: {
        attemptId,
        qIndex: index,
        saved: {
          answer: body.answer ?? null,
          flagged: !!body.flagged,
          strikes: Array.isArray(body.strikes) ? body.strikes : [],
          highlights: Array.isArray(body.highlights) ? body.highlights : [],
          timeSpentSec: Number(body.timeSpentSec || 0),
          updatedAtEpoch: now,
        },
        // Optional: keep tags here if you pass them from the client
        // tags: Array.isArray(body.tags) ? body.tags : [],
      },
    }).promise();

    await dynamo.update({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
      UpdateExpression: "SET currentIndex = :ci, lastHeartbeatEpoch = :hb",
      ExpressionAttributeValues: {
        ":ci": Number.isInteger(body.currentIndex) ? body.currentIndex : index,
        ":hb": now,
      },
    }).promise();

    res.json({ ok: true });
  } catch (e) {
    console.error("patch answer:", e);
    res.status(500).json({ error: "Failed to save answer" });
  }
});

/* ========================= HEARTBEAT / PAUSE (keep) ========================= */

router.patch("/attempts/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const body = req.body || {};
    const now = nowSec();

    const a = await dynamo.get({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
    }).promise();
    const A = a.Item;
    if (!A) return res.status(404).json({ error: "Attempt not found" });
    if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    if (A.status === "SUBMITTED") return res.json(A);

    let timeLeft = Number(A.timeLeftSec || 0);
    if (!A.paused && A.lastHeartbeatEpoch) {
      const elapsed = Math.max(0, now - Number(A.lastHeartbeatEpoch));
      timeLeft = Math.max(0, timeLeft - elapsed);
    }

    const perQuestionSec = { ...(A.perQuestionSec || {}) };
    if (!A.paused && A.qStartedAtEpoch != null && Number.isInteger(A.currentIndex)) {
      const seg = Math.max(0, now - Number(A.qStartedAtEpoch));
      if (seg > 0) {
        perQuestionSec[A.currentIndex] = Number(perQuestionSec[A.currentIndex] || 0) + seg;
      }
    }

    const clientSec = Number(body?.timeLeftSec);
    const allowIncreaseOnce = shouldAllowOneTimeIncrease(A, clientSec, timeLeft);
    if (Number.isFinite(clientSec)) {
      if (clientSec <= timeLeft || allowIncreaseOnce) timeLeft = Math.max(0, clientSec);
    }

    const nextPaused = typeof body?.paused === "boolean" ? body.paused : A.paused;
    let nextIndex = Number.isInteger(body?.currentIndex) ? body.currentIndex : A.currentIndex;

    // Precise clamp
    if (A.useSections && Array.isArray(A.sections) && A.sections.length > 0) {
      const { minIdx, maxIdx } = getActiveWindow(A.sections, A.currentSection);
      if (nextIndex < minIdx) nextIndex = minIdx;
      if (nextIndex > maxIdx) nextIndex = maxIdx;
    }

    if (timeLeft <= 0) timeLeft = 0;
    const nextQStartedAtEpoch = !nextPaused ? now : A.qStartedAtEpoch;

    const names = {
      "#tl": "timeLeftSec", "#ps": "paused", "#hb": "lastHeartbeatEpoch",
      "#ci": "currentIndex", "#qs": "qStartedAtEpoch", "#pq": "perQuestionSec",
    };
    const values = {
      ":tl": timeLeft, ":ps": nextPaused || timeLeft === 0, ":hb": now,
      ":ci": nextIndex, ":qs": nextQStartedAtEpoch, ":pq": perQuestionSec,
    };
    const setParts = ["#tl = :tl", "#ps = :ps", "#hb = :hb", "#ci = :ci", "#qs = :qs", "#pq = :pq"];

    if (allowIncreaseOnce) {
      names["#ds"] = "durationSec";
      values[":ds"] = Number(A.durationMin) * 60;
      setParts.push("#ds = :ds");
    }
    if (body.status && ["IN_PROGRESS", "SUBMITTED", "CANCELLED"].includes(body.status)) {
      names["#st"] = "status";
      values[":st"] = body.status;
      setParts.push("#st = :st");
    }

    const r = await dynamo.update({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
      UpdateExpression: `SET ${setParts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }).promise();

    res.json(r.Attributes);
  } catch (e) {
    console.error("patch attempt:", e);
    res.status(500).json({ error: "Failed to update attempt" });
  }
});

/* ============================= FINAL SUBMIT (keep) ============================= */

router.post("/attempts/:attemptId/submit", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const a = await dynamo.get({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
    }).promise();
    const attempt = a.Item;
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    // Guard: if sections are enabled, block final submit until all sections are submitted
    if (attempt.useSections) {
      const infos = Array.isArray(attempt.sectionInfo) ? attempt.sectionInfo : [];
      const anyPending = infos.some(si => !si || !si.submittedAt);
      if (anyPending) {
        return res.status(400).json({ error: "Sections pending. Submit sections first." });
      }
    }

    const now = nowSec();
    const r = await dynamo.update({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
      UpdateExpression: "SET #st = :st, submittedAtEpoch = :ts",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":st": "SUBMITTED", ":ts": now },
      ReturnValues: "ALL_NEW",
    }).promise();

    res.json({ ok: true, attempt: r.Attributes });
  } catch (e) {
    console.error("submit attempt:", e);
    res.status(500).json({ error: "Failed to submit attempt" });
  }
});

/* ===================== NEW: SUBMIT CURRENT SECTION ====================== */
/** Locks a section and advances currentSection (for section-wise mode) */
router.patch("/attempts/:attemptId/submit-section", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { sectionIndex } = req.body || {};
    if (!Number.isInteger(sectionIndex)) return res.status(400).json({ error: "sectionIndex required" });

    const r = await dynamo.get({ TableName: ATTEMPTS_TABLE, Key: { attemptId, entity: "attempt" } }).promise();
    const att = r.Item;
    if (!att) return res.status(404).json({ error: "Attempt not found" });
    if (att.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });
    if (!att.useSections) return res.status(400).json({ error: "Sections not enabled" });
    if (att.status !== "IN_PROGRESS") return res.status(400).json({ error: "Attempt not in progress" });

    console.log("[submit-section] attemptId=%s sec=%d totalSecs=%d", attemptId, sectionIndex, (att.sections || []).length);

    // mark submitted
    const sectionInfo = Array.isArray(att.sectionInfo) ? att.sectionInfo.slice() : [];
    if (!sectionInfo[sectionIndex]) return res.status(400).json({ error: "Invalid section index" });
    sectionInfo[sectionIndex].submittedAt = nowSec();

    // compute next
    const total = Array.isArray(att.sections) ? att.sections.length : 0;
    const next = sectionIndex + 1 < total ? sectionIndex + 1 : null;

    // If there is a next section, move cursor to its first question
    let nextIndex = att.currentIndex;
    if (next !== null) {
      const { minIdx } = getActiveWindow(att.sections, next);
      nextIndex = Number.isFinite(minIdx) ? minIdx : nextIndex;
    }

    await dynamo.update({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
      UpdateExpression: "SET sectionInfo = :si, currentSection = :cs, currentIndex = :ci, qStartedAtEpoch = :qs",
      ExpressionAttributeValues: {
        ":si": sectionInfo,
        ":cs": next,
        ":ci": nextIndex,
        ":qs": nowSec(),
      },
    }).promise();

    // -------------------- NEW: compute & persist this section's aggregate --------------------
    try {
      const sections = Array.isArray(att.sections) ? att.sections : [];
      const secObj = sections[sectionIndex];

      if (secObj && Number(secObj.count) > 0) {
        const meta = await loadMockMeta(att.mockTestId);

        if (meta) {
          const start = Number(secObj.start || 0);
          const end = start + Number(secObj.count || 0) - 1;

          // load all answers once and index by qIndex
          const q = await dynamo.query({
            TableName: DATA_TABLE,
            KeyConditionExpression: "attemptId = :a",
            ExpressionAttributeValues: { ":a": attemptId },
          }).promise();
          const byIndex = new Map((q.Items || []).map(row => [Number(row.qIndex || 0), row]));

          const isAnswered = (ans) =>
            ans !== null && (Array.isArray(ans) ? ans.length > 0 : String(ans ?? "").trim() !== "");

          function sameAnswer(user, correct) {
            if (Array.isArray(correct)) {
              const ua = Array.isArray(user) ? [...new Set(user)].map(Number).sort() : [];
              const ca = [...new Set(correct)].map(Number).sort();
              if (ua.length !== ca.length) return false;
              for (let i = 0; i < ua.length; i++) if (ua[i] !== ca[i]) return false;
              return true;
            }
            return Number(user) === Number(correct);
          }

          const secAgg = { total: 0, correct: 0, incorrect: 0, skipped: 0 };

          for (let i = start; i <= end; i++) {
            secAgg.total += 1;
            const row = byIndex.get(i);
            const ans = row?.saved?.answer;

            if (!isAnswered(ans)) {
              secAgg.skipped += 1;
              continue;
            }

            let correctVal;
            try {
              const qd = await loadOneQuestion(meta, i);
              correctVal = qd?.correct;
            } catch (_) { /* ignore; best-effort */ }

            if (correctVal === undefined) {
              // unknown 'correct' → count only in total, leave correct/incorrect unchanged
              continue;
            }
            if (sameAnswer(ans, correctVal)) secAgg.correct += 1;
            else secAgg.incorrect += 1;
          }

          // persist under result.sectionAgg["<sectionIndex>"], do not touch "all" here
          const idxKey = String(sectionIndex);
          // 1) Ensure `result` exists
await dynamo.update({
  TableName: ATTEMPTS_TABLE,
  Key: { attemptId, entity: "attempt" },
  UpdateExpression: "SET #res = if_not_exists(#res, :empty)",
  ExpressionAttributeNames: { "#res": "result" },
  ExpressionAttributeValues: { ":empty": {} },
}).promise();

// 2) Ensure `result.sectionAgg` exists
await dynamo.update({
  TableName: ATTEMPTS_TABLE,
  Key: { attemptId, entity: "attempt" },
  UpdateExpression: "SET #res.#sa = if_not_exists(#res.#sa, :empty)",
  ExpressionAttributeNames: { "#res": "result", "#sa": "sectionAgg" },
  ExpressionAttributeValues: { ":empty": {} },
}).promise();

// 3) Set the specific section key
await dynamo.update({
  TableName: ATTEMPTS_TABLE,
  Key: { attemptId, entity: "attempt" },
  UpdateExpression: "SET #res.#sa.#k = :v",
  ExpressionAttributeNames: { "#res": "result", "#sa": "sectionAgg", "#k": idxKey },
  ExpressionAttributeValues: { ":v": secAgg },
}).promise();

        }
      }
    } catch (err) {
      // best effort; don't block the flow
      console.warn("section-only aggregate failed:", err?.message || err);
    }
    // ------------------ END NEW: section aggregate ------------------

    res.json({ ok: true, nextSection: next });
  } catch (e) {
    console.error("submit-section:", e);
    res.status(500).json({ error: "Failed to submit section" });
  }
});


/* ===================== NEW: FINAL SUBMIT + SUMMARY ====================== */
/** Finalize attempt and store a light section/tag aggregate (answered vs skipped) */
router.patch("/attempts/:attemptId/submit-final", async (req, res) => {
  try {
    const { attemptId } = req.params;

    const g = await dynamo.get({ TableName: ATTEMPTS_TABLE, Key: { attemptId, entity: "attempt" } }).promise();
    const att = g.Item;
    if (!att) return res.status(404).json({ error: "Attempt not found" });
    if (att.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    // ------------------------- CORRECTED AGGREGATION -------------------------

    // Load saved answers
    const q = await dynamo.query({
      TableName: DATA_TABLE,
      KeyConditionExpression: "attemptId = :a",
      ExpressionAttributeValues: { ":a": attemptId },
    }).promise();
    const answers = q.Items || [];

    // Build a fast lookup by qIndex
    const byIndex = new Map();
    for (const row of answers) byIndex.set(Number(row.qIndex || 0), row);

    // Sections from attempt (already normalized at start time)
    const sections = Array.isArray(att.sections) ? att.sections : [];
    const useSections = !!att.useSections;

    // helper: which section contains absolute index?
    function findSectionKey(absIndex) {
      if (!useSections || sections.length === 0) return "all";
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i] || {};
        const start = Number(s.start || 0);
        const count = Number(s.count || 0);
        if (count > 0 && absIndex >= start && absIndex < start + count) {
          return String(i);
        }
      }
      return "all";
    }

    // normalize correctness check
    const isAnswered = (ans) =>
      ans !== null && (Array.isArray(ans) ? ans.length > 0 : String(ans ?? "").trim() !== "");

    function isCorrectAnswer(savedAnswer, correct) {
      if (Array.isArray(correct)) {
        const a = Array.isArray(savedAnswer) ? [...new Set(savedAnswer)].map(Number).sort() : [];
        const b = [...new Set(correct)].map(Number).sort();
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
        return true;
      }
      return Number(savedAnswer) === Number(correct);
    }

    // get meta and total questions
    const meta = await loadMockMeta(att.mockTestId);
    const totalQ = Number(meta?.totalQuestions || 0);

    // Aggregates
    const sectionAgg = { all: { total: 0, correct: 0, incorrect: 0, skipped: 0 } };
    const tagAgg = {};

    // Iterate over every absolute question index, so untouched become "skipped"
    for (let abs = 0; abs < totalQ; abs++) {
      const secKey = findSectionKey(abs);
      if (!sectionAgg[secKey]) sectionAgg[secKey] = { total: 0, correct: 0, incorrect: 0, skipped: 0 };

      sectionAgg[secKey].total += 1;
      sectionAgg.all.total += 1;

      const row = byIndex.get(abs);
      const saved = row?.saved || {};
      const ans = saved.answer;

      if (!isAnswered(ans)) {
        sectionAgg[secKey].skipped += 1;
        sectionAgg.all.skipped += 1;

        const tags = Array.isArray(row?.tags) ? row.tags : [];
        for (const t of tags) {
          const tt = String(t || "").trim().toLowerCase();
          if (!tt) continue;
          tagAgg[tt] = tagAgg[tt] || { total: 0, correct: 0, incorrect: 0, skipped: 0 };
          tagAgg[tt].total += 1;
          tagAgg[tt].skipped += 1;
        }
        continue;
      }

      // correctness
      let correctVal;
      try {
        const qdata = await loadOneQuestion(meta, abs);
        correctVal = qdata?.correct;
      } catch (_) { /* ignore */ }

      if (correctVal !== undefined) {
        const ok = isCorrectAnswer(ans, correctVal);
        if (ok) {
          sectionAgg[secKey].correct += 1;
          sectionAgg.all.correct += 1;
        } else {
          sectionAgg[secKey].incorrect += 1;
          sectionAgg.all.incorrect += 1;
        }

        const tags = Array.isArray(row?.tags) ? row.tags : [];
        for (const t of tags) {
          const tt = String(t || "").trim().toLowerCase();
          if (!tt) continue;
          tagAgg[tt] = tagAgg[tt] || { total: 0, correct: 0, incorrect: 0, skipped: 0 };
          tagAgg[tt].total += 1;
          if (ok) tagAgg[tt].correct += 1;
          else tagAgg[tt].incorrect += 1;
        }
      } else {
        // unknown correct key; count toward total only
        const tags = Array.isArray(row?.tags) ? row.tags : [];
        for (const t of tags) {
          const tt = String(t || "").trim().toLowerCase();
          if (!tt) continue;
          tagAgg[tt] = tagAgg[tt] || { total: 0, correct: 0, incorrect: 0, skipped: 0 };
          tagAgg[tt].total += 1;
        }
      }
    }

    // Persist
    const r = await dynamo.update({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
      UpdateExpression: "SET #s = :s, submittedAtEpoch = :ts, #res = :r",
      ExpressionAttributeNames: { "#s": "status", "#res": "result" },
      ExpressionAttributeValues: {
        ":s": "SUBMITTED",
        ":ts": nowSec(),
        ":r": { sectionAgg, tagAgg },
      },
      ReturnValues: "ALL_NEW",
    }).promise();

    res.json({ ok: true, attempt: r.Attributes, result: { sectionAgg, tagAgg } });

    // ----------------------- END CORRECTED AGGREGATION -----------------------
  } catch (e) {
    console.error("submit-final:", e);
    res.status(500).json({ error: "Failed to finalize attempt" });
  }
});


/* =========================== NEW: SUMMARY SNAPSHOT =========================== */
/** Read back attempt with result/sections for report screens */
router.get("/attempts/:attemptId/summary", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const r = await dynamo.get({ TableName: ATTEMPTS_TABLE, Key: { attemptId, entity: "attempt" } }).promise();
    const A = r.Item;
    if (!A) return res.status(404).json({ error: "Attempt not found" });
    if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });
    res.json({ ok: true, attempt: A });
  } catch (e) {
    console.error("summary:", e);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

/* ============================== CLEAR (keep) ============================== */

router.delete("/attempts/clear", async (req, res) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.user?.instituteId;
    const { mockTestId } = req.query || {};
    if (!userId || !instituteId) {
      return res.status(400).json({ error: "Missing user/institute" });
    }

    const instUser = `${instituteId}#${userId}`;
    const instMock = mockTestId ? `${instituteId}#${mockTestId}` : null;

    // 1) Find attempts to delete (prefer GSIs)
    let attempts = [];
    try {
      if (instMock) {
        const q = await dynamo.query({
          TableName: ATTEMPTS_TABLE,
          IndexName: "byInstituteMock",
          KeyConditionExpression: "instMock = :im",
          ExpressionAttributeValues: { ":im": instMock },
          ScanIndexForward: false,
          Limit: 200,
        }).promise();
        attempts = q.Items || [];
      } else {
        const q = await dynamo.query({
          TableName: ATTEMPTS_TABLE,
          IndexName: "byInstituteUser",
          KeyConditionExpression: "instUser = :iu",
          ExpressionAttributeValues: { ":iu": instUser },
          ScanIndexForward: false,
          Limit: 200,
        }).promise();
        attempts = q.Items || [];
      }
    } catch (err) {
      console.error("clear attempts: GSI query failed:", err);
      attempts = [];
    }

    if (!attempts.length) return res.json({ deleted: 0 });

    // small helper
    const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));

    let deletedCount = 0;

    // 2) For each attempt, delete attempt row + all DATA rows (answers)
    for (const A of attempts) {
      const attemptId = A.attemptId;
      if (!attemptId) continue;

      // 2a) Load all DATA rows for this attempt
      const dataRows = await dynamo.query({
        TableName: DATA_TABLE,
        KeyConditionExpression: "attemptId = :a",
        ExpressionAttributeValues: { ":a": attemptId },
      }).promise();

      // 2b) Batch delete DATA rows (25 per batch)
      const dataBatches = chunk(dataRows.Items || [], 25);
      for (const batch of dataBatches) {
        if (!batch.length) continue;
        await dynamo.batchWrite({
          RequestItems: {
            [DATA_TABLE]: batch.map(it => ({
              DeleteRequest: { Key: { attemptId: it.attemptId, qIndex: it.qIndex } }
            })),
          },
        }).promise();
      }

      // 2c) Delete the ATTEMPT row
      await dynamo.delete({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      }).promise();

      deletedCount += 1;
    }

    res.json({ deleted: deletedCount });
  } catch (e) {
    console.error("clear attempts:", e);
    res.status(500).json({ error: "Failed to clear attempts" });
  }
});

module.exports = router;
