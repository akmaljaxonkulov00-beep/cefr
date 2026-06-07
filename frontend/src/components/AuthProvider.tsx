'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Cookies from 'js-cookie';

function SessionPersistence() {
  const { token, logout } = useAuthStore();

  useEffect(() => {
    // Verify token on app start
    const verifySession = async () => {
      // Check multiple sources for token
      const cookieToken = Cookies.get('auth-token');
      const storageToken = localStorage.getItem('token');
      const storeToken = token;
      
      const activeToken = cookieToken || storageToken || storeToken;
      
      if (activeToken) {
        // Sync cookie if missing
        if (!cookieToken) {
          Cookies.set('auth-token', activeToken, { expires: 7, secure: false, sameSite: 'lax' });
        }
        
        try {
          await api.get('/api/auth/me');
        } catch (error) {
          // Token invalid/expired, clear storage
          logout();
          Cookies.remove('auth-token');
        }
      }
    };

    verifySession();
  }, [token, logout]);

  return null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionPersistence />
      {children}
    </>
  );
}
