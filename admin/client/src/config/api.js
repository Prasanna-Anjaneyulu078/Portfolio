// Centralized API Configuration for Admin Client

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3002';

const cleanBaseUrl = rawApiUrl.replace(/\/+$/, '');

export const API_BASE_URL = cleanBaseUrl.endsWith('/api')
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api`;

export const BACKEND_ROOT_URL = cleanBaseUrl.endsWith('/api')
  ? cleanBaseUrl.replace(/\/api$/, '')
  : cleanBaseUrl;

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
