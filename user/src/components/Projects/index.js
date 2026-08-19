import React, { useState, useRef, useEffect } from 'react';
import SectionHeader from '../SectionHeader';
import ProjectModal from './ProjectModal';
import { scrollToProjects } from '../../utils/scrollUtils';
import { resolveAssetUrl } from '../../config/api';
import './Projects.css';

const Projects = ({ projects = [], loading = false, error = false }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showMoreProjects, setShowMoreProjects] = useState(false);
  const [shouldScrollToProjects, setShouldScrollToProjects] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const carouselRef = useRef(null);
  const carouselTrackRef = useRef(null);
  const projectsSectionRef = useRef(null);

  // Helper to split tech stack string into array of tech items
  const parseTechStack = (techStack) => {
    if (Array.isArray(techStack)) return techStack;
    if (typeof techStack === 'string') {
      return techStack
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  // Sort database projects by displayPriority ascending
  const allProjects = React.useMemo(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return [];
    }
    const list = projects.map((p) => ({
      ...p,
      badge: (p.category || 'PROJECT').toUpperCase(),
      techList: parseTechStack(p.techStack),
    }));
    list.sort((a, b) => (a.displayPriority || 99) - (b.displayPriority || 99));
    return list;
  }, [projects]);

  // Top 3 featured projects (first 3 sorted by displayPriority)
  const topThreeProjects = React.useMemo(() => {
    if (allProjects.length === 0) return [];
    return allProjects.slice(0, 3);
  }, [allProjects]);

  // Projects for the "+ More Projects" carousel (guaranteed non-empty if allProjects exist)
  const carouselProjects = React.useMemo(() => {
    if (allProjects.length === 0) return [];
    if (allProjects.length > 3) return allProjects.slice(3);
    return allProjects;
  }, [allProjects]);

  // Max carousel index calculation
  const maxCarouselIndex = Math.max(0, carouselProjects.length - 1);

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => Math.min(maxCarouselIndex, prev + 1));
  };

  // Touch Swipe Handlers — attached via useEffect with { passive: true } to avoid
  // scroll-blocking non-passive event listener violation.
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && carouselIndex < maxCarouselIndex) {
      handleNextSlide();
    } else if (isRightSwipe && carouselIndex > 0) {
      handlePrevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleTouchEndRef = useRef(handleTouchEnd);
  useEffect(() => { handleTouchEndRef.current = handleTouchEnd; });

  useEffect(() => {
    const track = carouselTrackRef.current;
    if (!track) return;

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
    const onTouchEnd = () => handleTouchEndRef.current();

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: true });
    track.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
    };
  }, [showMoreProjects]);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showMoreProjects) return;
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMoreProjects, maxCarouselIndex]);

  // Shared Projects navigation helper — exact same function used by navbar & buttons
  const handleProjectsNavigation = () => {
    scrollToProjects();
  };

  // Handle "+ More Projects" / "Show Less" toggle
  const handleToggleMoreProjects = () => {
    if (showMoreProjects) {
      // Collapsing carousel -> trigger smooth scroll using shared Projects navigation handler
      setShowMoreProjects(false);
      setShouldScrollToProjects(true);
    } else {
      // Expanding carousel
      setShowMoreProjects(true);
    }
  };

  // Smooth scroll to carousel when expanding (block: 'nearest' to prevent unnatural jumping)
  useEffect(() => {
    if (showMoreProjects && carouselRef.current) {
      requestAnimationFrame(() => {
        carouselRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }, [showMoreProjects]);

  // Smooth scroll to Featured Projects section heading after collapse rendering completes
  useEffect(() => {
    if (!shouldScrollToProjects || showMoreProjects) {
      return;
    }

    // Double requestAnimationFrame guarantees DOM and browser layout calculation are complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleProjectsNavigation();
        setShouldScrollToProjects(false);
      });
    });
  }, [showMoreProjects, shouldScrollToProjects]);

  // 1. Loading State (Skeleton Cards)
  if (loading) {
    return (
      <section id="projects" className="projects-section">
        <div className="container">
          <SectionHeader title="Featured Projects" />
          <div className="featured-showcase-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="featured-project-card skeleton-card">
                <div className="card-visual-frame skeleton-pulse" />
                <div className="card-content-pane">
                  <div className="skeleton-line skeleton-badge skeleton-pulse" />
                  <div className="skeleton-line skeleton-title skeleton-pulse" />
                  <div className="skeleton-line skeleton-desc skeleton-pulse" />
                  <div className="skeleton-line skeleton-desc-short skeleton-pulse" />
                  <div className="skeleton-tech-chips">
                    <div className="skeleton-chip skeleton-pulse" />
                    <div className="skeleton-chip skeleton-pulse" />
                    <div className="skeleton-chip skeleton-pulse" />
                  </div>
                  <div className="card-actions-row">
                    <div className="skeleton-btn skeleton-pulse" />
                    <div className="skeleton-btn skeleton-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <section id="projects" className="projects-section">
        <div className="container">
          <SectionHeader title="Featured Projects" />
          <div className="projects-status-card projects-error-state">
            <p className="projects-status-message">Unable to load projects.</p>
          </div>
        </div>
      </section>
    );
  }

  // 3. Empty State (No featured projects)
  if (topThreeProjects.length === 0) {
    return (
      <section id="projects" className="projects-section">
        <div className="container">
          <SectionHeader title="Featured Projects" />
          <div className="projects-status-card projects-empty-state">
            <p className="projects-status-message">No featured projects available.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="projects-section" ref={projectsSectionRef}>
      <div className="container">
        <SectionHeader title="Featured Projects" />

        {/* Top 3 Featured Projects Showcase Grid */}
        <div className="featured-showcase-grid">
          {topThreeProjects.map((proj) => {
            const hasCode = Boolean(proj.codeUrl && proj.codeUrl.trim());
            const hasDemo = Boolean(proj.demoUrl && proj.demoUrl.trim());
            const visibleTech = proj.techList.slice(0, 3);
            const hiddenTechCount = proj.techList.length - 3;

            return (
              <div
                key={proj._id}
                className="featured-project-card clickable-card"
                onClick={() => setSelectedProject(proj)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${proj.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedProject(proj);
                  }
                }}
              >
                {/* 1. Project Visual / Image Area at Top */}
                <div className="card-visual-frame">
                  {proj.imageUrl ? (
                    <img
                      src={resolveAssetUrl(proj.imageUrl)}
                      alt={proj.title}
                      className="visual-image-preview"
                      loading="lazy"
                    />
                  ) : (
                    <div className="visual-browser-mockup">
                      <div className="browser-header-bar">
                        <div className="browser-dots">
                          <span className="dot red" />
                          <span className="dot yellow" />
                          <span className="dot green" />
                        </div>
                        <div className="browser-address">
                          {proj.demoUrl || 'https://demo.project.com'}
                        </div>
                      </div>
                      <div className="browser-viewport-content">
                        <div className="mockup-content-box">
                          <div className="mockup-line title" />
                          <div className="mockup-line text" />
                          <div className="mockup-line text short" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Card Content Pane */}
                <div className="card-content-pane">
                  <div className="card-top-bar">
                    <span className="badge-category">{proj.badge}</span>
                  </div>

                  <h3 className="project-card-title">{proj.title}</h3>
                  <p className="project-card-desc">{proj.description}</p>

                  {/* Tech Stack Chips with +N overflow treatment */}
                  {proj.techList.length > 0 && (
                    <div className="tech-chips-wrapper">
                      {visibleTech.map((tech, i) => (
                        <span key={i} className="tech-chip-item">
                          {tech}
                        </span>
                      ))}
                      {hiddenTechCount > 0 && (
                        <span className="tech-chip-item overflow-tag">
                          +{hiddenTechCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* External Resource Action CTAs */}
                  {(hasCode || hasDemo) && (
                    <div
                      className="card-actions-row"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasCode && (
                        <a
                          href={
                            proj.codeUrl.startsWith('http')
                              ? proj.codeUrl
                              : `https://${proj.codeUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-project-cta outline"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          GitHub ↗
                        </a>
                      )}
                      {hasDemo && (
                        <a
                          href={
                            proj.demoUrl.startsWith('http')
                              ? proj.demoUrl
                              : `https://${proj.demoUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-project-cta primary"
                        >
                          Live Demo ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* "+ More Projects" Expandable Button & Carousel Section */}
        {allProjects.length > 0 && (
          <div className="more-projects-trigger-wrapper">
            <button
              type="button"
              className="btn-more-projects-toggle"
              onClick={handleToggleMoreProjects}
              aria-expanded={showMoreProjects}
            >
              {showMoreProjects ? 'Show Less' : '+ More Projects'}
            </button>
          </div>
        )}

        {/* Expandable Carousel View */}
        {showMoreProjects && carouselProjects.length > 0 && (
          <div
            ref={carouselRef}
            className="more-projects-carousel-container"
            aria-labelledby="more-projects-title"
            tabIndex={-1}
          >
            <div className="carousel-controls-bar">
              <span id="more-projects-title" className="carousel-counter-text">
                Project {carouselIndex + 1} of {carouselProjects.length}
              </span>
              <div className="carousel-nav-buttons">
                <button
                  type="button"
                  className="carousel-btn"
                  onClick={handlePrevSlide}
                  disabled={carouselIndex === 0}
                  aria-label="Previous Project"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="carousel-btn"
                  onClick={handleNextSlide}
                  disabled={carouselIndex >= maxCarouselIndex}
                  aria-label="Next Project"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Carousel Viewport Track — touch listeners attached passively via useEffect */}
            <div
              ref={carouselTrackRef}
              className="carousel-viewport-track"
            >
              <div
                className="carousel-slides-wrapper"
                style={{
                  transform: `translateX(-${carouselIndex * 100}%)`,
                }}
              >
                {carouselProjects.map((proj) => {
                  const hasCode = Boolean(proj.codeUrl && proj.codeUrl.trim());
                  const hasDemo = Boolean(proj.demoUrl && proj.demoUrl.trim());
                  const visibleTech = proj.techList.slice(0, 3);
                  const hiddenTechCount = proj.techList.length - 3;

                  return (
                    <div key={proj._id} className="carousel-slide-item">
                      <div
                        className="featured-project-card carousel-card clickable-card"
                        onClick={() => setSelectedProject(proj)}
                      >
                        <div className="card-content-pane">
                          <div className="card-top-bar">
                            <span className="badge-category">{proj.badge}</span>
                          </div>
                          <h4 className="project-card-title">{proj.title}</h4>
                          <p className="project-card-desc">{proj.description}</p>

                          {proj.techList.length > 0 && (
                            <div className="tech-chips-wrapper">
                              {visibleTech.map((tech, i) => (
                                <span key={i} className="tech-chip-item">
                                  {tech}
                                </span>
                              ))}
                              {hiddenTechCount > 0 && (
                                <span className="tech-chip-item overflow-tag">
                                  +{hiddenTechCount}
                                </span>
                              )}
                            </div>
                          )}

                          {(hasCode || hasDemo) && (
                            <div
                              className="card-actions-row"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {hasCode && (
                                <a
                                  href={
                                    proj.codeUrl.startsWith('http')
                                      ? proj.codeUrl
                                      : `https://${proj.codeUrl}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-project-cta outline sm"
                                >
                                  GitHub ↗
                                </a>
                              )}
                              {hasDemo && (
                                <a
                                  href={
                                    proj.demoUrl.startsWith('http')
                                      ? proj.demoUrl
                                      : `https://${proj.demoUrl}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-project-cta primary sm"
                                >
                                  Live Demo ↗
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="carousel-dots-row">
              {carouselProjects.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
};

export default Projects;
