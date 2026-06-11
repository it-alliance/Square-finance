import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/utils/apiClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          if (!email || !password) {
            throw new Error('Email and password are required');
          }

          const response = await apiClient.post('/auth/login', { email, password });

          // Handle multiple response shapes from backend
          const token = response.token || response.accessToken || response.data?.token;
          const user = response.user || response.data?.user || response.data;
          const isSuccess =
            response.status === 'success' ||
            response.success === true ||
            !!token;

          if (isSuccess && token) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
            }
            set({
              user,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            return { success: true };
          } else {
            const errMsg =
              response.message ||
              response.error ||
              response.data?.message ||
              'Login failed. Please check your credentials.';
            throw new Error(errMsg);
          }
        } catch (error) {
          set({
            loading: false,
            error: error.message || 'Login failed',
          });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => {
        set({ error: null });
      },

      initializeAuth: () => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              set({ user, isAuthenticated: true });
            } catch (e) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }
        }
      },

      isSuperAdmin: () => {
        const user = get().user;
        return user?.role === 'SUPER_ADMIN' || user?.role === 'admin';
      },

      isEmployee: () => {
        const user = get().user;
        return user?.role === 'EMPLOYEE' || user?.role === 'employee';
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
