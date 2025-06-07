import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { backendApi, type User as BackendUser, type LoginCredentials, type RegisterData } from '../lib/backendApi';

interface AuthState {
  user: BackendUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signUp: (email: string, password: string, metadata?: { firstName: string; lastName: string; username: string }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Check if user is already authenticated via backend
    const checkAuthStatus = async () => {
      try {
        if (backendApi.isAuthenticated()) {
          const { data, success, error } = await backendApi.getProfile();
          
          if (success && data) {
            setState(prev => ({
              ...prev,
              user: data.user,
              loading: false,
              error: null
            }));
          } else {
            // Clear invalid tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setState(prev => ({
              ...prev,
              user: null,
              loading: false,
              error: error || null
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            loading: false
          }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication check failed'
        }));
      }
    };

    checkAuthStatus();

    // Listen for Supabase auth changes (for any remaining Supabase auth usage)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          loading: false
        }));

        if (event === 'SIGNED_OUT') {
          setState(prev => ({
            ...prev,
            user: null,
            session: null
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: { firstName: string; lastName: string; username: string }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      if (!metadata) {
        throw new Error('First name, last name, and username are required');
      }

      const registerData: RegisterData = {
        email,
        password,
        firstName: metadata.firstName,
        lastName: metadata.lastName,
        username: metadata.username
      };

      const { data, success, error, errors } = await backendApi.register(registerData);
      
      if (success && data) {
        setState(prev => ({
          ...prev,
          user: data.user,
          loading: false,
          error: null
        }));
        return { error: null };
      } else {
        const errorMessage = error || (errors && errors.length > 0 ? errors[0].message : 'Registration failed');
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        return { error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const credentials: LoginCredentials = { email, password };
      const { data, success, error, errors } = await backendApi.login(credentials);
      
      if (success && data) {
        setState(prev => ({
          ...prev,
          user: data.user,
          loading: false,
          error: null
        }));
        return { error: null };
      } else {
        const errorMessage = error || (errors && errors.length > 0 ? errors[0].message : 'Login failed');
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        return { error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { success, error } = await backendApi.logout();
      
      // Always clear local state regardless of backend response
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
        error: success ? null : (error || null)
      }));
      
      return { error: success ? null : (error || null) };
    } catch (error) {
      // Clear local state even if logout request fails
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
      return { error: error instanceof Error ? error.message : 'Logout failed' };
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { success, error } = await backendApi.resetPassword(email);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: success ? null : (error || null)
      }));
      
      return { error: success ? null : (error || null) };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { error: errorMessage };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { success, error } = await backendApi.updatePassword(currentPassword, newPassword);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: success ? null : (error || null)
      }));
      
      return { error: success ? null : (error || null) };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { error: errorMessage };
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    clearError
  };
}