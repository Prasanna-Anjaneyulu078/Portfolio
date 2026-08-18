import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import './index.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

const EducationSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [academic, setAcademic] = useState([]);

  // Fetch education data
  const fetchEducationData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/education`);
      if (response.data && Array.isArray(response.data.academic)) {
        setAcademic(response.data.academic);
      } else {
        setAcademic([]);
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEducationData();
  }, []);

  const validate = () => {
    const newErrors = {};
    academic.forEach((item, index) => {
      if (!item.degree.trim()) newErrors[`degree_${index}`] = "Degree is required";
      if (!item.institution.trim()) newErrors[`institution_${index}`] = "Institution is required";
      if (!item.duration.trim()) newErrors[`duration_${index}`] = "Duration is required";
      if (!item.cgpa.trim()) newErrors[`cgpa_${index}`] = "Result (CGPA/%) is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validate()) {
      try {
        const response = await axios.post(`${API_URL}/update/education`, {
          academic
        });

        if (response.data && Array.isArray(response.data.academic)) {
          setAcademic(response.data.academic);
        }
        setIsModalOpen(false);
        setErrors({});
      } catch (err) {
        console.error("Save Error:", err.message);
        alert("Failed to save changes.");
      }
    }
  };

  const addEducation = () => {
    setAcademic([
      ...academic,
      { id: Date.now().toString(), degree: "", institution: "", duration: "", cgpa: "" }
    ]);
  };

  const removeEducation = (index) => {
    setAcademic(academic.filter((_, i) => i !== index));
  };

  const updateEducationField = (index, field, value) => {
    setAcademic(academic.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading education section">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Education Section...</p>
      </div>
    );
  }

  return (
    <section className="education-admin-section" id="education">
      <div className="section-title-row">
        <div>
          <h3>Education Management</h3>
          <p>Manage your academic degrees, institutions, and qualifications.</p>
        </div>
        <button className="btn-add-project" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined icon-small">edit</span>
          Manage Education
        </button>
      </div>

      <div className="card card-padding">
        <div className="academic-section">
          <div className="academic-list">
            {academic.length > 0 ? (
              academic.map((edu) => (
                <div key={edu.id} className="academic-card">
                  <div className="academic-main">
                    <div className="icon-box">
                      <span className="material-symbols-outlined icon-large">school</span>
                    </div>
                    <div className="academic-info">
                      <h6>{edu.degree}</h6>
                      <p>{edu.institution}</p>
                    </div>
                  </div>
                  <div className="academic-meta">
                    <span className="duration">{edu.duration}</span>
                    <span className="badge">Result: {edu.cgpa}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-msg">No academic history added yet.</p>
            )}
          </div>
        </div>
      </div>

      <Modal title="Manage Education History" isOpen={isModalOpen} onClose={closeModal} onSave={handleSave}>
        <div className="form-divider-row">
          <div className="form-divider">
            <span>Qualifications</span>
          </div>
          <button className="btn-add-inline" onClick={addEducation}>
            <span className="material-symbols-outlined">add_circle</span>
            Add Qualification
          </button>
        </div>

        {academic.map((edu, index) => (
          <div key={edu.id} className="education-form-block">
            <div className="education-block-header">
              <span className="education-index">Qualification #{index + 1}</span>
              <button className="btn-remove-inline" onClick={() => removeEducation(index)}>
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>Degree Name</label>
                <input
                  type="text"
                  className={`form-input ${errors[`degree_${index}`] ? 'error' : ''}`}
                  value={edu.degree}
                  onChange={(e) => updateEducationField(index, 'degree', e.target.value)}
                  placeholder="e.g. B.Tech in AI & Data Science"
                />
                {errors[`degree_${index}`] && <span className="form-error-msg">{errors[`degree_${index}`]}</span>}
              </div>
              <div className="form-field">
                <label>Institution</label>
                <input
                  type="text"
                  className={`form-input ${errors[`institution_${index}`] ? 'error' : ''}`}
                  value={edu.institution}
                  onChange={(e) => updateEducationField(index, 'institution', e.target.value)}
                  placeholder="University / College Name"
                />
                {errors[`institution_${index}`] && <span className="form-error-msg">{errors[`institution_${index}`]}</span>}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>Duration</label>
                <input
                  type="text"
                  className={`form-input ${errors[`duration_${index}`] ? 'error' : ''}`}
                  value={edu.duration}
                  onChange={(e) => updateEducationField(index, 'duration', e.target.value)}
                  placeholder="e.g. 2021 - 2025"
                />
                {errors[`duration_${index}`] && <span className="form-error-msg">{errors[`duration_${index}`]}</span>}
              </div>
              <div className="form-field">
                <label>CGPA / Percentage</label>
                <input
                  type="text"
                  className={`form-input ${errors[`cgpa_${index}`] ? 'error' : ''}`}
                  value={edu.cgpa}
                  onChange={(e) => updateEducationField(index, 'cgpa', e.target.value)}
                  placeholder="e.g. 8.5 CGPA"
                />
                {errors[`cgpa_${index}`] && <span className="form-error-msg">{errors[`cgpa_${index}`]}</span>}
              </div>
            </div>
          </div>
        ))}
      </Modal>
    </section>
  );
};

export default EducationSection;
