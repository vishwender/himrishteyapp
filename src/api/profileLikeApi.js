import api from './client';
import {getSessionToken} from '../services/authStorage';

export async function profileLikeRequest(memberId, method = 'get', signal) {
  if (!Number.isSafeInteger(Number(memberId)) || Number(memberId) <= 0) throw new Error('Member ID unavailable.');
  const token = await getSessionToken();
  if (!token) throw new Error('Session expired. Please log in again.');
  const {data} = await api.request({method, url: `/profile-likes/${memberId}`, signal, headers: {Authorization: `Bearer ${token}`}});
  if (data?.success !== true || typeof data.data?.liked !== 'boolean') throw new Error(data?.message || 'Like status could not be confirmed.');
  return data.data.liked;
}
