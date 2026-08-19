import React from 'react';
import './index.css';

const Modal = ({ title, isOpen = true, onClose, onSave, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {onSave && (
          <div className="modal-footer">
            <button className="modal-btn modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="modal-btn modal-btn-save" onClick={onSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;