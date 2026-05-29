/**
 * API Configuration
 * Handles environment variable loading with proper fallbacks
 */

export const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    console.warn('VITE_API_URL not set. Using default fallback.');
    // Fallback to current domain's /api endpoint
    return `${window.location.origin}`;
  }
  
  // Remove trailing slash if present
  return apiUrl.replace(/\/$/, '');
};

export const makeApiUrl = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};
