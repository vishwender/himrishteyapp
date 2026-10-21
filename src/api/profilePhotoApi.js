
import api from './client';
import {getSessionToken} from '../services/authStorage';

async function uploadPhoto(endpoint, asset) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  if (!asset?.uri) {
    throw new Error('Please select a photo.');
  }

  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
    throw new Error('Please choose a photo smaller than 5 MB.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(asset.type)) {
    throw new Error('Only JPEG, PNG and WebP photos are supported.');
  }

  const extension =
    asset.type === 'image/png'
      ? 'png'
      : asset.type === 'image/webp'
        ? 'webp'
        : 'jpg';

  const formData = new FormData();

  formData.append('photo', {
    uri: asset.uri,
    type: asset.type,
    name: `profile-${Date.now()}.${extension}`,
  });

  const response = await api.post(endpoint, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Photo upload failed.',
    );
  }

  return response.data.data;
}

export function uploadPrimaryPhoto(asset) {
  return uploadPhoto('/profile/photos/profile', asset);
}

export function uploadGalleryPhoto(asset) {
  return uploadPhoto('/profile/photos/gallery', asset);
}
