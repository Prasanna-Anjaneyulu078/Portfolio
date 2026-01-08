const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    url: { type: String, required: true }, // Stores the Base64 String 
    uploadedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false }
});

module.exports = mongoose.model('Resume', ResumeSchema);