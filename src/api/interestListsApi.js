
import api from './client';
import {getSessionToken} from '../services/authStorage';

async function getHeaders() {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function validateId(id) {
  const value = Number(id);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Invalid interest ID.');
  }

  return value;
}

function getData(response) {
  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Request failed.',
    );
  }

  return response.data.data;
}

export async function getSentInterests() {
  const response = await api.get('/interests/sent', {
    headers: await getHeaders(),
  });

  return getData(response).interests || [];
}

export async function getReceivedInterests() {
  const response = await api.get('/interests/received', {
    headers: await getHeaders(),
  });

  return getData(response).interests || [];
}

export async function acceptReceivedInterest(id) {
  const response = await api.put(
    `/interests/${validateId(id)}/accept`,
    {},
    {headers: await getHeaders()},
  );

  return getData(response);
}

export async function rejectReceivedInterest(id) {
  const response = await api.put(
    `/interests/${validateId(id)}/reject`,
    {},
    {headers: await getHeaders()},
  );

  return getData(response);
}
