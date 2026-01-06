// // src/Student/hooks/useAttemptTimer.js
// console.log("🟢 useAttemptTimer FILE LOADED");

// import { useEffect, useRef, useState } from "react";
// import API from "../../LoginSystem/axios";

// /**
//  * Authoritative server timer with smooth client tick.
//  * - Server computes real time on each PATCH.
//  * - Client ticks in between for UX and clamps to server values when responses arrive.
//  */
// export default function useAttemptTimer({ attemptId, initialTimeLeft, pausedInitial = false }) {
//   const [timeLeft, setTimeLeft] = useState(Math.max(0, Number(initialTimeLeft || 0)));
//   const [paused, setPaused] = useState(!!pausedInitial);

//   const lastServerSyncRef = useRef(Date.now());
//   const tickRef = useRef(null);
//   const hbRef = useRef(null);
//   const inFlightRef = useRef(false);

//   // 🔁 REHYDRATE when meta arrives/changes   
//   useEffect(() => {
//     setTimeLeft(Math.max(0, Number(initialTimeLeft || 0)));
//     setPaused(!!pausedInitial);
//     lastServerSyncRef.current = Date.now(); // ✅ fixed name
//   }, [initialTimeLeft, pausedInitial]);

//   // Smooth local tick
//   useEffect(() => {
//     if (paused) return;
//     tickRef.current = setInterval(() => {
//       setTimeLeft((t) => Math.max(0, t - 1));
//     }, 1000);
//     return () => clearInterval(tickRef.current);
//   }, [paused]);

//   // Heartbeat to server: every 10s and on visibility changes
// useEffect(() => {
//   const beat = async () => {
//     if (inFlightRef.current) return;
//     inFlightRef.current = true;
//     try {
//       const { data } = await API.patch(`/api/student/attempts/${attemptId}`, {
//         paused,                                // current pause status
//         timeLeftSec: Math.max(0, Math.floor(timeLeft)), // SEND current time
//       });

//       // Only adopt server value if it is defined and > 0 (or exactly 0 when we are truly at 0)
//       const srv = Number(data?.timeLeftSec);
//       if (Number.isFinite(srv)) {
//         if (srv > 0 || timeLeft <= 0) setTimeLeft(srv);
//         // else ignore accidental 0 from stale server state
//       }
//     } catch {} finally {
//       lastServerSyncRef.current = Date.now();
//       inFlightRef.current = false;
//     }
//   };

//   hbRef.current = setInterval(beat, 10000);

//   const onVis = () => { if (!document.hidden) beat(); };
//   const onBeforeUnload = () => {
//     try {
//       navigator.sendBeacon?.(
//         `/api/student/attempts/${attemptId}`,
//         new Blob([JSON.stringify({
//           paused,
//           timeLeftSec: Math.max(0, Math.floor(timeLeft)),
//         })], { type: "application/json" })
//       );
//     } catch {}
//   };

//   document.addEventListener("visibilitychange", onVis);
//   window.addEventListener("beforeunload", onBeforeUnload);
//   return () => {
//     clearInterval(hbRef.current);
//     document.removeEventListener("visibilitychange", onVis);
//     window.removeEventListener("beforeunload", onBeforeUnload);
//   };
// }, [attemptId, paused, timeLeft]);  // include timeLeft so the beacon/beat has latest


//   const togglePause = async () => {
//   const next = !paused;
//   setPaused(next);
//   try {
//     const { data } = await API.patch(`/api/student/attempts/${attemptId}`, {
//       paused: next,
//       timeLeftSec: Math.max(0, Math.floor(timeLeft)), // SEND current time here too
//     });
//     const srv = Number(data?.timeLeftSec);
//     if (Number.isFinite(srv)) {
//       if (srv > 0 || timeLeft <= 0) setTimeLeft(srv);
//     }
//   } catch {}
// };


//   return { timeLeft, setTimeLeft, paused, togglePause };
// }

// src/Student/hooks/useAttemptTimer.js
import { useEffect, useRef, useState } from "react";
import API from "../../LoginSystem/axios";

console.log("🟢 useAttemptTimer FILE LOADED");

/**
 * Authoritative server timer with smooth client tick.
 * - Server computes real time on each PATCH.
 * - Client ticks in between for UX and clamps to server values when responses arrive.
 */
export default function useAttemptTimer({
  attemptId,
  initialTimeLeft,
  pausedInitial = false,
}) {
  console.log("🟢 useAttemptTimer INIT", {
    attemptId,
    initialTimeLeft,
    pausedInitial,
  });

  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Number(initialTimeLeft || 0))
  );
  const [paused, setPaused] = useState(!!pausedInitial);

  const lastServerSyncRef = useRef(Date.now());
  const tickRef = useRef(null);
  const hbRef = useRef(null);
  const inFlightRef = useRef(false);

  // 🔁 REHYDRATE when meta arrives/changes
  useEffect(() => {
    console.log("🔄 REHYDRATE TIMER", {
      initialTimeLeft,
      pausedInitial,
    });

    setTimeLeft(Math.max(0, Number(initialTimeLeft || 0)));
    setPaused(!!pausedInitial);
    lastServerSyncRef.current = Date.now();
  }, [initialTimeLeft, pausedInitial]);

  // ⏱ Smooth local tick (MAIN ENGINE)
  useEffect(() => {
    console.log("⏱ TIMER EFFECT FIRED", { paused, timeLeft });

    if (paused) {
      console.log("⏸ TIMER NOT RUNNING (PAUSED)");
      return;
    }

    if (timeLeft <= 0) {
      console.log("⛔ TIMER STOPPED (timeLeft <= 0)");
      return;
    }

    tickRef.current = setInterval(() => {
      console.log("⏱ TICK (before)", timeLeft);

      setTimeLeft((t) => {
        const next = Math.max(0, t - 1);
        console.log("⬇️ DECREMENT:", t, "→", next);
        return next;
      });
    }, 1000);

    return () => {
      console.log("🧹 CLEAR TIMER INTERVAL");
      clearInterval(tickRef.current);
    };
  }, [paused, timeLeft]);

  // 💓 Heartbeat to server: every 10s and on visibility changes
  useEffect(() => {
    console.log("💓 HEARTBEAT EFFECT STARTED");

    const beat = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      console.log("💓 HEARTBEAT SEND", {
        paused,
        timeLeft,
      });

      try {
        const { data } = await API.patch(
          `/api/student/attempts/${attemptId}`,
          {
            paused,
            timeLeftSec: Math.max(0, Math.floor(timeLeft)),
          }
        );

        const srv = Number(data?.timeLeftSec);
        console.log("💓 HEARTBEAT RESPONSE", srv);

        if (Number.isFinite(srv)) {
          if (srv > 0 || timeLeft <= 0) {
            console.log("🔁 ADOPT SERVER TIME:", srv);
            setTimeLeft(srv);
          }
        }
      } catch (e) {
        console.log("❌ HEARTBEAT ERROR", e);
      } finally {
        lastServerSyncRef.current = Date.now();
        inFlightRef.current = false;
      }
    };

    hbRef.current = setInterval(beat, 10000);

    const onVis = () => {
      if (!document.hidden) {
        console.log("👀 TAB VISIBLE → HEARTBEAT");
        beat();
      }
    };

    const onBeforeUnload = () => {
      console.log("🚪 BEFORE UNLOAD → SEND BEACON");
      try {
        navigator.sendBeacon?.(
          `/api/student/attempts/${attemptId}`,
          new Blob(
            [
              JSON.stringify({
                paused,
                timeLeftSec: Math.max(0, Math.floor(timeLeft)),
              }),
            ],
            { type: "application/json" }
          )
        );
      } catch {}
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      console.log("🧹 CLEAR HEARTBEAT");
      clearInterval(hbRef.current);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [attemptId, paused, timeLeft]);

  // ⏸ Pause / Resume
  const togglePause = async () => {
    const next = !paused;
    console.log("⏯ TOGGLE PAUSE", { from: paused, to: next });

    setPaused(next);

    try {
      const { data } = await API.patch(
        `/api/student/attempts/${attemptId}`,
        {
          paused: next,
          timeLeftSec: Math.max(0, Math.floor(timeLeft)),
        }
      );

      const srv = Number(data?.timeLeftSec);
      console.log("⏯ PAUSE RESPONSE", srv);

      if (Number.isFinite(srv)) {
        if (srv > 0 || timeLeft <= 0) {
          console.log("🔁 SYNC AFTER PAUSE:", srv);
          setTimeLeft(srv);
        }
      }
    } catch (e) {
      console.log("❌ PAUSE ERROR", e);
    }
  };

  console.log("🟢 useAttemptTimer RETURN", {
    timeLeft,
    paused,
  });

  return { timeLeft, setTimeLeft, paused, togglePause };
}
