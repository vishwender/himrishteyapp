
import api from './client';
import {getSessionToken} from '../services/authStorage';

export async function updateBasicProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/basic',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to update profile.',
    );
  }

  return response.data.data.member;
}


export async function updatePersonalProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/personal',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
        'Unable to update personal details.',
    );
  }

  return response.data.data.member;
}

export async function updateReligionProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/religion',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
        'Unable to update religion and community details.',
    );
  }

  return response.data.data.member;
}

export async function updateEducationCareerProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/education-career',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to update education and career details.',
    );
  }

  return response.data.data.member;
}

export async function updateLocationProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/location',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to update location details.',
    );
  }

  return response.data.data.member;
}

export async function updateFamilyProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/family',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to update family details.',
    );
  }

  return response.data.data.member;
}

export async function updateLifestyleProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/lifestyle',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to update lifestyle details.',
    );
  }

  return response.data.data.member;
}

export async function updatePartnerPreferencesProfile(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/partner-preferences',
    fields,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to update partner preferences.',
    );
  }

  return response.data.data.member;
}

