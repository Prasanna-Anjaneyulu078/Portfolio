// models/SkillGroup.js
const mongoose = require('mongoose');

const SkillGroupSchema = new mongoose.Schema({
  title: { type: String, required: true },
  skills: [{ type: String }],
});

module.exports = mongoose.model('SkillGroup', SkillGroupSchema);

