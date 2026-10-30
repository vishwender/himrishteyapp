import api from './client';
import {getSessionToken} from '../services/authStorage';

export async function unlockContact(memberId, signal, maximumPrice) {
  if (!Number.isSafeInteger(Number(memberId)) || Number(memberId) <= 0) {
    throw new Error('Member ID unavailable.');
  }
  const token = await getSessionToken();
  if (!token) throw new Error('Session expired. Please log in again.');
  const {data} = await api.request({
    method: 'post',
    ...(maximumPrice !== undefined ? {data: {maximum_price: maximumPrice}} : {}),
    url: `/profiles/${Number(memberId)}/contact/unlock`,
    signal,
    headers: {Authorization: `Bearer ${token}`},
  });
  const result = data?.data;
  if (data?.success !== true || Number(result?.profile?.id) !== Number(memberId) ||
      typeof result?.already_unlocked !== 'boolean' ||
      !result?.contact_details || typeof result.contact_details !== 'object' ||
      Array.isArray(result.contact_details) ||
      !Number.isFinite(result.coins_deducted) || result.coins_deducted < 0 ||
      !Number.isFinite(result.wallet_balance)) {
    throw new Error('Contact unlock could not be confirmed. It may have completed; retrying this profile will not charge twice.');
  }
  return result;
}

export async function getContactQuote(memberId, signal) {
  if (!Number.isSafeInteger(Number(memberId)) || Number(memberId) <= 0) throw new Error('Member ID unavailable.');
  const token = await getSessionToken();
  if (!token) throw new Error('Session expired. Please log in again.');
  const {data} = await api.request({method: 'get', url: `/profiles/${Number(memberId)}/contact/quote`, signal, headers: {Authorization: `Bearer ${token}`}});
  const quote = data?.data;
  if (data?.success !== true || Number(quote?.profile?.id) !== Number(memberId) ||
      !Number.isFinite(quote?.price) || quote.price < 0 || !Number.isFinite(quote?.wallet_balance) ||
      typeof quote?.already_unlocked !== 'boolean' || typeof quote?.can_afford !== 'boolean') {
    throw new Error('Unable to confirm the profile view price. Please retry.');
  }
  return quote;
}
