import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import './Contact.css';

const Contact = ({ userData = {} }) => {
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const formRef = useRef();

  const sendEmail = (e) => {
    e.preventDefault();
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
          setStatusMessage({ type: 'success', text: 'Message sent successfully! I will get back to you soon.' });
          formRef.current.reset();
        },
        (error) => {
          setIsSending(false);
          setStatusMessage({ type: 'danger', text: 'Failed to send message. Please email directly.' });
          console.error('EmailJS error:', error.text || error);
        }
      );
  };

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="section-title-wrapper">
          <div className="badge-emphasis">
            Get In Touch
          </div>
          <h2 className="section-title">
            Contact
          </h2>
          <p className="section-subtitle">
            I'm currently looking for Software Engineering opportunities, internships, and challenging development roles.
          </p>
        </div>

        <div className="contact-wrapper">
          {/* Recruiter-focused Message & Direct Links */}
          <div className="contact-info-card">
            <div>
              <h3 className="contact-info-title">Open for Opportunities</h3>
              <p className="contact-info-desc">
                Feel free to reach out via the contact form or send a message directly to my email. I typically respond within 24 hours.
              </p>

              {userData.email && (
                <a href={`mailto:${userData.email}`} className="contact-direct-link">
                  <div className="contact-direct-icon">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Direct Email</div>
                    <div className="contact-direct-text">{userData.email}</div>
                  </div>
                </a>
              )}
            </div>

            <div className="contact-socials-group">
              <div className="socials-label">Connect Online</div>
              <div className="contact-social-icons">
                {userData.githubUrl && (
                  <a
                    href={formatUrl(userData.githubUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-item"
                    aria-label="GitHub Profile"
                    title="GitHub"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                )}

                {userData.linkedinUrl && (
                  <a
                    href={formatUrl(userData.linkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-item"
                    aria-label="LinkedIn Profile"
                    title="LinkedIn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-container">
            <form ref={formRef} onSubmit={sendEmail}>
              {statusMessage.text && (
                <div className={`alert-${statusMessage.type}`} role="alert">
                  {statusMessage.text}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="user_name"
                  className="form-control"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="user_email"
                  className="form-control"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  className="form-control"
                  placeholder="Hi Prasanna, I would like to discuss..."
                  rows={4}
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn" disabled={isSending}>
                <span className="material-symbols-outlined">send</span>
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
