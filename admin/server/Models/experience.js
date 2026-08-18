const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  employmentType: { 
    type: String, 
    default: 'Full-time', 
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Self-employed']
  },
  startDate: { type: String, required: true },
  endDate: { type: String },
  currentlyWorking: { type: Boolean, default: false },
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  technologies: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Experience', experienceSchema);
