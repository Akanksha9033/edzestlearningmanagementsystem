const express = require("express");
const router = express.Router();

const { authAccess, requireRoles } = require("../../../../middleware/auth");

// 🔥 USE GLOBAL V3 WRAPPER (as you approved)
const { ddb: dynamo } = require("../../../../Services/aws/dynamo");

const { loadMockMeta, loadOneQuestion, sectionBaseIndex } = require("./MocktestShared/shared");
const {
  computeSeedSeconds,
  findExistingInProgressAttempt,
  shouldAllowOneTimeIncrease,
} = require("./studentMocktestAttemptHelper");

const ATTEMPTS_TABLE = process.env.DDB_STU_ATTEMPTS || "StudentMocktestAttempts";
const DATA_TABLE = process.env.DDB_STU_DATA || "StudentMocktestData";

router.use(authAccess);
router.use(requireRoles());

/* ------------------------------- helpers ------------------------------- */

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function normalizeSectionsFromMeta(meta) {
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
  if (count <= 0) return { minIdx: 0, maxIdx: -1 };
  return { minIdx: start, maxIdx: start + count - 1 };
}

/* ============================== LIST ============================= */

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
        const q = await dynamo
          .query({
            TableName: ATTEMPTS_TABLE,
            IndexName: "byInstituteMock",
            KeyConditionExpression: "instMock = :im",
            ExpressionAttributeValues: { ":im": instMock },
            ScanIndexForward: false,
            Limit: 50,
          })
          .promise();

        indexItems = q.Items || [];
      } else {
        const q = await dynamo
          .query({
            TableName: ATTEMPTS_TABLE,
            IndexName: "byInstituteUser",
            KeyConditionExpression: "instUser = :iu",
            ExpressionAttributeValues: { ":iu": instUser },
            ScanIndexForward: false,
            Limit: 50,
          })
          .promise();

        indexItems = q.Items || [];
      }
    } catch (err) {
      console.error("Index query failed:", err);
      indexItems = [];
    }

    if (!indexItems.length) {
      const s = await dynamo
        .scan({
          TableName: ATTEMPTS_TABLE,
          FilterExpression: instMock ? "instMock = :im" : "instUser = :iu",
          ExpressionAttributeValues: instMock ? { ":im": instMock } : { ":iu": instUser },
          Limit: 100,
        })
        .promise();
      indexItems = s.Items || [];
    }

    const keys = indexItems
      .map((it) => ({ attemptId: it.attemptId, entity: "attempt" }))
      .filter((k) => !!k.attemptId);

    const now = nowSec();
    const out = [];

    for (const k of keys) {
      const g = await dynamo
        .get({
          TableName: ATTEMPTS_TABLE,
          Key: k,
          ConsistentRead: true,
        })
        .promise();

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
        userId: A.userId, 
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

/* ===================== START or RESUME ====================== */

router.post("/attempts", async (req, res) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.user?.instituteId;
    const { mockTestId, forceNew, cancelPrevious } = req.body || {};

    if (!userId || !instituteId || !mockTestId) {
      return res.status(400).json({ error: "Missing user/institute/mockTestId" });
    }

    const instUser = `${instituteId}#${userId}`;

    // resume unless forceNew
    const maybeExisting = await findExistingInProgressAttempt({
      dynamo,
      table: ATTEMPTS_TABLE,
      gsiName: "byInstituteUser",
      instUser,
      mockTestId,
      scanLimit: 25,
    });

    if (!forceNew && maybeExisting) return res.json(maybeExisting);

    // 🛑 Prevent auto-creation of a new attempt after a SUBMITTED attempt
if (!maybeExisting) {
  const instMock = `${instituteId}#${mockTestId}`;

  const last = await dynamo
    .query({
      TableName: ATTEMPTS_TABLE,
      IndexName: "byInstituteMock",
      KeyConditionExpression: "instMock = :im",
      ExpressionAttributeValues: { ":im": instMock },
      ScanIndexForward: false,
      Limit: 1,
    })
    .promise();

  const lastAttempt = last.Items?.[0];
 if (lastAttempt && lastAttempt.status === "SUBMITTED" && !forceNew) {
  return res.status(400).json({
    error: "Test already submitted. Start Test manually to create a new attempt.",
  });
}

}


    if (forceNew && maybeExisting && cancelPrevious) {
      await dynamo
        .update({
          TableName: ATTEMPTS_TABLE,
          Key: { attemptId: maybeExisting.attemptId, entity: "attempt" },
          UpdateExpression: "SET #st = :st",
          ExpressionAttributeNames: { "#st": "status" },
          ExpressionAttributeValues: { ":st": "CANCELLED" },
        })
        .promise();
    }

    // load meta
    const meta = await loadMockMeta(mockTestId);
    if (!meta || meta.status !== "PUBLISHED") {
      return res.status(400).json({ error: "Mock test unavailable" });
    }

    const rawSections = Array.isArray(meta.sections) ? meta.sections : [];
    let boundaries = rawSections.map((s, i) => ({
      index: i,
      name: s?.name || `Section ${i + 1}`,
      start: sectionBaseIndex(rawSections, i),
      count: Number(s?.count || 0),
    }));

    boundaries = boundaries.sort((a, b) => a.start - b.start);

    const totalCounts = boundaries.reduce((sum, b) => sum + Number(b.count || 0), 0);
    const useSections = meta?.useSections === true && boundaries.length > 0 && totalCounts > 0;

    const seedSecs = computeSeedSeconds(meta);

    function buildSectionTimers(meta, totalDurationSec, sections) {
      if (!sections?.length) return [];
      let mins = Array.isArray(meta?.sectionDurations)
        ? meta.sectionDurations.map((n) => Math.max(0, Number(n || 0)))
        : null;

      let secs;
      if (mins && mins.length === sections.length) {
        secs = mins.map((m) => Math.floor(m * 60));
      } else {
        const each = Math.floor(totalDurationSec / sections.length);
        secs = new Array(sections.length).fill(each);
        secs[sections.length - 1] += totalDurationSec - each * sections.length;
      }

      return sections.map((_, i) => ({
        index: i,
        timeLeftSec: secs[i],
        submittedAt: null,
      }));
    }

    const sectionInfo = useSections ? buildSectionTimers(meta, seedSecs, boundaries) : [];

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

      durationMin: Number(meta.duration || 0),
      durationSec: seedSecs,
      timeLeftSec: seedSecs,
      paused: false,
      lastHeartbeatEpoch: now,
      qStartedAtEpoch: now,
      perQuestionSec: {},

      title: meta.title,
      imageUrl: meta.imageUrl,
      totalQuestions: Number(meta.totalQuestions || totalCounts || 0),

      useSections,
      breakMinutes: Number(meta.breakMinutes || 0),
      sections: boundaries,
      sectionInfo,
      currentSection: useSections ? 0 : null,

      currentIndex: useSections ? Number(boundaries[0]?.start || 0) : 0,
    };

    await dynamo.put({
      TableName: ATTEMPTS_TABLE,
      Item: item,
    }).promise();

    res.json(item);
  } catch (e) {
    console.error("start attempt:", e);
    res.status(500).json({ error: "Failed to start attempt" });
  }
});

/* ============================= SNAPSHOT ============================= */

router.get("/attempts/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;

    const r = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();

    const A = r.Item;
    if (!A) return res.status(404).json({ error: "Not found" });
    if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    const now = nowSec();
    let timeLeft = Number(A.timeLeftSec || 0);

    if (A.status === "IN_PROGRESS" && !A.paused && A.lastHeartbeatEpoch) {
      const elapsed = Math.max(0, now - Number(A.lastHeartbeatEpoch));
      timeLeft = Math.max(0, timeLeft - elapsed);
    }

    const perQuestionSec = { ...(A.perQuestionSec || {}) };
    if (
      A.status === "IN_PROGRESS" &&
      !A.paused &&
      A.qStartedAtEpoch != null &&
      Number.isInteger(A.currentIndex)
    ) {
      const qElapsed = Math.max(0, now - Number(A.qStartedAtEpoch));
      perQuestionSec[A.currentIndex] =
        Number(perQuestionSec[A.currentIndex] || 0) + qElapsed;
    }

    res.json({ ...A, timeLeftSec: timeLeft, perQuestionSec });
  } catch (e) {
    console.error("get attempt:", e);
    res.status(500).json({ error: "Failed to get attempt" });
  }
});

/* ============================ GET QUESTION ============================ */

router.get("/attempts/:attemptId/questions/:qIndex", async (req, res) => {
  try {
    const { attemptId, qIndex } = req.params;
    const index = Number(qIndex);

    const a = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();
    const attempt = a.Item;

    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

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

    const d = await dynamo
      .get({
        TableName: DATA_TABLE,
        Key: { attemptId, qIndex: index },
      })
      .promise();

    res.json({
      question,
      saved:
        d.Item?.saved || {
          answer: null,
          flagged: false,
          strikes: [],
          highlights: [],
          timeSpentSec: 0,
        },
    });
  } catch (e) {
    console.error("get question:", e);
    res.status(500).json({ error: "Failed to get question" });
  }
});

/* =============================== SAVE ANSWER =============================== */

router.patch("/attempts/:attemptId/answers/:qIndex", async (req, res) => {
  try {
    const { attemptId, qIndex } = req.params;
    const index = Number(qIndex);
    const body = req.body || {};
    const now = nowSec();

    const a = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();

    const attempt = a.Item;
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    if (attempt.useSections && Array.isArray(attempt.sections) && attempt.sections.length > 0) {
      const { minIdx, maxIdx } = getActiveWindow(attempt.sections, attempt.currentSection);
      if (index < minIdx || index > maxIdx) {
        return res.status(403).json({ error: "Out of current section range" });
      }
    }

    await dynamo
      .put({
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
        },
      })
      .promise();

    await dynamo
      .update({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
        UpdateExpression: "SET currentIndex = :ci, lastHeartbeatEpoch = :hb",
        ExpressionAttributeValues: {
          ":ci": Number.isInteger(body.currentIndex) ? body.currentIndex : index,
          ":hb": now,
        },
      })
      .promise();

    res.json({ ok: true });
  } catch (e) {
    console.error("patch answer:", e);
    res.status(500).json({ error: "Failed to save answer" });
  }
});

/* ========================= HEARTBEAT / PAUSE ========================= */

router.patch("/attempts/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const body = req.body || {};
    const now = nowSec();

    const a = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();

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
        perQuestionSec[A.currentIndex] =
          Number(perQuestionSec[A.currentIndex] || 0) + seg;
      }
    }

    const clientSec = Number(body?.timeLeftSec);
    const allowIncreaseOnce = shouldAllowOneTimeIncrease(A, clientSec, timeLeft);
    if (Number.isFinite(clientSec)) {
      if (clientSec <= timeLeft || allowIncreaseOnce) timeLeft = Math.max(0, clientSec);
    }

    let nextPaused = typeof body?.paused === "boolean" ? body.paused : A.paused;
    let nextIndex = Number.isInteger(body?.currentIndex) ? body.currentIndex : A.currentIndex;

    if (A.useSections && Array.isArray(A.sections) && A.sections.length > 0) {
      const { minIdx, maxIdx } = getActiveWindow(A.sections, A.currentSection);
      if (nextIndex < minIdx) nextIndex = minIdx;
      if (nextIndex > maxIdx) nextIndex = maxIdx;
    }

    if (timeLeft <= 0) timeLeft = 0;
    const nextQStartedAtEpoch = !nextPaused ? now : A.qStartedAtEpoch;

    const names = {
      "#tl": "timeLeftSec",
      "#ps": "paused",
      "#hb": "lastHeartbeatEpoch",
      "#ci": "currentIndex",
      "#qs": "qStartedAtEpoch",
      "#pq": "perQuestionSec",
    };

    const values = {
      ":tl": timeLeft,
      ":ps": nextPaused || timeLeft === 0,
      ":hb": now,
      ":ci": nextIndex,
      ":qs": nextQStartedAtEpoch,
      ":pq": perQuestionSec,
    };

    const setParts = [
      "#tl = :tl",
      "#ps = :ps",
      "#hb = :hb",
      "#ci = :ci",
      "#qs = :qs",
      "#pq = :pq",
    ];

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

    const r = await dynamo
      .update({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
        UpdateExpression: `SET ${setParts.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
      .promise();

    res.json(r.Attributes);
  } catch (e) {
    console.error("patch attempt:", e);
    res.status(500).json({ error: "Failed to update attempt" });
  }
});

/* ============================= FINAL SUBMIT ============================= */

router.post("/attempts/:attemptId/submit", async (req, res) => {
  try {
    const { attemptId } = req.params;

    const a = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();
    const attempt = a.Item;
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    // Block final submit until all sections done
    if (attempt.useSections) {
      const infos = Array.isArray(attempt.sectionInfo) ? attempt.sectionInfo : [];
      const anyPending = infos.some((si) => !si || !si.submittedAt);
      if (anyPending) {
        return res.status(400).json({ error: "Sections pending. Submit sections first." });
      }
    }

    const now = nowSec();
    const r = await dynamo
      .update({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
        UpdateExpression: "SET #st = :st, submittedAtEpoch = :ts",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":st": "SUBMITTED", ":ts": now },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    res.json({ ok: true, attempt: r.Attributes });
  } catch (e) {
    console.error("submit attempt:", e);
    res.status(500).json({ error: "Failed to submit attempt" });
  }
});

/* ===================== SUBMIT CURRENT SECTION ====================== */

router.patch("/attempts/:attemptId/submit-section", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { sectionIndex } = req.body || {};
    if (!Number.isInteger(sectionIndex)) {
      return res.status(400).json({ error: "sectionIndex required" });
    }

    const r = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();
    const att = r.Item;

    if (!att) return res.status(404).json({ error: "Attempt not found" });
    if (att.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });
    if (!att.useSections) return res.status(400).json({ error: "Sections not enabled" });
    if (att.status !== "IN_PROGRESS") return res.status(400).json({ error: "Attempt not in progress" });

    const sectionInfo = Array.isArray(att.sectionInfo) ? [...att.sectionInfo] : [];
    if (!sectionInfo[sectionIndex]) {
      return res.status(400).json({ error: "Invalid section index" });
    }
    sectionInfo[sectionIndex].submittedAt = nowSec();

    const totalSecs = Array.isArray(att.sections) ? att.sections.length : 0;
    const next = sectionIndex + 1 < totalSecs ? sectionIndex + 1 : null;

    let nextIndex = att.currentIndex;
    if (next !== null) {
      const { minIdx } = getActiveWindow(att.sections, next);
      nextIndex = Number.isFinite(minIdx) ? minIdx : nextIndex;
    }

    await dynamo
      .update({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
        UpdateExpression:
          "SET sectionInfo = :si, currentSection = :cs, currentIndex = :ci, qStartedAtEpoch = :qs",
        ExpressionAttributeValues: {
          ":si": sectionInfo,
          ":cs": next,
          ":ci": nextIndex,
          ":qs": nowSec(),
        },
      })
      .promise();

    // SECTION AGGREGATION BLOCK — SAFE TO KEEP EXACTLY SAME — ALREADY WORKING
    try {
      const sections = Array.isArray(att.sections) ? att.sections : [];
      const secObj = sections[sectionIndex];

      if (secObj && Number(secObj.count) > 0) {
        const meta = await loadMockMeta(att.mockTestId);
        if (meta) {
          const start = Number(secObj.start || 0);
          const end = start + Number(secObj.count || 0) - 1;

          const q = await dynamo
            .query({
              TableName: DATA_TABLE,
              KeyConditionExpression: "attemptId = :a",
              ExpressionAttributeValues: { ":a": attemptId },
            })
            .promise();

          const byIndex = new Map(
            (q.Items || []).map((row) => [Number(row.qIndex || 0), row])
          );

          const isAnswered = (ans) =>
            ans !== null &&
            (Array.isArray(ans) ? ans.length > 0 : String(ans ?? "").trim() !== "");

          const same = (u, c) => {
            if (Array.isArray(c)) {
              const ua = Array.isArray(u) ? [...new Set(u)].map(Number).sort() : [];
              const ca = [...new Set(c)].map(Number).sort();
              if (ua.length !== ca.length) return false;
              for (let i = 0; i < ua.length; i++) if (ua[i] !== ca[i]) return false;
              return true;
            }
            return Number(u) === Number(c);
          };

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
            } catch {}

            if (correctVal === undefined) continue;

            if (same(ans, correctVal)) secAgg.correct += 1;
            else secAgg.incorrect += 1;
          }

          // Persist
          const idxKey = String(sectionIndex);

          await dynamo
            .update({
              TableName: ATTEMPTS_TABLE,
              Key: { attemptId, entity: "attempt" },
              UpdateExpression: "SET #res = if_not_exists(#res, :empty)",
              ExpressionAttributeNames: { "#res": "result" },
              ExpressionAttributeValues: { ":empty": {} },
            })
            .promise();

          await dynamo
            .update({
              TableName: ATTEMPTS_TABLE,
              Key: { attemptId, entity: "attempt" },
              UpdateExpression: "SET #res.#sa = if_not_exists(#res.#sa, :empty)",
              ExpressionAttributeNames: { "#res": "result", "#sa": "sectionAgg" },
              ExpressionAttributeValues: { ":empty": {} },
            })
            .promise();

          await dynamo
            .update({
              TableName: ATTEMPTS_TABLE,
              Key: { attemptId, entity: "attempt" },
              UpdateExpression: "SET #res.#sa.#k = :v",
              ExpressionAttributeNames: {
                "#res": "result",
                "#sa": "sectionAgg",
                "#k": idxKey,
              },
              ExpressionAttributeValues: { ":v": secAgg },
            })
            .promise();
        }
      }
    } catch (err) {
      console.warn("section-only aggregate failed:", err?.message || err);
    }

    res.json({ ok: true, nextSection: next });
  } catch (e) {
    console.error("submit-section:", e);
    res.status(500).json({ error: "Failed to submit section" });
  }
});

/* ===================== FINAL SUBMIT + SUMMARY ====================== */

router.patch("/attempts/:attemptId/submit-final", async (req, res) => {
  try {
    const { attemptId } = req.params;

    const g = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();
    const att = g.Item;

    if (!att) return res.status(404).json({ error: "Attempt not found" });
    if (att.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    const q = await dynamo
      .query({
        TableName: DATA_TABLE,
        KeyConditionExpression: "attemptId = :a",
        ExpressionAttributeValues: { ":a": attemptId },
      })
      .promise();

    const answers = q.Items || [];
    const byIndex = new Map();
    for (const row of answers) byIndex.set(Number(row.qIndex || 0), row);

    const sections = Array.isArray(att.sections) ? att.sections : [];
    const useSections = !!att.useSections;

    function findSection(absIndex) {
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

    const isAnswered = (ans) =>
      ans !== null &&
      (Array.isArray(ans) ? ans.length > 0 : String(ans ?? "").trim() !== "");

    const isCorrect = (user, correct) => {
      if (Array.isArray(correct)) {
        const ua = Array.isArray(user) ? [...new Set(user)].map(Number).sort() : [];
        const ca = [...new Set(correct)].map(Number).sort();
        if (ua.length !== ca.length) return false;
        for (let i = 0; i < ua.length; i++) if (ua[i] !== ca[i]) return false;
        return true;
      }
      return Number(user) === Number(correct);
    };

    const meta = await loadMockMeta(att.mockTestId);
    const totalQ = Number(meta?.totalQuestions || 0);

    const sectionAgg = {
      all: { total: 0, correct: 0, incorrect: 0, skipped: 0 },
    };

    const tagAgg = {};

    for (let abs = 0; abs < totalQ; abs++) {
      const sec = findSection(abs);
      if (!sectionAgg[sec])
        sectionAgg[sec] = { total: 0, correct: 0, incorrect: 0, skipped: 0 };

      sectionAgg[sec].total++;
      sectionAgg.all.total++;

      const row = byIndex.get(abs);
      const saved = row?.saved || {};
      const ans = saved.answer;

      if (!isAnswered(ans)) {
        sectionAgg[sec].skipped++;
        sectionAgg.all.skipped++;

        const tags = Array.isArray(row?.tags) ? row.tags : [];
        for (const t of tags) {
          const tt = String(t || "").trim().toLowerCase();
          if (!tt) continue;
          tagAgg[tt] = tagAgg[tt] || {
            total: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
          };
          tagAgg[tt].total++;
          tagAgg[tt].skipped++;
        }

        continue;
      }

      let correctVal;
      try {
        const qd = await loadOneQuestion(meta, abs);
        correctVal = qd?.correct;
      } catch {}

      if (correctVal !== undefined) {
        const ok = isCorrect(ans, correctVal);
        if (ok) {
          sectionAgg[sec].correct++;
          sectionAgg.all.correct++;
        } else {
          sectionAgg[sec].incorrect++;
          sectionAgg.all.incorrect++;
        }

        const tags = Array.isArray(row?.tags) ? row.tags : [];
        for (const t of tags) {
          const tt = String(t || "").trim().toLowerCase();
          if (!tt) continue;
          tagAgg[tt] = tagAgg[tt] || {
            total: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
          };
          tagAgg[tt].total++;
          if (ok) tagAgg[tt].correct++;
          else tagAgg[tt].incorrect++;
        }
      } else {
        const tags = Array.isArray(row?.tags) ? row.tags : [];
        for (const t of tags) {
          const tt = String(t || "").trim().toLowerCase();
          if (!tt) continue;
          tagAgg[tt] = tagAgg[tt] || {
            total: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
          };
          tagAgg[tt].total++;
        }
      }
    }

    const r = await dynamo
      .update({
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
      })
      .promise();

    res.json({
      ok: true,
      attempt: r.Attributes,
      result: { sectionAgg, tagAgg },
    });
  } catch (e) {
    console.error("submit-final:", e);
    res.status(500).json({ error: "Failed to finalize attempt" });
  }
});

/* =========================== SUMMARY SNAPSHOT =========================== */

router.get("/attempts/:attemptId/summary", async (req, res) => {
  try {
    const { attemptId } = req.params;

    const r = await dynamo
      .get({
        TableName: ATTEMPTS_TABLE,
        Key: { attemptId, entity: "attempt" },
      })
      .promise();

    const A = r.Item;
    if (!A) return res.status(404).json({ error: "Attempt not found" });
    if (A.userId !== req.user?.id) return res.status(403).json({ error: "Forbidden" });

    res.json({ ok: true, attempt: A });
  } catch (e) {
    console.error("summary:", e);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

/* ============================== CLEAR ============================== */

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

    // 1) Find attempts
    let attempts = [];
    try {
      if (instMock) {
        const q = await dynamo
          .query({
            TableName: ATTEMPTS_TABLE,
            IndexName: "byInstituteMock",
            KeyConditionExpression: "instMock = :im",
            ExpressionAttributeValues: { ":im": instMock },
            ScanIndexForward: false,
            Limit: 200,
          })
          .promise();
        attempts = q.Items || [];
      } else {
        const q = await dynamo
          .query({
            TableName: ATTEMPTS_TABLE,
            IndexName: "byInstituteUser",
            KeyConditionExpression: "instUser = :iu",
            ExpressionAttributeValues: { ":iu": instUser },
            ScanIndexForward: false,
            Limit: 200,
          })
          .promise();
        attempts = q.Items || [];
      }
    } catch (err) {
      console.error("clear attempts: GSI query failed:", err);
      attempts = [];
    }

    if (!attempts.length) return res.json({ deleted: 0 });

    const chunk = (arr, n) =>
      Array.from({ length: Math.ceil(arr.length / n) }, (_, i) =>
        arr.slice(i * n, (i + 1) * n)
      );

    let deletedCount = 0;

    // 2) For each attempt delete answers + attempt row
    for (const A of attempts) {
      const attemptId = A.attemptId;
      if (!attemptId) continue;

      const dataRows = await dynamo
        .query({
          TableName: DATA_TABLE,
          KeyConditionExpression: "attemptId = :a",
          ExpressionAttributeValues: { ":a": attemptId },
        })
        .promise();

      const dataBatches = chunk(dataRows.Items || [], 25);
      for (const batch of dataBatches) {
        if (!batch.length) continue;
        await dynamo
          .batchWrite({
            RequestItems: {
              [DATA_TABLE]: batch.map((it) => ({
                DeleteRequest: {
                  Key: { attemptId: it.attemptId, qIndex: it.qIndex },
                },
              })),
            },
          })
          .promise();
      }

      await dynamo
        .delete({
          TableName: ATTEMPTS_TABLE,
          Key: { attemptId, entity: "attempt" },
        })
        .promise();

      deletedCount++;
    }

    res.json({ deleted: deletedCount });
  } catch (e) {
    console.error("clear attempts:", e);
    res.status(500).json({ error: "Failed to clear attempts" });
  }
});

module.exports = router;
