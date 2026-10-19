import api from './client';

export async function getMyProfile(token) {
  const response = await api.get('/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to load profile.',
    );
  }

  return response.data.data;
}