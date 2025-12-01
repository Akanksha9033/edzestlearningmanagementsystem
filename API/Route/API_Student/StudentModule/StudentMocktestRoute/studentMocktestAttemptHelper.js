/** minutes → seconds (safe) */
function minsToSecs(m) {
  // Convert minutes → seconds safely.
  // Number(m || 0) ensures blank/null becomes 0.
  return Math.max(0, Math.floor(Number(m || 0) * 60));
}

/**
 * Robustly compute the initial seconds to seed an attempt timer from admin meta.
 * Handles cases where admin minutes leaked into durationSec.
 */
function computeSeedSeconds(meta) {
  // Admin-assigned duration in MINUTES (always minutes)
  const adminMin  = Number(meta?.duration || 0);

  // Raw durationSec field: could be minutes OR seconds depending on older data
  const rawDurSec = Number(meta?.durationSec || 0);

  if (rawDurSec > 0) {
    // Case 1: durationSec accidentally equals adminMin (e.g., 230)
    // → Treat rawDurSec as minutes
    if (adminMin > 0 && Math.abs(rawDurSec - adminMin) <= 2) {
      return adminMin * 60; // minutes → seconds
    }

    // Case 2: rawDurSec is small (< 3600)
    // → very likely minutes (e.g., 120 → 2 hours)
    if (rawDurSec < 3600) return rawDurSec * 60;

    // Case 3: Already proper seconds (large values like 7200, 10800)
    return Math.floor(rawDurSec);
  }

  // Case 4: No durationSec present → directly use admin minutes
  return minsToSecs(adminMin);
}

/**
 * Read latest full attempts for a user via GSI and return the first IN_PROGRESS
 * for the provided mockTestId. Avoid relying on GSI projections.
 */
async function findExistingInProgressAttempt({ dynamo, table, gsiName, instUser, mockTestId, scanLimit = 25 }) {
  // Step 1: Query GSI using partition key instUser. Get recent attempts.
  const q1 = await dynamo.query({
    TableName: table,
    IndexName: gsiName,
    KeyConditionExpression: "instUser = :iu",
    ExpressionAttributeValues: { ":iu": instUser },
    ScanIndexForward: false,  // get newest first
    Limit: scanLimit,         // bounded read for performance
  }).promise();

  // Extract attempt keys from index results
  const attemptKeys = (q1.Items || [])
    .map(it => ({ attemptId: it?.attemptId, entity: "attempt" }))
    .filter(k => !!k.attemptId);  // ignore blanks

  // Step 2: Fetch FULL records from main table to check status
  for (const k of attemptKeys) {
    const g = await dynamo.get({ TableName: table, Key: k }).promise();
    const item = g.Item;

    // Found IN_PROGRESS attempt for same mock test
    if (item && item.mockTestId === mockTestId && item.status === "IN_PROGRESS") {
      return item;
    }
  }

  // No matching in-progress attempt found
  return null;
}

/**
 * Determine if we should allow a one-time increase of timeLeftSec
 * (e.g., initial seed was minute-shaped and client is correcting to legit seconds).
 */
function shouldAllowOneTimeIncrease(A, clientSec, currentServerTimeLeft) {
  const durationMin = Number(A?.durationMin); // admin minutes
  const durationSec = Number(A?.durationSec); // stored raw seconds/minutes

  return (
    // clientSec must be a valid number
    Number.isFinite(clientSec) &&

    // Admin minutes and durationSec must both exist
    durationMin > 0 &&
    durationSec > 0 &&

    // durationSec < 3600 → probably minutes, not seconds
    durationSec < 3600 &&

    // durationSec matches admin minutes +- 2 tolerance
    Math.abs(durationSec - durationMin) <= 2 &&

    // clientSec is not exceeding real max allowed seconds
    clientSec <= durationMin * 60 &&

    // And client is increasing the time (not reducing)
    clientSec >= currentServerTimeLeft
  );
}

module.exports = {
  minsToSecs,
  computeSeedSeconds,
  findExistingInProgressAttempt,
  shouldAllowOneTimeIncrease,
};
