import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import { fileToBase64 } from '../../utils/fileHelpers';
import './index.css';

const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'https://prasanna-portfolio-admin.vercel.app/api/certifications';
const LOCAL_API_URL = 'http://localhost:3002/api/certifications';

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

const CertificationsSection = () => {
  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [errors, setErrors] = useState({});

  const [certForm, setCertForm] = useState({
    title: "",
    issuer: "",
    issueDate: "",
    expirationDate: "",
    credentialId: "",
    verificationUrl: "",
    imageUrl: "",
    displayOrder: 0,
    isActive: true
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

  const validate = () => {
    const newErrors = {};
    if (!certForm.title?.trim()) newErrors.title = "Certification title is required";
    if (!certForm.issuer?.trim()) newErrors.issuer = "Issuing organization is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingCert(null);
    setCertForm({
      title: "",
      issuer: "",
      issueDate: "",
      expirationDate: "",
      credentialId: "",
      verificationUrl: "",
      imageUrl: "",
      displayOrder: certifications.length + 1,
      isActive: true
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cert) => {
    setEditingCert(cert);
    setCertForm({
      title: cert.title || "",
      issuer: cert.issuer || "",
      issueDate: cert.issueDate || "",
      expirationDate: cert.expirationDate || "",
      credentialId: cert.credentialId || "",
      verificationUrl: cert.verificationUrl || "",
      imageUrl: cert.imageUrl || "",
      displayOrder: cert.displayOrder ?? 0,
      isActive: cert.isActive ?? true
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const payload = {
        ...certForm,
        _id: editingCert ? editingCert._id : undefined
      };
      await apiCall('post', '/save', payload);
      await fetchCertifications();
      setIsModalOpen(false);
      setEditingCert(null);
      setErrors({});
    } catch (err) {
      console.error("Save Error:", err.message);
      alert("Failed to save certification. Please check backend connection.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this certification?")) return;
    try {
      await apiCall('delete', `/${id}`);
      fetchCertifications();
    } catch (err) {
      console.error("Delete Error:", err.message);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiCall('patch', `/${id}/status`);
      fetchCertifications();
    } catch (err) {
      console.error("Toggle Status Error:", err.message);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setCertForm({ ...certForm, imageUrl: base64 });
      } catch (err) {
        console.error("File Error:", err);
      }
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
      <div className="section-title-row">
        <div className="section-header">
          <h3>Certifications</h3>
          <p>Manage your professional credentials, licenses, and verified certificates.</p>
        </div>
        <button className="btn-add-project" onClick={openAddModal}>
          <span className="material-symbols-outlined">workspace_premium</span>
          Add Certification
        </button>
      </div>

      <div className="projects-display-wrapper">
        {certifications.length === 0 ? (
          <div className="empty-projects-canvas">
            <span className="material-symbols-outlined icon-giant">workspace_premium</span>
            <div className="empty-text-group">
              <h4>No Certifications Added Yet</h4>
              <p>Add your earned certificates and licenses to display them on your portfolio.</p>
            </div>
            <button className="btn-primary-action" onClick={openAddModal}>
              Add Your First Certification
            </button>
          </div>
        ) : (
          <div className="projects-table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th className="th-thumb">Badge</th>
                  <th className="th-identity">Certification & Issuer</th>
                  <th className="th-tags">Dates & ID</th>
                  <th className="th-stack">Status</th>
                  <th className="th-links">Verify Link</th>
                  <th className="th-actions">Manage</th>
                </tr>
              </thead>
              <tbody>
                {certifications.map((cert) => (
                  <tr key={cert._id} className={!cert.isActive ? 'tr-disabled' : ''}>
                    <td>
                      <div 
                        className="table-thumb-box" 
                        style={{ backgroundImage: cert.imageUrl ? `url(${cert.imageUrl})` : 'none' }}
                      >
                        {!cert.imageUrl && (
                          <span className="material-symbols-outlined">verified</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-identity-block">
                        <span className="table-title-main">{cert.title}</span>
                        <span className="table-chip-tag" style={{ fontSize: '11px', width: 'fit-content' }}>
                          {cert.issuer}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="cert-dates-block">
                        {cert.issueDate && <span className="cert-date-text">Issued: {cert.issueDate}</span>}
                        {cert.credentialId && <span className="cert-id-text">ID: {cert.credentialId}</span>}
                      </div>
                    </td>
                    <td>
                      <button 
                        className={`cert-status-badge ${cert.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(cert._id)}
                        title="Click to toggle visibility"
                      >
                        <span className="material-symbols-outlined">
                          {cert.isActive ? 'visibility' : 'visibility_off'}
                        </span>
                        {cert.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <div className="table-link-group">
                        {cert.verificationUrl ? (
                          <a 
                            href={cert.verificationUrl.startsWith('http') ? cert.verificationUrl : `https://${cert.verificationUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="table-nav-link demo-accent"
                            title="Verify Certificate"
                          >
                            <span className="material-symbols-outlined">open_in_new</span>
                          </a>
                        ) : (
                          <span className="text-muted-small">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-btn-group">
                        <button onClick={() => openEditModal(cert)} className="table-btn-icon edit-btn" title="Edit">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => handleDelete(cert._id)} className="table-btn-icon delete-btn" title="Delete">
                          <span className="material-symbols-outlined">delete_forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        title={editingCert ? "Refine Certification" : "Add New Certification"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
      >
        <div className="project-form-container">
          <div className="form-group-box">
            <h6 className="group-label">Credential Identity</h6>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Certification Title</label>
                <input 
                  type="text" 
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g. AWS Certified Solutions Architect" 
                  value={certForm.title} 
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                />
                {errors.title && <span className="form-error-msg">{errors.title}</span>}
              </div>

              <div className="form-field">
                <label>Issuing Organization</label>
                <input 
                  type="text" 
                  className={`form-input ${errors.issuer ? 'error' : ''}`}
                  placeholder="e.g. Amazon Web Services, Meta, Google" 
                  value={certForm.issuer} 
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                />
                {errors.issuer && <span className="form-error-msg">{errors.issuer}</span>}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>Issue Date</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Aug 2024" 
                  value={certForm.issueDate} 
                  onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Credential / License ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. AWS-12345678" 
                  value={certForm.credentialId} 
                  onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group-box">
            <h6 className="group-label">Verification & Image</h6>
            <div className="form-field">
              <label>Verification URL</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://www.credly.com/org/..." 
                value={certForm.verificationUrl} 
                onChange={(e) => setCertForm({ ...certForm, verificationUrl: e.target.value })}
              />
            </div>

            <div className="project-upload-area">
              {certForm.imageUrl ? (
                <div className="upload-preview-active">
                  <img src={certForm.imageUrl || null} alt="Certificate Badge" />
                  <div className="upload-actions-overlay">
                    <label className="btn-overlay-change">
                      <span className="material-symbols-outlined">sync</span> Replace
                      <input type="file" accept="image/*" className="hidden-input" onChange={handleFileChange} />
                    </label>
                    <button type="button" className="btn-overlay-remove" onClick={() => setCertForm({ ...certForm, imageUrl: "" })}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="upload-placeholder-zone">
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  <div className="placeholder-text">
                    <p className="main-p">Upload Certificate Badge / Image</p>
                    <p className="sub-p">PNG, JPG, SVG up to 5MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden-input" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div className="form-group-box">
            <h6 className="group-label">Settings</h6>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Display Order</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="0" 
                  value={certForm.displayOrder} 
                  onChange={(e) => setCertForm({ ...certForm, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="form-field checkbox-field-wrapper">
                <label className="checkbox-label-styled">
                  <input 
                    type="checkbox" 
                    checked={certForm.isActive} 
                    onChange={(e) => setCertForm({ ...certForm, isActive: e.target.checked })}
                  />
                  <span>Active & Visible on Portfolio</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default CertificationsSection;
