// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  eventType: String,
  page: String,
  timestamp: Date,
  timeSpent: Number,
  userAgent: String,
  event: String,
});

const Analytics = mongoose.model('Analytics', analyticsSchema); // Collection will be 'analytics'

router.post('/track', async (req, res) => {
  try {
    console.log("📥 Received analytics data:", req.body);
    const newEntry = new Analytics(req.body);
    await newEntry.save();
    console.log("✅ Saved to MongoDB");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error saving analytics:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
