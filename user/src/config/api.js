// Centralized API Configuration for User Portfolio

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3002';

const cleanBaseUrl = rawApiUrl.replace(/\/+$/, '');

// Base API URL (ensures /api suffix)
export const API_BASE_URL = cleanBaseUrl.endsWith('/api')
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api`;

// Backend Root URL (without /api) for relative asset resolution
export const BACKEND_ROOT_URL = cleanBaseUrl.endsWith('/api')
  ? cleanBaseUrl.replace(/\/api$/, '')
  : cleanBaseUrl;

// Endpoints mapping
export const ENDPOINTS = {
  USER: `${API_BASE_URL}/user`,
  EDUCATION: `${API_BASE_URL}/education`,
  SKILLS: `${API_BASE_URL}/skill-groups`,
  PROFILES: `${API_BASE_URL}/profiles`,
  PROJECTS: `${API_BASE_URL}/projects`,
  EXPERIENCES: `${API_BASE_URL}/experiences`,
  CERTIFICATIONS: `${API_BASE_URL}/certifications`,
  RESUME_DOWNLOAD: `${API_BASE_URL}/resume/download`,
};

/**
 * Resolves absolute, data, or relative asset URLs.
 * - Leaves http://, https://, and data: URIs intact.
 * - Prepends BACKEND_ROOT_URL to relative paths.
 */
export const resolveAssetUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BACKEND_ROOT_URL}${cleanPath}`;
};
