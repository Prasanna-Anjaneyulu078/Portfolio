import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import './index.css';

const API_URL = 'http://localhost:3002/api';

const AboutMe = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    coreObjective: '',
    academic: []
  });

  // 1. Fetch data from MongoDB
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/education`);
      if (response.data) {
        setFormData({
          coreObjective: response.data.coreObjective || '',
          academic: response.data.academic || []
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.coreObjective.trim()) {
      newErrors.coreObjective = "Core Objective is required";
    }
    
    formData.academic.forEach((item, index) => {
      if (!item.degree.trim()) newErrors[`degree_${index}`] = "Degree is required";
      if (!item.institution.trim()) newErrors[`institution_${index}`] = "Institution is required";
      if (!item.duration.trim()) newErrors[`duration_${index}`] = "Duration is required";
      if (!item.cgpa.trim()) newErrors[`cgpa_${index}`] = "Result (CGPA/%) is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2. Save data to MongoDB
  const handleSave = async () => {
    if (validate()) {
      try {
        const response = await axios.post(`${API_URL}/update/education`, {
          coreObjective: formData.coreObjective, 
          academic: formData.academic
        });
        
        setFormData({
          coreObjective: response.data.coreObjective,
          academic: response.data.academic
        });
        
        setIsModalOpen(false);
        setErrors({});
      } catch(err) {
        console.error("Save Error:", err.message);
        alert("Failed to save changes.");
      }
    }
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      academic: [
        ...formData.academic,
        { id: Date.now().toString(), degree: "", institution: "", duration: "", cgpa: "" }
      ]
    });
  };

  const removeEducation = (index) => {
    const updated = formData.academic.filter((_, i) => i !== index);
    setFormData({ ...formData, academic: updated });
  };

  const updateEducationField = (index, field, value) => {
    const updated = formData.academic.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, academic: updated });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  // --- STANDARD MINIMAL LOADER ---
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px', width: '100%' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="about-section" id="about">
      <div className="section-title-row">
        <h3>About Me</h3>
        <button className="btn-text-edit" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined icon-small">edit</span>
          Edit Profile
        </button>
      </div>

      <div className="card card-padding">
        <div className="objective-container">
          <h5 className="label-small">Core Objective</h5>
          <p className="text-content">
            {formData.coreObjective || "Define your professional objective by clicking Edit."}
          </p>
        </div>

        <div className="academic-section">
          <h5 className="label-small">Academic Background</h5>
          <div className="academic-list">
            {formData.academic.length > 0 ? (
              formData.academic.map((edu) => (
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

      <Modal title="Refine About & Education" isOpen={isModalOpen} onClose={closeModal} onSave={handleSave}>
        <div className="form-field">
          <label>Core Objective</label>
          <textarea 
            rows={4} 
            className={`form-textarea ${errors.coreObjective ? 'error' : ''}`} 
            value={formData.coreObjective} 
            onChange={(e) => setFormData({...formData, coreObjective: e.target.value})} 
            placeholder="Write a brief professional summary..."
          />
          {errors.coreObjective && <span className="form-error-msg">{errors.coreObjective}</span>}
        </div>
        
        <div className="form-divider-row">
          <div className="form-divider">
            <span>Education History</span>
          </div>
          <button className="btn-add-inline" onClick={addEducation}>
            <span className="material-symbols-outlined">add_circle</span>
            Add Qualification
          </button>
        </div>

        {formData.academic.map((edu, index) => (
          <div key={edu.id} className="education-form-block">
            <div className="education-block-header">
              <span className="education-index">Qualification # {index + 1}</span>
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
                  placeholder="e.g. B.Sc in Computer Science"
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
                  placeholder="University Name"
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
                  placeholder="e.g. 2018 - 2022" 
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
                  placeholder="e.g. 3.8/4.0"
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

export default AboutMe;