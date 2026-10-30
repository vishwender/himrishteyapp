import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  saveSession,
  getSessionToken,
  clearSession,
} from '../services/authStorage';


import { getMyProfile } from '../api/profileApi';
import {normalizeSessionMember, isSessionMemberActive} from '../services/sessionMember';

import {assertAdultMember, isAdultAccessError} from '../features/safety/adultAccess';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const token = await getSessionToken();

        if (token) {
          const profile = await getMyProfile(token);

          assertAdultMember(profile);

          if (mounted) {
            setUser(normalizeSessionMember(profile));
          }
        }
      } catch (error) {
        if (mounted && isAdultAccessError(error)) {
          setAccessError(error.response?.data?.message || error.message);
        }
        // Keep the token on temporary network errors.
        // Clear rejected credentials and sessions that fail adult eligibility.
        if (error.response?.status === 401 || isAdultAccessError(error)) {
          await clearSession();

          if (mounted) {
            setUser(null);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (token, member) => {
    const profile = await getMyProfile(token);

    assertAdultMember(profile);
    await saveSession(token, member);
    setAccessError('');

    setUser(normalizeSessionMember(profile, member));
  };

  const refreshUser = useCallback(async () => {
    const token = await getSessionToken();

    if (!token) {
      throw new Error('Session expired. Please log in again.');
    }

    let profile;
    try {
      profile = await getMyProfile(token);
      assertAdultMember(profile);
    } catch (error) {
      if (isAdultAccessError(error)) {
        setAccessError(error.response?.data?.message || error.message);
        setUser(null);
        await clearSession();
      }
      throw error;
    }
    setUser(previous => normalizeSessionMember(profile, previous));

    return profile;
  }, []);

  const signOut = async () => {
    await clearSession();
    setAccessError('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, accessError, signIn, signOut, refreshUser, canSendInterest: isSessionMemberActive(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
