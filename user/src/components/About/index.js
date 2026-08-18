import React,{useState, useEffect} from 'react';
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './About.css';

const API_URL = 'https://prasanna-portfolio-admin.vercel.app/api'

const About = () => {
  const [data, setData] = useState({
    coreObjective: '',
    academic: []
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get(`${API_URL}/education`);
        // If data exists, update state. If not, defaults stay empty.
        if (response.data) {
          setData({
            coreObjective: response.data.coreObjective || '',
            academic: response.data.academic || []
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err.message);
      }
    };
    fetchProfileData();
  }, []);

  return (
    <section id="about" className="about-section">
      <div className="container about-grid">
        <div className="about-text-content">
          <div className="section-header">
            <span className="material-symbols-outlined icon-primary">engineering</span>
            <h2>About Me</h2>
          </div>
          <div className="objective-card">
            <p className="objective-text">
              {`"${data.coreObjective}"`}
            </p>
          </div>
        </div>

        <div className="education-content">
          <div className="section-header">
            <span className="material-symbols-outlined icon-primary">school</span>
            <h2>Academic Background</h2>
          </div>
          <div className="education-list">
            {data.academic.length > 0 ? (
              data.academic.map((edu, index) => (
                <React.Fragment key={edu.id || index}>
                  <div className="edu-item">
                    <div className="edu-main">
                      <h4>{edu.degree}</h4>
                      <p>{edu.institution}</p>
                    </div>
                    <div className="edu-meta">
                      <span className="year">{edu.duration}</span>
                      <span className="grade">Result: {edu.cgpa}</span>
                    </div>
                  </div>
                  {index < data.academic.length - 1 && <div className="divider"></div>}
                </React.Fragment>
              ))
            ) : (
              <p>No academic details found.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
