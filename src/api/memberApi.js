import api from './client';
import {getSessionToken} from '../services/authStorage';

export async function getMemberProfile(profileId) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.get(
    `/search/profile/${encodeURIComponent(profileId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Unable to load profile.');
  }

  return response.data.data.member;
}