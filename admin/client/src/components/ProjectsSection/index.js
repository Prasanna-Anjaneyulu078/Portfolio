import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import { fileToBase64 } from '../../utils/fileHelpers';
import './index.css';

const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'https://prasanna-portfolio-admin.vercel.app/api';
const LOCAL_API_URL = 'http://localhost:3002/api';

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

const ProjectsSection = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    codeUrl: "",
    demoUrl: "",
    category: "Full Stack" 
  });

  const [tagsInput, setTagsInput] = useState("");
  const [techStackInput, setTechStackInput] = useState("");

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await apiCall('get', '/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!projectForm.title?.trim()) newErrors.title = "Project title is required";
    if (!projectForm.description?.trim()) newErrors.description = "A short description is required";
    if (!projectForm.imageUrl) newErrors.imageUrl = "Project thumbnail is required";
    if (!projectForm.category) newErrors.category = "Category is required";
    if (!techStackInput.trim()) newErrors.techStack = "Add at least one technology";
    if (!tagsInput.trim()) newErrors.tags = "Add at least one tag";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingProject(null);
    setProjectForm({ 
      title: "", 
      description: "", 
      imageUrl: "", 
      codeUrl: "", 
      demoUrl: "", 
      category: "Full Stack" 
    });
    setTagsInput("");
    setTechStackInput("");
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project); 
    setProjectForm({
      title: project.title,
      description: project.description,
      imageUrl: project.imageUrl,
      codeUrl: project.codeUrl || "",
      demoUrl: project.demoUrl || "",
      category: project.category || "Full Stack"
    });
    setTagsInput(project.tags ? project.tags.join(", ") : "");
    setTechStackInput(project.techStack ? project.techStack.join(", ") : "");
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (validate()) {
      const parsedTags = tagsInput.split(",").map(t => t.trim()).filter(t => t !== "");
      const parsedTech = techStackInput.split(",").map(t => t.trim()).filter(t => t !== "");

      const payload = {
        ...projectForm,
        tags: parsedTags,
        techStack: parsedTech,
        _id: editingProject ? editingProject._id : undefined
      };

      try {
        await apiCall('post', '/projects/save', payload);
        await fetchProjects(); 
        setIsModalOpen(false);
        setEditingProject(null);
        setErrors({});
      } catch (err) {
        console.error("Save error:", err.message);
      }
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm("Permanent delete? This action cannot be undone.")) {
      try {
        await apiCall('delete', `/projects/${id}`);
        if (selectedProject?._id === id) setSelectedProject(null);
        fetchProjects();
      } catch (err) {
        console.error("Delete error:", err.message);
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setProjectForm({ ...projectForm, imageUrl: base64 });
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading projects">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Projects...</p>
      </div>
    );
  }

  return (
    <section className="section-container" id="projects">
      <div className="section-title-row">
        <div className="section-header">
          <h3>Project Library</h3>
          <p>Detailed overview of your engineering milestones and contributions.</p>
        </div>
        <button className="btn-add-project" onClick={openAddModal}>
          <span className="material-symbols-outlined">add_box</span>
          Add Project
        </button>
      </div>

      <div className="projects-display-wrapper">
        {projects.length === 0 ? (
          <div className="empty-projects-canvas">
            <span className="material-symbols-outlined icon-giant">folder_off</span>
            <div className="empty-text-group">
              <h4>No projects in your library</h4>
              <p>Items you add will appear here in a manageable table format.</p>
            </div>
            <button className="btn-primary-action" onClick={openAddModal}>Add Your First Project</button>
          </div>
        ) : (
          <div className="projects-table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th className="th-thumb">Preview</th>
                  <th className="th-identity">Project Identity & Type</th>
                  <th className="th-tags">Classifications</th>
                  <th className="th-stack">Technology Stack</th>
                  <th className="th-links">Resources</th>
                  <th className="th-actions">Manage</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project._id}>
                    <td>
                      <div 
                        className="table-thumb-box clickable" 
                        style={{ backgroundImage: `url(${project.imageUrl})` }}
                        onClick={() => setSelectedProject(project)}
                        title="Click to view details"
                      >
                        {!project.imageUrl && <span className="material-symbols-outlined">image</span>}
                      </div>
                    </td>
                    <td>
                      <div className="table-identity-block">
                        <button 
                          className="table-title-btn" 
                          onClick={() => setSelectedProject(project)}
                          title="Click to view project details"
                        >
                          {project.title}
                        </button>
                        <span className="table-chip-tag" style={{fontSize: '10px', width: 'fit-content'}}>{project.category}</span>
                        <span className="table-desc-sub">{project.description}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-tag-list">
                        {project.tags && project.tags.map(tag => <span key={tag} className="table-chip-tag">{tag}</span>)}
                      </div>
                    </td>
                    <td>
                      <div className="table-stack-list">
                        {project.techStack && project.techStack.map(tech => <span key={tech} className="table-chip-stack">{tech}</span>)}
                      </div>
                    </td>
                    <td>
                      <div className="table-link-group">
                        {project.codeUrl && (
                          <a href={project.codeUrl.startsWith('http') ? project.codeUrl : `https://${project.codeUrl}`} target="_blank" rel="noopener noreferrer" className="table-nav-link" title="Code Repository">
                            <span className="material-symbols-outlined">code</span>
                          </a>
                        )}
                        {project.demoUrl && (
                          <a href={project.demoUrl.startsWith('http') ? project.demoUrl : `https://${project.demoUrl}`} target="_blank" rel="noopener noreferrer" className="table-nav-link demo-accent" title="Live Demo">
                            <span className="material-symbols-outlined">public</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-btn-group">
                        <button onClick={() => setSelectedProject(project)} className="table-btn-icon view-btn" title="View Project Details">
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button onClick={() => openEditModal(project)} className="table-btn-icon edit-btn" title="Edit Project">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => deleteProject(project._id)} className="table-btn-icon delete-btn" title="Delete Project">
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

      {/* In-App Native Project Details Modal */}
      {selectedProject && (
        <div className="pdf-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="pdf-modal-container project-details-container" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <div className="pdf-modal-title">
                <span className="material-symbols-outlined">work</span>
                <h3>{selectedProject.title}</h3>
              </div>
              <div className="pdf-modal-actions">
                <button 
                  className="btn-banner-action" 
                  onClick={() => { 
                    const p = selectedProject; 
                    setSelectedProject(null); 
                    openEditModal(p); 
                  }}
                >
                  <span className="material-symbols-outlined">edit</span> Edit
                </button>
                <button className="pdf-close-btn" onClick={() => setSelectedProject(null)} title="Close Details">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="project-details-body">
              {selectedProject.imageUrl && (
                <div className="project-details-banner" style={{ backgroundImage: `url(${selectedProject.imageUrl})` }}>
                  <div className="project-banner-overlay">
                    <span className="project-category-badge">{selectedProject.category}</span>
                    <h2 className="project-banner-title">{selectedProject.title}</h2>
                  </div>
                </div>
              )}
              
              <div className="project-details-content">
                <div className="details-block">
                  <h6 className="details-section-label">Overview & Summary</h6>
                  <p className="project-description-full">{selectedProject.description}</p>
                </div>

                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="details-block">
                    <h6 className="details-section-label">Classifications / Tags</h6>
                    <div className="details-chip-list">
                      {selectedProject.tags.map(t => (
                        <span key={t} className="table-chip-tag detail-chip">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.techStack && selectedProject.techStack.length > 0 && (
                  <div className="details-block">
                    <h6 className="details-section-label">Technology Stack</h6>
                    <div className="details-chip-list">
                      {selectedProject.techStack.map(s => (
                        <span key={s} className="table-chip-stack detail-chip">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedProject.codeUrl || selectedProject.demoUrl) && (
                  <div className="details-block">
                    <h6 className="details-section-label">External Resources</h6>
                    <div className="details-resource-links">
                      {selectedProject.codeUrl && (
                        <a href={selectedProject.codeUrl.startsWith('http') ? selectedProject.codeUrl : `https://${selectedProject.codeUrl}`} target="_blank" rel="noopener noreferrer" className="btn-resource-link">
                          <span className="material-symbols-outlined">code</span> View Code Repository
                        </a>
                      )}
                      {selectedProject.demoUrl && (
                        <a href={selectedProject.demoUrl.startsWith('http') ? selectedProject.demoUrl : `https://${selectedProject.demoUrl}`} target="_blank" rel="noopener noreferrer" className="btn-resource-link demo-accent">
                          <span className="material-symbols-outlined">public</span> Live Demo / Deployment
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal 
        title={editingProject ? "Refine Project Details" : "Construct New Project"} 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setErrors({}); }} 
        onSave={handleSave}
      >
        <div className="project-form-container">
          <div className="form-group-box">
            <h6 className="group-label">Core Identity</h6>
            <div className="form-grid-2">
                <div className="form-field">
                    <label>Project Title</label>
                    <input 
                        type="text" 
                        className={`form-input ${errors.title ? 'error' : ''}`} 
                        value={projectForm.title} 
                        onChange={(e) => setProjectForm({...projectForm, title: e.target.value})} 
                    />
                    {errors.title && <span className="form-error-msg">{errors.title}</span>}
                </div>
                <div className="form-field">
                    <label>Project Type</label>
                    <select 
                        className="form-input"
                        value={projectForm.category}
                        onChange={(e) => setProjectForm({...projectForm, category: e.target.value})}
                    >
                        <option value="Full Stack">Full Stack</option>
                        <option value="Front End">Front End</option>
                        <option value="Back End">Back End</option>
                    </select>
                </div>
            </div>
            
            <div className="form-field">
              <label>Summary Description</label>
              <textarea 
                rows={4} 
                className={`form-textarea ${errors.description ? 'error' : ''}`} 
                value={projectForm.description} 
                onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} 
              />
              {errors.description && <span className="form-error-msg">{errors.description}</span>}
            </div>
          </div>

          <div className="form-group-box">
            <h6 className="group-label">Branding & Assets</h6>
            <div className={`project-upload-area ${errors.imageUrl ? 'error' : ''}`}>
              {projectForm.imageUrl ? (
                <div className="upload-preview-active">
                  <img src={projectForm.imageUrl || null} alt="Thumbnail" />
                  <div className="upload-actions-overlay">
                    <label className="btn-overlay-change">
                      <span className="material-symbols-outlined">sync</span> Replace
                      <input type="file" accept="image/*" className="hidden-input" onChange={handleFileChange} />
                    </label>
                    <button className="btn-overlay-remove" onClick={() => setProjectForm({...projectForm, imageUrl: ""})}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="upload-placeholder-zone">
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  <div className="placeholder-text"><p>Click to upload image</p></div>
                  <input type="file" accept="image/*" className="hidden-input" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div className="form-group-box">
            <h6 className="group-label">Technical Footprint</h6>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Tags (Comma separated)</label>
                <input type="text" className="form-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="React, Node, etc." />
              </div>
              <div className="form-field">
                <label>Tech Stack (Comma separated)</label>
                <input type="text" className="form-input" value={techStackInput} onChange={(e) => setTechStackInput(e.target.value)} placeholder="MERN, AWS, etc." />
              </div>
            </div>
          </div>

          <div className="form-group-box">
            <h6 className="group-label">Links</h6>
            <div className="form-grid-2">
              <input type="text" className="form-input" placeholder="Code URL" value={projectForm.codeUrl} onChange={(e) => setProjectForm({...projectForm, codeUrl: e.target.value})} />
              <input type="text" className="form-input" placeholder="Demo URL" value={projectForm.demoUrl} onChange={(e) => setProjectForm({...projectForm, demoUrl: e.target.value})} />
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ProjectsSection;
