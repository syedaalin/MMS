import React, { createContext, useState, useContext, useEffect } from 'react';
import { syncDatabase } from './db';
import { clear2FAState, mark2FAVerified } from './twoFactor';
import { type User, type Workspace } from '@mms/shared';
import { appNavigate } from './appNavigate';
import { ROUTES } from './routes';

export interface AuthError {
  type: 'invalid_credentials' | 'auth_required' | 'connection_error' | 'user_not_registered';
  message: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthError | null;
  appPublicSettings: unknown | null;
  authChecked: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean }>;
  logout: (shouldRedirect?: boolean) => void;
  navigateToLogin: () => void;
  checkUserAuth: () => Promise<void>;
  checkAppState: () => Promise<void>;
  onboard: (data: {
    madrasaName: string;
    tagline: string;
    adminName: string;
    email: string;
    password: string;
    subdomain: string;
    country?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    adminPhone?: string;
    website?: string;
    footerText?: string;
  }) => Promise<OnboardResult>;
  exchangeHandoff: (code: string) => Promise<void>;
}

export interface OnboardResult {
  token: string;
  user: User;
  workspace: Workspace;
  handoffCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that wraps the application and provides real authentication state.
 * Syncs with the standalone backend API endpoints and handles JWT tokens.
 *
 * @param props - React component props.
 * @param props.children - The children components to render inside the provider.
 * @returns The rendered provider element.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [appPublicSettings, setAppPublicSettings] = useState<unknown | null>({
    id: 'mock-app-id',
    public_settings: {}
  });

  const checkAppState = async (): Promise<void> => {
    // Basic health check to ensure API is online
    try {
      setIsLoadingPublicSettings(true);
      const response = await fetch('/health');
      if (response.ok) {
        setAppPublicSettings({ id: 'app-online', public_settings: {} });
      }
    } catch (err) {
      console.warn('API server seems to be offline:', err);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async (): Promise<void> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    const token = localStorage.getItem('mms_token');
    
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('mms_user', JSON.stringify(data.user));
        
        // Seeding / updates local database from server in the background
        await syncDatabase(token);
      } else {
        // Token is invalid/expired
        localStorage.removeItem('mms_token');
        localStorage.removeItem('mms_user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.warn('Network error checking auth, trying local cache:', error);
      const cachedUser = localStorage.getItem('mms_user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ requires2FA: boolean }> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json() as { token: string; user: User; requires2FA?: boolean };
        await applyAuthSession(data.token, data.user);
        return { requires2FA: data.requires2FA === true };
      } else {
        const errorData = await response.json();
        const errObj: AuthError = { type: 'invalid_credentials', message: (errorData as { message?: string }).message || 'Login failed' };
        setAuthError(errObj);
        throw new Error(errObj.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect to authentication server';
      const errObj: AuthError = { type: 'connection_error', message };
      setAuthError(errObj);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true): void => {
    clear2FAState();
    localStorage.removeItem('mms_token');
    localStorage.removeItem('mms_user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    
    // Fire-and-forget server side logout
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    if (shouldRedirect) {
      appNavigate(ROUTES.login, { replace: true });
    }
  };

  const applyAuthSession = async (token: string, authUser: User): Promise<void> => {
    localStorage.setItem('mms_token', token);
    localStorage.setItem('mms_user', JSON.stringify(authUser));
    setUser(authUser);
    setIsAuthenticated(true);
    setAuthChecked(true);
    await syncDatabase(token);
  };

  const onboard = async (data: {
    madrasaName: string;
    tagline: string;
    adminName: string;
    email: string;
    password: string;
    subdomain: string;
    country?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    adminPhone?: string;
    website?: string;
    footerText?: string;
  }): Promise<OnboardResult> => {
    setAuthError(null);
    const response = await fetch('/api/auth/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Onboarding failed');
    }

    return (await response.json()) as OnboardResult;
  };

  const exchangeHandoff = async (code: string): Promise<void> => {
    setAuthError(null);
    const response = await fetch('/api/auth/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Sign-in handoff failed');
    }

    const data = (await response.json()) as { token: string; user: User };
    await applyAuthSession(data.token, data.user);
    mark2FAVerified();
  };

  const navigateToLogin = (): void => {
    appNavigate(ROUTES.login, { replace: true });
  };

  // Run initial check once on mount
  useEffect(() => {
    void checkAppState();
    void checkUserAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      onboard,
      exchangeHandoff,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume the authentication context.
 * Throws an error if used outside an AuthProvider.
 *
 * @returns The active AuthContext values.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
