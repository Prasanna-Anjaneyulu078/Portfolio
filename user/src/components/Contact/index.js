import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Contact.css';

const API_URL = "https://prasanna-portfolio-admin.vercel.app/api/user"

const Contact = () => {
  const [data, setData] = useState({
    name: '',
    role: '',
    email: '',
    bio: '',
    avatarUrl: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  // State for form feedback
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL)
        setData(response.data)
      } catch (err) {
        console.log(`Error: ${err.message}`)
      }
    }
    fetchData()
  }, [])

  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSending(true);
    setStatusMessage({ type: '', text: '' });

    emailjs
      .sendForm(
        'service_w8jvq37', 
        'template_ropuv6m', 
        form.current, 
        'tR9d02DCGKaP1ZLCW' // Passing Public Key directly as string
      )
      .then(
        () => {
          setIsSending(false);
          setStatusMessage({ type: 'success', text: 'Message sent successfully!' });
          form.current.reset(); // Clear form after success
        },
        (error) => {
          setIsSending(false);
          setStatusMessage({ type: 'danger', text: 'Failed to send. Please try again.' });
          console.log('FAILED...', error.text);
        },
      );
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container contact-container">
        <div className="contact-header">
          <span className="material-symbols-outlined contact-main-icon">alternate_email</span>
          <h2 className="contact-title">Let's Connect</h2>
          <p className="contact-subtitle">
            I'm currently seeking new opportunities. Whether you have a project in mind 
            or just want to discuss tech — my inbox is always open!
          </p>
        </div>
        
        <form className="contact-form" ref={form} onSubmit={sendEmail}>
          {/* Feedback Alert */}
          {statusMessage.text && (
            <div className={`alert alert-${statusMessage.type} mb-4`} role="alert">
              {statusMessage.text}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="user_name" placeholder="Enter your name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="user_email" placeholder="example@email.com" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="message">Your Message</label>
            {/* Added name="message" so EmailJS can find the content */}
            <textarea id="message" name="message" placeholder="What would you like to say?" rows={4} required></textarea>
          </div>
          
          {/* Change type to "submit" so onSubmit triggers */}
          <button type="submit" className="submit-btn" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="contact-info">
          <a className="contact-email" href={`mailto:${data.email}`}>
            {data.email}
          </a>
          <div className="social-footer">
            <a href={data.githubUrl?.startsWith("http") ? data.githubUrl : `https://${data.githubUrl}`} target="_blank" rel="noopener noreferrer" className="social-item" aria-label="GitHub">
              <div className="icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
            </a>
            <a href={data.linkedinUrl?.startsWith("http") ? data.linkedinUrl : `https://${data.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="social-item" aria-label="LinkedIn">
              <div className="icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
