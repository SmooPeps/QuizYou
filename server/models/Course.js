const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g., "CS591"
  name: { type: String, required: true }, // e.g., "Software Engineering"
  description: { type: String },
  isLeaderboardEnabled: { type: Boolean, default: true },
  isTimerEnabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('Course', courseSchema);
