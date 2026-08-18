import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import './index.css';

const PRIMARY_API = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/auth/login`;
const LOCAL_API = 'http://localhost:3002/api/auth/login';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      try {
        res = await axios.post(PRIMARY_API, { email, password });
      } catch (primaryErr) {
        if (!primaryErr.response) {
          // Network error — try local
          res = await axios.post(LOCAL_API, { email, password });
        } else {
          throw primaryErr;
        }
      }
      const { token } = res.data;
      Cookies.set('adminToken', token, { expires: 1, sameSite: 'strict' });
      onLogin(token);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg-grid"></div>
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <h1 className="login-title">Portfolio Admin</h1>
          <p className="login-subtitle">Sign in to manage your portfolio content</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-email" className="login-label">Email Address</label>
            <div className="login-input-wrap">
              <span className="login-input-icon material-symbols-outlined">mail</span>
              <input
                id="login-email"
                type="email"
                className={`login-input ${error ? 'login-input-error' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon material-symbols-outlined">lock</span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`login-input ${error ? 'login-input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-show-btn"
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error-box" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="login-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="login-footer-note">
          <span className="material-symbols-outlined">shield</span>
          Secured with JWT authentication
        </p>
      </div>
    </div>
  );
};

export default Login;
