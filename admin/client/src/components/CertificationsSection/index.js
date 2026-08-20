import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import { fileToBase64 } from '../../utils/fileHelpers';
import './index.css';

import { API_BASE_URL } from '../../config/api';

const PRIMARY_API_URL = `${API_BASE_URL}/certifications`;

const apiCall = async (method, endpoint = '', data = null) => {
  try {
    const url = `${PRIMARY_API_URL}${endpoint}`;
    return await axios({ method, url, data });
  } catch (primaryErr) {
    if (primaryErr.response?.status === 404 || primaryErr.code === 'ERR_NETWORK' || !primaryErr.response) {
      const fallbackUrl = `${LOCAL_API_URL}${endpoint}`;
      return await axios({ method, url: fallbackUrl, data });
    }
    throw primaryErr;
  }
};

const resolveFileUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  const apiBase = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:3002';
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBase}${cleanPath}`;
};

const detectFileType = (urlStr) => {
  if (!urlStr) return { isPdf: false, isImage: false };
  const lower = urlStr.toLowerCase();
  if (lower.startsWith('data:application/pdf') || lower.includes('.pdf')) {
    return { isPdf: true, isImage: false };
  }
  return { isPdf: false, isImage: true };
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];

const AdminPdfPreview = ({ fileUrl, title }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="cert-pdf-badge-box">
        <span className="material-symbols-outlined icon-pdf">picture_as_pdf</span>
        <span className="pdf-label">PDF Certificate Document</span>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-cert-preview"
        >
          View PDF ↗
        </a>
      </div>
    );
  }

  return (
    <div className="admin-pdf-frame-wrapper">
      <object
        data={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        type="application/pdf"
        className="admin-pdf-object"
        onError={() => setHasError(true)}
      >
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          title={title || 'PDF Certificate'}
          className="admin-pdf-iframe"
          onError={() => setHasError(true)}
        >
          <div className="cert-pdf-badge-box">
            <span className="material-symbols-outlined icon-pdf">picture_as_pdf</span>
            <span className="pdf-label">PDF Certificate Document</span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cert-preview"
            >
              View PDF ↗
            </a>
          </div>
        </iframe>
      </object>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-cert-preview-overlay"
        title="Open PDF in new tab"
      >
        <span className="material-symbols-outlined">visibility</span>
        View PDF ↗
      </a>
    </div>
  );
};

const CertificationsSection = () => {
  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const [certForm, setCertForm] = useState({
    title: "",
    issuingOrganization: "",
    issueDate: "",
    credentialId: "",
    verificationUrl: "",
    certificateFileUrl: "",
    displayOrder: 0,
    isVisible: true
  });

  const fetchCertifications = async () => {
    try {
      setIsLoading(true);
      const res = await apiCall('get');
      setCertifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Certifications fetch notice:", err.message);
      setCertifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  // Sorted certifications list adhering strictly to Admin displayOrder
  const sortedCertifications = React.useMemo(() => {
    if (!Array.isArray(certifications)) return [];
    return [...certifications].sort((a, b) => {
      const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : typeof a.order === 'number' ? a.order : 0;
      const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : typeof b.order === 'number' ? b.order : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return String(a._id || '').localeCompare(String(b._id || ''));
    });
  }, [certifications]);

  const validate = () => {
    const newErrors = {};
    const titleClean = certForm.title?.trim();
    if (!titleClean) {
      newErrors.title = "Certification title is required";
    } else if (titleClean.length > 150) {
      newErrors.title = "Title cannot exceed 150 characters";
    }

    const orgClean = certForm.issuingOrganization?.trim();
    if (!orgClean) {
      newErrors.issuingOrganization = "Issuing organization is required";
    }

    const dateClean = certForm.issueDate?.trim();
    if (!dateClean) {
      newErrors.issueDate = "Issue date is required";
    }

    if (certForm.verificationUrl?.trim() && !/^https?:\/\/.+/i.test(certForm.verificationUrl.trim())) {
      newErrors.verificationUrl = "Enter a valid URL starting with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingCert(null);
    setCertForm({
      title: "",
      issuingOrganization: "",
      issueDate: "",
      credentialId: "",
      verificationUrl: "",
      certificateFileUrl: "",
      displayOrder: certifications.length + 1,
      isVisible: true
    });
    setErrors({});
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cert) => {
    setEditingCert(cert);
    setCertForm({
      title: cert.title || "",
      issuingOrganization: cert.issuingOrganization || cert.issuer || "",
      issueDate: cert.issueDate || "",
      credentialId: cert.credentialId || "",
      verificationUrl: cert.verificationUrl || "",
      certificateFileUrl: cert.certificateFileUrl || cert.imageUrl || "",
      displayOrder: typeof cert.displayOrder === 'number' ? cert.displayOrder : typeof cert.order === 'number' ? cert.order : 0,
      isVisible: cert.isVisible !== false && cert.isActive !== false
    });
    setErrors({});
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCert(null);
    setErrors({});
    setSelectedFile(null);
  };

  const handleSave = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalFileUrl = certForm.certificateFileUrl;
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (uploadRes.data && uploadRes.data.success) {
          finalFileUrl = uploadRes.data.fileUrl;
        }
      }

      const parsedOrder = parseInt(certForm.displayOrder, 10) || 0;
      const payload = {
        _id: editingCert ? editingCert._id : undefined,
        title: certForm.title.trim(),
        issuingOrganization: certForm.issuingOrganization.trim(),
        issuer: certForm.issuingOrganization.trim(),
        issueDate: certForm.issueDate.trim(),
        credentialId: certForm.credentialId.trim(),
        verificationUrl: certForm.verificationUrl.trim(),
        certificateFileUrl: finalFileUrl,
        imageUrl: finalFileUrl,
        displayOrder: parsedOrder,
        order: parsedOrder,
        isVisible: certForm.isVisible,
        isActive: certForm.isVisible
      };

      await apiCall('post', '/save', payload);
      await fetchCertifications();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save certification.";
      const field = err.response?.data?.field || "general";
      setErrors(prev => ({ ...prev, [field]: msg, general: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete certification "${title || 'item'}"?\nThis action cannot be undone.`)) return;
    try {
      await apiCall('delete', `/${id}`);
      fetchCertifications();
    } catch (err) {
      console.error("Delete Error:", err.message);
    }
  };

  const handleToggleVisibility = async (cert) => {
    try {
      await apiCall('patch', `/${cert._id}/status`);
      fetchCertifications();
    } catch (err) {
      console.error("Toggle Status Error:", err.message);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors(prev => ({
        ...prev,
        certificateFileUrl: `File size exceeds limit of 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB selected)`
      }));
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setErrors(prev => ({
        ...prev,
        certificateFileUrl: "Unsupported file type. Please upload PNG, JPG, JPEG, SVG, or PDF."
      }));
      return;
    }

    try {
      const previewUrl = URL.createObjectURL(file);
      setCertForm(prev => ({ ...prev, certificateFileUrl: previewUrl }));
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, certificateFileUrl: null }));
    } catch (err) {
      console.error("File Conversion Error:", err);
      setErrors(prev => ({ ...prev, certificateFileUrl: "Failed to read file. Please try again." }));
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading certifications">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Certifications...</p>
      </div>
    );
  }

  return (
    <section className="section-container" id="certifications">
      {/* Dashboard Page Header */}
      <div className="section-title-row">
        <div className="section-header">
          <h3>Certifications Management</h3>
          <p className="section-subtext">
            Add, edit, and organize display priority for your verified credentials.
          </p>
        </div>
        <button className="btn-add-project" onClick={openAddModal}>
          <span className="material-symbols-outlined">add_circle</span>
          New Certification
        </button>
      </div>

      {/* Certifications Dashboard Cards Grid */}
      {sortedCertifications.length === 0 ? (
        <div className="empty-cert-card-box">
          <span className="material-symbols-outlined icon-giant">workspace_premium</span>
          <div className="empty-text-group">
            <h4>No Certifications Added</h4>
            <p>Add your first certification to display it on your portfolio.</p>
          </div>
          <button className="btn-primary-action" onClick={openAddModal}>
            + New Certification
          </button>
        </div>
      ) : (
        <div className="certifications-admin-grid">
          {sortedCertifications.map((cert) => {
            const isPublic = cert.isVisible !== false && cert.isActive !== false;
            const rawFileUrl = cert.certificateFileUrl || cert.imageUrl;
            const fileUrl = resolveFileUrl(rawFileUrl);
            const { isPdf } = detectFileType(fileUrl);
            const issuerName = cert.issuingOrganization || cert.issuer;
            const certOrder = typeof cert.displayOrder === 'number' ? cert.displayOrder : typeof cert.order === 'number' ? cert.order : 0;

            return (
              <div key={cert._id} className={`admin-cert-card ${!isPublic ? 'is-hidden' : ''}`}>
                {/* Visual Header Frame - Aspect Ratio Preserving Container */}
                <div className="cert-card-visual-frame">
                  {fileUrl ? (
                    isPdf ? (
                      <AdminPdfPreview fileUrl={fileUrl} title={cert.title} />
                    ) : (
                      <div className="cert-image-preview-wrapper">
                        <img
                          src={fileUrl}
                          alt={cert.title}
                          className="cert-thumb-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-cert-preview-overlay"
                          title="View Full Certificate Image"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                          View Certificate ↗
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="cert-no-image-box">
                      <span className="material-symbols-outlined">workspace_premium</span>
                      <span className="no-file-text">No File Uploaded</span>
                    </div>
                  )}
                </div>

                {/* Card Body Information */}
                <div className="cert-card-body">
                  <div className="cert-card-title-row">
                    <h4 className="cert-card-title">{cert.title}</h4>
                    <span className={`cert-status-tag ${isPublic ? 'active' : 'hidden'}`}>
                      {isPublic ? '● Active & Visible' : '○ Hidden'}
                    </span>
                  </div>

                  {issuerName && <p className="cert-card-issuer">{issuerName}</p>}

                  <div className="cert-card-metadata">
                    {cert.issueDate && (
                      <div className="cert-meta-item">
                        <span className="material-symbols-outlined">event</span>
                        <span>Issued: {cert.issueDate}</span>
                      </div>
                    )}

                    {cert.credentialId && cert.credentialId.trim() !== '' && (
                      <div className="cert-meta-item">
                        <span className="material-symbols-outlined">badge</span>
                        <span>ID: {cert.credentialId}</span>
                      </div>
                    )}

                    <div className="cert-meta-item">
                      <span className="material-symbols-outlined">format_list_numbered</span>
                      <span>Display Order: #{certOrder}</span>
                    </div>
                  </div>

                  {/* Verification URL Link */}
                  {cert.verificationUrl && cert.verificationUrl.trim() !== '' && (
                    <a
                      href={cert.verificationUrl.startsWith('http') ? cert.verificationUrl : `https://${cert.verificationUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-verify-credential"
                    >
                      Verify Credential
                      <span className="material-symbols-outlined">open_in_new</span>
                    </a>
                  )}

                  {/* Card Management Action Toolbar */}
                  <div className="cert-card-actions">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-card-action view"
                        title="View Full File"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                        View
                      </a>
                    )}

                    <button
                      className="btn-card-action edit"
                      onClick={() => openEditModal(cert)}
                      title="Edit Certification"
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">edit</span>
                      Edit
                    </button>

                    <button
                      className={`btn-card-action visibility ${isPublic ? 'active' : ''}`}
                      onClick={() => handleToggleVisibility(cert)}
                      title={isPublic ? 'Hide from Portfolio' : 'Show on Portfolio'}
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">
                        {isPublic ? 'visibility_off' : 'visibility'}
                      </span>
                      {isPublic ? 'Hide' : 'Show'}
                    </button>

                    <button
                      className="btn-card-action delete"
                      onClick={() => handleDelete(cert._id, cert.title)}
                      title="Delete Certification"
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for Certification Form (Create / Edit) */}
      <Modal
        title={editingCert ? 'Edit Certification' : 'Add New Certification'}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="cert-form"
        >
          {errors.general && (
            <div className="form-error-banner" role="alert">
              <span className="material-symbols-outlined">error</span>
              {errors.general}
            </div>
          )}

          <div className="cert-form-grid">
            <div className="form-group">
              <label className="form-label">Certification Title *</label>
              <input
                type="text"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Python Programming"
                value={certForm.title}
                onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Issuing Organization *</label>
              <input
                type="text"
                className={`form-input ${errors.issuingOrganization ? 'error' : ''}`}
                placeholder="e.g. Great Learning, Coursera, AWS"
                value={certForm.issuingOrganization}
                onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.issuingOrganization && <span className="error-text">{errors.issuingOrganization}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Issue Date *</label>
              <input
                type="text"
                className={`form-input ${errors.issueDate ? 'error' : ''}`}
                placeholder="e.g. May 2026 or YYYY-MM-DD"
                value={certForm.issueDate}
                onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.issueDate && <span className="error-text">{errors.issueDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Credential ID (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. GL-12345"
                value={certForm.credentialId}
                onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Display Order / Priority Number</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 1, 2, 3..."
                value={certForm.displayOrder}
                onChange={(e) => setCertForm({ ...certForm, displayOrder: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group span-2">
              <label className="form-label">Verification URL (Optional)</label>
              <input
                type="url"
                className={`form-input ${errors.verificationUrl ? 'error' : ''}`}
                placeholder="https://provider.com/verify/ABC123"
                value={certForm.verificationUrl}
                onChange={(e) => setCertForm({ ...certForm, verificationUrl: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.verificationUrl && <span className="error-text">{errors.verificationUrl}</span>}
            </div>

            {/* Certificate File Upload & Instant Preview Box */}
            <div className="form-group span-2">
              <label className="form-label">Certificate File (PNG, JPG, JPEG, SVG or PDF up to 5MB)</label>
              
              {certForm.certificateFileUrl ? (
                <div className="modal-cert-preview-box">
                  <div className="modal-preview-header">
                    <span className="preview-label-title">Selected Certificate Preview:</span>
                    <button
                      type="button"
                      className="btn-link-action remove"
                      onClick={() => {
                        setCertForm({ ...certForm, certificateFileUrl: '' });
                        setSelectedFile(null);
                      }}
                      disabled={isSubmitting}
                    >
                      Remove File
                    </button>
                  </div>

                  <div className="modal-preview-media-frame">
                    {detectFileType(resolveFileUrl(certForm.certificateFileUrl)).isPdf ? (
                      <AdminPdfPreview
                        fileUrl={resolveFileUrl(certForm.certificateFileUrl)}
                        title={certForm.title}
                      />
                    ) : (
                      <img
                        src={resolveFileUrl(certForm.certificateFileUrl)}
                        alt="Certificate Preview"
                        className="modal-cert-img"
                      />
                    )}
                  </div>
                </div>
              ) : null}

              <div className="cert-upload-dropzone">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,application/pdf"
                  onChange={handleFileChange}
                  id="cert-file-upload"
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
                />
                <label htmlFor="cert-file-upload" className="upload-dropzone-label">
                  <span className="material-symbols-outlined">upload_file</span>
                  <div className="dropzone-text">
                    <p className="main-text">
                      {certForm.certificateFileUrl ? 'Click to Replace Certificate File' : 'Click to Upload Certificate File'}
                    </p>
                    <p className="sub-text">PNG, JPG, JPEG, SVG or PDF up to 5MB</p>
                  </div>
                </label>
              </div>
              {errors.certificateFileUrl && (
                <span className="error-text block">{errors.certificateFileUrl}</span>
              )}
            </div>

            <div className="form-group span-2">
              <label className="checkbox-label flex-row">
                <input
                  type="checkbox"
                  checked={certForm.isVisible}
                  onChange={(e) => setCertForm({ ...certForm, isVisible: e.target.checked })}
                  disabled={isSubmitting}
                />
                <span>Show on User Portfolio (Active & Visible)</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default CertificationsSection;
