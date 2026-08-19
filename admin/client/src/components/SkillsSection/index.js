import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import './index.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

const PLATFORM_ICONS = {
  leetcode: 'code',
  hackerrank: 'terminal',
  gfg: 'code',
  geeksforgeeks: 'code',
  code360: 'dataset',
  github: 'public',
  linkedin: 'work',
};

const getPlatformIcon = (platform, customIcon) => {
  if (customIcon) return customIcon;
  const key = (platform || '').toLowerCase().replace(/\s+/g, '');
  return PLATFORM_ICONS[key] || 'code';
};

const SkillsSection = () => {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSingleProfileModalOpen, setIsSingleProfileModalOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [skillGroups, setSkillGroups] = useState([]);
  const [codingProfiles, setCodingProfiles] = useState([]);
  
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({ title: "", skillsString: "" });
  
  const [profileFormData, setProfileFormData] = useState([]);
  const [newProfile, setNewProfile] = useState({ platform: "", url: "", icon: "code", color: "blue" });

  const [singleProfileEdit, setSingleProfileEdit] = useState({ index: null, platform: "", url: "" });

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
      setSkillGroups(Array.isArray(skillsRes.data) ? skillsRes.data : []);
      setCodingProfiles(Array.isArray(profilesRes.data) ? profilesRes.data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddGroupModal = () => {
    setEditingGroup(null);
    setGroupFormData({ title: "", skillsString: "" });
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (group) => {
    setEditingGroup(group);
    setGroupFormData({
      title: group.title || '',
      skillsString: Array.isArray(group.skills) ? group.skills.join(', ') : '',
    });
    setIsGroupModalOpen(true);
  };

  const openManageProfilesModal = () => {
    setProfileFormData([...codingProfiles]);
    setIsProfileModalOpen(true);
  };

  const openQuickEditProfile = (index) => {
    const p = codingProfiles[index];
    if (!p) return;
    setSingleProfileEdit({ index, platform: p.platform || '', url: p.url || '' });
    setIsSingleProfileModalOpen(true);
  };

  const addNewProfileToList = () => {
    if (!newProfile.platform?.trim() || !newProfile.url?.trim()) return;
    setProfileFormData([...profileFormData, { ...newProfile, platform: newProfile.platform.trim(), url: newProfile.url.trim() }]);
    setNewProfile({ platform: "", url: "", icon: "code", color: "blue" });
  };

  const updateProfileInList = (index, field, value) => {
    const updated = [...profileFormData];
    updated[index] = { ...updated[index], [field]: value };
    setProfileFormData(updated);
  };

  const removeProfileFromList = (index) => {
    setProfileFormData(profileFormData.filter((_, i) => i !== index));
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/profiles/sync`, profileFormData);
      setCodingProfiles(Array.isArray(res.data) ? res.data : profileFormData);
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error("Profile Sync Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSingleProfile = async () => {
    if (!singleProfileEdit.platform.trim() || singleProfileEdit.index === null) return;
    setIsSaving(true);
    try {
      const updatedProfiles = codingProfiles.map((p, i) => 
        i === singleProfileEdit.index 
          ? { ...p, platform: singleProfileEdit.platform.trim(), url: singleProfileEdit.url.trim() } 
          : p
      );
      const res = await axios.post(`${API_BASE}/profiles/sync`, updatedProfiles);
      setCodingProfiles(Array.isArray(res.data) ? res.data : updatedProfiles);
      setIsSingleProfileModalOpen(false);
    } catch (err) {
      console.error("Single Profile Save Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSingleProfile = async (index) => {
    const target = codingProfiles[index];
    if (!target || !window.confirm(`Delete coding profile "${target.platform}"?`)) return;
    setIsSaving(true);
    try {
      const updatedProfiles = codingProfiles.filter((_, i) => i !== index);
      const res = await axios.post(`${API_BASE}/profiles/sync`, updatedProfiles);
      setCodingProfiles(Array.isArray(res.data) ? res.data : updatedProfiles);
    } catch (err) {
      console.error("Single Profile Delete Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGroupSave = async () => {
    if (!groupFormData.title.trim()) return;
    setIsSaving(true);
    const payload = { 
      title: groupFormData.title.trim(), 
      skills: groupFormData.skillsString.split(",").map(s => s.trim()).filter(Boolean) 
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
    } catch (err) {
      console.error("Skill Save Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm("Delete this category? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/skill-groups/${id}`);
      setSkillGroups(prev => prev.filter(g => g._id !== id));
    } catch (err) {
      console.error("Delete Group Error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading skills">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Skills & Profiles...</p>
      </div>
    );
  }

  return (
    <section className="section-container" id="skills">
      {/* Dashboard Page Header */}
      <div className="section-title-row">
        <div className="section-header">
          <div className="title-badge-row">
            <h3>Skills & Coding Profiles</h3>
            <span className="db-live-status-pill">
              <span className="status-dot">●</span> Live from MongoDB
            </span>
          </div>
          <p className="section-subtext">
            Manage technical skills and coding profiles from MongoDB.
          </p>
        </div>
        <button className="btn-add-project" onClick={openAddGroupModal}>
          <span className="material-symbols-outlined">add_circle</span>
          Add Skill
        </button>
      </div>

      {/* 70 / 30 Two-Column Dashboard Layout */}
      <div className="skills-dashboard-layout">
        {/* Left Main Panel: Technical Skills (70%) */}
        <div className="skills-main-panel">
          <div className="panel-header-row">
            <h4 className="panel-title">Technical Skills</h4>
          </div>

          {skillGroups.length === 0 ? (
            <div className="empty-panel-box">
              <span className="material-symbols-outlined icon-large">psychology_alt</span>
              <p>No skills added yet.</p>
              <button className="btn-primary-action" onClick={openAddGroupModal}>
                + Add Skill
              </button>
            </div>
          ) : (
            <div className="skill-categories-grid">
              {skillGroups.map((group) => (
                <div key={group._id} className="skill-category-card">
                  <div className="category-card-header">
                    <h5 className="category-title">{group.title}</h5>
                    <div className="category-actions">
                      <button
                        className="btn-icon-action edit"
                        onClick={() => openEditGroupModal(group)}
                        title="Edit category"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="btn-icon-action delete"
                        onClick={() => deleteGroup(group._id)}
                        title="Delete category"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="skill-chips-row">
                    {Array.isArray(group.skills) && group.skills.length > 0 ? (
                      group.skills.map((s, i) => (
                        <span key={i} className="skill-chip-item">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="empty-skills-text">No skills in this category</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side Panel: Coding Profiles (30%) */}
        <div className="profiles-side-panel">
          <div className="panel-header-row">
            <h4 className="panel-title">Coding Profiles</h4>
            <button className="btn-manage-profiles" onClick={openManageProfilesModal}>
              Manage Profiles
            </button>
          </div>

          {codingProfiles.length === 0 ? (
            <div className="empty-panel-box">
              <span className="material-symbols-outlined icon-large">public_off</span>
              <p>No coding profiles added yet.</p>
              <button className="btn-primary-action" onClick={openManageProfilesModal}>
                Manage Profiles
              </button>
            </div>
          ) : (
            <div className="profiles-list-wrapper">
              {codingProfiles.map((p, index) => {
                const iconName = getPlatformIcon(p.platform, p.icon);
                return (
                  <div
                    key={p._id || `${p.platform}-${index}`}
                    className="profile-row-item"
                  >
                    <div className="profile-row-main">
                      <div className="profile-platform-icon">
                        <span className={`material-symbols-outlined symbol-${p.color || 'blue'}`}>
                          {iconName}
                        </span>
                      </div>
                      <span className="profile-platform-name">{p.platform}</span>
                    </div>

                    <div className="profile-row-actions">
                      <button
                        type="button"
                        className="btn-icon-action edit"
                        onClick={() => openQuickEditProfile(index)}
                        title="Edit Profile"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action open-link"
                        onClick={() => p.url && window.open(p.url.startsWith('http') ? p.url : `https://${p.url}`, '_blank')}
                        title={`Open ${p.platform} Profile`}
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action delete"
                        onClick={() => deleteSingleProfile(index)}
                        title="Delete Profile"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- QUICK EDIT SINGLE PROFILE MODAL --- */}
      <Modal
        title="Edit Coding Profile"
        isOpen={isSingleProfileModalOpen}
        onClose={() => setIsSingleProfileModalOpen(false)}
        onSave={handleSaveSingleProfile}
        disabled={isSaving}
      >
        <div className="quick-profile-edit-form">
          <div className="form-field">
            <label className="form-subtitle">Platform Name *</label>
            <input
              className="form-input"
              placeholder="e.g. HackerRank, LeetCode"
              value={singleProfileEdit.platform}
              onChange={(e) => setSingleProfileEdit({ ...singleProfileEdit, platform: e.target.value })}
            />
          </div>
          <div className="form-field" style={{ marginTop: '1.25rem' }}>
            <label className="form-subtitle">Profile URL *</label>
            <input
              className="form-input"
              placeholder="https://hackerrank.com/profile"
              value={singleProfileEdit.url}
              onChange={(e) => setSingleProfileEdit({ ...singleProfileEdit, url: e.target.value })}
            />
          </div>
        </div>
      </Modal>

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
                  </div>
                  <div className="profile-inputs-flex">
                    <input 
                      className="form-input-compact platform-input"
                      placeholder="Platform Name"
                      value={profile.platform} 
                      onChange={(e) => updateProfileInList(index, 'platform', e.target.value)}
                    />
                    <input 
                      className="form-input-compact url-input"
                      placeholder="Profile URL"
                      value={profile.url} 
                      onChange={(e) => updateProfileInList(index, 'url', e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-remove-profile"
                    onClick={() => removeProfileFromList(index)}
                    title="Delete Profile"
                  >
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
                placeholder="Platform Name (e.g. HackerRank)" 
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

      {/* --- SKILL CATEGORY MODAL --- */}
      <Modal 
        title={editingGroup ? "Edit Category" : "Add Category"} 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
        onSave={handleGroupSave}
        disabled={isSaving}
      >
        <div className="form-field">
          <label className="form-subtitle">Category Title *</label>
          <input 
            className="form-input" 
            placeholder="e.g. Languages & Core"
            value={groupFormData.title} 
            onChange={e => setGroupFormData({...groupFormData, title: e.target.value})} 
          />
        </div>
        <div className="form-field" style={{ marginTop: '1.25rem' }}>
          <label className="form-subtitle">Skills (Comma Separated) *</label>
          <textarea 
            className="form-textarea" 
            placeholder="JavaScript, Java, Python, SQL"
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
