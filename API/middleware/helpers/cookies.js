

// // backend/helpers/cookies.js
// function computeCookieOptions(req) {
//   const host = (req.headers.host || "").split(":")[0].toLowerCase();
//   const forwardedProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();

//   // Treat execute-api / edzest.org hosts as HTTPS too (defensive)
//   const probablyHttps =
//     forwardedProto === "https" ||
//     req.secure === true ||
//     host.endsWith(".amazonaws.com") ||
//     host.endsWith(".edzest.org");

//   const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
//   const bare = COOKIE_DOMAIN ? COOKIE_DOMAIN.replace(/^\./, "").toLowerCase() : undefined;

//   // Only set Domain if current host matches your site domain
//   const canUseDomain =
//     !!COOKIE_DOMAIN &&
//     !!host &&
//     (host === bare || (bare && host.endsWith("." + bare)));

//   return {
//     httpOnly: true,
//     secure: !!probablyHttps,                // required with SameSite=None
//     sameSite: probablyHttps ? "none" : "lax",
//     domain: canUseDomain ? COOKIE_DOMAIN : undefined,
//     path: "/",                              // <- key so cookie is sent back on your APIGW path
//     maxAge: 30 * 24 * 60 * 60 * 1000,       // 30d
//   };
// }

// function setRefreshCookie(req, res, refreshToken) {
//   const opts = computeCookieOptions(req);
//   res.cookie("refreshToken", refreshToken, opts);
// }

// function clearRefreshCookie(req, res) {
//   const opts = computeCookieOptions(req);
//   res.clearCookie("refreshToken", { ...opts, expires: new Date(0) });
// }

// module.exports = { setRefreshCookie, clearRefreshCookie };


// API/middleware/helpers/cookies.js

function computeCookieOptions(req) {
  const host = (req.headers.host || "").split(":")[0].toLowerCase();
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();

  // Detect local dev (HTTP on localhost / 127.0.0.1)
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  const isHttpsish =
    forwardedProto === "https" ||
    req.secure === true ||
    host.endsWith(".amazonaws.com") ||
    host.endsWith(".edzest.org");

  // Cookie domain handling (unchanged)
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
  const bare = COOKIE_DOMAIN ? COOKIE_DOMAIN.replace(/^\./, "").toLowerCase() : undefined;
  const canUseDomain =
    !!COOKIE_DOMAIN &&
    !!host &&
    (host === bare || (bare && host.endsWith("." + bare)));

  // On localhost (HTTP), browsers drop Secure cookies → use SameSite=Lax + Secure=false
  // On HTTPS (prod/APIGW/custom domain), keep SameSite=None + Secure=true (your current behavior)
  const isLocalHttp = isLocalHost && !isHttpsish;
  const secure   = isLocalHttp ? false : true;              // stay true for prod/APIGW
  const sameSite = isLocalHttp ? "lax"  : "none";           // stay 'none' for prod/APIGW

  return {
    httpOnly: true,
    secure,
    sameSite,
    domain: canUseDomain ? COOKIE_DOMAIN : undefined,
    path: "/",                                   // keep your current path (no behavior change)
    maxAge: 30 * 24 * 60 * 60 * 1000,            // 30d
  };
}

function setRefreshCookie(req, res, refreshToken) {
  const opts = computeCookieOptions(req);
  res.cookie("refreshToken", refreshToken, opts);
}

function clearRefreshCookie(req, res) {
  const opts = computeCookieOptions(req);
  res.clearCookie("refreshToken", { ...opts, expires: new Date(0) });
}

module.exports = { setRefreshCookie, clearRefreshCookie };
