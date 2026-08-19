const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  normalizedTitle: { type: String, index: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  imageUrl: { type: String, default: '' },
  imageHash: { type: String, index: true },
  techStack: [{ type: String }],
  category: { 
    type: String, 
    required: true, 
    enum: ['Full Stack', 'Frontend', 'Backend', 'AI / ML', 'Other'],
    default: 'Full Stack' 
  },
  displayPriority: { type: Number, default: 99, index: true },
  isVisible: { type: Boolean, default: true },
  codeUrl: { type: String, default: '' },
  normalizedCodeUrl: { type: String, index: true },
  demoUrl: { type: String, default: '' },
  normalizedDemoUrl: { type: String, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);