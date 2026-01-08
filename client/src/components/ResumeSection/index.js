import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import { fileToBase64, viewPdf } from '../../utils/fileHelpers';
import './index.css';

const API_BASE = 'http://localhost:3002/api/resumes';

const ResumeSection = () => {
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadData, setUploadData] = useState({ fileName: "", url: "" });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(API_BASE);
      setResumes(res.data || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setErrors({ upload: "Please upload a PDF file only." });
        return;
      }
      
      setIsProcessingFile(true);
      try {
        const base64 = await fileToBase64(file);
        setUploadData({ fileName: file.name, url: base64 });
        setErrors({});
      } catch (err) {
        setErrors({ upload: "Failed to process file." });
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleAddResume = async () => {
    if (!uploadData.url) {
      setErrors({ upload: "Please select a file first" });
      return;
    }

    try {
      await axios.post(API_BASE, uploadData);
      setUploadData({ fileName: "", url: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsModalOpen(false);
      fetchResumes();
    } catch (err) {
      setErrors({ upload: "Upload failed. Please try again." });
    }
  };

  const toggleActive = async (id) => {
    try {
      await axios.patch(`${API_BASE}/${id}/active`);
      fetchResumes();
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  const deleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchResumes();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const downloadResume = (resume) => {
    const link = document.createElement('a');
    link.href = resume.url;
    link.download = resume.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeResume = resumes.find(r => r.isActive);

  // --- MINIMAL LOADER (Removed synchronizing text) ---
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
    <section className="section-container" id="resume">
      <div className="section-header">
        <div className="header-title-row">
          <h3>Resume Management</h3>
          <span className="badge-status">Document Center</span>
        </div>
        <p>Upload and manage multiple versions of your professional resume.</p>
      </div>

      <div className="resume-manager-layout">
        <div className="manager-main-card">
          <div className="active-resume-banner">
            <div className="banner-content">
              <div className="banner-info">
                <span className="label-tiny">Primary Document</span>
                {activeResume ? (
                  <>
                    <h4>{activeResume.fileName}</h4>
                    <p>Uploaded on {new Date(activeResume.uploadedAt).toLocaleDateString()}</p>
                  </>
                ) : (
                  <h4>No Active Resume Set</h4>
                )}
              </div>
              <div className="banner-actions">
                {activeResume && (
                  <>
                    <button className="btn-banner-action" onClick={() => viewPdf(activeResume.url)}>
                      <span className="material-symbols-outlined">visibility</span>
                      View
                    </button>
                    <button className="btn-banner-action" onClick={() => downloadResume(activeResume)}>
                      <span className="material-symbols-outlined">download</span>
                      Download
                    </button>
                  </>
                )}
                <button className="btn-banner-primary" onClick={() => setIsModalOpen(true)}>
                  <span className="material-symbols-outlined">upload_file</span>
                  Upload New
                </button>
              </div>
            </div>
          </div>

          <div className="resume-list-container">
            <div className="list-header">
              <h5>All Files</h5>
              <span className="count-tag">{resumes.length} Documents</span>
            </div>
            
            <div className="resume-table">
              {resumes.length === 0 ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined">folder_open</span>
                  <p>Your resume library is empty. Please upload a PDF.</p>
                </div>
              ) : (
                resumes.map(resume => (
                  <div key={resume._id} className={`resume-row ${resume.isActive ? 'is-active' : ''}`}>
                    <div className="row-main">
                      <button 
                        className={`action-btn star-btn ${resume.isActive ? 'active' : ''}`}
                        title={resume.isActive ? "Primary Resume" : "Set as Primary"}
                        onClick={() => toggleActive(resume._id)}
                      >
                        <span className={`material-symbols-outlined ${resume.isActive ? 'material-symbols-fill' : ''}`}>
                          star
                        </span>
                      </button>
                      
                      <div className="file-details">
                        <span className="file-name" title={resume.fileName}>{resume.fileName}</span>
                        <span className="file-meta">{new Date(resume.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="row-actions">
                      <button className="action-btn view-btn" onClick={() => viewPdf(resume.url)} title="View PDF">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button className="action-btn download-btn" onClick={() => downloadResume(resume)} title="Download PDF">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                      <button className="action-btn delete-btn" onClick={() => deleteResume(resume._id)} title="Delete Document">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal title="Upload Professional Resume" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddResume}>
        <div className="form-field">
          <label>File Selection</label>
          <div className={`enhanced-upload-zone ${isProcessingFile ? 'processing' : ''}`}>
            <span className="material-symbols-outlined">description</span>
            <div className="upload-zone-text">
              {isProcessingFile ? (
                <p>Reading PDF content...</p>
              ) : (
                <>
                  <p className="upload-main-text">{uploadData.fileName || "Choose a PDF file"}</p>
                  <p className="upload-sub-text">PDF format only • Max 5MB</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="application/pdf" 
              className="hidden-file-input" 
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer'
              }}
            />
          </div>
          {errors.upload && <span className="form-error-msg" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>{errors.upload}</span>}
        </div>
      </Modal>
    </section>
  );
};

export default ResumeSection;