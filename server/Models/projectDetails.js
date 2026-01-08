const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  tags: [{ type: String }],
  techStack: [{ type: String }],
  category: { type: String, required: true }, // Add this line (e.g., 'Full Stack', 'Front End')
  codeUrl: { type: String },
  demoUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);