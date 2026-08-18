const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  normalizedTitle: { type: String, index: true },
  issuer: { type: String, required: true },
  normalizedIssuer: { type: String, index: true },
  issueDate: { type: String },
  expirationDate: { type: String },
  credentialId: { type: String },
  verificationUrl: { type: String },
  normalizedVerificationUrl: { type: String, index: true },
  imageUrl: { type: String },
  fileHash: { type: String, index: true },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Certification', certificationSchema);
