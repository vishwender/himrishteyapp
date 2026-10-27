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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const token = await getSessionToken();

        if (token) {
          const profile = await getMyProfile(token);

          if (mounted) {
            setUser(normalizeSessionMember(profile));
          }
        }
      } catch (error) {
        // Keep the token on temporary network errors.
        // Clear it only when Laravel explicitly rejects it.
        if (error.response?.status === 401) {
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

    await saveSession(token, member);

    setUser(normalizeSessionMember(profile, member));
  };

  const refreshUser = useCallback(async () => {
    const token = await getSessionToken();

    if (!token) {
      throw new Error('Session expired. Please log in again.');
    }

    const profile = await getMyProfile(token);
    setUser(previous => normalizeSessionMember(profile, previous));

    return profile;
  }, []);

  const signOut = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, refreshUser, canSendInterest: isSessionMemberActive(user) }}>
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
