// models/CodingProfile.js
const mongoose = require('mongoose')

const CodingProfileSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, default: 'code' },
  color: { type: String, default: 'leetcode-orange' }
});

module.exports = mongoose.model('CodingProfile', CodingProfileSchema);