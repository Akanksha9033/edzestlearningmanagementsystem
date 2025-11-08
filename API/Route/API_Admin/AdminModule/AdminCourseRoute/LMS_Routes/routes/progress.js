// routes/progress.js
const express = require('express');
const router = express.Router();

// in-memory store (demo)
const store = new Map();
const key = (u,l)=>`${u}::${l}`;

router.get('/ping', (req,res)=>{
  res.json({ ok:true, ts:new Date().toISOString() });
});

// GET /api/progress/status?userId=u1&lessonId=abc123
router.get('/status', (req,res)=>{
  const { userId, lessonId } = req.query;
  if (!userId || !lessonId) {
    return res.status(400).json({ message:'userId & lessonId required' });
  }
  const rec = store.get(key(userId, lessonId)) || { completed:false, secondsWatched:0, duration:null };
  res.json(rec);
});

// POST /api/progress/update  { userId, lessonId, secondsWatched, duration }
router.post('/update', express.json(), (req,res)=>{
  const { userId, lessonId, secondsWatched=0, duration=null } = req.body || {};
  if (!userId || !lessonId) return res.status(400).json({ message:'userId & lessonId required' });

  const k = key(userId, lessonId);
  const prev = store.get(k) || { completed:false, secondsWatched:0, duration:null };
  const next = {
    completed: prev.completed,
    secondsWatched: Math.max(Number(prev.secondsWatched)||0, Number(secondsWatched)||0),
    duration: duration ?? prev.duration ?? null,
  };
  store.set(k, next);
  res.json({ ok:true, ...next });
});

// POST /api/progress/complete  { userId, lessonId }
router.post('/complete', express.json(), (req,res)=>{
  const { userId, lessonId } = req.body || {};
  if (!userId || !lessonId) return res.status(400).json({ message:'userId & lessonId required' });

  const k = key(userId, lessonId);
  const prev = store.get(k) || { secondsWatched:0, duration:null };
  const next = { completed:true, secondsWatched: prev.secondsWatched||0, duration: prev.duration??null };
  store.set(k, next);
  res.json({ ok:true, ...next });
});

module.exports = router;
