import api from './client';
import {getSessionMember} from '../services/sessionMember';

export async function getMyProfile(token) {
  const headers = {Authorization: `Bearer ${token}`};
  const response = await api.get('/profile', {headers});

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Unable to load profile.',
    );
  }

  const member = getSessionMember(response.data.data);
  if (member.active !== undefined) {
    return member;
  }

  // The current Laravel /profile serializer omits active. The existing
  // authenticated visibility endpoint returns the account's actual status.
  const visibility = await api.get('/profile/visibility', {headers});
  if (!visibility.data?.success || visibility.data.data?.active === undefined) {
    throw new Error(
      visibility.data?.message || 'Unable to verify account activation.',
    );
  }

  return {...member, active: visibility.data.data.active};
}
