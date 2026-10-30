import api from './client';
import { getSessionToken } from '../services/authStorage';
import { getSentInterests, getReceivedInterests } from './interestApi';

async function get(path) {
  const token = await getSessionToken();
  if (!token) throw new Error('Session expired. Please log in again.');
  const response = await api.get(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.data?.success)
    throw new Error(response.data?.message || 'Unable to load activity.');
  return response.data.data;
}

export async function getActivityCounts() {
  const results = await Promise.allSettled([
    get('/dashboard/stats'),
    getReceivedInterests(),
    getSentInterests(),
    get('/shortlisted'),
  ]);
  const value = index =>
    results[index].status === 'fulfilled' ? results[index].value : null;
  const received = value(1);
  const sent = value(2);
  const count = number =>
    number !== null &&
    number !== undefined &&
    Number.isSafeInteger(Number(number)) &&
    Number(number) >= 0
      ? Number(number)
      : null;
  return {
    counts: {
      viewers: count(value(0)?.profile_views),
      contacts: count(value(0)?.contacts_viewed),
      received: Array.isArray(received) ? received.length : null,
      sent: Array.isArray(sent) ? sent.length : null,
      shortlisted: count(value(3)?.count),
      accepted:
        Array.isArray(received) && Array.isArray(sent)
          ? [
              ...new Map(
                [...received, ...sent]
                  .filter(item => String(item.status) === '1')
                  .map(item => [item.id, item]),
              ).values(),
            ].length
          : null,
    },
    failed: results.some(result => result.status === 'rejected'),
  };
}
