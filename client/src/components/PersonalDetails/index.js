import React, { useState, useEffect } from 'react';
import axios from 'axios'
import Modal from '../Modal';
import { fileToBase64 } from '../../utils/fileHelpers';
import './index.css';

const API_URL = 'http://localhost:3002/api/user'

const PersonalDetails = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Standardized loading state
  const [errors, setErrors] = useState({});
  const [data, setData] = useState({
    name: '',
    role: '',
    bio: '',
    email: '',
    avatarUrl: '',
    githubUrl: '',
    linkedinUrl: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    email: '',
    avatarUrl: '',
    githubUrl: '',
    linkedinUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const userData = await axios.get(API_URL)
      setData(userData.data)
      setFormData(userData.data)
    } catch (err) {
      console.log(`Error: ${err.message}`)
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setFormData({ ...formData, avatarUrl: base64 });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full Name is required";
    if (!formData.role.trim()) newErrors.role = "Professional Role is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validate()) {
      try {
        const userData = await axios.post(`${API_URL}/update`, formData)
        setData(userData.data);
        setFormData(userData.data);
        setIsModalOpen(false);
        setErrors({});
      } catch (err) {
        console.log(`Error: ${err.message}`)
      }
    }
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
    <section className="section-container" id="personal">
      <div className="section-header">
        <h3>Personal Details</h3>
        <p>Manage your personal information visible on the portfolio.</p>
      </div>

      <div className="card">
        <div className="profile-banner">
          <div className="avatar-wrapper">
            <div 
              className="avatar-circle"
              style={{ backgroundImage: `url(${data.avatarUrl})` }}
            />
            <div className="avatar-overlay">
              <span className="material-symbols-outlined">photo_camera</span>
            </div>
          </div>
          
          <div className="profile-info">
            <h4 className="profile-name">{data.name}</h4>
            <p className="profile-role">{data.role}</p>
            <p className="profile-bio">{data.bio}</p>
          </div>

          <button className="btn-edit" onClick={() => {
            setFormData({ ...data });
            setIsModalOpen(true);
          }}>
            <span className="material-symbols-outlined icon-small">edit_square</span>
            Edit Details
          </button>
        </div>

        <div className="details-grid">
          <DetailItem label="Email" value={data.email} icon="mail" iconColor="#94a3b8" />
          <DetailItem label="GitHub" value={data.githubUrl} isLink icon="link" />
          <DetailItem label="LinkedIn" value={data.linkedinUrl} isLink icon="link" />
        </div>
      </div>

      <Modal title="Edit Personal Details" isOpen={isModalOpen} onClose={closeModal} onSave={handleSave}>
        <div className="form-field">
          <label>Profile Picture</label>
          <div className="file-upload-container">
            <div 
              className="file-upload-preview"
              style={{ backgroundImage: `url(${formData.avatarUrl})` }}
            />
            <input type="file" accept="image/*" className="file-input-custom" onChange={handleFileChange} />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label>Full Name</label>
            <input 
              type="text" 
              className={`form-input ${errors.name ? 'error' : ''}`} 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            {errors.name && <span className="form-error-msg">{errors.name}</span>}
          </div>
          <div className="form-field">
            <label>Email Address</label>
            <input 
              type="email" 
              className={`form-input ${errors.email ? 'error' : ''}`} 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />
            {errors.email && <span className="form-error-msg">{errors.email}</span>}
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label>GitHub Profile</label>
            <input type="text" className="form-input" value={formData.githubUrl} onChange={(e) => setFormData({...formData, githubUrl: e.target.value})} placeholder="github.com/username" />
          </div>
          <div className="form-field">
            <label>LinkedIn Profile</label>
            <input type="text" className="form-input" value={formData.linkedinUrl} onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})} placeholder="linkedin.com/in/username" />
          </div>
        </div>
        <div className="form-field">
          <label>Professional Role</label>
          <input 
            type="text" 
            className={`form-input ${errors.role ? 'error' : ''}`} 
            value={formData.role} 
            onChange={(e) => setFormData({...formData, role: e.target.value})} 
          />
          {errors.role && <span className="form-error-msg">{errors.role}</span>}
        </div>
        <div className="form-field">
          <label>Short Bio</label>
          <textarea rows={3} className="form-textarea" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
        </div>
      </Modal>
    </section>
  );
};

const DetailItem = ({ label, value, icon, iconColor = "#135bec", isLink = false }) => (
  <div className="detail-item">
    <label className="detail-label">{label}</label>
    <div className="detail-value-wrapper">
      <span className="material-symbols-outlined icon-medium" style={{color: iconColor}}>{icon}</span>
      {isLink ? (
        <a href={value && value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="detail-link">
          {value || 'Not set'}
          <span className="material-symbols-outlined icon-xs">open_in_new</span>
        </a>
      ) : (
        <span className="truncate-text">{value || 'Not set'}</span>
      )}
    </div>
  </div>
);

export default PersonalDetails;