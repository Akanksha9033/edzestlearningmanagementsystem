// backend/models/VideoProgress.js
const mongoose = require("mongoose");

const VideoProgressSchema = new mongoose.Schema(
  {
    // ✅ store as plain string (supports both ObjectId and UUID)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // ✅ keep slug or courseId (string for both types)
    courseSlug: {
      type: String,
      index: true,
      default: "",
    },

    sectionId: {
      type: String,
      index: true,
      default: null,
    },

    lessonId: {
      type: String,
      required: true,
      index: true,
    },

    // ✅ progress data
    currentTime: {
      type: Number,
      default: 0, // in seconds
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// ✅ One row per user+lesson (avoid duplicate progress entries)
VideoProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model("VideoProgress", VideoProgressSchema);
