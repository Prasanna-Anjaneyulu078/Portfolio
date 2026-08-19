const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Certification title is required'], trim: true },
  issuingOrganization: { type: String, default: '', trim: true },
  issuer: { type: String, default: '', trim: true },
  issueDate: { type: String, default: '', trim: true },
  credentialId: { type: String, default: '', trim: true },
  verificationUrl: { type: String, default: '', trim: true },
  certificateFileUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Synchronous pre-save hook in Mongoose 6+
certificationSchema.pre('save', function () {
  const org = this.issuingOrganization || this.issuer || '';
  this.issuingOrganization = org;
  this.issuer = org;

  const file = this.certificateFileUrl || this.imageUrl || '';
  this.certificateFileUrl = file;
  this.imageUrl = file;

  if (this.isVisible !== undefined) {
    this.isActive = Boolean(this.isVisible);
  }

  const numOrder = typeof this.displayOrder === 'number' ? this.displayOrder : typeof this.order === 'number' ? parseInt(this.order, 10) || 0 : 0;
  this.displayOrder = numOrder;
  this.order = numOrder;
});

module.exports = mongoose.model('Certification', certificationSchema);
