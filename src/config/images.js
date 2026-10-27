import { API_CONFIG } from './api';

export const IMAGE_CONFIG = {
  profileBaseURL: `${API_CONFIG.baseURL.replace(
    /\/api\/v1\/?$/,
    '',
  )}/photos/photo/`,
};

export function getProfileImage(photo) {
  if (!photo || typeof photo !== 'string') {
    return null;
  }

  const filename = photo.trim();

  if (!filename) {
    return null;
  }

  if (/^https:\/\//i.test(filename)) {
    return filename;
  }

  // Only allow a filename, not an arbitrary path.
  if (
    filename.includes('/') ||
    filename.includes('\\') ||
    filename === '.' ||
    filename === '..'
  ) {
    return null;
  }

  return IMAGE_CONFIG.profileBaseURL + encodeURIComponent(filename);
}
