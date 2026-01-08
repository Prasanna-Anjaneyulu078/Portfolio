const mongoose = require('mongoose');

const AcademicSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Keeping your client-side generated ID
  degree: { type: String, required: true, trim: true },
  institution: { type: String, required: true, trim: true },
  duration: { type: String, required: true },
  cgpa: { type: String, required: true }
});

const EducationSchema = new mongoose.Schema({
  coreObjective: {
    type: String,
    required: true,
    trim: true
  },
  academic: [AcademicSchema]
}, { timestamps: true });

module.exports = mongoose.model('Education', EducationSchema);