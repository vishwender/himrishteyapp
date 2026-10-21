
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

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '',
    ),
  );
}

async function search(endpoint, filters, page = 1) {
  const response = await api.get(endpoint, {
    headers: await authHeaders(),
    params: {
      ...cleanFilters(filters),
      page,
    },
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Search failed.',
    );
  }

  const data = response.data.data || {};

  return {
    members: data.members || [],
    pagination: data.pagination || {
      current_page: page,
      last_page: page,
      total: 0,
      per_page: 20,
    },
  };
}

export function quickSearch(filters, page = 1) {
  return search('/search/quick', filters, page);
}

export function advancedSearch(filters, page = 1) {
  return search('/search/advanced', filters, page);
}

export async function findByProfileId(profileId) {
  const id = String(profileId).trim();

  if (!id) {
    throw new Error('Please enter a Profile ID.');
  }

  const response = await api.get(
    `/search/profile/${encodeURIComponent(id)}`,
    {
      headers: await authHeaders(),
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Profile not found.',
    );
  }

  return response.data.data;
}
