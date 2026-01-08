import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import './index.css';

const API_BASE = 'http://localhost:3002/api';

const SkillsSection = () => {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [skillGroups, setSkillGroups] = useState([]);
  const [codingProfiles, setCodingProfiles] = useState([]);
  
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({ title: "", skillsString: "" });
  
  const [profileFormData, setProfileFormData] = useState([]);
  const [newProfile, setNewProfile] = useState({ platform: "", url: "", icon: "code", color: "blue" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [skillsRes, profilesRes] = await Promise.all([
        axios.get(`${API_BASE}/skill-groups`),
        axios.get(`${API_BASE}/profiles`)
      ]);
      setSkillGroups(skillsRes.data);
      setCodingProfiles(profilesRes.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewProfileToList = () => {
    if (!newProfile.platform || !newProfile.url) return;
    setProfileFormData([...profileFormData, { ...newProfile }]);
    setNewProfile({ platform: "", url: "", icon: "code", color: "blue" });
  };

  const removeProfileFromList = (index) => {
    setProfileFormData(profileFormData.filter((_, i) => i !== index));
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/profiles/sync`, profileFormData);
      setCodingProfiles(res.data);
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error("Profile Sync Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGroupSave = async () => {
    if (!groupFormData.title.trim()) return;
    setIsSaving(true);
    const payload = { 
      title: groupFormData.title, 
      skills: groupFormData.skillsString.split(",").map(s => s.trim()).filter(s => s !== "") 
    };
    try {
      if (editingGroup) {
        const res = await axios.put(`${API_BASE}/skill-groups/${editingGroup._id}`, payload);
        setSkillGroups(prev => prev.map(g => g._id === editingGroup._id ? res.data : g));
      } else {
        const res = await axios.post(`${API_BASE}/skill-groups`, payload);
        setSkillGroups(prev => [...prev, res.data]);
      }
      setIsGroupModalOpen(false);
    } catch (err) { console.error(err); } 
    finally { setIsSaving(false); }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await axios.delete(`${API_BASE}/skill-groups/${id}`);
      setSkillGroups(prev => prev.filter(g => g._id !== id));
    } catch (err) { console.error(err); }
  };

  // --- STANDARD MINIMAL LOADER ---
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px', width: '100%' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="section-container" id="skills">
      <div className="section-title-row">
        <div className="section-header">
          <h3>Skills & Coding Profiles</h3>
          <p className="db-status">Live from MongoDB</p>
        </div>
        <button className="btn-add-project" onClick={() => {
            setEditingGroup(null);
            setGroupFormData({ title: "", skillsString: "" });
            setIsGroupModalOpen(true);
        }}>
          <span className="material-symbols-outlined">add_circle</span>
          Add New Skill
        </button>
      </div>

      <div className="card card-padding">
        <div className="skills-main-layout">
          {/* Main Skills Grid */}
          <div className="skill-groups-grid">
            {skillGroups.map((group) => (
              <div key={group._id} className="skill-group-card">
                <div className="skill-group-header">
                  <h5 className="skills-group-title">{group.title}</h5>
                  <div className="group-actions">
                    <button className="btn-icon-small" onClick={() => {
                      setEditingGroup(group);
                      setGroupFormData({ title: group.title, skillsString: group.skills.join(", ") });
                      setIsGroupModalOpen(true);
                    }}>
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="btn-icon-small btn-icon-danger" onClick={() => deleteGroup(group._id)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
                <div className="skills-tags">
                  {group.skills.map((s, i) => (
                    <div key={i} className="skill-tag">{s}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Profiles Sidebar */}
          <div className="profiles-sidebar">
            <div className="profile-header-row">
              <h5 className="skills-group-title">Coding Profiles</h5>
              <button className="btn-tiny-link" onClick={() => {
                setProfileFormData([...codingProfiles]);
                setIsProfileModalOpen(true);
              }}>Manage Profiles</button>
            </div>
            <div className="profile-list">
              {codingProfiles.map((p) => (
                <div key={p._id} className="profile-card" onClick={() => window.open(p.url, '_blank')}>
                  <div className="profile-info-main">
                    <div className="profile-icon">
                      <span className={`material-symbols-outlined profile-symbol-${p.color}`}>
                        {p.icon || 'code'}
                      </span>
                    </div>
                    <span className="profile-name">{p.platform}</span>
                  </div>
                  <span className="material-symbols-outlined profile-arrow">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MANAGE PROFILES MODAL --- */}
      <Modal 
        title="Manage Coding Profiles" 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onSave={handleProfileSave}
        disabled={isSaving}
      >
        <div className="profile-manager-content">
          <div>
            <h6 className="form-subtitle">Current Profiles</h6>
            <div className="current-profiles-list">
              {profileFormData.map((profile, index) => (
                <div key={index} className="profile-edit-item">
                  <div className="profile-edit-info">
                    <span className="material-symbols-outlined">public</span>
                    <p>{profile.platform}</p>
                  </div>
                  <input 
                    className="form-input-compact" 
                    value={profile.url} 
                    onChange={(e) => {
                      const updated = [...profileFormData];
                      updated[index].url = e.target.value;
                      setProfileFormData(updated);
                    }} 
                  />
                  <button className="btn-remove-profile" onClick={() => removeProfileFromList(index)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="add-new-profile-section">
            <h6 className="form-subtitle">Add New Profile</h6>
            <div className="add-profile-grid">
              <input 
                className="form-input" 
                placeholder="Platform Name (e.g. GitHub)" 
                value={newProfile.platform}
                onChange={(e) => setNewProfile({...newProfile, platform: e.target.value})}
              />
              <input 
                className="form-input" 
                placeholder="Profile URL" 
                value={newProfile.url}
                onChange={(e) => setNewProfile({...newProfile, url: e.target.value})}
              />
              <button className="btn-add-profile-now" onClick={addNewProfileToList}>
                <span className="material-symbols-outlined">add_link</span>
                Add to List
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- SKILL GROUP MODAL --- */}
      <Modal 
        title={editingGroup ? "Edit Category" : "Add Category"} 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
        onSave={handleGroupSave}
        disabled={isSaving}
      >
        <div className="form-field">
          <label className="form-subtitle">Category Title</label>
          <input 
            className="form-input" 
            placeholder="e.g. Frontend Development"
            value={groupFormData.title} 
            onChange={e => setGroupFormData({...groupFormData, title: e.target.value})} 
          />
        </div>
        <div className="form-field" style={{ marginTop: '1.5rem' }}>
          <label className="form-subtitle">Skills (Comma Separated)</label>
          <textarea 
            className="form-textarea" 
            placeholder="React, Vue, Next.js..."
            rows={4} 
            value={groupFormData.skillsString} 
            onChange={e => setGroupFormData({...groupFormData, skillsString: e.target.value})} 
          />
        </div>
      </Modal>
    </section>
  );
};

export default SkillsSection;