import api from './client';
import {getSessionToken} from '../services/authStorage';

async function post(action, payload, signal) {
  const token = await getSessionToken();
  if (!token) throw new Error('Session expired. Please log in again.');
  const {data} = await api.post(`/profile/mobile-verification/otp/${action}`, payload, {
    headers: {Authorization: `Bearer ${token}`}, signal,
  });
  if (data?.success !== true) throw new Error(data?.message || 'Verification failed. Please try again.');
  return data.data;
}

export async function requestVerificationOtp(signal) {
  let data;
  try {
    data = await post('request', {}, signal);
  } catch (error) {
    // This endpoint returns 409 only when the account is already verified.
    if (error.response?.status === 409) return {alreadyVerified: true};
    throw error;
  }
  if (typeof data?.challenge_id !== 'string' || data.challenge_id.length !== 64 ||
      !Number.isFinite(data.expires_in) || data.expires_in <= 0) {
    throw new Error('Unable to start verification. Please request a new OTP.');
  }
  return data;
}

export async function verifyProfileOtp(challengeId, otp, signal) {
  if (!/^\d{4}$/.test(otp)) throw new Error('Enter the four-digit OTP.');
  const data = await post('verify', {challenge_id: challengeId, otp}, signal);
  if (String(data?.member_type).toLowerCase() !== 'verified') {
    throw new Error('Verification was not confirmed. Please refresh your status.');
  }
  return data;
}
