
import api from './client';
import {getSessionToken} from '../services/authStorage';

export async function changePassword(fields) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/change-password',
    {
      current_password: fields.currentPassword,
      new_password: fields.newPassword,
      new_password_confirmation: fields.confirmPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to change password.',
    );
  }

  return response.data;
}

export async function getProfileVisibility() {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.get('/profile/visibility', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to load profile visibility.',
    );
  }

  return response.data.data;
}

export async function updateProfileVisibility(isHidden) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.put(
    '/profile/visibility',
    {
      profile_hide: isHidden ? 'Yes' : 'No',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to update profile visibility.',
    );
  }

  return response.data.data;
}

export async function getDeleteAccountRequests() {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.get(
    '/profile/delete-request',
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
      'Unable to load deletion requests.',
    );
  }

  return response.data?.data?.requests || [];
}

export async function submitDeleteAccountRequest(reason) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.post(
    '/profile/delete-request',
    {
      reason,
    },
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
      'Unable to submit deletion request.',
    );
  }

  return response.data.data;
}
