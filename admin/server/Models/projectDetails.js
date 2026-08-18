const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  normalizedTitle: { type: String, index: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imageHash: { type: String, index: true },
  tags: [{ type: String }],
  techStack: [{ type: String }],
  category: { type: String, required: true },
  codeUrl: { type: String },
  normalizedCodeUrl: { type: String, index: true },
  demoUrl: { type: String },
  normalizedDemoUrl: { type: String, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  featuredOrder: { type: Number, default: null, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);