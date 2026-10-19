import api from './client';
import {getSessionToken} from '../services/authStorage';

export async function getHomeData() {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please login again.');
  }

  const response = await api.get('/home', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to load home data.',
    );
  }

  return response.data.data;
}