
import api from './client';
import {getSessionToken} from '../services/authStorage';

async function request(method, url, data) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  const response = await api.request({
    method,
    url,
    ...(data !== undefined ? {data} : {}),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'Request failed.',
    );
  }

  return response.data.data;
}

export function getMemberships() {
  return request('get', '/memberships');
}

export function getMembershipPlans(membershipTypeId) {
  return request(
    'get',
    `/memberships/${encodeURIComponent(membershipTypeId)}/plans`,
  );
}

export function requestMembershipCallback() {
  return request('post', '/memberships/callback-request');
}

export function getWallet() {
  return request('get', '/wallet');
}

export function getWalletTransactions() {
  return request('get', '/wallet/transactions');
}
export function getWalletOffers() {
  return request('get', '/offers');
}
