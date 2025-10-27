

/** minutes → seconds (safe) */
function minsToSecs(m) {
  return Math.max(0, Math.floor(Number(m || 0) * 60));
}

/**
 * Robustly compute the initial seconds to seed an attempt timer from admin meta.
 * Handles cases where admin minutes leaked into durationSec.
 */
function computeSeedSeconds(meta) {
  const adminMin  = Number(meta?.duration || 0);     // minutes (admin)
  const rawDurSec = Number(meta?.durationSec || 0);  // could be seconds OR minutes

  if (rawDurSec > 0) {
    // durationSec equals minutes value (e.g., 230) -> convert to seconds
    if (adminMin > 0 && Math.abs(rawDurSec - adminMin) <= 2) {
      return adminMin * 60;
    }
    // Small raw duration (e.g., < 3600) very likely still minutes
    if (rawDurSec < 3600) return rawDurSec * 60;

    // Looks like proper seconds already
    return Math.floor(rawDurSec);
  }

  // No durationSec; use admin minutes directly
  return minsToSecs(adminMin);
}

/**
 * Read latest full attempts for a user via GSI and return the first IN_PROGRESS
 * for the provided mockTestId. Avoid relying on GSI projections.
 */
async function findExistingInProgressAttempt({ dynamo, table, gsiName, instUser, mockTestId, scanLimit = 25 }) {
  const q1 = await dynamo.query({
    TableName: table,
    IndexName: gsiName,
    KeyConditionExpression: "instUser = :iu",
    ExpressionAttributeValues: { ":iu": instUser },
    ScanIndexForward: false,
    Limit: scanLimit,
  }).promise();

  const attemptKeys = (q1.Items || [])
    .map(it => ({ attemptId: it?.attemptId, entity: "attempt" }))
    .filter(k => !!k.attemptId);

  for (const k of attemptKeys) {
    const g = await dynamo.get({ TableName: table, Key: k }).promise();
    const item = g.Item;
    if (item && item.mockTestId === mockTestId && item.status === "IN_PROGRESS") {
      return item;
    }
  }
  return null;
}

/**
 * Determine if we should allow a one-time increase of timeLeftSec
 * (e.g., initial seed was minute-shaped and client is correcting to legit seconds).
 */
function shouldAllowOneTimeIncrease(A, clientSec, currentServerTimeLeft) {
  const durationMin = Number(A?.durationMin);
  const durationSec = Number(A?.durationSec);

  return (
    Number.isFinite(clientSec) &&
    durationMin > 0 &&
    durationSec > 0 &&
    durationSec < 3600 &&                         // minute-shaped seed like 230
    Math.abs(durationSec - durationMin) <= 2 &&   // matches admin minutes
    clientSec <= durationMin * 60 &&              // not exceeding legit ceiling
    clientSec >= currentServerTimeLeft            // it is an increase, not a reduction
  );
}

module.exports = {
  minsToSecs,
  computeSeedSeconds,
  findExistingInProgressAttempt,
  shouldAllowOneTimeIncrease,
};
