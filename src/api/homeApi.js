
import api from './client';
import {getSessionToken} from '../services/authStorage';

async function authenticatedRequest(method, url) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.request({
    method,
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.data?.success === false) {
    throw new Error(response.data.message || 'Request failed.');
  }

  return response.data?.data;
}

export function getHomeProfiles() {
  return authenticatedRequest('get', '/home');
}

export function sendHomeInterest(profileId) {
  return authenticatedRequest(
    'post',
    `/interests/${encodeURIComponent(profileId)}`,
  );
}

export function addHomeShortlist(memberId) {
  return authenticatedRequest(
    'post',
    `/shortlisted/${encodeURIComponent(memberId)}`,
  );
}

export function removeHomeShortlist(memberId) {
  return authenticatedRequest(
    'delete',
    `/shortlisted/${encodeURIComponent(memberId)}`,
  );
}



export async function getDiscoverProfiles({
  section = 'matches',
  perPage = 10,
  cursor = null,
} = {}) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  if (section === 'nearby') {
    const response = await api.get('/search/nearby', {
      params: {per_page: perPage, page: cursor ? Number(cursor) : 1},
      headers: {Authorization: `Bearer ${token}`},
    });
    const data = response.data?.data;
    const page = Number(data?.pagination?.current_page);
    const lastPage = Number(data?.pagination?.last_page);
    if (!response.data?.success || !Array.isArray(data?.members) ||
        !Number.isInteger(page) || page < 1 ||
        !Number.isInteger(lastPage) || lastPage < page) {
      throw new Error(response.data?.message || 'Invalid nearby API response.');
    }
    return {
      profiles: data.members,
      nextCursor: page < lastPage ? String(page + 1) : null,
    };
  }

  const params = {
    section,
    per_page: perPage,
  };

  if (cursor) {
    params.cursor = cursor;
  }

  const response = await api.get('/discover/profiles', {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.data?.success === false) {
    throw new Error(
      response.data.message || 'Unable to load profiles.',
    );
  }

  const data = response.data?.data;

  if (!data || !Array.isArray(data.profiles)) {
    throw new Error('Invalid discovery API response.');
  }

  return {
    profiles: data.profiles,
    nextCursor: data.next_cursor || null,
  };
}


