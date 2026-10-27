import api from './client';

export async function submitRegistrationStep(step, memberId, payload, signal) {
  if (!Number.isInteger(step) || step < 1 || step > 5)
    throw new Error('Invalid registration step.');
  if (step > 1 && !/^[1-9]\d*$/.test(String(memberId)))
    throw new Error('Missing registration member.');
  const path =
    step === 1 ? '/auth/register' : `/auth/register/step-${step}/${memberId}`;
  let body = payload;
  const config = { signal };
  if (step === 5 && payload.photo) {
    body = new FormData();
    body.append('photo', payload.photo);
    config.headers = { 'Content-Type': 'multipart/form-data' };
  }
  const response = await api.post(path, body, config);
  const data = response.data?.data;
  if (
    response.data?.success !== true ||
    data?.registration_step !== step ||
    data?.next_step !== (step === 5 ? null : step + 1) ||
    !/^[1-9]\d*$/.test(String(data?.member?.id)) ||
    (step > 1 && String(data.member.id) !== String(memberId))
  ) {
    const error = new Error(
      response.data?.message || 'Unable to confirm registration.',
    );
    error.unconfirmed = true;
    error.status = response.status;
    throw error;
  }
  return data;
}

export function getRegistrationFailure(error, step = 1) {
  const status = error.response?.status || error.status;
  const recovery =
    step === 1
      ? 'Your account may already exist. Try logging in before registering again.'
      : 'Your account is already created. Retry this step to save your profile details.';
  if (error.unconfirmed) {
    return {
      uncertain: step === 1,
      message: `The server returned an unexpected account confirmation${
        status ? ` (HTTP ${status})` : ''
      }. ${recovery}`,
    };
  }
  if (status >= 500) {
    return {
      uncertain: step === 1,
      message: `The registration server returned an error (HTTP ${status}). ${recovery}`,
    };
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return {
      uncertain: step === 1,
      message: `The registration request timed out. ${recovery}`,
    };
  }
  if (!error.response) {
    return {
      uncertain: step === 1,
      message: `The connection was interrupted before registration could be confirmed. ${recovery}`,
    };
  }
  return { uncertain: false, message: null };
}
