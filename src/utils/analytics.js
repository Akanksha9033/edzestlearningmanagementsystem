// src/utils/analytics.js
export const safeGtag = (eventName, params) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  } else {
    console.warn("gtag not available:", eventName, params);
  }
};
//