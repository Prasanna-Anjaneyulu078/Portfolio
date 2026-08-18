const mongoose = require('mongoose');

const AcademicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  degree: { type: String, required: true, trim: true },
  institution: { type: String, required: true, trim: true },
  duration: { type: String, required: true },
  cgpa: { type: String, required: true }
});

const EducationSchema = new mongoose.Schema({
  academic: [AcademicSchema]
}, { timestamps: true });

module.exports = mongoose.model('Education', EducationSchema);