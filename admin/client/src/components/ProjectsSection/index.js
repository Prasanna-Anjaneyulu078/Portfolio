import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import { fileToBase64 } from '../../utils/fileHelpers';
import './index.css';

import { API_BASE_URL } from '../../config/api';

const PRIMARY_API_URL = API_BASE_URL;

const CATEGORIES = ['Full Stack', 'Frontend', 'Backend', 'AI / ML', 'Other'];

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingPriorityId, setUpdatingPriorityId] = useState(null);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Types');
  const [sortBy, setSortBy] = useState('priority_asc');

  const [projectForm, setProjectForm] = useState({
    title: '',
    category: 'Full Stack',
    description: '',
    imageUrl: '',
    techStackInput: '',
    displayPriority: 1,
    codeUrl: '',
    demoUrl: '',
    isVisible: true,
  });

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setGlobalError('');
      const res = await apiCall('get', '/projects');
      const data = Array.isArray(res.data) ? res.data : [];
      setProjects(data);
    } catch (err) {
      console.error('Fetch Error:', err.message);
      setProjects([]);
      setGlobalError('Unable to load projects right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const validate = () => {
    const newErrors = {};
    const titleClean = projectForm.title?.trim();
    if (!titleClean) {
      newErrors.title = 'Project title is required';
    } else if (titleClean.length > 120) {
      newErrors.title = 'Project title cannot exceed 120 characters';
    }

    if (!projectForm.category) {
      newErrors.category = 'Project category is required';
    }

    const descClean = projectForm.description?.trim();
    if (!descClean) {
      newErrors.description = 'Summary description is required';
    } else if (descClean.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters';
    }

    const priorityNum = parseInt(projectForm.displayPriority, 10);
    if (isNaN(priorityNum) || priorityNum < 1) {
      newErrors.displayPriority = 'Priority must be a positive integer';
    }

    if (projectForm.codeUrl?.trim() && !/^https?:\/\/.+/i.test(projectForm.codeUrl.trim())) {
      newErrors.codeUrl = 'Enter a valid URL (e.g. https://github.com/user/repo)';
    }

    if (projectForm.demoUrl?.trim() && !/^https?:\/\/.+/i.test(projectForm.demoUrl.trim())) {
      newErrors.demoUrl = 'Enter a valid URL (e.g. https://example.com)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingProject(null);
    setProjectForm({
      title: '',
      category: 'Full Stack',
      description: '',
      imageUrl: '',
      techStackInput: '',
      displayPriority: projects.length + 1,
      codeUrl: '',
      demoUrl: '',
      isVisible: true,
    });
    setErrors({});
    setIsCreateProjectOpen(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setEditingProject(project);
    setProjectForm({
      title: project.title || '',
      category: project.category || 'Full Stack',
      description: project.description || '',
      imageUrl: project.imageUrl || '',
      techStackInput: Array.isArray(project.techStack) ? project.techStack.join(', ') : '',
      displayPriority: project.displayPriority || 1,
      codeUrl: project.codeUrl || '',
      demoUrl: project.demoUrl || '',
      isVisible: project.isVisible !== false,
    });
    setErrors({});
    setIsEditProjectOpen(true);
  };

  const closeModal = () => {
    setIsCreateProjectOpen(false);
    setIsEditProjectOpen(false);
    setEditingProject(null);
    setSelectedProject(null);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const parsedTech = projectForm.techStackInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    const payload = {
      _id: editingProject ? editingProject._id : undefined,
      title: projectForm.title.trim(),
      category: projectForm.category,
      description: projectForm.description.trim(),
      imageUrl: projectForm.imageUrl,
      techStack: parsedTech,
      displayPriority: parseInt(projectForm.displayPriority, 10) || 1,
      codeUrl: projectForm.codeUrl.trim(),
      demoUrl: projectForm.demoUrl.trim(),
      isVisible: projectForm.isVisible,
    };

    try {
      await apiCall('post', '/projects/save', payload);
      await fetchProjects();
      closeModal();
    } catch (err) {
      const msg = editingProject
        ? 'Failed to update project. Please try again.'
        : 'Failed to create project. Please try again.';
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (project) => {
    try {
      setUpdatingPriorityId(project._id);
      setGlobalError('');
      await apiCall('post', '/projects/save', {
        _id: project._id,
        title: project.title,
        category: project.category,
        description: project.description,
        imageUrl: project.imageUrl,
        techStack: project.techStack,
        displayPriority: project.displayPriority,
        codeUrl: project.codeUrl,
        demoUrl: project.demoUrl,
        isVisible: project.isVisible === false ? true : false,
      });
      await fetchProjects();
    } catch (err) {
      console.error('Visibility update error:', err.message);
      setGlobalError('Failed to update project visibility. Please try again.');
    } finally {
      setUpdatingPriorityId(null);
    }
  };

  const handlePriorityQuickChange = async (project, newPriority) => {
    const pNum = parseInt(newPriority, 10);
    if (isNaN(pNum) || pNum < 1 || pNum === project.displayPriority || updatingPriorityId) return;

    try {
      setUpdatingPriorityId(project._id);
      setGlobalError('');
      const res = await apiCall('post', '/projects/reorder', {
        projectId: project._id,
        newPriority: pNum,
      });

      if (res.data?.projects && Array.isArray(res.data.projects)) {
        setProjects(res.data.projects);
      } else {
        await fetchProjects();
      }
    } catch (err) {
      console.error('Priority update error:', err.message);
      setGlobalError('Failed to update project order. Please try again.');
      await fetchProjects();
    } finally {
      setUpdatingPriorityId(null);
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm('Permanent delete? This action cannot be undone.')) {
      try {
        await apiCall('delete', `/projects/${id}`);
        if (selectedProject?._id === id) setSelectedProject(null);
        await fetchProjects();
      } catch (err) {
        console.error('Delete error:', err.message);
        setGlobalError('Failed to delete project. Please try again.');
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setProjectForm((prev) => ({ ...prev, imageUrl: base64 }));
    }
  };

  // Filter and Sort Projects
  const filteredAndSortedProjects = React.useMemo(() => {
    let list = projects.filter((project) => {
      const matchesSearch =
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(project.techStack) &&
          project.techStack.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory =
        selectedCategory === 'All Types' || selectedCategory === 'All'
          ? true
          : project.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    list.sort((a, b) => {
      if (sortBy === 'priority_asc') {
        return (a.displayPriority || 99) - (b.displayPriority || 99);
      }
      if (sortBy === 'priority_desc') {
        return (b.displayPriority || 99) - (a.displayPriority || 99);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return list;
  }, [projects, searchTerm, selectedCategory, sortBy]);

  // Calculated Statistics
  const totalCount = projects.length;
  const featuredCount = projects.filter((p) => p.displayPriority >= 1 && p.displayPriority <= 3).length;
  const carouselCount = projects.filter((p) => p.displayPriority > 3).length;
  const visibleCount = projects.filter((p) => p.isVisible !== false).length;

  const isAnyModalOpen = isCreateProjectOpen || isEditProjectOpen;

  if (isLoading) {
    return (
      <section className="section-container" id="projects">
        <div className="section-title-row">
          <div className="section-header">
            <h3>Project Library</h3>
            <p>Manage your portfolio projects, technology stack, and public display priority.</p>
          </div>
          <button className="btn-add-project" onClick={openAddModal}>
            <span className="material-symbols-outlined">add_box</span>
            New Project
          </button>
        </div>

        {/* Skeleton Card Grid */}
        <div className="projects-card-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="admin-project-card skeleton-card">
              <div className="admin-card-header skeleton-pulse" />
              <div className="admin-card-body">
                <div className="skeleton-line skeleton-title skeleton-pulse" />
                <div className="skeleton-line skeleton-desc skeleton-pulse" />
                <div className="skeleton-line skeleton-chips skeleton-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="section-container" id="projects">
      {/* Compact Page Header */}
      <div className="section-title-row">
        <div className="section-header">
          <h3>Project Library</h3>
          <p>Manage your portfolio projects, technology stack, and public display priority.</p>
        </div>
        <button className="btn-add-project" onClick={openAddModal}>
          <span className="material-symbols-outlined">add_box</span>
          New Project
        </button>
      </div>

      {globalError && (
        <div className="global-error-banner" role="alert">
          <span className="material-symbols-outlined">error</span>
          {globalError}
          <button className="btn-retry" onClick={fetchProjects}>
            Retry
          </button>
        </div>
      )}

      {/* Dynamic Summary Stats Row */}
      <div className="project-stats-row">
        <div className="project-stat-card">
          <div className="stat-value">{String(totalCount).padStart(2, '0')}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="project-stat-card">
          <div className="stat-value featured">{String(featuredCount).padStart(2, '0')}</div>
          <div className="stat-label">Featured Showcase</div>
        </div>
        <div className="project-stat-card">
          <div className="stat-value carousel">{String(carouselCount).padStart(2, '0')}</div>
          <div className="stat-label">More Carousel</div>
        </div>
        <div className="project-stat-card">
          <div className="stat-value visible">{String(visibleCount).padStart(2, '0')}</div>
          <div className="stat-label">Public Visible</div>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="projects-toolbar-row">
        <div className="search-input-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search projects by title, category, or tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All Types">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="sort-select-wrapper">
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="priority_asc">Display Priority ↑</option>
            <option value="priority_desc">Display Priority ↓</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A → Z)</option>
          </select>
        </div>
      </div>

      {/* Project Card Grid */}
      <div className="projects-display-wrapper">
        {projects.length === 0 ? (
          <div className="empty-projects-canvas">
            <span className="material-symbols-outlined icon-giant">folder_off</span>
            <div className="empty-text-group">
              <h4>No Projects Found</h4>
              <p>There are currently no projects in your Project Library.</p>
            </div>
            <button className="btn-primary-action" onClick={openAddModal}>
              + New Project
            </button>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="empty-projects-canvas">
            <span className="material-symbols-outlined icon-giant">search_off</span>
            <div className="empty-text-group">
              <h4>No Matching Projects</h4>
              <p>Try changing your search terms or category filter.</p>
            </div>
            <button
              className="btn-primary-action"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All Types');
                setSortBy('priority_asc');
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="projects-card-grid">
            {filteredAndSortedProjects.map((project) => {
              const priority = project.displayPriority || 99;
              const isFeatured = priority >= 1 && priority <= 3;
              const isPublic = project.isVisible !== false;

              const techStack = Array.isArray(project.techStack)
                ? project.techStack
                : typeof project.techStack === 'string'
                ? project.techStack.split(',').map((t) => t.trim()).filter(Boolean)
                : [];

              const visibleTech = techStack.slice(0, 3);
              const overflowCount = techStack.length - 3;

              const codeUrlClean = project.codeUrl?.trim();
              const demoUrlClean = project.demoUrl?.trim();
              const isUpdatingThis = updatingPriorityId === project._id;

              return (
                <div key={project._id} className={`admin-project-card ${isUpdatingThis ? 'updating' : ''}`}>
                  {/* Card Header & Visual Preview */}
                  <div className="admin-card-visual">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="admin-card-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="admin-card-placeholder">
                        <span className="material-symbols-outlined">laptop</span>
                      </div>
                    )}
                    <div className="admin-badge-row">
                      <span className="admin-category-badge">
                        {(project.category || 'Full Stack').toUpperCase()}
                      </span>
                      {isFeatured && (
                        <span className="admin-featured-star-pill">
                          ★ Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="admin-card-body">
                    <h4 className="admin-project-title">{project.title}</h4>
                    <p className="admin-project-desc">{project.description}</p>

                    {/* Tech Stack Chips */}
                    {techStack.length > 0 && (
                      <div className="admin-tech-row">
                        {visibleTech.map((tech, i) => (
                          <span key={i} className="admin-tech-chip">
                            {tech}
                          </span>
                        ))}
                        {overflowCount > 0 && (
                          <span className="admin-tech-chip overflow">
                            +{overflowCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Priority & Status Meta Bar */}
                  <div className="admin-card-meta-bar">
                    <div className="meta-left">
                      <label className="priority-control-label">
                        Display Priority
                        <select
                          className="priority-dropdown-select"
                          value={priority}
                          disabled={isUpdatingThis}
                          onChange={(e) => handlePriorityQuickChange(project, e.target.value)}
                          title="Change Display Priority"
                        >
                          {Array.from({ length: totalCount }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              #{num}
                            </option>
                          ))}
                        </select>
                        {isUpdatingThis && <span className="updating-spinner" />}
                      </label>
                    </div>

                    <div className="meta-right">
                      <span className={`status-pill ${isPublic ? 'public' : 'hidden'}`}>
                        {isPublic ? '● Public' : '● Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* External Resource Links */}
                  {(codeUrlClean || demoUrlClean) && (
                    <div className="admin-card-links-row">
                      {codeUrlClean && (
                        <a
                          href={codeUrlClean.startsWith('http') ? codeUrlClean : `https://${codeUrlClean}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-link-btn github"
                        >
                          GitHub ↗
                        </a>
                      )}
                      {demoUrlClean && (
                        <a
                          href={demoUrlClean.startsWith('http') ? demoUrlClean : `https://${demoUrlClean}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-link-btn demo"
                        >
                          Live Demo ↗
                        </a>
                      )}
                    </div>
                  )}

                  {/* Management Action Bar */}
                  <div className="admin-card-actions">
                    <button
                      className={`btn-card-action visibility ${isPublic ? 'active' : ''}`}
                      onClick={() => handleToggleVisibility(project)}
                      title={isPublic ? 'Hide from Portfolio' : 'Show on Portfolio'}
                      disabled={isSubmitting || isUpdatingThis}
                    >
                      <span className="material-symbols-outlined">
                        {isPublic ? 'visibility' : 'visibility_off'}
                      </span>
                      {isPublic ? 'Public' : 'Hidden'}
                    </button>

                    <button
                      className="btn-card-action edit"
                      onClick={() => openEditModal(project)}
                      title="Edit Project"
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">edit</span>
                      Edit
                    </button>

                    <button
                      className="btn-card-action delete"
                      onClick={() => deleteProject(project._id)}
                      title="Delete Project"
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialog for Project Form (Create / Edit) */}
      {isAnyModalOpen && (
        <Modal
          title={isEditProjectOpen ? 'Edit Project' : 'New Project'}
          isOpen={isAnyModalOpen}
          onClose={closeModal}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="project-form"
          >
            {errors.general && (
              <div className="form-error-banner" role="alert">
                <span className="material-symbols-outlined">error</span>
                {errors.general}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group span-2">
                <label className="form-label">Project Title *</label>
                <input
                  type="text"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g. Placement Portal System"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  disabled={isSubmitting}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className={`form-input ${errors.category ? 'error' : ''}`}
                  value={projectForm.category}
                  onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                  disabled={isSubmitting}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Display Priority *</label>
                <select
                  className={`form-input ${errors.displayPriority ? 'error' : ''}`}
                  value={projectForm.displayPriority}
                  onChange={(e) => setProjectForm({ ...projectForm, displayPriority: parseInt(e.target.value, 10) })}
                  disabled={isSubmitting}
                >
                  {Array.from(
                    { length: isEditProjectOpen ? totalCount : totalCount + 1 },
                    (_, i) => i + 1
                  ).map((num) => (
                    <option key={num} value={num}>
                      #{num} {num <= 3 ? '(Featured Showcase)' : '(More Carousel)'}
                    </option>
                  ))}
                </select>
                {errors.displayPriority && <span className="error-text">{errors.displayPriority}</span>}
              </div>

              <div className="form-group span-2">
                <label className="form-label">Summary Description *</label>
                <textarea
                  rows="3"
                  className={`form-input ${errors.description ? 'error' : ''}`}
                  placeholder="Provide a concise description of what the project does..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  disabled={isSubmitting}
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>

              <div className="form-group span-2">
                <label className="form-label">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Node.js, Express, PostgreSQL"
                  value={projectForm.techStackInput}
                  onChange={(e) => setProjectForm({ ...projectForm, techStackInput: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Repository URL</label>
                <input
                  type="url"
                  className={`form-input ${errors.codeUrl ? 'error' : ''}`}
                  placeholder="https://github.com/username/repository"
                  value={projectForm.codeUrl}
                  onChange={(e) => setProjectForm({ ...projectForm, codeUrl: e.target.value })}
                  disabled={isSubmitting}
                />
                {errors.codeUrl && <span className="error-text">{errors.codeUrl}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Live Demo URL</label>
                <input
                  type="url"
                  className={`form-input ${errors.demoUrl ? 'error' : ''}`}
                  placeholder="https://yourprojectdemo.com"
                  value={projectForm.demoUrl}
                  onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                  disabled={isSubmitting}
                />
                {errors.demoUrl && <span className="error-text">{errors.demoUrl}</span>}
              </div>

              <div className="form-group span-2">
                <label className="checkbox-label flex-row">
                  <input
                    type="checkbox"
                    checked={projectForm.isVisible}
                    onChange={(e) => setProjectForm({ ...projectForm, isVisible: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <span>Public Visibility (Display on Portfolio)</span>
                </label>
              </div>

              <div className="form-group span-2">
                <label className="form-label">Project Image / Screenshot</label>
                <div className="project-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="project-image-file"
                    style={{ display: 'none' }}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="project-image-file" className="upload-placeholder-zone">
                    <span className="material-symbols-outlined">add_photo_alternate</span>
                    <div className="placeholder-text">
                      <p className="main-p">Click to Upload Project Cover Image</p>
                      <p className="sub-p">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  </label>
                </div>
                {projectForm.imageUrl && (
                  <div className="image-preview-container">
                    <img src={projectForm.imageUrl} alt="Project Preview" className="image-preview" />
                    <button
                      type="button"
                      className="btn-remove-image"
                      onClick={() => setProjectForm({ ...projectForm, imageUrl: '' })}
                      disabled={isSubmitting}
                    >
                      Remove Cover
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditProjectOpen
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditProjectOpen
                  ? 'Save Changes'
                  : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};

export default ProjectsSection;
