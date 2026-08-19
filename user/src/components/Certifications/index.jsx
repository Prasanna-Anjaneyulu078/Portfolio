import React, { useState, useRef, useEffect } from 'react';
import SectionHeader from '../SectionHeader';
import './Certifications.css';

const formatUrl = (url) => {
  if (!url || url === '#' || url.trim() === '') return '';
  return url.startsWith('http') ? url : `https://${url}`;
};

const resolveFileUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  const apiBase = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:3002';
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBase}${cleanPath}`;
};

const detectFileType = (urlStr) => {
  if (!urlStr) return { isPdf: false, isImage: false };
  const lower = urlStr.toLowerCase();
  if (lower.startsWith('data:application/pdf') || lower.includes('.pdf')) {
    return { isPdf: true, isImage: false };
  }
  return { isPdf: false, isImage: true };
};

const PdfPreview = ({ fileUrl, title }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="pdf-fallback-box">
        <span className="material-symbols-outlined icon-pdf-large">picture_as_pdf</span>
        <p className="pdf-fallback-title">PDF Certificate Document</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-view-pdf-large"
        >
          View Certificate ↗
        </a>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-wrapper">
      <object
        data={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        type="application/pdf"
        className="pdf-embed-object"
        onError={() => setHasError(true)}
      >
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          title={title || 'PDF Certificate'}
          className="pdf-embed-iframe"
          onError={() => setHasError(true)}
        >
          <div className="pdf-fallback-box">
            <span className="material-symbols-outlined icon-pdf-large">picture_as_pdf</span>
            <p className="pdf-fallback-title">PDF Certificate Document</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-view-pdf-large"
            >
              View Certificate ↗
            </a>
          </div>
        </iframe>
      </object>
      <div className="pdf-open-overlay">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-view-pdf-floating"
          title="Open PDF in new tab"
        >
          Open PDF ↗
        </a>
      </div>
    </div>
  );
};

const Certifications = ({ certifications = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Filter active/visible certs & sort strictly by displayOrder ascending
  const validCerts = React.useMemo(() => {
    if (!Array.isArray(certifications)) return [];
    const filtered = certifications.filter((c) => c.isVisible !== false && c.isActive !== false);

    return [...filtered].sort((a, b) => {
      const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : typeof a.order === 'number' ? a.order : 0;
      const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : typeof b.order === 'number' ? b.order : 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return String(a._id || '').localeCompare(String(b._id || ''));
    });
  }, [certifications]);

  const maxIndex = Math.max(0, validCerts.length - 1);

  // Reset index if validCerts changes and currentIndex is out of bounds
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(Math.max(0, maxIndex));
    }
  }, [validCerts.length, maxIndex, currentIndex]);

  // If no database certification records exist, return null to completely hide section
  if (validCerts.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50 && currentIndex < maxIndex) {
      handleNext();
    } else if (distance < -50 && currentIndex > 0) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      handlePrev();
    } else if (e.key === 'ArrowRight' && currentIndex < maxIndex) {
      handleNext();
    }
  };

  const activeCert = validCerts[currentIndex] || validCerts[0];
  const formattedUrl = formatUrl(activeCert.verificationUrl);
  const rawFileUrl = activeCert.certificateFileUrl || activeCert.imageUrl || activeCert.fileUrl || activeCert.certificate || activeCert.url || '';
  const resolvedFileUrl = resolveFileUrl(rawFileUrl);
  const { isPdf } = detectFileType(resolvedFileUrl);
  const issuerName = activeCert.issuingOrganization || activeCert.issuer;

  const formattedCurrentPos = String(currentIndex + 1).padStart(2, '0');
  const formattedTotalCount = String(validCerts.length).padStart(2, '0');

  return (
    <section id="certifications" className="certifications-section">
      <div className="container">
        <SectionHeader title="Certifications" />

        <div className="cert-carousel-container">
          {/* Main Carousel Card & Navigation Arrows */}
          <div className="cert-carousel-wrapper">
            {/* Desktop Left Arrow */}
            {validCerts.length > 1 && (
              <button
                type="button"
                className="cert-nav-arrow arrow-left"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                aria-label="Previous certificate"
              >
                ‹
              </button>
            )}

            {/* Active Certificate Card */}
            <div
              className="cert-active-card"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {/* Full Certificate Preview Area */}
              <div className="cert-full-preview-box">
                {resolvedFileUrl ? (
                  isPdf ? (
                    <PdfPreview fileUrl={resolvedFileUrl} title={activeCert.title} />
                  ) : (
                    <a
                      href={resolvedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cert-img-wrapper-link"
                      title="Click to view full certificate"
                    >
                      <img
                        src={resolvedFileUrl}
                        alt={`${activeCert.title || 'Certificate'} preview`}
                        className="cert-full-img"
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="cert-fallback-box" style={{ display: 'none' }}>
                        <span className="material-symbols-outlined icon-large">description</span>
                        <p className="fallback-text">Certificate Preview Unavailable</p>
                        <span className="btn-view-pdf">Open Document ↗</span>
                      </div>
                    </a>
                  )
                ) : (
                  <div className="cert-fallback-box">
                    <span className="material-symbols-outlined icon-large">workspace_premium</span>
                    <p className="fallback-text">Certificate File Not Uploaded</p>
                  </div>
                )}
              </div>

              {/* Compact Metadata Info Below Certificate */}
              <div className="cert-metadata-info">
                {activeCert.title && <h3 className="cert-title-primary">{activeCert.title}</h3>}
                {issuerName && <h4 className="cert-issuer-name">{issuerName}</h4>}

                <div className="cert-details-meta">
                  {(activeCert.issueDate || activeCert.date) && (
                    <span className="cert-meta-item">
                      <span className="material-symbols-outlined icon-meta">event</span>
                      Issued: {activeCert.issueDate || activeCert.date}
                    </span>
                  )}
                  {activeCert.credentialId && (
                    <span className="cert-meta-item">
                      <span className="material-symbols-outlined icon-meta">badge</span>
                      ID: {activeCert.credentialId}
                    </span>
                  )}
                  {formattedUrl && (
                    <a
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cert-verify-link"
                    >
                      Verify Credential ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Right Arrow */}
            {validCerts.length > 1 && (
              <button
                type="button"
                className="cert-nav-arrow arrow-right"
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                aria-label="Next certificate"
              >
                ›
              </button>
            )}
          </div>

          {/* Certificate Position Counter (e.g. 02 / 05) */}
          <div className="cert-position-counter-row">
            <span className="cert-position-counter" aria-live="polite">
              {formattedCurrentPos} / {formattedTotalCount}
            </span>
          </div>

          {/* Carousel Controls & Pagination Indicators */}
          {validCerts.length > 1 && (
            <div className="cert-carousel-controls">
              <button
                type="button"
                className="cert-control-btn-mobile"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                aria-label="Previous certificate"
              >
                ←
              </button>

              <div className="cert-dots-indicator-row">
                {validCerts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`cert-indicator-dot ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to certificate ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="cert-control-btn-mobile"
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                aria-label="Next certificate"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Certifications;
