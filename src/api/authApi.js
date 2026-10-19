import api from './client';

export async function loginMember(identifier, password) {
  const response = await api.post('/auth/login', {
    login: identifier.trim(),
    password,
  });

  if (!response.data?.success || !response.data?.data?.token) {
    throw new Error(
      response.data?.message || 'Login failed.',
    );
  }

  return response.data.data;
}

export function getAuthError(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond.';
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Network error. Unable to reach the Laravel API.';
  }

  if (error.response?.status === 401) {
    return 'Invalid credentials or expired session.';
  }

  if (error.response?.status >= 500) {
    return 'The server encountered an error.';
  }

  return error.message || 'Something went wrong.';
}