import React, { useState, useRef, useEffect, useCallback } from 'react';
import SectionHeader from '../SectionHeader';
import './Certifications.css';

import { resolveAssetUrl } from '../../config/api';

const formatUrl = (url) => {
  if (!url || url === '#' || url.trim() === '') return '';
  return url.startsWith('http') ? url : `https://${url}`;
};

const resolveFileUrl = (urlStr) => resolveAssetUrl(urlStr);

const detectFileType = (urlStr) => {
  if (!urlStr) return { isPdf: false, isImage: false };
  const lower = urlStr.toLowerCase();
  if (lower.startsWith('data:application/pdf') || lower.includes('.pdf')) {
    return { isPdf: true, isImage: false };
  }
  return { isPdf: false, isImage: true };
};

/* ─── Clean fallback UI for when preview is unavailable ─────────────────── */
const CertPreviewFallback = ({ fileUrl, label = 'Open Certificate' }) => (
  <div className="cert-preview-fallback">
    <span className="material-symbols-outlined cert-fallback-icon">workspace_premium</span>
    <p className="cert-fallback-label">Certificate Preview</p>
    <p className="cert-fallback-sub">Unable to preview this file</p>
    {fileUrl && (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-cert-open"
      >
        {label} ↗
      </a>
    )}
  </div>
);

/* ─── Image certificate with React-state error handling ─────────────────── */
const CertImagePreview = ({ fileUrl, title }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state when fileUrl changes (carousel navigation)
  useEffect(() => {
    setImgError(false);
  }, [fileUrl]);

  if (imgError) {
    return (
      <CertPreviewFallback
        fileUrl={fileUrl}
        label="Open Certificate"
      />
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="cert-img-wrapper-link"
      title="Click to view full certificate"
    >
      <img
        src={fileUrl}
        alt={title ? `${title} certificate` : 'Certificate preview'}
        className="cert-full-img"
        loading="eager"
        onError={() => setImgError(true)}
      />
    </a>
  );
};

/* ─── PDF certificate component with reliable state-based fallback ───────── */
const PdfPreview = ({ fileUrl, title }) => {
  const [hasError, setHasError] = useState(false);

  // Reset when fileUrl changes
  useEffect(() => {
    setHasError(false);
  }, [fileUrl]);

  if (hasError) {
    return <CertPreviewFallback fileUrl={fileUrl} label="Open PDF" />;
  }

  return (
    <div className="pdf-viewer-wrapper">
      <object
        data={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        type="application/pdf"
        className="pdf-embed-object"
        onError={() => setHasError(true)}
      >
        {/* Fallback for browsers that cannot render PDF inside <object> */}
        <CertPreviewFallback fileUrl={fileUrl} label="Open PDF" />
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

/* ─── Main Certifications component ─────────────────────────────────────── */
const Certifications = ({ certifications = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const certCardRef = useRef(null);

  // Filter active/visible certs & sort strictly by displayOrder ascending
  const validCerts = React.useMemo(() => {
    if (!Array.isArray(certifications)) return [];
    const filtered = certifications.filter(
      (c) => c.isVisible !== false && c.isActive !== false
    );

    return [...filtered].sort((a, b) => {
      const orderA =
        typeof a.displayOrder === 'number'
          ? a.displayOrder
          : typeof a.order === 'number'
          ? a.order
          : 0;
      const orderB =
        typeof b.displayOrder === 'number'
          ? b.displayOrder
          : typeof b.order === 'number'
          ? b.order
          : 0;

      if (orderA !== orderB) return orderA - orderB;

      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;

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

  // If no certification records exist, hide section entirely
  if (validCerts.length === 0) return null;

  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50 && currentIndex < maxIndex) handleNext();
    else if (distance < -50 && currentIndex > 0) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  }, [currentIndex, maxIndex]);

  // Attach touch listeners passively to avoid scroll-blocking violation
  useEffect(() => {
    const card = certCardRef.current;
    if (!card) return;

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
    const onTouchEnd = () => handleTouchEnd();

    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchmove', onTouchMove, { passive: true });
    card.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      card.removeEventListener('touchstart', onTouchStart);
      card.removeEventListener('touchmove', onTouchMove);
      card.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleTouchEnd]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) handlePrev();
    else if (e.key === 'ArrowRight' && currentIndex < maxIndex) handleNext();
  };

  const activeCert = validCerts[currentIndex] || validCerts[0];
  const formattedVerifyUrl = formatUrl(activeCert.verificationUrl);
  const rawFileUrl =
    activeCert.certificateFileUrl ||
    activeCert.imageUrl ||
    activeCert.fileUrl ||
    activeCert.certificate ||
    activeCert.url ||
    '';
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

            {/* Active Certificate Card — touch listeners attached passively */}
            <div
              ref={certCardRef}
              className="cert-active-card"
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {/* Certificate Preview Area */}
              <div className="cert-full-preview-box">
                {resolvedFileUrl ? (
                  isPdf ? (
                    <PdfPreview
                      key={resolvedFileUrl}
                      fileUrl={resolvedFileUrl}
                      title={activeCert.title}
                    />
                  ) : (
                    <CertImagePreview
                      key={resolvedFileUrl}
                      fileUrl={resolvedFileUrl}
                      title={activeCert.title}
                    />
                  )
                ) : (
                  /* No file URL at all */
                  <CertPreviewFallback label="Certificate Not Available" />
                )}
              </div>

              {/* Compact Metadata Info Below Certificate */}
              <div className="cert-metadata-info">
                {activeCert.title && (
                  <h3 className="cert-title-primary">{activeCert.title}</h3>
                )}
                {issuerName && (
                  <h4 className="cert-issuer-name">{issuerName}</h4>
                )}

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
                  {formattedVerifyUrl && (
                    <a
                      href={formattedVerifyUrl}
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
