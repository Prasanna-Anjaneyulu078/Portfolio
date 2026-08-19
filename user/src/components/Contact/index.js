import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import SectionHeader from '../SectionHeader';
import './Contact.css';

const formatUrl = (url) => {
  if (!url) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
};

const Contact = ({ userData = {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const formRef = useRef();

  const email = userData.email || '';
  const github = userData.githubUrl || '';
  const linkedin = userData.linkedinUrl || '';

  const validateForm = () => {
    const newErrors = {};
    const nameClean = formData.name.trim();
    const emailClean = formData.email.trim();
    const messageClean = formData.message.trim();

    if (!nameClean) {
      newErrors.name = 'Full name is required';
    }

    if (!emailClean) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!messageClean) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const sendEmail = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSending(true);
    setStatusMessage({ type: '', text: '' });

    emailjs
      .sendForm(
        'service_w8jvq37',
        'template_ropuv6m',
        formRef.current,
        'tR9d02DCGKaP1ZLCW'
      )
      .then(
        () => {
          setIsSending(false);
          setStatusMessage({ type: 'success', text: 'Message sent successfully.' });
          setFormData({ name: '', email: '', message: '' });
          setErrors({});
        },
        (error) => {
          setIsSending(false);
          setStatusMessage({
            type: 'danger',
            text: 'Unable to send your message. Please try again.',
          });
          console.error('EmailJS error:', error.text || error);
        }
      );
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <SectionHeader title="Contact" />

        <div className="contact-layout-grid">
          {/* Left Column: Contact Information */}
          <div className="contact-info-pane">
            <h3 className="contact-info-title">Let's Connect</h3>
            <p className="contact-info-desc">
              Have a question, opportunity, or project you'd like to discuss?
            </p>

            <div className="contact-details-list">
              {email && (
                <div className="contact-detail-item">
                  <span className="material-symbols-outlined contact-detail-icon">mail</span>
                  <div className="contact-detail-text">
                    <span className="contact-detail-label">Email</span>
                    <a href={`mailto:${email}`} className="contact-detail-value">
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {github && (
                <div className="contact-detail-item">
                  <svg className="contact-detail-svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <div className="contact-detail-text">
                    <span className="contact-detail-label">GitHub</span>
                    <a
                      href={formatUrl(github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-detail-value"
                    >
                      GitHub ↗
                    </a>
                  </div>
                </div>
              )}

              {linkedin && (
                <div className="contact-detail-item">
                  <svg className="contact-detail-svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <div className="contact-detail-text">
                    <span className="contact-detail-label">LinkedIn</span>
                    <a
                      href={formatUrl(linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-detail-value"
                    >
                      LinkedIn ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Send a Message Form Card */}
          <div className="contact-form-card">
            <h3 className="form-heading">Send a Message</h3>

            {statusMessage.text && (
              <div
                className={`contact-alert alert-${statusMessage.type}`}
                role="alert"
                aria-live="polite"
              >
                <span className="material-symbols-outlined icon-alert">
                  {statusMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form ref={formRef} onSubmit={sendEmail} noValidate>
              <div className="form-field-group">
                <label htmlFor="user_name" className="form-label">
                  Full Name <span className="req-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="user_name"
                  name="name"
                  autoComplete="name"
                  className={`form-input-field ${errors.name ? 'has-error' : ''}`}
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isSending}
                  required
                />
                {errors.name && <span className="field-error-msg">{errors.name}</span>}
              </div>

              <div className="form-field-group">
                <label htmlFor="user_email" className="form-label">
                  Email Address <span className="req-asterisk">*</span>
                </label>
                <input
                  type="email"
                  id="user_email"
                  name="email"
                  autoComplete="email"
                  className={`form-input-field ${errors.email ? 'has-error' : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSending}
                  required
                />
                {errors.email && <span className="field-error-msg">{errors.email}</span>}
              </div>

              <div className="form-field-group">
                <label htmlFor="message" className="form-label">
                  Your Message <span className="req-asterisk">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  className={`form-textarea-field ${errors.message ? 'has-error' : ''}`}
                  placeholder="Tell me about your opportunity or project..."
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isSending}
                  required
                />
                {errors.message && <span className="field-error-msg">{errors.message}</span>}
              </div>

              {/* Hidden fields for EmailJS name binding */}
              <input type="hidden" name="user_name" value={formData.name} />
              <input type="hidden" name="user_email" value={formData.email} />

              <button
                type="submit"
                className="btn-contact-submit"
                disabled={isSending}
              >
                {isSending
                  ? 'Sending...'
                  : statusMessage.type === 'success'
                  ? 'Message Sent ✓'
                  : 'Send Message →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
