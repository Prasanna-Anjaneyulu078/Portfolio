import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import './index.css';

const PRIMARY_API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/experiences`;
const LOCAL_API_URL = 'http://localhost:3002/api/experiences';

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

const ExperienceSection = ({ onUpdate }) => {
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items state
  const [editingExp, setEditingExp] = useState(null);
  const [viewingExp, setViewingExp] = useState(null);
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

    if (!form.description?.trim()) newErrors.description = "Description is required.";

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
      currentlyWorking: Boolean(exp.currentlyWorking),
      description: exp.description || '',
      responsibilitiesText: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : exp.responsibilities || '',
      technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
      techInput: ''
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  const openViewModal = (exp) => {
    setViewingExp(exp);
    setIsDetailsModalOpen(true);
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
    if (!validate()) return;

    try {
      const responsibilitiesArray = form.responsibilitiesText
        ? form.responsibilitiesText.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        _id: editingExp ? editingExp._id : undefined,
        jobTitle: form.jobTitle.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType,
        startDate: form.startDate.trim(),
        endDate: form.currentlyWorking ? '' : form.endDate.trim(),
        currentlyWorking: form.currentlyWorking,
        description: form.description.trim(),
        responsibilities: responsibilitiesArray,
        technologies: form.technologies
      };

      await apiCall('post', '/save', payload);
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
    }
  };

  // Confirm Delete Experience
  const handleDelete = async () => {
    if (!deletingExp) return;
    try {
      await apiCall('delete', `/${deletingExp._id}`);
      await fetchExperiences();
      setIsDeleteModalOpen(false);
      setDeletingExp(null);
      showToast('success', "Experience deleted successfully.");
    } catch (err) {
      console.error("Delete Error:", err);
      showToast('error', err.response?.data?.message || "Failed to delete experience.");
    }
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
      <div className="section-title-row">
        <div className="section-header">
          <h3>Experience Management</h3>
          <p>Add, edit, and organize your professional career, internships, and work history.</p>
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

      {/* Experience List Table or Empty Canvas */}
      <div className="projects-display-wrapper">
        {experiences.length === 0 ? (
          <div className="empty-projects-canvas">
            <span className="material-symbols-outlined icon-giant">business_center</span>
            <div className="empty-text-group">
              <h4>No Experience Added</h4>
              <p>Add your first professional experience to display it on the portfolio.</p>
            </div>
            <button className="btn-primary-action" onClick={openAddModal}>
              <span className="material-symbols-outlined">add</span> Add Experience
            </button>
          </div>
        ) : (
          <div className="experience-table-container">
            <table className="experience-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Icon</th>
                  <th>Job Title & Company</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Technologies</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiences.map((exp) => (
                  <tr key={exp._id}>
                    <td>
                      <div className="table-icon-box">
                        <span className="material-symbols-outlined">work</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="exp-title-main">{exp.jobTitle}</span>
                        <span className="exp-company-sub">
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                            apartment
                          </span>
                          {exp.company}
                          {exp.location ? ` • ${exp.location}` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="exp-type-badge">{exp.employmentType || 'Full-time'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate || ''}
                      </span>
                    </td>
                    <td>
                      <span className={`exp-status-badge ${exp.currentlyWorking ? 'ongoing' : 'completed'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>
                          {exp.currentlyWorking ? 'sensors' : 'check_circle'}
                        </span>
                        {exp.currentlyWorking ? 'Ongoing' : 'Completed'}
                      </span>
                    </td>
                    <td>
                      <div className="tech-chips-wrapper">
                        {exp.technologies?.slice(0, 3).map((tech, i) => (
                          <span key={i} className="tech-chip-item">
                            {tech}
                          </span>
                        ))}
                        {exp.technologies?.length > 3 && (
                          <span className="tech-chip-item" style={{ opacity: 0.7 }}>
                            +{exp.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          onClick={() => openViewModal(exp)}
                          className="action-btn-icon view-btn"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button
                          onClick={() => openEditModal(exp)}
                          className="action-btn-icon edit-btn"
                          title="Edit Experience"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(exp)}
                          className="action-btn-icon delete-btn"
                          title="Delete Experience"
                        >
                          <span className="material-symbols-outlined">delete</span>
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
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Self-employed">Self-employed</option>
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
              placeholder="- Developed full-stack web features&#10;- Optimized database queries by 40%&#10;- Collaborated with cross-functional teams"
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
                placeholder="Type technology name (e.g. React.js, Node.js) and press Enter"
                value={form.techInput}
                onChange={(e) => setForm({ ...form, techInput: e.target.value })}
                onKeyDown={handleTechKeyDown}
              />
              <button type="button" className="btn-tag-add" onClick={handleAddTech}>
                Add Tag
              </button>
            </div>

            {form.technologies.length > 0 && (
              <div className="tags-chips-container">
                {form.technologies.map((tag) => (
                  <span key={tag} className="tag-chip-removable">
                    {tag}
                    <span
                      className="tag-remove-btn"
                      onClick={() => handleRemoveTech(tag)}
                      title="Remove"
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

      {/* View Details Modal */}
      {viewingExp && (
        <Modal
          title="Experience Details"
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onSave={() => setIsDetailsModalOpen(false)}
        >
          <div className="experience-details-modal">
            <div className="details-row-header">
              <h3 className="details-job-title">{viewingExp.jobTitle}</h3>
              <div className="details-company-line">
                <span className="material-symbols-outlined">apartment</span>
                {viewingExp.company}
              </div>
            </div>

            <div className="details-meta-grid">
              <div className="details-meta-item">
                <span className="details-meta-label">Employment Type</span>
                <span className="details-meta-value">{viewingExp.employmentType || 'Full-time'}</span>
              </div>
              <div className="details-meta-item">
                <span className="details-meta-label">Location</span>
                <span className="details-meta-value">{viewingExp.location || 'N/A'}</span>
              </div>
              <div className="details-meta-item">
                <span className="details-meta-label">Duration</span>
                <span className="details-meta-value">
                  {viewingExp.startDate} - {viewingExp.currentlyWorking ? 'Present' : viewingExp.endDate || ''}
                </span>
              </div>
              <div className="details-meta-item">
                <span className="details-meta-label">Status</span>
                <span className="details-meta-value">
                  {viewingExp.currentlyWorking ? 'Ongoing (Present)' : 'Completed'}
                </span>
              </div>
            </div>

            {viewingExp.description && (
              <div>
                <h4 className="details-section-label">Description</h4>
                <p className="details-desc-text">{viewingExp.description}</p>
              </div>
            )}

            {viewingExp.responsibilities && viewingExp.responsibilities.length > 0 && (
              <div>
                <h4 className="details-section-label">Key Responsibilities & Deliverables</h4>
                <ul className="details-resp-list">
                  {viewingExp.responsibilities.map((resp, i) => (
                    <li key={i} className="details-resp-item">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {viewingExp.technologies && viewingExp.technologies.length > 0 && (
              <div>
                <h4 className="details-section-label">Tech Stack & Tools</h4>
                <div className="tags-chips-container">
                  {viewingExp.technologies.map((tech, i) => (
                    <span key={i} className="tech-chip-item">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

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
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default ExperienceSection;
