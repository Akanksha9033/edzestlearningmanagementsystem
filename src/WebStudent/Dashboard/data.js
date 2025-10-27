// src/WebStudent/StudentModule/Dashboard/data.js
// ✅ Uses your real endpoints discovered in the zips.
//    - MockTest:   /api/student/attempts/* , /api/student/mocktests
//    - Q-Bank:     /api/student/qbank/sessions/my , /api/student/qbank/student/attempts/:studentId
//    - E-Book:     /api/student/ebooks/progress , /api/ebooks/notes/*

import API from "../../LoginSystem/axios";

/* -------------------- Helpers -------------------- */
const byEpochDesc = (a, b) => Number(b?.createdAtEpoch || 0) - Number(a?.createdAtEpoch || 0);
const pick = (...vals) => vals.find(v => v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== ""));

/* =========================================================
   MOCKTEST — attempts list + per-attempt summary (score)
   Endpoints found in backend:
   GET  /api/student/attempts/list                -> { items: [...] }
   GET  /api/student/attempts/:attemptId/summary  -> { scorePct, total, correct, ... }
   GET  /api/student/mocktests                    -> available mock tests (for Quick Start)
========================================================= */

export async function fetchMockAttempts(limit = 10) {
  const r = await API.get("/api/student/attempts/list");
  const items = Array.isArray(r.data?.items) ? r.data.items : [];
  // newest first (server already sorts but keep it safe)
  items.sort(byEpochDesc);
  return items.slice(0, limit);
}

export async function fetchAttemptSummary(attemptId) {
  const r = await API.get(`/api/student/attempts/${attemptId}/summary`);
  // normalize a little
  return {
    scorePct: Number(r.data?.scorePct ?? r.data?.score ?? 0),
    total: Number(r.data?.total ?? 0),
    correct: Number(r.data?.correct ?? 0),
    submittedAtEpoch: Number(r.data?.submittedAtEpoch ?? 0),
    ...r.data,
  };
}

export async function fetchMockTestsCatalog() {
  // student-facing list of available mock tests
  const r = await API.get("/api/student/mocktests");
  return Array.isArray(r.data?.items) ? r.data.items : (Array.isArray(r.data) ? r.data : []);
}

/* =========================================================
   Q-BANK — sessions & attempts per student
   Endpoints found in backend:
   GET  /api/student/qbank/sessions/my
   GET  /api/student/qbank/student/attempts/:studentId
========================================================= */

export async function fetchMyQBankSessions() {
  const r = await API.get("/api/student/qbank/sessions/my");
  const arr = Array.isArray(r.data?.items) ? r.data.items : (Array.isArray(r.data) ? r.data : []);
  // ensure recent first if date exists
  arr.sort((a, b) => new Date(b?.endTime || b?.updatedAt || 0) - new Date(a?.endTime || a?.updatedAt || 0));
  return arr;
}

export async function fetchQBankAttemptsByStudent(studentId) {
  if (!studentId) return [];
  const r = await API.get(`/api/student/qbank/student/attempts/${studentId}`);
  const arr = Array.isArray(r.data?.items) ? r.data.items : (Array.isArray(r.data) ? r.data : []);
  return arr;
}

/** Build weak-area list from Q-Bank attempts (lowest accuracy, >= 20 attempts per tag) */
export async function computeWeakAreasFromQBank(studentId, limit = 3) {
  const attempts = await fetchQBankAttemptsByStudent(studentId);

  // Aggregate accuracy per tag/domain
  const buckets = new Map(); // tag -> {correct, total}
  for (const a of attempts) {
    const tags = Array.isArray(a?.tags) ? a.tags : [];
    const correct = Number(a?.correct ?? 0);
    const total = Number(a?.total ?? 0);
    if (!total) continue;
    for (const t of tags) {
      const key = String(t).trim();
      if (!key) continue;
      const b = buckets.get(key) || { correct: 0, total: 0 };
      b.correct += correct;
      b.total += total;
      buckets.set(key, b);
    }
  }

  const entries = [...buckets.entries()]
    .map(([tag, b]) => ({ tag, your: Math.round((b.correct / b.total) * 100), total: b.total }))
    .filter(x => x.total >= 20)         // ignore too-thin data
    .sort((a, b) => a.your - b.your)    // lowest first
    .slice(0, limit);

  // No global benchmark available from your API; keep "global" blank for now.
  return entries.map(x => ({ ...x, global: undefined }));
}

/* =========================================================
   E-BOOK — progress & notes (student)
   Endpoints found in backend:
   PUT  /api/student/ebooks/progress
   GET  /api/ebooks/notes?ebookId=...&chapterId=...
   POST /api/ebooks/notes      { ebookId, chapterId, text }
   DELETE /api/ebooks/notes/:noteId
========================================================= */

export async function putEBookProgress({ userId, ebookId, chapterId, timeSpent = 0, completed = false }) {
  const r = await API.put("/api/student/ebooks/progress", {
    userId, ebookId, chapterId, timeSpent, completed
  });
  return r.data;
}

export async function listEBookNotes(ebookId, chapterId) {
  const r = await API.get("/api/ebooks/notes", { params: { ebookId, chapterId } });
  return Array.isArray(r.data?.items) ? r.data.items : (Array.isArray(r.data) ? r.data : []);
}

/* -------------------- Dashboard “Continue” item --------------------
   Heuristic that uses latest of:
   - last MockTest attempt still IN_PROGRESS (or last submitted)
   - last Q-Bank session
   - last E-Book progress tick
------------------------------------------------------------------- */
export async function resolveContinueItem(user) {
  const userId = user?.id || user?._id;
  let kind = null, label = "", percent = 0, deepLink = null;

  // 1) mock attempts
  let latestAttempt = null;
  try {
    const attempts = await fetchMockAttempts(5);
    latestAttempt = attempts[0] || null;
  } catch {}

  if (latestAttempt) {
    kind = "mock";
    label = pick(latestAttempt?.title, "Mock Test");
    percent = Math.round(
      (Number(latestAttempt?.currentIndex || 0) / Math.max(1, Number(latestAttempt?.totalQuestions || 100))) * 100
    );
    deepLink = `/student/mocktests/attempt/${latestAttempt.attemptId}`;
  }

  // 2) q-bank session (fallback if newer)
  try {
    const sessions = await fetchMyQBankSessions();
    const s = sessions[0];
    if (s && Number(new Date(s.updatedAt || s.endTime || 0)) >
             Number(latestAttempt?.createdAtEpoch ? new Date(latestAttempt.createdAtEpoch * 1000) : 0)) {
      kind = "qbank";
      label = pick(s?.title, s?.bankName, "Practice Session");
      percent = Number(s?.progressPct ?? 0);
      deepLink = `/student/qbank/session/${s?.sessionId || s?.id}`;
    }
  } catch {}

  // 3) e-book tick (as a last fallback)
  // If you want, call a “last progress” endpoint later; for now we just leave as is.

  return { kind, label, percent, deepLink };
}

/* =========================================================
   Dashboard aggregates for charts
========================================================= */
export async function buildScoreTrendFromAttempts(limit = 8) {
  const attempts = await fetchMockAttempts(limit);
  const out = [];
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    let scorePct = 0;
    if (a?.status === "SUBMITTED" || a?.submittedAtEpoch) {
      try {
        const s = await fetchAttemptSummary(a.attemptId);
        scorePct = Number(s.scorePct || 0);
      } catch {
        scorePct = 0;
      }
    }
    out.push({ name: `A${attempts.length - i}`, score: scorePct });
  }
  return out.reverse();
}

export async function buildDomainTimeDonut(studentId) {
  // If you later add a backend “time-by-domain” API, use it here.
  // For now, approximate from Q-Bank attempts (each attempt tagged).
  const attempts = await fetchQBankAttemptsByStudent(studentId);
  const agg = new Map(); // domain -> count
  for (const a of attempts) {
    for (const t of (a.tags || [])) {
      agg.set(t, (agg.get(t) || 0) + 1);
    }
  }
  const out = [...agg.entries()].map(([name, value]) => ({ name, value }));
  // sort desc and take top 5
  out.sort((a,b) => b.value - a.value);
  return out.slice(0, 5);
}
