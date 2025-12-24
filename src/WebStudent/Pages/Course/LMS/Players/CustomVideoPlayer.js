import React, { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  putLessonProgress,
  getLessonProgress,
} from "../../../../../utils/ProgressApi";

export default function CustomVideoPlayer({
  src,
  autoPlay = true,
  poster,
  lessonId,
  courseSlug,
  onEnded,
  onProgress,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [duration, setDuration] = useState(0);
  const [localPct, setLocalPct] = useState(0);
  const [resumeMsg, setResumeMsg] = useState("");
  const watched = useRef(new Set());
  const lastSentPct = useRef(0);
  const debounceTimer = useRef(null);

  /** ---------------------------------------------
   *  🔥 HLS OR MP4 AUTO DETECT + ATTACH
   *  (fully fixed for AWS long filenames)
   * --------------------------------------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
 console.log("🎥 [CustomVideoPlayer] src received:", src);
    let hls;

    // ⭐ FIXED HLS DETECTION
    const isHls = src.includes(".m3u8");

   if (Hls.isSupported() && isHls) {
  const hlsInstance = new Hls({
    autoStartLoad: true,
  });

  hlsInstance.loadSource(src);
  hlsInstance.attachMedia(video);

  hlsRef.current = hlsInstance;

  console.log("✅ HLS.js ATTACHED to video element");
  console.log("🎬 HLS Source URL:", src);

  // 🔴 HLS ERROR DEBUG (VERY IMPORTANT)
 hlsInstance.on(Hls.Events.ERROR, (event, data) => {
  // Ignore non-fatal buffer seek warnings
  if (data?.details === "bufferSeekOverHole" && data?.fatal === false) {
    console.warn("⚠️ HLS buffer hole (safe to ignore)");
    return;
  }

  console.error("❌ HLS ERROR:", data);
});

} else {
  console.log("⚠️ HLS NOT SUPPORTED, playing normally:", src);

  video.src = src;
  video.load();
}


    if (autoPlay) video.play().catch(() => {});
    return () => {
      if (hls) hls.destroy();
    };
  }, [src, autoPlay]);

  /* 🧠 Resume from backend (accurate seek) */
  useEffect(() => {
    if (!lessonId) return;
    const v = videoRef.current;
    if (!v) return;
    let resumed = false;
    let attempts = 0;

    const fetchAndSeek = async () => {
      try {
        const local = JSON.parse(
          localStorage.getItem(`videoProgress_${lessonId}`) || "{}"
        );
        const data = await getLessonProgress(lessonId);

        let resumeTime = 0;
        if (Number(data?.watchedSeconds) > 0)
          resumeTime = Number(data.watchedSeconds);
        else if (Number(local?.current) > 0)
          resumeTime = Number(local.current);

        if (data?.percent >= 100 && resumeTime === 0)
          resumeTime = Number(local?.current || 0);

        const safeResume = Math.max(
          0,
          Math.min(resumeTime - 0.5, (v.duration || 9999) - 1)
        );

        const trySeekAccurate = () => {
          if (resumed) return;
          attempts++;
          if (v.readyState >= 2 && v.duration > 0 && safeResume > 0) {
            v.currentTime = safeResume;
            resumed = true;
            console.log(`🎯 Resumed from ${safeResume.toFixed(2)}s`);
            setResumeMsg(
              `▶️ Resumed from ${Math.floor(safeResume / 60)}:${String(
                Math.floor(safeResume % 60)
              ).padStart(2, "0")}`
            );
            setTimeout(() => setResumeMsg(""), 2500);
            setTimeout(() => v.play().catch(() => {}), 200);
          } else if (attempts < 20) {
            setTimeout(trySeekAccurate, 250);
          }
        };

        v.addEventListener("loadedmetadata", trySeekAccurate);
        setTimeout(trySeekAccurate, 600);
      } catch (err) {
        console.warn("⚠️ getLessonProgress failed:", err?.message || err);
      }
    };

    fetchAndSeek();
  }, [lessonId, src]);

  /* detect duration */
  const onLoaded = useCallback(() => {
    const d = Math.floor(videoRef.current?.duration || 0);
    setDuration(d);
  }, []);

  /* 🧮 progress tracking all fix*/
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const d = Math.floor(v.duration || 0);
    const t = Math.floor(v.currentTime || 0);
    if (!d) return;

    watched.current.add(Math.max(0, Math.min(t, d)));
    const pct = Math.round((watched.current.size / Math.max(d, 1)) * 100);
    setLocalPct(pct);
    onProgress?.(pct);

    // store locally
    localStorage.setItem(
      `videoProgress_${lessonId}`,
      JSON.stringify({ current: v.currentTime, duration: d })
    );

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const send50 = pct >= 50 && lastSentPct.current < 50;
        const send95 = pct >= 95 && lastSentPct.current < 95;
        if (send50 || send95) {
          await putLessonProgress({
            lessonId,
            courseSlug,
            watchedSeconds: v.currentTime,
            duration: d,
            percent: pct,
          });
          lastSentPct.current = send95 ? 95 : 50;
          console.log("✅ Progress updated:", pct);
        }
      } catch (e) {
        console.warn("⚠️ Progress update failed", e);
      }
    }, 3000);
  }, [courseSlug, lessonId, onProgress]);

  /* ended → 100% */
  const handleEnded = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    const d = Math.floor(v.duration || 0);
    watched.current = new Set(Array.from({ length: d }, (_, i) => i + 1));
    setLocalPct(100);
    onProgress?.(100);
    localStorage.removeItem(`videoProgress_${lessonId}`);

    try {
      await putLessonProgress({
        lessonId,
        courseSlug,
        watchedSeconds: d,
        duration: d,
        percent: 100,
        completed: true,
      });
      lastSentPct.current = 100;
      console.log("🏁 Completed 100%");
    } catch {}
    onEnded?.();
  }, [courseSlug, lessonId, onEnded, onProgress]);

  /* cleanup */
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      try {
        hlsRef.current?.destroy();
      } catch {}
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#000",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          poster={poster}
          controls
          playsInline
          preload="auto"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#000",
          }}
        />

        {resumeMsg && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 13,
              animation: "fadeinout 2.5s ease",
            }}
          >
            {resumeMsg}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
        {duration > 0 ? (
          <>
            ⏱ Duration: {Math.floor(duration / 60)}m {Math.round(duration % 60)}s • Watched: {localPct}%
          </>
        ) : (
          <>⏱ Detecting duration...</>
        )}
      </div>
    </>
  );
}
