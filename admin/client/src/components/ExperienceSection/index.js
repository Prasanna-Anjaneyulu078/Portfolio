import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import './index.css';

import { API_BASE_URL } from '../../config/api';

const PRIMARY_API_URL = `${API_BASE_URL}/experiences`;

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

const extractTechList = (exp) => {
  if (!exp) return [];
  const rawTech = exp.technologies || exp.techStack || exp.technologyStack || exp.tech || exp.tags || exp.skills || [];
  if (Array.isArray(rawTech)) {
    return rawTech
      .flatMap(item => typeof item === 'string' ? item.split(',') : (item?.name || item?.label || String(item)))
      .map(t => typeof t === 'string' ? t.trim() : '')
      .filter(Boolean);
  }
  if (typeof rawTech === 'string') {
    return rawTech.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
};

const INITIAL_FORM = {
  jobTitle: '',
  company: '',
  location: '',
  employmentType: 'Full-time',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  description: '',
  responsibilitiesText: '',
  technologies: [],
  techInput: ''
};

const EMPLOYMENT_OPTIONS = [
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
  'Freelance',
  'Self-employed',
  'Temporary',
  'Volunteer',
  'Other'
];

const ExperienceSection = ({ onUpdate }) => {
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items state
  const [editingExp, setEditingExp] = useState(null);
  const [deletingExp, setDeletingExp] = useState(null);

  // Form & Error state
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const fetchExperiences = async () => {
    try {
      setIsLoading(true);
      const res = await apiCall('get');
      const data = Array.isArray(res.data) ? res.data : [];
      setExperiences(data);
      if (onUpdate) {
        onUpdate(prev => ({ ...prev, experiences: data }));
      }
    } catch (err) {
      console.warn("Error fetching experiences:", err.message);
      setExperiences([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.jobTitle?.trim()) newErrors.jobTitle = "Job Title is required.";
    if (!form.company?.trim()) newErrors.company = "Company Name is required.";
    if (!form.startDate?.trim()) newErrors.startDate = "Start Date is required.";

    if (!form.currentlyWorking) {
      if (!form.endDate?.trim()) {
        newErrors.endDate = "End Date is required unless currently working.";
      } else if (form.startDate && form.endDate) {
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
          newErrors.endDate = "End Date cannot be earlier than Start Date.";
        }
      }
    }

    if (!form.description?.trim()) newErrors.description = "Short Professional Description is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingExp(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (exp) => {
    setEditingExp(exp);
    setForm({
      jobTitle: exp.jobTitle || '',
      company: exp.company || '',
      location: exp.location || '',
      employmentType: exp.employmentType || 'Full-time',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      currentlyWorking: Boolean(exp.currentlyWorking || exp.isCurrentlyWorking),
      description: exp.description || '',
      responsibilitiesText: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : exp.responsibilities || '',
      technologies: extractTechList(exp),
      techInput: ''
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (exp) => {
    setDeletingExp(exp);
    setIsDeleteModalOpen(true);
  };

  // Tech Tag Handlers
  const handleAddTech = () => {
    if (!form.techInput?.trim()) return;
    const tag = form.techInput.trim();
    if (!form.technologies.includes(tag)) {
      setForm(prev => ({
        ...prev,
        technologies: [...prev.technologies, tag],
        techInput: ''
      }));
    } else {
      setForm(prev => ({ ...prev, techInput: '' }));
    }
  };

  const handleRemoveTech = (tagToRemove) => {
    setForm(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tagToRemove)
    }));
  };

  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTech();
    }
  };

  // Save Experience
  const handleSave = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const responsibilitiesArray = form.responsibilitiesText
        ? form.responsibilitiesText.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      let currentTech = [...form.technologies];
      if (form.techInput?.trim()) {
        const pendingTag = form.techInput.trim();
        if (!currentTech.includes(pendingTag)) {
          currentTech.push(pendingTag);
        }
      }
      const finalTech = Array.from(new Set(currentTech.map(t => t.trim()).filter(Boolean)));

      const payload = {
        _id: editingExp ? editingExp._id : undefined,
        jobTitle: form.jobTitle.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType,
        startDate: form.startDate.trim(),
        endDate: form.currentlyWorking ? '' : form.endDate.trim(),
        currentlyWorking: form.currentlyWorking,
        isCurrentlyWorking: form.currentlyWorking,
        description: form.description.trim(),
        responsibilities: responsibilitiesArray,
        technologies: finalTech,
        techStack: finalTech
      };

      const endpoint = editingExp ? `/${editingExp._id}` : '/save';
      const method = editingExp ? 'put' : 'post';

      await apiCall(method, endpoint, payload);
      await fetchExperiences();

      setIsFormModalOpen(false);
      setEditingExp(null);
      setForm(INITIAL_FORM);
      setErrors({});

      showToast('success', editingExp ? "Experience updated successfully." : "Experience added successfully.");
    } catch (err) {
      console.error("Save Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to save experience.";
      showToast('error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Experience
  const handleDelete = async () => {
    if (!deletingExp || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiCall('delete', `/${deletingExp._id}`);
      await fetchExperiences();
      setIsDeleteModalOpen(false);
      setDeletingExp(null);
      showToast('success', "Experience deleted successfully.");
    } catch (err) {
      console.error("Delete Error:", err);
      showToast('error', err.response?.data?.message || "Failed to delete experience.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateStr = (dStr) => {
    if (!dStr) return '';
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(dStr)) {
      const parts = dStr.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parts[2] ? parseInt(parts[2]) : 1;
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return dStr;
  };

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading experiences">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Experience Data...</p>
      </div>
    );
  }

  return (
    <section className="section-container experience-section-container" id="experience">
      {/* Page Header */}
      <div className="section-title-row">
        <div className="section-header">
          <h3>Experience Management</h3>
          <p>Manage professional experience, internships, and work history.</p>
        </div>
        <button className="btn-add-project" onClick={openAddModal}>
          <span className="material-symbols-outlined">add</span>
          Add Experience
        </button>
      </div>

      {/* Toast alert */}
      {toast.message && (
        <div className={`toast-alert ${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}

      {/* Experience Timeline or Empty State */}
      <div className="experience-display-wrapper">
        {experiences.length === 0 ? (
          <div className="empty-projects-canvas">
            <span className="material-symbols-outlined icon-giant">business_center</span>
            <div className="empty-text-group">
              <h4>No Experience Added</h4>
              <p>Add your first professional experience to display it on your portfolio.</p>
            </div>
            <button className="btn-primary-action" onClick={openAddModal}>
              <span className="material-symbols-outlined">add</span> Add Experience
            </button>
          </div>
        ) : (
          <div className="experience-timeline-admin">
            {experiences.map((exp) => {
              const isOngoing = Boolean(exp.currentlyWorking || exp.isCurrentlyWorking);
              const startFormatted = formatDateStr(exp.startDate);
              const endFormatted = isOngoing ? 'Present' : formatDateStr(exp.endDate);
              const durationText = startFormatted && endFormatted
                ? `${startFormatted} — ${endFormatted}`
                : (startFormatted || endFormatted);

              const techList = extractTechList(exp);

              return (
                <div key={exp._id} className="timeline-admin-item">
                  <div className="timeline-admin-node">
                    <div className="timeline-admin-dot"></div>
                    <div className="timeline-admin-line"></div>
                  </div>

                  <div className="admin-experience-card">
                    <div className="exp-card-header">
                      <div className="exp-card-main-info">
                        <h4 className="exp-job-title">{exp.jobTitle}</h4>
                        <div className="exp-company-line">
                          <span className="exp-company-name">
                            <span className="material-symbols-outlined icon-inline">apartment</span>
                            {exp.company}
                          </span>
                          {exp.location && (
                            <span className="exp-location-tag">
                              <span className="material-symbols-outlined icon-inline">location_on</span>
                              {exp.location}
                            </span>
                          )}
                          {exp.employmentType && (
                            <span className="exp-type-badge">{exp.employmentType}</span>
                          )}
                        </div>
                      </div>

                      <div className="exp-card-meta-side">
                        {isOngoing ? (
                          <span className="badge-ongoing-role">
                            <span className="dot-live">●</span> Ongoing
                          </span>
                        ) : null}
                        <span className="exp-date-duration">{durationText}</span>
                      </div>
                    </div>

                    {exp.description && (
                      <p className="exp-card-desc">{exp.description}</p>
                    )}

                    {Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                      <ul className="exp-resp-list">
                        {exp.responsibilities.map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    )}

                    {techList.length > 0 && (
                      <div className="exp-tech-chips-group">
                        {techList.map((tech, i) => (
                          <span key={i} className="exp-tech-chip">{tech}</span>
                        ))}
                      </div>
                    )}

                    <div className="exp-card-footer">
                      <div className="exp-actions-group">
                        <button
                          className="btn-action-slate"
                          onClick={() => openEditModal(exp)}
                          title="Edit Experience"
                        >
                          <span className="material-symbols-outlined">edit</span> Edit
                        </button>
                        <button
                          className="btn-action-danger"
                          onClick={() => openDeleteModal(exp)}
                          title="Delete Experience"
                        >
                          <span className="material-symbols-outlined">delete</span> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Experience Modal */}
      <Modal
        title={editingExp ? "Edit Experience" : "Add New Experience"}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSave}
      >
        <div className="experience-form-container">
          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="jobTitle">Job Title *</label>
              <input
                id="jobTitle"
                type="text"
                className={`form-input-styled ${errors.jobTitle ? 'error' : ''}`}
                placeholder="e.g. Software Engineering Intern"
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              />
              {errors.jobTitle && <span className="form-error-text">{errors.jobTitle}</span>}
            </div>

            <div className="form-field-group">
              <label htmlFor="company">Company Name *</label>
              <input
                id="company"
                type="text"
                className={`form-input-styled ${errors.company ? 'error' : ''}`}
                placeholder="e.g. Google, ABC Tech"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              {errors.company && <span className="form-error-text">{errors.company}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                className="form-input-styled"
                placeholder="e.g. Hyderabad, India / Remote"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="employmentType">Employment Type</label>
              <select
                id="employmentType"
                className="form-input-styled"
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
              >
                {EMPLOYMENT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                id="startDate"
                type="date"
                className={`form-input-styled ${errors.startDate ? 'error' : ''}`}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              {errors.startDate && <span className="form-error-text">{errors.startDate}</span>}
            </div>

            <div className="form-field-group">
              <label htmlFor="endDate">End Date {!form.currentlyWorking && '*'}</label>
              <input
                id="endDate"
                type="date"
                className={`form-input-styled ${errors.endDate ? 'error' : ''}`}
                disabled={form.currentlyWorking}
                value={form.currentlyWorking ? '' : form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              {errors.endDate && <span className="form-error-text">{errors.endDate}</span>}
            </div>
          </div>

          <label className="checkbox-styled-label">
            <input
              type="checkbox"
              checked={form.currentlyWorking}
              onChange={(e) => setForm({ ...form, currentlyWorking: e.target.checked })}
            />
            <span>I am currently working in this role (Ongoing)</span>
          </label>

          <div className="form-field-group">
            <label htmlFor="description">Short Professional Description *</label>
            <textarea
              id="description"
              className={`form-input-styled ${errors.description ? 'error' : ''}`}
              placeholder="Brief overview of your primary responsibilities and achievements..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            ></textarea>
            {errors.description && <span className="form-error-text">{errors.description}</span>}
          </div>

          <div className="form-field-group">
            <label htmlFor="responsibilities">Key Responsibilities / Achievements (One per line)</label>
            <textarea
              id="responsibilities"
              className="form-input-styled"
              placeholder="Developed full-stack web features&#10;Optimized database queries by 40%&#10;Collaborated with cross-functional teams"
              rows={4}
              value={form.responsibilitiesText}
              onChange={(e) => setForm({ ...form, responsibilitiesText: e.target.value })}
            ></textarea>
          </div>

          <div className="form-field-group">
            <label>Technologies Used</label>
            <div className="tag-input-wrapper">
              <input
                type="text"
                className="form-input-styled"
                placeholder="Type technology name (e.g. React.js) and press Enter"
                value={form.techInput}
                onChange={(e) => setForm({ ...form, techInput: e.target.value })}
                onKeyDown={handleTechKeyDown}
              />
            </div>

            {form.technologies.length > 0 && (
              <div className="tags-chips-container">
                {form.technologies.map((tag) => (
                  <span key={tag} className="tag-chip-removable">
                    {tag}
                    <span
                      className="tag-remove-btn"
                      onClick={() => handleRemoveTech(tag)}
                      title="Remove tag"
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingExp && (
        <Modal
          title="Delete Experience"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSave={handleDelete}
        >
          <div className="confirm-modal-body">
            <div className="confirm-icon-circle">
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <h3 className="confirm-modal-title">Delete Experience?</h3>
            <p className="confirm-modal-desc">
              Are you sure you want to delete <strong>{deletingExp.jobTitle}</strong> at <strong>{deletingExp.company}</strong>?
              <br />
              This experience will be permanently removed.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default ExperienceSection;
