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

/* ─── Certification Card Component ────────────────────────────────────────── */
const CertCard = ({ cert }) => {
  const formattedVerifyUrl = formatUrl(cert.verificationUrl);
  const rawFileUrl =
    cert.certificateFileUrl ||
    cert.imageUrl ||
    cert.fileUrl ||
    cert.certificate ||
    cert.url ||
    '';
  
  const [resolvedFileUrl, setResolvedFileUrl] = useState('');
  const { isPdf } = detectFileType(resolveFileUrl(rawFileUrl));
  const issuerName = cert.issuingOrganization || cert.issuer;

  useEffect(() => {
    let objectUrl = null;
    const resolved = resolveFileUrl(rawFileUrl);
    
    // For legacy certificates stored as Base64 PDFs, convert to a Blob URL
    // Modern browsers block direct navigation/rendering of data:application/pdf URIs
    if (resolved && resolved.startsWith('data:application/pdf;base64,')) {
      try {
        const base64Data = resolved.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        setResolvedFileUrl(objectUrl);
      } catch (err) {
        console.error("Failed to decode base64 PDF", err);
        setResolvedFileUrl(resolved);
      }
    } else {
      setResolvedFileUrl(resolved);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [rawFileUrl]);

  return (
    <div className="cert-card">
      <div className="cert-preview-box">
        {resolvedFileUrl ? (
          isPdf ? (
            <PdfPreview key={resolvedFileUrl} fileUrl={resolvedFileUrl} title={cert.title} />
          ) : (
            <CertImagePreview key={resolvedFileUrl} fileUrl={resolvedFileUrl} title={cert.title} />
          )
        ) : (
          <CertPreviewFallback label="Certificate Not Available" />
        )}
      </div>

      <div className="cert-content">
        <div className="cert-header">
          <h3 className="cert-title">{cert.title}</h3>
        </div>
        
        {issuerName && <h4 className="cert-issuer">{issuerName}</h4>}
        
        {(cert.issueDate || cert.date) && (
          <div className="cert-date">
            <span className="material-symbols-outlined icon-meta">event</span>
            Issued: {cert.issueDate || cert.date}
          </div>
        )}
        
        <hr className="cert-divider" />
        
        <div className="cert-actions">
          {formattedVerifyUrl && (
            <a
              href={formattedVerifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cert-action btn-verify"
            >
              Verify Credential ↗
            </a>
          )}
          {resolvedFileUrl && (
            <a
              href={resolvedFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cert-action btn-view"
            >
              View Certificate
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Certifications Component ─────────────────────────────────────── */
const Certifications = ({ certifications = [] }) => {
  const viewportRef = useRef(null);
  
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

  // If no certification records exist, hide section entirely
  if (validCerts.length === 0) return null;

  const scrollByAmount = (direction) => {
    if (viewportRef.current) {
      const itemWidth = viewportRef.current.querySelector('.cert-slide').offsetWidth;
      const gap = 16; // 1rem gap
      viewportRef.current.scrollBy({
        left: direction * (itemWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  const handlePrev = () => scrollByAmount(-1);
  const handleNext = () => scrollByAmount(1);

  return (
    <section id="certifications" className="certifications-section">
      <div className="container">
        <SectionHeader title="Certifications" />

        <div className="cert-carousel-container">
          <div className="cert-carousel-wrapper">
            {validCerts.length > 1 && (
              <button
                type="button"
                className="cert-nav-arrow arrow-left"
                onClick={handlePrev}
                aria-label="Previous certification"
              >
                ‹
              </button>
            )}

            <div 
              className={`cert-carousel-viewport ${validCerts.length < 3 ? 'center-certs' : ''}`} 
              ref={viewportRef}
            >
              {validCerts.map((cert) => (
                <div 
                  className="cert-slide" 
                  key={cert._id || cert.title}
                >
                  <CertCard cert={cert} />
                </div>
              ))}
            </div>

            {validCerts.length > 1 && (
              <button
                type="button"
                className="cert-nav-arrow arrow-right"
                onClick={handleNext}
                aria-label="Next certification"
              >
                ›
              </button>
            )}
          </div>

          {validCerts.length > 1 && (
            <div className="cert-carousel-controls">
              <button
                type="button"
                className="cert-control-btn-mobile"
                onClick={handlePrev}
                aria-label="Previous certification"
              >
                &#8592;
              </button>

              <button
                type="button"
                className="cert-control-btn-mobile"
                onClick={handleNext}
                aria-label="Next certification"
              >
                &#8594;
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Certifications;
