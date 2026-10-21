
import api from './client';
import {getSessionToken} from '../services/authStorage';

/**
 * Get authentication headers.
 */
async function authHeaders() {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Validate numeric member ID.
 *
 * Laravel expects members.id, not a public
 * profile ID such as HIM39395.
 */
function validateMemberId(memberId) {
  const id = Number(memberId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Invalid member ID.');
  }

  return id;
}

/**
 * Check whether a profile is shortlisted.
 *
 * GET /api/v1/shortlisted/{memberId}
 */
export async function checkShortlist(memberId) {
  const id = validateMemberId(memberId);

  const response = await api.get(
    `/shortlisted/${id}`,
    {
      headers: await authHeaders(),
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to check shortlist status.',
    );
  }

  return response.data.data.shortlisted === true;
}

/**
 * Add member to shortlist.
 *
 * POST /api/v1/shortlisted/{memberId}
 */
export async function addToShortlist(memberId) {
  const id = validateMemberId(memberId);

  const response = await api.post(
    `/shortlisted/${id}`,
    {},
    {
      headers: await authHeaders(),
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to shortlist this member.',
    );
  }

  return response.data.data.shortlisted === true;
}

/**
 * Remove member from shortlist.
 *
 * DELETE /api/v1/shortlisted/{memberId}
 */
export async function removeFromShortlist(memberId) {
  const id = validateMemberId(memberId);

  const response = await api.delete(
    `/shortlisted/${id}`,
    {
      headers: await authHeaders(),
    },
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message ||
      'Unable to remove this member from shortlist.',
    );
  }

  return response.data.data.shortlisted === true;
}
