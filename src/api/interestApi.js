
import api from './client';
import {getSessionToken} from '../services/authStorage';

async function authHeaders() {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function validMemberId(memberId) {
  const id = Number(memberId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Invalid member ID.');
  }

  return id;
}

export async function checkSentInterest(memberId) {
  const id = validMemberId(memberId);

  const response = await api.get(`/interests/${id}`, {
    headers: await authHeaders(),
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to check interest status.',
    );
  }

  return response.data.data;
}

export async function sendInterest(memberId) {
  const id = validMemberId(memberId);

  const response = await api.post(
    `/interests/${id}`,
    {},
    {headers: await authHeaders()},
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to send interest.',
    );
  }

  return response.data.data;
}

export async function cancelInterest(interestId) {
  const id = Number(interestId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Invalid interest ID.');
  }

  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.delete(
    `/interests/${id}/cancel`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to cancel interest.',
    );
  }

  return response.data.data;
}


export async function getSentInterests() {
  const response = await api.get('/interests/sent', {
    headers: await authHeaders(),
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to fetch sent interests.',
    );
  }

  return response.data.data?.interests ?? [];
}

export async function getReceivedInterests() {
  const response = await api.get('/interests/received', {
    headers: await authHeaders(),
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to fetch received interests.',
    );
  }

  return response.data.data?.interests ?? [];
}

export async function acceptInterest(interestId) {
  const id = validMemberId(interestId);

  const response = await api.put(
    `/interests/${id}/accept`,
    {},
    {headers: await authHeaders()},
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to accept interest.',
    );
  }

  return response.data.data;
}

export async function rejectInterest(interestId) {
  const id = validMemberId(interestId);

  const response = await api.put(
    `/interests/${id}/reject`,
    {},
    {headers: await authHeaders()},
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to reject interest.',
    );
  }

  return response.data.data;
}
