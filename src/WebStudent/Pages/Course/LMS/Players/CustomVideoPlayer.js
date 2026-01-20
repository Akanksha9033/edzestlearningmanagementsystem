

import React, { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  putLessonProgress,
  getLessonProgress,
} from "../../../../../utils/ProgressApi";
console.log("🔥 CF ENV AT BUILD =", process.env.REACT_APP_CLOUDFRONT_DOMAIN);
/* =====================================================
   ✅ CRA-safe CloudFront base
   ===================================================== */
const RAW_CF = process.env.REACT_APP_CLOUDFRONT_DOMAIN;

const CLOUDFRONT_BASE = RAW_CF
  ? (RAW_CF.startsWith("http") ? RAW_CF : `https://${RAW_CF}`)
  : "https://d3gvlfug24vd2e.cloudfront.net";



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
  const wrapperRef = useRef(null);

  const [duration, setDuration] = useState(0);
  const [localPct, setLocalPct] = useState(0);
  const [resumeMsg, setResumeMsg] = useState("");

  const watched = useRef(new Set());
  const lastSentPct = useRef(0);
  const debounceTimer = useRef(null);

  /* =====================================================
     🔥 HLS / MP4 attach (BUG FIXED)
     ===================================================== */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    console.log("🎥 [CustomVideoPlayer] src received:", src);

    let finalSrc = src;

    // ✅ FIX: correct CloudFront URL building
    if (!/^https?:\/\//i.test(src)) {
      if (!CLOUDFRONT_BASE) {
        console.error("❌ REACT_APP_CLOUDFRONT_DOMAIN missing");
        return;
      }

      const base = CLOUDFRONT_BASE.replace(/\/$/, "");
      const cleanSrc = String(src).replace(/^\//, "");

      if (/\.(m3u8|mp4|webm)(\?.*)?$/i.test(cleanSrc)) {
        finalSrc = `${base}/${cleanSrc}`;
      } else {
        finalSrc = `${base}/${cleanSrc}/index.m3u8`;
      }
    }

    console.log("🎬 FINAL VIDEO URL:", finalSrc);

    const isHls = finalSrc.includes(".m3u8");

    if (Hls.isSupported() && isHls) {
      const hls = new Hls({ autoStartLoad: true });

      hls.loadSource(finalSrc);
      hls.attachMedia(video);
      hlsRef.current = hls;

      console.log("✅ HLS.js attached");

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data?.details === "bufferSeekOverHole" && data?.fatal === false) {
          console.warn("⚠️ HLS buffer hole (safe)");
          return;
        }
        console.error("❌ HLS ERROR:", data);
      });
    } else {
      video.src = finalSrc;
      video.load();
    }

    if (autoPlay) video.play().catch(() => {});

    return () => {
      try {
        hlsRef.current?.destroy();
        hlsRef.current = null;
      } catch {}
    };
  }, [src, autoPlay]);

  /* =====================================================
     🧠 Resume logic (UNCHANGED)
     ===================================================== */
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

        const trySeek = () => {
          if (resumed) return;
          attempts++;
          if (v.readyState >= 2 && v.duration > 0 && safeResume > 0) {
            v.currentTime = safeResume;
            resumed = true;

            setResumeMsg(
              `▶️ Resumed from ${Math.floor(safeResume / 60)}:${String(
                Math.floor(safeResume % 60)
              ).padStart(2, "0")}`
            );
            setTimeout(() => setResumeMsg(""), 2500);
          } else if (attempts < 20) {
            setTimeout(trySeek, 250);
          }
        };

        v.addEventListener("loadedmetadata", trySeek);
        setTimeout(trySeek, 600);
      } catch (err) {
        console.warn("⚠️ getLessonProgress failed", err);
      }
    };

    fetchAndSeek();
  }, [lessonId, src]);

  /* =====================================================
     📊 Progress tracking (UNCHANGED)
     ===================================================== */
  const onLoaded = useCallback(() => {
    const d = Math.floor(videoRef.current?.duration || 0);
    setDuration(d);
  }, []);

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

    localStorage.setItem(
      `videoProgress_${lessonId}`,
      JSON.stringify({ current: v.currentTime, duration: d })
    );

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        if (
          (pct >= 50 && lastSentPct.current < 50) ||
          (pct >= 95 && lastSentPct.current < 95)
        ) {
          await putLessonProgress({
            lessonId,
            courseSlug,
            watchedSeconds: v.currentTime,
            duration: d,
            percent: pct,
          });
          lastSentPct.current = pct >= 95 ? 95 : 50;
        }
      } catch {}
    }, 3000);
  }, [courseSlug, lessonId, onProgress]);

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
    } catch {}

    onEnded?.();
  }, [courseSlug, lessonId, onEnded, onProgress]);

  /* =====================================================
     🎬 UI (UNCHANGED)
     ===================================================== */
  return (
    <>
      <div
        ref={wrapperRef}
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
      </div>

      <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
        {duration > 0 ? (
          <>
            ⏱ {Math.floor(duration / 60)}m {Math.round(duration % 60)}s • Watched{" "}
            {localPct}%
          </>
        ) : (
          <>⏱ Detecting duration...</>
        )}
      </div>
    </>
  );
}
