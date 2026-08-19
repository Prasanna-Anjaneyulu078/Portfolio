const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  jobTitle: { type: String, required: [true, 'Job title is required'], trim: true },
  company: { type: String, required: [true, 'Company name is required'], trim: true },
  location: { type: String, default: '', trim: true },
  employmentType: { 
    type: String, 
    default: 'Full-time', 
    trim: true
  },
  startDate: { type: String, required: [true, 'Start date is required'], trim: true },
  endDate: { type: String, default: '', trim: true },
  currentlyWorking: { type: Boolean, default: false },
  isCurrentlyWorking: { type: Boolean, default: false },
  description: { type: String, required: [true, 'Description is required'], trim: true },
  responsibilities: [{ type: String }],
  technologies: [{ type: String }],
  techStack: [{ type: String }]
}, { timestamps: true });

experienceSchema.pre('save', function () {
  const ongoing = Boolean(this.currentlyWorking || this.isCurrentlyWorking);
  this.currentlyWorking = ongoing;
  this.isCurrentlyWorking = ongoing;
  if (ongoing) {
    this.endDate = '';
  }

  // Synchronize technologies and techStack fields
  if ((!this.technologies || this.technologies.length === 0) && Array.isArray(this.techStack) && this.techStack.length > 0) {
    this.technologies = this.techStack;
  } else if ((!this.techStack || this.techStack.length === 0) && Array.isArray(this.technologies) && this.technologies.length > 0) {
    this.techStack = this.technologies;
  }
});

module.exports = mongoose.model('Experience', experienceSchema);
