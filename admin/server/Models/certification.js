const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: String },
  expirationDate: { type: String },
  credentialId: { type: String },
  verificationUrl: { type: String },
  imageUrl: { type: String },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Certification', certificationSchema);
